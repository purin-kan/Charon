import argparse
import hashlib
import html
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
from zipfile import ZipFile, ZIP_DEFLATED
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[2]
NAME = 'The_Ferryman_v0.6_Submission'
PDF_NAMES = ['Print_and_Play', 'Cutout_Sheets', 'Player_Guide', 'Assembly_and_Setup', 'Full_Rules', 'Workshop_Record']
SELF_REPORTS = {'MANIFEST.json', 'PACKAGE_RESULTS.json'}
SOURCE_EXCLUSIONS = {'print/Handoff_A_v0.6.zip', 'print/Handoff_A_v0.6.zip.sha256'}
RUNTIME = ['index.html', 'app.js', 'engine.js', 'content.js', 'content.json', 'asset-map.js', 'styles.css']


def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def read_json(file):
    return json.loads(file.read_text(encoding='utf-8'))


def write_json(file, value):
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def safe_path(root, relative):
    file = (root / relative).resolve()
    if not file.is_relative_to(root.resolve()):
        raise ValueError('Path leaves package: ' + relative)
    return file


def hashes_match(record, root):
    return bool(record.get('hashes')) and all(safe_path(root, relative).is_file() and digest(safe_path(root, relative)) == expected for relative, expected in record['hashes'].items())


def gates():
    missing = []
    required = ['print/' + name + '_v0.6.pdf' for name in PDF_NAMES]
    required += ['print/COMPONENT_INVENTORY.json', 'print/COMPONENT_INVENTORY.md', 'art/ASSET_MANIFEST.json', 'verification/integration/print-delivery.json']
    for relative in required:
        file = safe_path(ROOT, relative)
        if not file.is_file() or not file.stat().st_size:
            missing.append(relative)
    for folder in ['tools/print', 'verification/print']:
        if not (ROOT / folder).is_dir() or not any(file.is_file() for file in (ROOT / folder).rglob('*')):
            missing.append(folder + '/ (editable sources/checks)')
    content_hash = digest(ROOT / 'content.json')
    delivery_path = ROOT / 'verification/integration/print-delivery.json'
    delivery = read_json(delivery_path) if delivery_path.is_file() else {}
    if delivery:
        if delivery.get('status') != 'READY' or delivery.get('contentSha256') != content_hash:
            missing.append('A delivery READY status and current shared content hash')
        if not isinstance(delivery.get('masterPages'), int) or delivery.get('masterPages', 0) < 1 or not isinstance(delivery.get('cutPieces'), int) or delivery.get('cutPieces', 0) < 1:
            missing.append('A actual positive masterPages and cutPieces')
        required_checks = ['everyPageVisualReview', 'contentMatch', 'inventoryMatch', 'a4MarginsFonts', 'extractsMatch', 'portableRebuild', 'deskWalkthrough']
        for check in required_checks:
            if delivery.get('checks', {}).get(check) != 'PASS':
                missing.append('A print check: ' + check)
        if not delivery.get('files') or not all(safe_path(ROOT, file).is_file() for file in delivery.get('files', [])):
            missing.append('A delivery file list with all real paths')
        if not hashes_match(delivery, ROOT):
            missing.append('Current integration receipt hashes for reviewed print/art/source bytes')
        for relative in required:
            if relative.endswith('.pdf') and (ROOT / relative).is_file():
                if relative not in delivery.get('hashes', {}):
                    missing.append('A reviewed PDF hash: ' + relative)
    if all((ROOT / 'print' / (name + '_v0.6.pdf')).is_file() for name in PDF_NAMES):
        reader = shutil.which('pdfinfo')
        if not reader:
            missing.append('An existing pdfinfo reader for final PDF structural checks')
        else:
            for name in PDF_NAMES:
                file = ROOT / 'print' / (name + '_v0.6.pdf')
                result = subprocess.run([reader, str(file)], capture_output=True, text=True)
                pages = re.search(r'^Pages:\s+(\d+)', result.stdout, re.MULTILINE)
                if result.returncode or not pages or int(pages[1]) < 1:
                    missing.append('Readable nonempty PDF: ' + file.name)
                    continue
                if name == 'Player_Guide' and int(pages[1]) != 1:
                    missing.append('One-page Player_Guide_v0.6.pdf')
                if name == 'Print_and_Play' and int(pages[1]) != delivery.get('masterPages'):
                    missing.append('Master PDF page count matches delivery record')
                all_pages = subprocess.run([reader, '-f', '1', '-l', pages[1], str(file)], capture_output=True, text=True)
                sizes = re.findall(r'^Page\s+\d+ size:\s+([0-9.]+) x ([0-9.]+)', all_pages.stdout, re.MULTILINE)
                if len(sizes) != int(pages[1]) or any(abs(min(float(width), float(height)) - 595.276) > 1 or abs(max(float(width), float(height)) - 841.89) > 1 for width, height in sizes):
                    missing.append('Every page A4: ' + file.name)
    art = read_json(ROOT / 'verification/art-integration.json')
    if art.get('status') != 'PASS':
        missing.extend('Artwork: ' + item for item in art.get('missing', []))
        if not art.get('finalManifestPresent'):
            missing.append('A final artwork manifest and provenance')
    if (ROOT / 'art/ASSET_MANIFEST.json').is_file():
        manifest = read_json(ROOT / 'art/ASSET_MANIFEST.json')
        assets = manifest.get('assets', manifest.get('files', []))
        if not assets:
            missing.append('Artwork: nonempty final manifest')
        for item in assets:
            file = safe_path(ROOT, item.get('path', ''))
            if not file.is_file() or digest(file) != item.get('sha256') or not (item.get('component_ids') or item.get('componentId')) or not item.get('source') or not (item.get('license') or item.get('generation')):
                missing.append('Complete art provenance/hash: ' + item.get('path', 'unknown'))
    for relative in ['verification/engine-results.json', 'verification/integration/print-parity-results.json', 'verification/browser-results.json', 'verification/extracted-browser-results.json']:
        if not (ROOT / relative).is_file():
            missing.append(relative)
            continue
        record = read_json(ROOT / relative)
        if record.get('failed', 0) or record.get('status', 'PASS') != 'PASS' or not hashes_match(record, ROOT):
            missing.append('Current passing evidence: ' + relative)
        if 'browser' in relative and not all(file in record.get('hashes', {}) for file in RUNTIME):
            missing.append('Browser runtime hashes: ' + relative)
    return {'version': '0.6', 'status': 'WAITING_FOR_A' if any(item.startswith(('print/', 'art/', 'Artwork:', 'A ', 'tools/print', 'verification/print')) for item in missing) else 'CHECKS_PENDING' if missing else 'READY', 'contentSha256': content_hash, 'missing': missing, 'masterPages': delivery.get('masterPages'), 'cutPieces': delivery.get('cutPieces'), 'note': 'Integrity PASS does not mean submission-ready while dependencies are missing.'}


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        self.references.extend(value for key, value in attrs if key in ('href', 'src') and value)


