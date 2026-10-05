"""Package only Handoff A folders, then verify membership, bytes and CRC."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, zipfile

BASE = Path(__file__).resolve().parents[2]
ARCHIVE = BASE / 'print/Handoff_A_v0.6.zip'
MANIFEST = BASE / 'print/A_DELIVERY_MANIFEST.json'
RECEIPT = BASE / 'verification/print/a-package-check.json'
CHECKSUM = BASE / 'print/Handoff_A_v0.6.zip.sha256'
OWNED = ['print', 'art', 'assets/art', 'tools/print', 'verification/print']
EXCLUDED = {ARCHIVE, MANIFEST, RECEIPT, CHECKSUM}

def sha(data):
    return hashlib.sha256(data).hexdigest()

files = sorted({p for folder in OWNED for p in (BASE/folder).rglob('*')
                if p.is_file() and p not in EXCLUDED and '__pycache__' not in p.parts
                and p.suffix not in {'.pyc', '.zip'}})
records = [{'path':p.relative_to(BASE).as_posix(), 'bytes':p.stat().st_size,
            'sha256':sha(p.read_bytes())} for p in files]
manifest = dict(scope='Handoff A only. B owns the final combined submission archive.',
                roots=OWNED, payload_file_count=len(records), files=records,
                excluded=['All ZIPs', 'Python caches', 'This manifest itself',
                          'verification/print/a-package-check.json, included in ZIP but excluded from manifest to avoid recursion',
                          'print/Handoff_A_v0.6.zip.sha256, adjacent archive checksum'])
MANIFEST.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
files.append(MANIFEST)
receipt = dict(status='PASS', checked_utc=datetime.now(timezone.utc).isoformat(),
               archive='print/Handoff_A_v0.6.zip', archive_file_count=len(files)+1,
               payload_file_count=len(records), exact_membership=True, exact_bytes=True,
               crc=True, manifest_hashes=True,
               scope='A-only delivery. Receipt included in ZIP; whole-archive SHA-256 is adjacent to the ZIP to avoid a circular hash.')
receipt_bytes = json.dumps(receipt, indent=2).encode('utf-8')
with zipfile.ZipFile(ARCHIVE, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in files:
        z.write(p, p.relative_to(BASE).as_posix())
    z.writestr(RECEIPT.relative_to(BASE).as_posix(),receipt_bytes)
expected = {p.relative_to(BASE).as_posix():p.read_bytes() for p in files}
expected[RECEIPT.relative_to(BASE).as_posix()] = receipt_bytes
with zipfile.ZipFile(ARCHIVE) as z:
    assert z.testzip() is None, 'CRC failure'
    assert len(z.namelist()) == len(expected) and set(z.namelist()) == set(expected), 'Membership differs'
    assert all(z.read(name) == data for name,data in expected.items()), 'Bytes differ'
    packed = json.loads(z.read('print/A_DELIVERY_MANIFEST.json'))
    assert all(sha(z.read(r['path'])) == r['sha256'] and len(z.read(r['path'])) == r['bytes']
               for r in packed['files']), 'Manifest mismatch'
RECEIPT.write_bytes(receipt_bytes)
archive_sha256=sha(ARCHIVE.read_bytes())
CHECKSUM.write_text(archive_sha256+'  Handoff_A_v0.6.zip\n',encoding='utf-8')
print(json.dumps(dict(**receipt,archive_sha256=archive_sha256,archive_bytes=ARCHIVE.stat().st_size), indent=2))
