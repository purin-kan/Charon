"""Verify v0.5 print files, shared content, sources and local links."""
from pathlib import Path
from datetime import datetime, timezone
import json, hashlib, re
import pdfplumber
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
D=json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
I=json.loads((ROOT/'print/COMPONENT_INVENTORY.json').read_text(encoding='utf-8'))
B=json.loads((ROOT/'verification/build-results.json').read_text(encoding='utf-8'))
records=[]; details={}
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def check(name,fn):
    try:
        fn()
        records.append({'name':name,'status':'PASS'})
    except Exception as e:
        records.append({'name':name,'status':'FAIL','error':str(e)})
def require(ok,message):
    if not ok: raise AssertionError(message)
def sources():
    for name,value in B['sourceHashes'].items():
        p=ROOT/name if name!='build.py' else ROOT/'tools/build.py'
        require(digest(p)==value,'Stale build: '+name)
    for name,result in B['outputs'].items():
        require(digest(ROOT/'print'/name)==result['sha256'],'PDF hash mismatch: '+name)
    for filename in ['engine-results.json','simulation-results.json','browser-results.json']:
        data=json.loads((ROOT/'verification'/filename).read_text(encoding='utf-8'))
        for name,value in data.get('sourceHashes',{}).items():
            require(digest(ROOT/name)==value,'Stale evidence '+filename+': '+name)
def components():
    categories={'souls':'souls','routes':'routes','memories':'memories','arrivalTickets':'arrivals','events':'events'}
    for name,key in categories.items():
        require(len(D[key])==I['perPlayer'][name],'Wrong count: '+key)
        ids=[x['id'] for x in D[key]]
        require(len(set(ids))==len(ids),'Duplicate IDs')
        for cid in ids: require(sum(x['id']==cid for x in I['components'])==1,'Missing printable '+cid)
    require(len(I['components'])==sum(I['perPlayer'].values()),'Total component count')
    all_arrivals=[s for a in D['arrivals'] for s in a['souls']]
    require(sorted(all_arrivals)==sorted(s['id'] for s in D['souls']),'Arrival conservation')
    require(sorted(s['memory'] for s in D['souls'] if s['memory'])==sorted(m['id'] for m in D['memories']),'Memory mapping')
    for c in I['components']:
        require(c['x_mm']>=9.9 and c['x_mm']+c['width_mm']<=200.1 and c['y_mm']>=9.9 and c['y_mm']+c['height_mm']<=287.1,'Component outside safe area')
    for i,a in enumerate(I['components']):
        for b in I['components'][i+1:]:
            if a['page']==b['page']:
                overlap=min(a['x_mm']+a['width_mm'],b['x_mm']+b['width_mm'])-max(a['x_mm'],b['x_mm'])>0.05 and min(a['y_mm']+a['height_mm'],b['y_mm']+b['height_mm'])-max(a['y_mm'],b['y_mm'])>0.05
                require(not overlap,'Overlapping pieces '+a['id']+' '+b['id'])
    markers=[c for c in I['components'] if c['id'].startswith('TOKEN-')]
    require(all(c['width_mm']<=20 and c['height_mm']<=11 for c in markers),'Marker exceeds smallest track cell')
    details['componentCount']=len(I['components'])
