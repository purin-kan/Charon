"""Build a portable game archive, using only the Python standard library."""
from pathlib import Path
import hashlib,json,re,zipfile
root=Path(__file__).resolve().parent.parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
results=json.loads((root/'verification/quest-results.json').read_text())
assert results['failed']==0
for name,value in results['hashes'].items():assert sha(root/name)==value,name
for name in ['index.html','app.js','asset-map.js']:
    text=(root/name).read_text()
    for asset in re.findall(r'assets/art/[^"\s]+\.(?:png|jpg)',text):assert (root/asset).is_file(),asset
for href in re.findall(r'(?:src|href)="([^"]+)"',(root/'index.html').read_text()):
    if not href.startswith(('http:','https:','#')):assert (root/href).is_file(),href
receipt={'version':'0.7-trial','status':'PROTOTYPE_FOR_TEAM_REVIEW','engine_groups_passed':results['passed'],'scale':'Deferred for team direction; existing temporary configuration retained','pending_playable_souls':['Drug Dealer','Fool','Killer'],'spreadsheets':'Local and gitignored; not included','human_playtest':'Not performed','browser_evidence':'Earlier native Chrome/macOS smoke check of v0.7 gameplay. No new mobile/Windows or current TBA-panel browser check claimed.'}
(root/'verification/delivery.json').write_text(json.dumps(receipt,indent=2)+'\n')
files=sorted(p for p in root.rglob('*') if p.is_file() and '__pycache__' not in p.parts)
manifest={str(p.relative_to(root)):sha(p) for p in files}
archive=root.parent/'The_Ferryman_v0.7.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:z.write(p,'The_Ferryman_v0.7/'+str(p.relative_to(root)))
    z.writestr('The_Ferryman_v0.7/MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for name,value in manifest.items():assert hashlib.sha256(z.read('The_Ferryman_v0.7/'+name)).hexdigest()==value,name
final={**receipt,'archive':archive.name,'bytes':archive.stat().st_size,'sha256':sha(archive),'payload_files':len(files),'zip_entries':len(files)+1,'all_payload_hashes_verified':True}
(root.parent/'The_Ferryman_v0.7_RECEIPT.json').write_text(json.dumps(final,indent=2)+'\n')
print(json.dumps(final,indent=2))
