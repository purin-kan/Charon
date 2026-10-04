"""Build a complete portable ZIP, then verify CRC, file set and exact bytes."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,zipfile
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT.parent/(ROOT.name+'.zip')
MANIFEST=ROOT/'PACKAGE_MANIFEST.json'
REPORT=ROOT/'verification/package-check.json'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def files():return sorted(p for p in ROOT.rglob('*') if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc')
def writezip():
    with zipfile.ZipFile(DEST,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in files():z.write(p,ROOT.name+'/'+p.relative_to(ROOT).as_posix())
def verify():
    with zipfile.ZipFile(DEST) as z:
        assert z.testzip() is None,'ZIP CRC failure'
        expected={ROOT.name+'/'+p.relative_to(ROOT).as_posix():p for p in files()}
        assert set(z.namelist())==set(expected),'ZIP file list differs'
        for name,p in expected.items():assert z.read(name)==p.read_bytes(),'ZIP bytes differ: '+name
        return len(expected)
payload=[p for p in files() if p not in (MANIFEST,REPORT)]
MANIFEST.write_text(json.dumps({'createdAt':datetime.now(timezone.utc).isoformat(),'scope':'Hashes cover every payload file except this manifest and verification/package-check.json, which describe this package.','files':{p.relative_to(ROOT).as_posix():{'bytes':p.stat().st_size,'sha256':digest(p)} for p in payload}},indent=2),encoding='utf-8')
# Validate the payload first, then include its report and verify the final archive again.
writezip();verify()
REPORT.write_text(json.dumps({'checkedAt':datetime.now(timezone.utc).isoformat(),'archive':DEST.name,'status':'PASS','checks':['ZIP CRC','Exact relative file set','Byte-for-byte comparison against current folder'],'fileCount':len(files())+(0 if REPORT.exists() else 1),'manifestSha256':digest(MANIFEST),'note':'Archive hash is omitted to avoid a self-referential report. Final archive is verified again after inserting this report.'},indent=2),encoding='utf-8')
writezip()
try:
    count=verify()
except Exception:
    REPORT.write_text(json.dumps({'status':'FAIL','reason':'Final ZIP verification failed.'}),encoding='utf-8')
    raise
assert count==json.loads(REPORT.read_text(encoding='utf-8'))['fileCount']
print(json.dumps({'archive':str(DEST),'files':count,'bytes':DEST.stat().st_size,'sha256':digest(DEST),'status':'PASS'}))