def check_links(root):
    checked = 0
    for file in sorted(root.rglob('*')):
        if not file.is_file() or file.suffix.lower() not in ('.html', '.css', '.md'):
            continue
        text = file.read_text(encoding='utf-8')
        if file.suffix == '.html':
            parser = Links()
            parser.feed(text)
            references = parser.references
        elif file.suffix == '.css':
            references = re.findall(r'url\([\'\"]?([^\)\'\"]+)', text)
        else:
            references = re.findall(r'\[[^\]]*\]\(([^)]+)\)', text)
        for reference in references:
            parsed = urlsplit(reference.strip('<>'))
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            target = (file.parent / unquote(parsed.path)).resolve()
            if not target.is_relative_to(root.resolve()) or not target.exists():
                raise ValueError(f'Broken local link in {file.relative_to(root)}: {reference}')
            checked += 1
    asset_map = json.loads((root / 'game/asset-map.js').read_text().split(' = ', 1)[1].rstrip().removesuffix(';'))
    for relative in asset_map.values():
        if not safe_path(root / 'game', relative).is_file():
            raise ValueError('Missing runtime asset: ' + relative)
        checked += 1
    return checked


def verify_manifest(root):
    manifest = read_json(root / 'MANIFEST.json')
    entries = {item['path']: item for item in manifest['files']}
    actual = {file.relative_to(root).as_posix() for file in root.rglob('*') if file.is_file()} - SELF_REPORTS
    if actual != set(entries):
        raise ValueError('Manifest membership differs')
    for relative, item in entries.items():
        file = safe_path(root, relative)
        if file.stat().st_size != item['bytes'] or digest(file) != item['sha256']:
            raise ValueError('Manifest hash/size mismatch: ' + relative)
    return len(entries)


