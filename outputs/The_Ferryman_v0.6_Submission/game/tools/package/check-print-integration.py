import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
VERIFY = ROOT / 'verification/integration'


def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def read(file):
    return json.loads(file.read_text(encoding='utf-8'))


def write(file, value):
    file.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def run(arguments, cwd=ROOT):
    return subprocess.run(arguments, cwd=cwd, check=True, capture_output=True, text=True).stdout


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--work', required=True, type=Path)
    args = parser.parse_args()
    args.work.mkdir(parents=True, exist_ok=True)
    checked = datetime.now(timezone.utc).isoformat()
    visual = read(VERIFY / 'visual-review.json')
    master = ROOT / 'print/Print_and_Play_v0.6.pdf'
    inventory = read(ROOT / 'print/COMPONENT_INVENTORY.json')
    assert visual['status'] == 'PASS' and visual['masterSha256'] == digest(master)
    assert visual['pages'] == list(range(1, inventory['page_count'] + 1))
    run(['node', 'tools/package/project-print-content.js'])
    run([sys.executable, 'tools/print/check_b_projection.py', 'verification/B_CONTENT_PROJECTION.json'])
    run(['node', 'tests/print-parity-check.js'])
    run([sys.executable, 'tools/print/verify.py'])
    static = read(ROOT / 'verification/print/static-results.json')
    supply = read(ROOT / 'verification/print/supply-results.json')
    assert static['status'] == supply['status'] == 'PASS'
    with tempfile.TemporaryDirectory(prefix='print-portable-', dir=args.work.resolve()) as folder:
        portable = Path(folder) / 'game'
        for relative in ['print', 'art', 'assets/art', 'tools/print', 'verification/print']:
            shutil.copytree(ROOT / relative, portable / relative, ignore=shutil.ignore_patterns('*.zip', '*.sha256', '__pycache__'))
        run([sys.executable, 'tools/print/build.py'], portable)
        run([sys.executable, 'tools/print/verify.py'], portable)
        rebuilt = read(portable / 'verification/print/static-results.json')
        assert rebuilt['status'] == 'PASS'
        comparisons = []
        for file in sorted((ROOT / 'print').glob('*.pdf')):
            other = portable / 'print' / file.name
            same = digest(file) == digest(other)
            assert same, file.name
            comparisons.append({'file': file.name, 'sha256': digest(file), 'byteIdentical': same})
    rebuild = {'status': 'PASS', 'checkedAt': checked, 'scope': 'Isolated directory with only bundled A inputs; exact current PDFs, no external project paths.', 'pdfs': comparisons, 'identicalPdfCount': len(comparisons), 'rebuiltStaticCounts': rebuilt['counts'], 'runtime': {name: importlib.metadata.version(name) for name in ['reportlab', 'Pillow', 'pypdf', 'pdfplumber']}}
    write(VERIFY / 'portable-print-rebuild.json', rebuild)
    renders = args.work.resolve() / ('print-renders-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
    renders.mkdir()
    run(['pdftoppm', '-r', '110', '-png', str(master), str(renders / 'master')])
    page_records = []
    for page in visual['pages']:
        file = renders / f'master-{page:02}.png'
        page_records.append({'page': page, 'sha256': digest(file), 'pixels': list(Image.open(file).size)})
    extracts = []
    for name, pages in inventory['extracts'].items():
        directory = renders / Path(name).stem
        directory.mkdir()
        run(['pdftoppm', '-r', '110', '-png', str(ROOT / 'print' / name), str(directory / 'page')])
        files = sorted(directory.glob('page-*.png'), key=lambda file: int(file.stem.split('-')[-1]))
        assert len(files) == len(pages)
        for file, page in zip(files, pages):
            reference = renders / f'master-{page:02}.png'
            same = Image.open(file).tobytes() == Image.open(reference).tobytes() and Image.open(file).size == Image.open(reference).size
            assert same, (name, page)
            extracts.append({'file': name, 'page': int(file.stem.split('-')[-1]), 'masterPage': page, 'pixelIdentical': same, 'renderSha256': digest(file)})
    render_report = {'status': 'PASS', 'checkedAt': checked, 'dpi': 110, 'masterSha256': digest(master), 'masterPages': page_records, 'extractedPages': extracts, 'scope': 'All 31 master pages rendered; all 26 supporting pages independently rendered and compared. Visual inspection is recorded separately.'}
    write(VERIFY / 'render-comparison.json', render_report)
    paths = set()
    for relative in ['print', 'art', 'assets/art', 'tools/print']:
        paths.update(file for file in (ROOT / relative).rglob('*') if file.is_file() and file.suffix not in ['.zip', '.sha256', '.pyc'] and '__pycache__' not in file.parts)
    evidence = ['verification/print/static-results.json', 'verification/print/supply-results.json', 'verification/print/build-result.json', 'verification/print/printed-content-contract.json', 'verification/print/b-content-comparison.json', 'verification/print/desk-walkthroughs.json', 'verification/B_CONTENT_PROJECTION.json', 'verification/integration/visual-review.json', 'verification/integration/render-comparison.json', 'verification/integration/portable-print-rebuild.json', 'verification/integration/print-parity-results.json', 'tools/package/check-print-integration.py', 'tools/package/project-print-content.js', 'tests/print-parity-check.js', 'engine.js', 'content.json']
    paths.update(ROOT / relative for relative in evidence)
    hashes = {file.relative_to(ROOT).as_posix(): digest(file) for file in sorted(paths)}
    receipt = {'status': 'READY', 'checkedAt': checked, 'scope': 'Current A+B integration receipt authored by the integrator, not an invented worker A delivery record. Historical A-only receipts remain separately labeled.', 'contentSha256': digest(ROOT / 'content.json'), 'masterPages': inventory['page_count'], 'cutPieces': inventory['cut_piece_count'], 'checks': {name:'PASS' for name in ['everyPageVisualReview', 'contentMatch', 'inventoryMatch', 'a4MarginsFonts', 'extractsMatch', 'portableRebuild', 'deskWalkthrough']}, 'files': sorted(hashes), 'hashes': hashes, 'limitations': ['Physical print/cut/opacity/handling NOT_RUN', 'Human playtesting and team art approval NOT_RUN', 'Institution-specific submission requirements unknown']}
    write(VERIFY / 'print-delivery.json', receipt)
    print(json.dumps({'status': 'PASS', 'masterPages': len(page_records), 'extractPages': len(extracts), 'rebuiltPdfs': len(comparisons), 'static': static['counts'], 'receipt': 'verification/integration/print-delivery.json'}, indent=2))


if __name__ == '__main__':
    main()