def pdfs():
    master=PdfReader(ROOT/'print/Print_and_Play_v0.5.pdf')
    guide=PdfReader(ROOT/'print/Player_Guide_v0.5.pdf')
    require(len(master.pages)==16 and len(guide.pages)==1,'Page count')
    for p in list(master.pages)+list(guide.pages):
        require(abs(float(p.mediabox.width)-595.2756)<.1 and abs(float(p.mediabox.height)-841.8898)<.1,'Not A4')
    require(master.pages[1].get_contents().get_data()==guide.pages[0].get_contents().get_data(),'Separate guide differs from master page 2')
    used=set(); minsize=100; chars=0
    with pdfplumber.open(ROOT/'print/Print_and_Play_v0.5.pdf') as doc:
        for page in doc.pages:
            text=page.extract_text() or ''
            require('\ufffd' not in text and '\u25a0' not in text,'Missing glyph')
            for ch in page.chars:
                minsize=min(minsize,ch['size']); chars+=1; used.add(ch['fontname'])
                require(ch['x0']>=28.1 and ch['x1']<=567.2 and ch['top']>=28.1 and ch['bottom']<=813.8,'Glyph outside 10 mm margins on page '+str(page.page_number))
        calibration=[l for l in doc.pages[0].lines if abs(l['y0']-l['y1'])<.01 and abs(abs(l['x1']-l['x0'])-50*72/25.4)<.1]
        require(calibration,'Missing 50 mm calibration vector')
        full='\n'.join(p.extract_text() or '' for p in doc.pages)
        for key in ['souls','memories','routes','arrivals','events']:
            for obj in D[key]: require(obj['id'] in full,'Missing printed ID '+obj['id'])
    font_resources={}
    for page in master.pages:
        for ref in page['/Resources']['/Font'].get_object().values():
            f=ref.get_object(); font_resources[str(f.get('/BaseFont','')).lstrip('/')]=f
    for name in used:
        font=font_resources.get(name)
        require(font is not None,'Unknown font '+name)
        desc=font.get('/FontDescriptor')
        require(desc is not None and any(k in desc.get_object() for k in ['/FontFile','/FontFile2','/FontFile3']),'Font not embedded: '+name)
    details.update({'masterPages':16,'guidePages':1,'glyphCount':chars,'minimumTextPt':round(minsize,2),'embeddedUsedFonts':sorted(used),'guideMatchesMasterPage':2,'calibrationMm':50})
def provenance():
    proof=json.loads((ROOT/'assets/PROVENANCE.json').read_text(encoding='utf-8'))
    for entry in proof['files']:
        require(digest(ROOT/entry['file'])==entry['sha256'],'Changed asset '+entry['file'])
    require((ROOT/'assets/fonts/bitstream-vera-license.txt').exists(),'Font license missing')
def shared():
    js=(ROOT/'content.js').read_text(encoding='utf-8')
    embedded=json.loads(js.split('window.FerryData = ',1)[1].strip().rstrip(';'))
    require(embedded==D,'Browser wrapper differs from content.json')
    rules=json.loads((ROOT/'rules.json').read_text(encoding='utf-8'))
    md=(ROOT/'RULES.md').read_text(encoding='utf-8')
    quick=(ROOT/'QUICK_START.md').read_text(encoding='utf-8')
    require(all(s['text'] in md for s in rules),'Rule markdown drift')
    require(all(s['text'] in quick for s in D['guide']),'Guide markdown drift')
def links():
    count=0
    for p in list(ROOT.glob('*.md'))+list(ROOT.glob('*.html')):
        text=p.read_text(encoding='utf-8')
        targets=re.findall(r'\[[^\]\n]+\]\(([^)\n]+)\)',text) if p.suffix=='.md' else re.findall(r'(?:href|src)="([^"]+)"',text)
        for target in targets:
            if re.match(r'^(https?:|mailto:|#)',target):continue
            from urllib.parse import unquote
            target=unquote(target.split('#')[0])
            require((p.parent/target).is_file(),'Broken link '+str(p.name)+': '+target)
            count+=1
    details['localLinksChecked']=count
for name,fn in [('Build and evidence hashes',sources),('Component inventory, mapping and geometry',components),('PDF dimensions, guide equality, glyphs, fonts and calibration',pdfs),('Reused art and font provenance',provenance),('Browser/rules/guide source consistency',shared),('Package local links',links)]:
    check(name,fn)
result={'scope':'Static artifact checks, not a physical print or human playtest.','createdAt':datetime.now(timezone.utc).isoformat(),'counts':{'passed':sum(r['status']=='PASS' for r in records),'failed':sum(r['status']=='FAIL' for r in records)},'details':details,'records':records,'sourceHashes':{p.relative_to(ROOT).as_posix():digest(p) for p in [ROOT/'content.json',ROOT/'rules.json',ROOT/'engine.js',ROOT/'app.js',ROOT/'index.html',ROOT/'styles.css',ROOT/'print/Print_and_Play_v0.5.pdf',ROOT/'print/Player_Guide_v0.5.pdf']}}
(ROOT/'verification/static-results.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result['counts']))
for r in records:
    if r['status']=='FAIL': print(r)
if result['counts']['failed']:raise SystemExit(1)

