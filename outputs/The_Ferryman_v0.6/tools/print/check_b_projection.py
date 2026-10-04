"""Compare B-derived normalized content, without editing B's files."""
from pathlib import Path
import sys,json,hashlib
BASE=Path(__file__).resolve().parents[2]
expected=json.loads((BASE/'verification/print/printed-content-contract.json').read_text(encoding='utf-8'))
path=Path(sys.argv[1]);actual=json.loads(path.read_text(encoding='utf-8-sig'))
keys=['souls','destinations','memories','constants','initialShore','initialArrivals','endless','ordinaryRecycle','freshMemoryEveryEligibleDelivery','questOncePerRun','facilitatorRoutes']
def norm(key,value):
    if key in ['souls','destinations']:return sorted(value,key=lambda a:a['id'])
    if key in ['initialShore','initialArrivals']:return sorted(value)
    return value
diff=[]
for key in keys:
    if key not in actual:diff.append(dict(field=key,reason='missing'))
    elif norm(key,actual[key])!=norm(key,expected[key]):diff.append(dict(field=key,expected=expected[key],actual=actual[key]))
result=dict(status='FAIL' if diff else 'PASS',source=str(path),source_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),differences=diff,scope='Normalized content equality only. Does not verify runtime sequence or replace browser tests.')
(BASE/'verification/print/b-content-comparison.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2));sys.exit(bool(diff))