def make_zip(stage, target):
    with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
        for file in sorted(stage.rglob('*')):
            if file.is_file():
                archive.write(file, NAME + '/' + file.relative_to(stage).as_posix())


def verify_zip(stage, target):
    expected = {NAME + '/' + file.relative_to(stage).as_posix(): file for file in stage.rglob('*') if file.is_file()}
    with ZipFile(target) as archive:
        if archive.testzip() is not None or set(archive.namelist()) != set(expected) or len(archive.namelist()) != len(expected):
            raise ValueError('ZIP CRC or membership failed')
        for name, file in expected.items():
            if archive.read(name) != file.read_bytes():
                raise ValueError('ZIP bytes differ: ' + name)
    return len(expected)


def main():
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--prepare', action='store_true')
    mode.add_argument('--complete', action='store_true')
    parser.add_argument('--output-parent', type=Path)
    args = parser.parse_args()
    provenance = read_json(ROOT / 'source/SOURCE_FRESHNESS.json')
    for record in provenance['suppliedSourcesOldestFirst']:
        file = ROOT / 'source/supplied_guides' / Path(record['copyPath']).name
        if not file.is_file() or digest(file) != record['sha256']:
            raise ValueError('Original guide hash differs: ' + str(file))
        with ZipFile(file) as document:
            if document.testzip() is not None:
                raise ValueError('Source DOCX CRC failed: ' + str(file))
            ElementTree.fromstring(document.read('word/document.xml'))
    shared_hash = digest(ROOT / 'content.json')
    for relative in ['rules.json', 'PRINT_TEXT.json', 'verification/content-build.json']:
        if read_json(ROOT / relative)['contentSha256'] != shared_hash:
            raise ValueError('Stale shared content export: ' + relative)
    output_parent = (args.output_parent or (ROOT.parent.parent if ROOT.name == 'game' else ROOT.parent)).resolve()
    output_parent.mkdir(parents=True, exist_ok=True)
    status = gates()
    write_json(ROOT / 'verification/submission-status.json', status)
    if args.complete and status['missing']:
        print(json.dumps(status, indent=2))
        raise SystemExit('Complete submission blocked. No final ZIP created.')
    complete = args.complete and not status['missing']
    stage = output_parent / NAME
    if stage == ROOT or stage.is_relative_to(ROOT):
        raise ValueError('Staging must be outside the source game folder')
    stage.mkdir(parents=True, exist_ok=True)
    old_files = set()
    if (stage / 'MANIFEST.json').is_file():
        old_files = {item['path'] for item in read_json(stage / 'MANIFEST.json')['files']} | SELF_REPORTS
    existing = {file.relative_to(stage).as_posix() for file in stage.rglob('*') if file.is_file()}
    if existing - old_files:
        raise ValueError('Unknown staging files preserved; use another --output-parent: ' + ', '.join(sorted(existing - old_files)))
    copied = set()
    for file in sorted(ROOT.rglob('*')):
        if not file.is_file() or file.relative_to(ROOT).as_posix() in SOURCE_EXCLUSIONS or any(part in ('.git', '__pycache__', 'node_modules', '.DS_Store') for part in file.relative_to(ROOT).parts):
            continue
        if file.is_symlink():
            raise ValueError('Do not package symlink: ' + str(file))
        relative = 'game/' + file.relative_to(ROOT).as_posix()
        destination = stage / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, destination)
        copied.add(relative)
    label = 'Complete local submission package' if complete else 'INCOMPLETE integration package: waiting for A and final release gates'
    print_block = '<a href="game/print/Print_and_Play_v0.6.pdf">Print the complete kit</a><p>A4, color, single-sided, actual size / 100 percent. Separate cutout and guide PDFs duplicate master pages; do not print both for one station.</p><a href="game/print/Player_Guide_v0.6.pdf">Read the one-page player guide</a>' if complete else '<h2>Print the complete kit: unavailable</h2><p>A’s v0.6 master kit, extracts, inventory, editable print sources and verification must be integrated. This archive is not ready for course submission.</p>'
    (stage / 'START_HERE.html').write_text(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>The Ferryman v0.6 submission</title><style>body{{max-width:860px;margin:40px auto;padding:24px;background:#10252b;color:#f2e9d7;font:18px/1.65 system-ui}}a{{color:#edc47f}}li{{margin:12px 0}}strong{{color:#ffd18a}}</style></head><body><h1>The Ferryman v0.6</h1><p><strong>{html.escape(label)}</strong></p>{print_block}<h2>Play</h2><p><a href="game/index.html">Play the browser game</a>. All runtime assets are local. Direct-file testing was blocked by the browser tool; see the tested local-server instructions.</p><h2>Read and edit</h2><ul><li><a href="game/RULES.md">Read the reconciled rules</a></li><li><a href="game/REBUILD.md">View editable sources and rebuild instructions</a></li><li><a href="game/README.md">Launch and save instructions</a></li><li><a href="game/INTEGRATION.md">A/B integration dependencies</a></li><li><a href="game/VALIDATION.md">Current verification and human checks</a></li><li><a href="SUBMISSION_INVENTORY.md">All-files inventory</a></li></ul><p>No external upload or team approval is claimed. Course naming, size and deadline requirements are unknown.</p></body></html>\n', encoding='utf-8')
    (stage / 'README.md').write_text(f'# The Ferryman v0.6 submission\n\n**{label}.**\n\n[Play](game/index.html) · [Rules](game/RULES.md) · [Editable sources](game/REBUILD.md) · [Validation](game/VALIDATION.md) · [Integration dependencies](game/INTEGRATION.md)\n\nThe `game/` tree preserves all browser, rules, design, original guides, licenses, assets, build sources and verification paths. A complete release also includes A’s print/art folders in that same tree. Missing deliverables have no substitute files. The source DOCX documents are provenance, not final rules.\n\nA4 color, single-sided, 100 percent printing applies to the eventual master kit. Its separate cutout and reference extracts duplicate pages; do not print all variants for one set.\n\nNo deployment or upload is performed. Human printer and play checks remain required.\n', encoding='utf-8')
    (stage / 'RELEASE_NOTES.md').write_text('# v0.6 release notes\n\n' + label + '.\n\nEndless survival replaces earlier finite targets. Ordinary souls recycle from resolved discard, fixed memory rewards recur, family quest success/failure persists, and the facilitator supplies route offers. A new save namespace preserves older saves. The content hash and all actual release gates appear in `game/verification/submission-status.json`.\n\nNo earlier-version PDF or testing outcome establishes completion of v0.6.\n', encoding='utf-8')
    copied |= {'START_HERE.html', 'README.md', 'RELEASE_NOTES.md', 'SUBMISSION_INVENTORY.md'}
    for relative in old_files - copied - SELF_REPORTS:
        file = safe_path(stage, relative)
        if file.is_file():
            file.unlink()
    inventory = ['# Submission inventory', '', label + '.', '', '| File | Bytes |', '|---|---:|']
    for file in sorted(stage.rglob('*')):
        if file.is_file() and file.relative_to(stage).as_posix() not in SELF_REPORTS | {'SUBMISSION_INVENTORY.md'}:
            inventory.append(f'| `{file.relative_to(stage).as_posix()}` | {file.stat().st_size} |')
    inventory += ['', 'Inventory excludes its own changing byte count and the two self-report files. The manifest covers every other payload file. Missing A dependencies are listed in `game/verification/submission-status.json`.', '']
    (stage / 'SUBMISSION_INVENTORY.md').write_text('\n'.join(inventory), encoding='utf-8')
    entries = [{'path': file.relative_to(stage).as_posix(), 'bytes': file.stat().st_size, 'sha256': digest(file)} for file in sorted(stage.rglob('*')) if file.is_file() and file.relative_to(stage).as_posix() not in SELF_REPORTS]
    write_json(stage / 'MANIFEST.json', {'version': '0.6', 'releaseStatus': 'COMPLETE_LOCAL' if complete else 'INCOMPLETE', 'excludedSelfReports': sorted(SELF_REPORTS), 'files': entries})
    if (stage / 'PACKAGE_RESULTS.json').exists():
        (stage / 'PACKAGE_RESULTS.json').unlink()
    links = check_links(stage)
    verify_manifest(stage)
    scratch_parent = ROOT.parents[1] / 'work' if ROOT.parent.name == 'outputs' else output_parent
    scratch_parent.mkdir(exist_ok=True, parents=True)
    with tempfile.TemporaryDirectory(prefix='v06-package-', dir=scratch_parent) as scratch:
        candidate = Path(scratch) / 'candidate.zip'
        make_zip(stage, candidate)
        verify_zip(stage, candidate)
        with ZipFile(candidate) as archive:
            archive.extractall(Path(scratch) / 'extracted')
        extracted = Path(scratch) / 'extracted' / NAME
        verify_manifest(extracted)
        extracted_links = check_links(extracted)
        process = subprocess.run(['node', 'tests/engine-check.js'], cwd=extracted / 'game', env={**os.environ, 'FERRY_CHECK_NO_WRITE': '1'}, capture_output=True, text=True, check=True)
        engine = json.loads(process.stdout)
        generated = ['content.js', 'rules.json', 'PRINT_TEXT.json', 'RULES.md', 'asset-map.js']
        before = {relative: digest(extracted / 'game' / relative) for relative in generated}
        subprocess.run(['node', 'tools/package/build-content.js'], cwd=extracted / 'game', capture_output=True, check=True)
        subprocess.run(['node', 'tools/package/build-assets.js'], cwd=extracted / 'game', capture_output=True, check=True)
        if before != {relative: digest(extracted / 'game' / relative) for relative in generated}:
            raise ValueError('Bundled rebuild changes generated runtime/rules bytes')
        parity_process = subprocess.run(['node', 'tests/print-parity-check.js'], cwd=extracted / 'game', env={**os.environ, 'FERRY_CHECK_NO_WRITE': '1'}, capture_output=True, text=True, check=True)
        parity = json.loads(parity_process.stdout)
        print_files = sorted((extracted / 'game/print').glob('*.pdf'))
        pdf_hashes = {file.name: digest(file) for file in print_files}
        subprocess.run([sys.executable, 'tools/print/build.py'], cwd=extracted / 'game', capture_output=True, text=True, check=True)
        if pdf_hashes != {file.name: digest(file) for file in print_files}:
            raise ValueError('Extracted print rebuild differs from reviewed PDFs')
        subprocess.run([sys.executable, 'tools/print/verify.py'], cwd=extracted / 'game', capture_output=True, text=True, check=True)
        print_checks = read_json(extracted / 'game/verification/print/static-results.json')
        if print_checks['status'] != 'PASS' or print_checks['counts']['fail_count']:
            raise ValueError('Extracted print verification failed')
        verify_manifest(extracted)
    report = {'version': '0.6', 'checkedAt': datetime.now(timezone.utc).isoformat(), 'integrityStatus': 'PASS', 'releaseStatus': 'COMPLETE_LOCAL' if complete else 'INCOMPLETE', 'contentSha256': status['contentSha256'], 'sourceAndExtractedLinks': [links, extracted_links], 'manifestFiles': len(entries), 'extractedEngine': {'passed': engine['passed'], 'failed': engine['failed'], 'hashes': engine['hashes']}, 'bundledDataRebuild': 'BYTE_IDENTICAL', 'zipChecks': 'CRC, exact membership and all bytes verified on candidate and final archive', 'missing': status['missing'], 'masterPages': status['masterPages'], 'cutPieces': status['cutPieces'], 'humanChecks': 'NOT_RUN; see bundled human checklist', 'exclusions': sorted(SELF_REPORTS), 'note': 'Final archive hash/size live in the external receipt to avoid a self-reference loop.'}
    report['originalGuides'] = 'Both DOCX SHA-256 match recorded supplied originals'
    report['extractedPaperParity'] = {'passed': parity['passed'], 'failed': parity['failed']}
    report['extractedPrint'] = {'rebuiltPdfs': len(print_files), 'pdfBytes': 'BYTE_IDENTICAL', 'staticChecks': print_checks['counts']}
    report['sourceExclusions'] = sorted(SOURCE_EXCLUSIONS)
    write_json(stage / 'PACKAGE_RESULTS.json', report)
    target = output_parent / (NAME + ('' if complete else '_INCOMPLETE') + '.zip')
    make_zip(stage, target)
    zip_files = verify_zip(stage, target)
    verify_manifest(stage)
    receipt = {**report, 'archive': target.name, 'archiveBytes': target.stat().st_size, 'archiveSha256': digest(target), 'zipFiles': zip_files, 'stagingFolder': NAME}
    receipt_path = output_parent / (target.stem + '_RECEIPT.json')
    write_json(receipt_path, receipt)
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
