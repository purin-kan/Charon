"""Digital print checks, independent supply exploration and rendering receipts.
Run after build.py. Optional --renders DIRECTORY records final render hashes.
"""
from pathlib import Path
import json, hashlib, re, argparse, itertools
from collections import deque, Counter
from pypdf import PdfReader
from pypdf.generic import ContentStream
import pdfplumber
from PIL import Image
BASE=Path(__file__).resolve().parents[2]; V=BASE/'verification/print'; P=BASE/'print'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(p,o):p.write_text(json.dumps(o,indent=2,ensure_ascii=False),encoding='utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
inv=load(P/'COMPONENT_INVENTORY.json');ledger=load(V/'layout-ledger.json');contract=load(V/'printed-content-contract.json');master=PdfReader(P/'Print_and_Play_v0.6.pdf');checks=[]
def check(name,condition,detail):
    checks.append(dict(name=name,status='PASS' if condition else 'FAIL',detail=detail))
def normalize(s):return re.sub(r'\s+',' ',s).strip()
texts=[normalize(p.extract_text()) for p in master.pages]
check('A4 page size',all(abs(float(p.mediabox.width)-595.27559)<.02 and abs(float(p.mediabox.height)-841.88976)<.02 for p in master.pages),{'pages':len(master.pages),'width_mm':210,'height_mm':297})
check('Component IDs on actual pages',all(a['id'] in texts[a['page']-1] for a in inv['components'] if a['status']=='cut'),{'cut_ids':sum(a['status']=='cut' for a in inv['components'])})
cut=[a for a in inv['components'] if a['status']=='cut'];check('Unique cut IDs',len({a['id'] for a in cut})==len(cut),{'unique':len({a['id'] for a in cut}),'pieces':len(cut)})
collisions=[]
for a,b in itertools.combinations(cut,2):
    if a['page']!=b['page']:continue
    overlap=min(a['x_mm']+a['width_mm'],b['x_mm']+b['width_mm'])>max(a['x_mm'],b['x_mm']) and min(a['y_mm']+a['height_mm'],b['y_mm']+b['height_mm'])>max(a['y_mm'],b['y_mm'])
    if overlap:collisions.append([a['id'],b['id']])
check('No overlapping cut pieces',not collisions,collisions)
safe=all(a['x_mm']>=10 and a['y_mm']>=10 and a['x_mm']+a['width_mm']<=200.01 and a['y_mm']+a['height_mm']<=287.01 for a in ledger)
check('Recorded content inside 10 mm safe margins',safe,{'records':len(ledger),'minimum_margin_mm':10})
textcoll=[]
for page in range(1,len(master.pages)+1):
    ts=[a for a in ledger if a['page']==page and a['kind']=='text']
    for a,b in itertools.combinations(ts,2):
        dx=min(a['x_mm']+a['width_mm'],b['x_mm']+b['width_mm'])-max(a['x_mm'],b['x_mm']);dy=min(a['y_mm']+a['height_mm'],b['y_mm']+b['height_mm'])-max(a['y_mm'],b['y_mm'])
        if dx>.3 and dy>.3:textcoll.append(dict(page=page,a=a['text'],b=b['text'],overlap_mm=dy))
check('No recorded text-block overlaps',not textcoll,textcoll)
check('50 mm calibration line',any(a['page']==1 and a['kind']=='line' and a['width_mm']==50 and a['height_mm']==0 for a in ledger),{'page':1,'length_mm':50})
extracts=[]
for name,pages in inv['extracts'].items():
    r=PdfReader(P/name);equal=len(r.pages)==len(pages)
    for p,n in zip(r.pages,pages):equal &= p.get_contents().get_data()==master.pages[n-1].get_contents().get_data() and normalize(p.extract_text())==texts[n-1]
    extracts.append(dict(file=name,master_pages=pages,content_stream_and_text_equal=bool(equal)))
check('Extracted PDFs equal master pages',all(a['content_stream_and_text_equal'] for a in extracts),extracts)
font_details=[];badfonts=[]
for i,page in enumerate(master.pages,1):
    resources=page['/Resources'];fonts=resources.get('/Font',{});used=set()
    for operands,op in ContentStream(page.get_contents(),master).operations:
        if op==b'Tf':used.add(str(operands[0]))
    for key in used:
        f=fonts[key].get_object();descriptor=f.get('/FontDescriptor');embedded=bool(descriptor and any(k in descriptor.get_object() for k in ['/FontFile','/FontFile2','/FontFile3']))
        font_details.append(dict(page=i,font=str(f.get('/BaseFont')),embedded=embedded))
        if not embedded:badfonts.append(font_details[-1])
check('All used PDF fonts embedded',not badfonts,{'used_font_records':len(font_details),'unembedded':badfonts})
badchars=[];minsize=100
with pdfplumber.open(P/'Print_and_Play_v0.6.pdf') as pdf:
    for i,page in enumerate(pdf.pages,1):
        for c in page.chars:
            minsize=min(minsize,c['size'])
            if c['text'] in ['\ufffd','\u25a0','\u2014']:badchars.append({'page':i,'text':c['text']})
check('No replacement glyph or em dash in extracted text',not badchars,{'minimum_font_pt_including_ids':round(minsize,2),'bad_glyphs':badchars})
component_checks=[];glyph_margin=100;cut_text_margin=100
with pdfplumber.open(P/'Print_and_Play_v0.6.pdf') as pdf:
    for page in pdf.pages:
        for c in page.chars:
            glyph_margin=min(glyph_margin,c['x0']*25.4/72,210-c['x1']*25.4/72,c['top']*25.4/72,297-c['bottom']*25.4/72)
    for a in cut:
        x,y,w,h=[a[k]*72/25.4 for k in ['x_mm','y_mm','width_mm','height_mm']]
        crop=pdf.pages[a['page']-1].crop((x,y,x+w,y+h));t=normalize(crop.extract_text() or '')
        ok=a['id'] in t
        if a['id'].startswith('SOUL-') and '-MEM-' not in a['id']:
            soul=next(s for s in contract['souls'] if a['id']==s['id'] or a['id'].startswith(s['id']+'-'))
            dn=next(d['name'] for d in contract['destinations'] if d['id']==soul['destination'])
            ok &= dn in t and str(soul['seats'])+' seat' in t
        if a['id'].startswith('DEST-'):
            d=next(d for d in contract['destinations'] if d['id']==a['id']);ok &= d['name'] in t and 'BASE FOG '+str(d['fog']) in t
        mid=next((s['memory'] for s in contract['souls'] if a['id'].startswith(s['id']+'-MEM-')),None)
        if a['id']=='MEM-PASSAGE-01':mid='MEM-PASSAGE'
        if mid:ok &= normalize(contract['memories'][mid]) in t
        component_checks.append({'id':a['id'],'page':a['page'],'matches':bool(ok)})
        if a['width_mm']>=80:
            for c in crop.chars:
                cut_text_margin=min(cut_text_margin,(c['x0']-x)*25.4/72,(x+w-c['x1'])*25.4/72,(c['top']-y)*25.4/72,(y+h-c['bottom'])*25.4/72)
check('Each individual cut piece matches identity and gameplay fields',all(a['matches'] for a in component_checks),component_checks)
check('Actual PDF glyphs inside safe page margins',glyph_margin>=10,{'minimum_mm':round(glyph_margin,3)})
check('Large cut-piece text inset at least 3 mm',cut_text_margin>=3,{'minimum_mm':round(cut_text_margin,3),'excludes':'15 mm small markers, whose letter labels are separately reviewed'})
reward_souls=[s for s in contract['souls'] if s['memory']]
memory_counts={s['id']:sum(a['id'].startswith(s['id']+'-MEM-') for a in cut) for s in reward_souls}
check('Four fixed memory copies per rewarding source',all(n==4 for n in memory_counts.values()) and len(memory_counts)==7,memory_counts)
check('One Passage; no Child or PoLong ordinary memory',sum(a['id']=='MEM-PASSAGE-01' for a in cut)==1 and not any(a['id'].startswith(('SOUL-CHILD-MEM','SOUL-POLONG-MEM')) for a in cut),{'passage':1,'no_reward_sources':['Child','PoLong']})
effects=[]
for a in cut:
    mid=next((s['memory'] for s in reward_souls if a['id'].startswith(s['id']+'-MEM-')),None)
    if a['id']=='MEM-PASSAGE-01':mid='MEM-PASSAGE'
    if mid:effects.append(dict(id=a['id'],effect=mid,exact_effect_in_page=normalize(contract['memories'][mid]) in texts[a['page']-1]))
check('Every printed memory effect equals shared contract',all(a['exact_effect_in_page'] for a in effects),{'card_copies':len(effects),'effects':effects})
art=load(BASE/'art/ASSET_MANIFEST.json')['assets'];check('Asset bytes match manifest',all(sha(BASE/a['path'])==a['sha256'] for a in art),{'assets':len(art)})
placed=[a['effective_ppi'] for a in ledger if a['kind']=='art'];cardppi=[a['effective_ppi'] for a in ledger if a['kind']=='art' and a['page']>=17]
check('Card artwork approximately 300 ppi or better',min(cardppi)>=290,{'minimum_card_ppi':round(min(cardppi),1),'minimum_decorative_banner_ppi':round(min(placed),1),'note':'Large decorative shore banner may be below 300 ppi; card art checked separately.'})
save(V/'static-results.json',dict(scope='Automated PDF and file checks only; not a physical print or human playtest',status='PASS' if all(a['status']=='PASS' for a in checks) else 'FAIL',counts=dict(pass_count=sum(a['status']=='PASS' for a in checks),fail_count=sum(a['status']=='FAIL' for a in checks)),checks=checks))

# Exhaustive relaxed PoLong state graph. Unlimited Calm once per round and free
# removals over-approximate every legal run. Survival and memory availability
# are relaxed, so the maximum is an upper bound, not claimed full-game reachability.
start=(0,());q=deque([start]);seen={start};max_pre=0;max_post=0;witness=None;parents={start:None};edges=0
while q:
    phase,ages=q.popleft()
    for target in [None]+list(range(len(ages))):
        pre=list(ages)
        if target is not None:pre[target]=max(0,pre[target]-1)
        nextphase=(phase+1)%3
        if nextphase==0:pre.append(0)
        if len(pre)>max_pre:max_pre=len(pre);witness=dict(state=[phase,list(ages)],calm_target=target,after_spawn=pre.copy())
        # Free removals before anger also include optional matching delivery.
        for mask in range(1<<len(pre)):
            post=tuple(sorted(a+1 for i,a in enumerate(pre) if mask&(1<<i) and a+1<4));state=(nextphase,post);edges+=1;max_post=max(max_post,len(post))
            if state not in seen:seen.add(state);parents[state]=(phase,ages);q.append(state)
    assert len(seen)<10000,'Unexpected unbounded search'
polong_count=sum(a['id'].startswith('SOUL-POLONG-') for a in cut)
supply=dict(status='PASS' if polong_count>=max_pre else 'FAIL',method='Exhaustive closure of a relaxed finite state graph, including unlimited one-per-outward-round Calm and free removals; all legal games are a subset. Return cannot retain PoLong because the boat must be empty.',states=len(seen),transitions=edges,max_instances_after_spawn_upper_bound=max_pre,max_instances_after_anger_upper_bound=max_post,printed_instance_cards=polong_count,additional_reusable_templates=sum(a['id'].startswith('POLONG-TEMPLATE') for a in cut),witness_in_relaxed_graph=witness,not_claimed='This upper bound is not a full-game reachability or balance test.',memory_proof={'held_hand_limit':3,'maximum_new_reward_per_source_before_overflow':1,'copies_per_source':4,'reason':'Only one active soul per ordinary source, so each source can reward at most once before overflow. 3 held + 1 new = 4. Multiple different sources use different reserves. Spent/discarded cards replenish reserve.'})
save(V/'supply-results.json',supply)

parser=argparse.ArgumentParser();parser.add_argument('--renders');args=parser.parse_args()
if args.renders:
    rd=Path(args.renders);files=sorted(rd.glob('master-*.png'))
    save(V/'render-receipt.json',dict(master_sha256=sha(P/'Print_and_Play_v0.6.pdf'),status='RENDERED' if len(files)==len(master.pages) else 'INCOMPLETE',rendered_pages=len(files),page_images=[dict(file=p.name,sha256=sha(p),pixels=Image.open(p).size) for p in files],visual_review='Recorded separately in visual-review.json; rendering alone is not inspection.'))
print(json.dumps(dict(static_status='PASS' if all(a['status']=='PASS' for a in checks) else 'FAIL',failures=[a for a in checks if a['status']=='FAIL'],supply=supply),indent=2))
