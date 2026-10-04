"""Portable A4 print build. Run with Python + reportlab, Pillow and pypdf.
All content/art/fonts are local to this release. Does not write worker B files.
"""
from pathlib import Path
import json, re, hashlib, math, argparse, io
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from PIL import Image
from pypdf import PdfReader, PdfWriter

BASE=Path(__file__).resolve().parents[2]
OUT=BASE/'print'; VERIFY=BASE/'verification/print'; HERE=Path(__file__).resolve().parent
for p in [OUT,VERIFY]: p.mkdir(parents=True,exist_ok=True)
for name,file in [('Vera','Vera.ttf'),('VeraBold','VeraBd.ttf'),('VeraItalic','VeraIt.ttf')]: pdfmetrics.registerFont(TTFont(name,str(HERE/'fonts'/file)))
pdfmetrics.registerFontFamily('Vera',normal='Vera',bold='VeraBold',italic='VeraItalic',boldItalic='VeraBold')
INK='#15323B'; GOLD='#A37835'; PAPER='#F5F0E5'; PALE='#E8EDEC'; RED='#993C2E'; WHITE='#FFFFFF'
W,H=210,297
src=(HERE/'source-contract/SHARED_RULES.md').read_text(encoding='utf-8-sig')
souls=[]; destinations=[]; memories={}
for line in src.splitlines():
    cols=[x.strip() for x in line.strip('|').split('|')]
    if line.startswith('| SOUL-'):
        souls.append(dict(id=cols[0],name=cols[1],seats=int(cols[2]),destination=cols[3],memory=None if cols[4]=='None' else cols[4]))
    elif line.startswith('| DEST-'): destinations.append(dict(id=cols[0],name=cols[1],fog=int(cols[2])))
    elif line.startswith('| MEM-'): memories[cols[0]]=cols[1]
NAMES={'MEM-LIGHT':'Light','MEM-FORESIGHT':'Foresight','MEM-GUARD':'Guard','MEM-CALM':'Calm','MEM-FOG':'Fog Shield','MEM-PASSAGE':'Passage'}
ASSETS=json.loads((BASE/'art/ASSET_MANIFEST.json').read_text(encoding='utf-8'))['assets']
ART={cid:a['path'] for a in ASSETS for cid in a['component_ids']}
DEST={d['id']:d for d in destinations}
CONTRACT=dict(version='0.6',authority='tools/print/source-contract/SHARED_RULES.md',authority_sha256=hashlib.sha256(src.encode()).hexdigest(),souls=souls,destinations=destinations,memories=memories,constants=dict(initialLight=6,maxLight=6,capacity=4,handLimit=3,spawnEvery=3,shipExpiry=4,shoreExpiry=2,returnRecovery=2),initialShore=['SOUL-MOTHER','SOUL-CHILD','SOUL-MERCHANT','SOUL-MASON','SOUL-COOK'],initialArrivals=['SOUL-SOLDIER','SOUL-POET','SOUL-KEEPER'],endless=True,ordinaryRecycle=True,freshMemoryEveryEligibleDelivery=True,questOncePerRun=True,facilitatorRoutes=True)
def save(path,obj): path.write_text(json.dumps(obj,indent=2,ensure_ascii=False),encoding='utf-8')
save(VERIFY/'printed-content-contract.json',CONTRACT)

PAGES=[]; INV=[]; LEDGER=[]; TEXT=[]; CURRENT=0; C=None; PDF_IMAGES={}
def rec(kind,x,y,w,h,**extra):
    assert x>=9.99 and y>=9.99 and x+w<=200.01 and y+h<=287.01,(CURRENT,kind,x,y,w,h)
    LEDGER.append(dict(page=CURRENT,kind=kind,x_mm=x,y_mm=y,width_mm=w,height_mm=h,**extra))
def box(x,y,w,h,fill=PAPER,stroke=INK,lw=.6):
    rec('box',x,y,w,h); C.setFillColor(HexColor(fill));C.setStrokeColor(HexColor(stroke));C.setLineWidth(lw);C.rect(x*mm,(H-y-h)*mm,w*mm,h*mm,fill=1,stroke=1)
def line(x,y,x2,y2,color=INK,lw=.5):
    rec('line',min(x,x2),min(y,y2),abs(x2-x),abs(y2-y));C.setStrokeColor(HexColor(color));C.setLineWidth(lw);C.line(x*mm,(H-y)*mm,x2*mm,(H-y2)*mm)
def text(t,x,y,w,size=11,bold=False,color=INK,maxh=None,leading=None):
    style=ParagraphStyle('p',fontName='VeraBold' if bold else 'Vera',fontSize=size,leading=leading or size*1.32,textColor=HexColor(color),spaceAfter=0)
    para=Paragraph(t.replace('\n','<br/>'),style);pw,ph=para.wrap(w*mm,1000*mm);height=ph/mm
    if maxh is not None: assert height<=maxh+.1,('TEXT OVERFLOW',CURRENT,t,height,maxh)
    rec('text',x,y,w,height,font_pt=size,text=re.sub('<[^>]+>','',t));para.drawOn(C,x*mm,(H-y)*mm-ph)
    TEXT.append(dict(page=CURRENT,text=re.sub('<[^>]+>','',t),font_pt=size));return y+height
def title(t,y=35): return text(t,12,y,186,20,True)+5
def para(t,y,w=186,x=12,size=11.5): return text(t,x,y,w,size)+3
def section(name,t,y,x=12,w=186):
    y=text(name,x,y,w,13,True)+2;return text(t,x,y,w,11.5)+5
def art(cid,x,y,w,h,focus=.5):
    p=BASE/ART.get(cid,cid);im=Image.open(p);iw,ih=im.size;scale=max(w/iw,h/ih);dw,dh=iw*scale,ih*scale;ox=x-(dw-w)/2;oy=y-(dh-h)*focus
    rec('art',x,y,w,h,asset=p.relative_to(BASE).as_posix(),effective_ppi=25.4/scale,crop_focus=focus)
    # PDF-only high-quality JPEG encoding. Pixel dimensions and original PNGs
    # remain intact; this prevents lossless PNG streams bloating each extract.
    if str(p) not in PDF_IMAGES:
        if im.mode in ('RGB','L'):
            stream=io.BytesIO();im.save(stream,format='JPEG',quality=94,subsampling=0,optimize=True);stream.seek(0);PDF_IMAGES[str(p)]=ImageReader(stream)
        else:PDF_IMAGES[str(p)]=ImageReader(str(p))
    C.saveState();clip=C.beginPath();clip.rect(x*mm,(H-y-h)*mm,w*mm,h*mm);C.clipPath(clip,stroke=0,fill=0);C.drawImage(PDF_IMAGES[str(p)],ox*mm,(H-oy-dh)*mm,dw*mm,dh*mm,mask='auto');C.restoreState()
def component(cid,label,page,x,y,w,h,kind='cut',role='play',copy=1):
    INV.append(dict(id=cid,label=label,quantity=1,copy=copy,page=page,width_mm=w,height_mm=h,x_mm=x,y_mm=y,status=kind,role=role))
def cutbox(cid,label,x,y,w,h,role='play',copy=1):
    box(x,y,w,h,WHITE,INK,.7);component(cid,label,CURRENT,x,y,w,h,role=role,copy=copy)
def add(name,fn,cut=False,group='reference'): PAGES.append(dict(title=name,fn=fn,cut=cut,group=group))
def footer():
    line(12,281,198,281,GOLD,.6);text('THE FERRYMAN / v0.6',12,283,125,8);text(f'{CURRENT:02d} / {len(PAGES):02d}',180,283,18,8,True)
def header(name,cut):
    box(10,10,190,17,INK,INK);text('CUT  |  STRAIGHT OUTER BORDERS' if cut else 'KEEP WHOLE  |  WORKSHOP EDITION',14,12,180,8,True,color='#EBCB96');text(name,14,17,180,14,True,color=WHITE)
def makepage(i,p):
    global CURRENT;CURRENT=i;header(p['title'],p['cut']);p['fn']();footer();C.showPage()

def cover():
    art('MAT-SHORE',12,34,186,85)
    box(20,86,170,25,INK,INK);text('THE FERRYMAN',26,91,158,27,True,color=WHITE)
    y=title('A river that keeps returning',128)
    y=para('Complete illustrated print-and-cut kit. One player station, with facilitator-controlled route offers. Play endless survival as Charon\'s apprentice.',y)
    y=section('Print this PDF once, in full',f'{len(PAGES)} A4 pages. Color, single-sided, actual size / 100%. Turn off fit-to-page, booklet and duplex. Print CUT pages on opaque card, or mount them to opaque card after printing. Keep all other pages whole.',y)
    y=para('Use a printer, paper or card, scissors, pencil and eraser. Glue is optional for mounting. No phone, internet or app is needed. Check printer scale before printing the remaining sheets.',y)
    line(14,238,64,238,INK,1);line(14,235,14,241,INK,1);line(64,235,64,241,INK,1);text('This line must measure 50 mm.',14,245,95,11,True)
    text('Replacement PDFs contain pages from this master. Do not print the full kit and the cutout PDF for one ordinary set.',113,235,83,11,maxh=32)

def guide():
    y=section('Goal and setup','Survive for as long as desired. Light 0 means immediate loss. Start Light 6 (maximum 6), no memories, global round 0, cycle 1. Follow setup on page 4. There is no automatic victory.',34)
    y=section('Board at the shore','Take at least one ordinary soul, up to 4 seats. Soldier takes 2; each other ordinary soul takes 1. Reset boarded Ship Anger to 0. Choices may be reversed before departure.',y)
    y=text('OUTWARD ROUND',12,y,186,13,True)+3
    for t in [
        '1. Optional: play 1 memory. Resolve it fully. If it empties the boat, return without starting a round.',
        '2. Advance the global round. On every multiple of 3, add a fresh PoLong at Ship Anger 0, even with 4 seats occupied.',
        '3. Choose 1 of 2 offered destinations. Fog = base fog + PoLong penalties - Fog Shield, minimum 0. Apply Guard, then lose Light. At 0, stop before delivery.',
        '4. Optionally deliver matching souls. Take each fixed memory reward, plus any quest reward. Unmatched souls stay aboard.',
        '5. Remaining passengers gain 1 Ship Anger. At 4, each costs 1 Light and leaves. Guard can prevent the next 1 loss. Stop immediately at 0. Keep at most 3 memories.',
        '6. Empty boat: return. Otherwise start another outward round.'
    ]: y=para(t,y,size=11)
    y=section('Return, only when the boat is empty','Optional 1 memory, unless Passage already used this allowance. Waiting souls gain 1 Shore Anger; at 2, each costs 1 Light and leaves. Stop at 0. If alive, restore 2 Light (max 6), record a completed cycle, refill the shore to 5 and get new route offers.',y)
    text('PoLong: anger 0-1 adds 0 fog; 2-3 adds 1 each.\nMemories: at most 1 before each outward round or return.\nQuest: Child to Haven, then Mother to Tartarus, once per run.\nFull details, recycling, quest failure and examples: pages 5-10.',12,y,186,11,maxh=39)

def assembly():
    cutpages=[str(i+1) for i,p in enumerate(PAGES) if p['cut']]
    y=section('One station','Print the complete master once. Keep pages 1-16 whole. Cut pages 17-31 on their solid outer borders. White gutters are waste. No required shape has a curved cut or fine silhouette.',34)
    y=section('Opaque fronts, plain backs','Soul cards and offer slips must hide their fronts when face down. Use opaque stock or glue each printed sheet to plain opaque card, let dry, then cut. Backs remain plain and identical within each shuffled or concealed class. No duplex alignment is needed.',y)
    y=section('Inventory by sheet', 'Cards are 90 x 112 mm unless a different size is shown below. Card gutters are at least 6 mm. Markers are 15 x 15 mm.',y)
    rows=[('17-18','8 ordinary soul cards, one per identity'),('19','4 PoLong cards: 2 base + 2 spare instances'),('20-21','6 destination map cards, one per destination'),('22-28','28 memories: 4 per rewarding source soul'),('29','1 Passage memory (quest reward, once per run)'),('30','6 offer slips (90 x 50 mm); 2 reusable PoLong templates (90 x 66 mm)'),('31','22 markers (15 mm); Soldier second-seat marker (90 x 24 mm)')]
    for pg,t in rows:
        text(pg,14,y,23,11,True); yy=text(t,40,y,155,11);line(12,yy+2,198,yy+2,'#CDD6D4');y=yy+5
    y=section('Keep-whole play aids','Pages 12-16: shore, two boat panels, dashboard and route mat. Place boat panels side by side. Rules: pages 5-10. Page 2 is the quick reference. Page 11 is a blank workshop record.',y)
    text('Spare pieces do not add souls or change spawn timing. Print pages 20-21 again only if the facilitator wants extra destination pictures. Keep extra ordinary identity cards out of play.',12,y,186,11,maxh=24)

def setup():
    text('An illustrated table arrangement',12,34,186,18,True)
    # Diagram is a placement guide, not a printed-size template.
    for x,y,w,h,cid,label in [(12,49,58,40,'MAT-SHORE','SHORE + PILES'),(76,49,58,40,'MAT-BOAT','BOAT LEFT'),(140,49,58,40,'MAT-BOAT','BOAT RIGHT'),(12,99,58,34,'MEM-LIGHT','MEMORY RESERVE'),(76,99,58,34,'MEM-FORESIGHT','ROUTE OFFERS'),(140,99,58,34,'MEM-PASSAGE','DASHBOARD')]:
        art(cid,x,y,w,h);box(x,y+h-8,w,8,INK,INK);text(label,x+2,y+h-6,w-4,8,True,color=WHITE)
    y=145
    for head,body in [
        ('1  Sort the supplies','Separate ordinary souls, PoLong, destination maps and source-labeled memories. Place memories face up in 8 reserve stacks: Mother, Merchant, Soldier, Poet, Cook, Mason, Keeper and Passage. Child and PoLong give no memory.'),
        ('2  Prepare the shore','Place Mother, Child, Merchant, Mason and Cook waiting at anger 0. Shuffle Soldier, Poet and Keeper face down as the arrival pile. Leave the resolved-soul discard empty. Never mix PoLong into these piles.'),
        ('3  Set the dashboard','Light 6; completed cycles 0 (current cycle 1); global round 0; ordinary deliveries 0; quest AVAILABLE. Hand empty. Put anger markers at 0 or pencil-mark card tracks.'),
        ('4  Stage routes and board','The facilitator prepares the current and next two pairs using page 16 and the six offer slips. Keep future pairs face down. Choose at least one ordinary passenger within 4 seats; reset boarded anger to 0. Keep the player guide nearby.')
    ]:y=section(head,body,y)

def rules1():
    y=section('Premise, ending and cycles','One player is Charon\'s apprentice. Choose one of two offered destinations each outward round. Deliveries are optional and only to preferred destinations. A cycle begins with boarding and ends after the empty boat returns. There is no cycle cap, delivery target or automatic win. At zero Light, stop immediately. A voluntary workshop stop is a session stop, not a victory.',34)
    y=section('Starting state','Light 6, maximum 6; ordinary capacity 4 seats; no memories; cycle 1; global outward round 0; all anger 0. Initial shore: Mother, Child, Merchant, Mason, Cook. Initial shuffled arrival pile: Soldier, Poet, Keeper.',y)
    y=text('Soul roster',12,y,186,14,True)+4
    for xx,ww,t in [(14,45,'Soul'),(60,16,'Seats'),(81,49,'Destination'),(140,56,'Fixed reward')]:text(t,xx,y,ww,10,True)
    y+=9
    for s in souls:
        for xx,ww,t in [(14,45,s['name']),(60,16,str(s['seats'])),(81,49,DEST[s['destination']]['name']),(140,56,NAMES.get(s['memory'],'None'))]:text(t,xx,y,ww,11)
        line(12,y+7,198,y+7,'#CDD6D4');y+=10
    y+=4
    y=section('Boarding','Board at least one ordinary soul within 4 seats. Soldier occupies 2 seats; place the second-seat marker beside it. Reverse choices freely before departure. Boarding resets Ship Anger to 0, whatever the old Shore Anger. After departure, do not unload back onto the shore. No older-version passive powers apply.',y)
    text('One active ordinary card per identity. PoLong is a separate zero-seat type whose scheduled arrivals are independent instances. Its spare cards are supplies, not extra scheduled spawns.',12,y,186,11.5,maxh=30)

def rules2():
    y=34
    for head,body in [
        ('1  Optional memory','Play at most one memory before the outward round. Consume it from your hand, resolve its effect and any rewards or excess-hand choice. If Passage empties the boat, return immediately; do not advance the global round or spawn.'),
        ('2  Advance and spawn','Advance the global outward counter. On rounds 3, 6, 9 and every later multiple of 3, add a PoLong at Ship Anger 0. It takes 0 seats. Boarding, returning and Passage do not advance this counter.'),
        ('3  Choose and pay','Choose one of the two offers. Base fog + current PoLong contributions - a played Fog Shield = payable fog, minimum 0. Each PoLong at anger 0-1 adds 0; at anger 2-3 adds 1. Apply Guard prevention after calculating fog. Pay Light. At 0, lose immediately, before delivery.'),
        ('4  Optional delivery','Deliver any subset of passengers whose preferred destination matches. Keep the rest aboard. Each eligible ordinary delivery grants its fixed fresh memory, even after that soul recycles. Child and PoLong grant none. Resolve family quest rewards as applicable. Delivery and Haven do not heal Light.'),
        ('5  Anger and wraiths','Every passenger still aboard gains 1 Ship Anger, including a newly spawned PoLong. Each reaching 4 becomes a wraith: apply 1 Light loss, then remove it. Guard prevents only the next 1 point. Stop immediately at 0. Wraiths do not remain to add fog. Ordinary cards enter the resolved discard; removed PoLong becomes reusable supply.'),
        ('6  Continue or return','After rewards, choose which excess memories to discard until the hand contains at most 3. If the boat is empty, return. Otherwise another outward round is available. Newly earned memories are usable only before a later round or return; they cannot rescue zero Light.')
    ]:y=section(head,body,y)

def rules3():
    y=section('How to play a memory','At most one before each outward round or return. It is single-use: return the used card to its source-labeled reserve. Unused cards persist across cycles. After receiving rewards, choose excess cards to discard to reserve until holding at most 3. Never take a held copy to pay a new reward.',34)
    for mid in NAMES:
        art(mid,12,y,32,22);name=NAMES[mid];body=memories[mid]
        if mid=='MEM-PASSAGE':body+=' If it empties the boat, this use also occupies the immediate return\'s memory allowance.'
        text(name,49,y,149,12,True);end=text(body,49,y+7,149,11.2);y=max(y+22,end)+6
    y=section('Fixed rewards, renewable supply','Merchant and Poet each give their own source-labeled Foresight. Mason and Keeper each give their own Fog Shield. Four copies per rewarding source support a 3-card held hand plus the next reward. Memory supply is not random. Passage follows the same hand limit and one-memory limit.',y)

def rules4():
    y=section('Return only when the boat is empty','Return has no travel fog and does not advance the outward counter. If the memory allowance is available, optionally play one before resolving return. Passage that just emptied the boat already used this allowance.',34)
    for head,body in [('1  Waiting anger first','Every ordinary soul already waiting gains 1 Shore Anger. At 2, it becomes a wraith: lose 1 Light subject to Guard, then place it in the resolved discard. Stop immediately on zero Light, before recovery.'),('2  Recovery and cycle','If still alive, restore 2 Light, capped at 6. Record one completed cycle. The next cycle is completed cycles + 1; there is no limit or scheduled final return.'),('3  Refill and prepare','Refill the shore to 5. Draw from the arrival pile. Whenever it runs out during refill, shuffle only resolved ordinary souls into a new arrival pile. New arrivals start at anger 0 and do not receive this return\'s increment. The facilitator supplies the next cycle\'s offers.')]:y=section(head,body,y)
    y=section('Family quest: once per run','Deliver Child to Haven before delivering Mother to Tartarus. These deliveries may occur in different cycles. On that qualifying Mother delivery, take her usual Light memory and one Passage. The quest is optional. Keep its state across cycles and soul recycling.',y)
    for name,t in [('AVAILABLE','Neither required delivery has yet qualified.'),('CHILD DELIVERED','Child has qualified; Mother is still required.'),('COMPLETED','Mother qualified after Child. Passage was awarded. Never award it again this run.'),('FAILED','Mother was delivered before Child qualified, or a still-required family member was lost before its required delivery. Recycling gives no retry.')]:
        y=para(f'<b>{name}:</b> {t}',y,size=11)
    text('A later recycled Child\'s fate does not undo the recorded qualifying Child delivery. Completed or failed quest state never resets during the run.',12,y,186,11.5,maxh=22)

def rules5():
    y=34
    examples=[
        ('Outward round 6, from the shared rules','Light 4; Keeper and Soldier at Ship Anger 3. Play Fog Shield, then spawn PoLong at 0. Choose Asphodel: 2 - 1 = 1 fog, so Light becomes 3. Deliver Keeper for a fresh Fog Shield. Soldier reaches 4 anger, costs 1 Light and enters the resolved discard. Light is now 2. PoLong reaches 1 anger; the boat is not empty.'),
        ('Full boat and a new PoLong','Four ordinary seats are occupied before global round 3. Resolve the optional memory, then add PoLong without ejecting anybody. On Haven with no older PoLong penalty, its anger 0 adds no fog. If retained, it becomes anger 1 after delivery.'),
        ('Calm and stacked fog','Two PoLong instances are at anger 2 and 3. Calm lowers the first to 1. Their contributions are now 0 + 1. Haven\'s base 0 therefore costs 1 Light. Both remaining instances then gain anger; the second reaches 4 and costs another 1 Light before leaving.'),
        ('Returning at low Light','Light 1 and one waiting soul at Shore Anger 1. Without protection, it reaches 2 and its wraith damage ends the run. The later 2-Light recovery never happens. With Guard, prevent that 1 loss, remove the soul, then recover to Light 3.'),
        ('Renewable reward and overflow','Three Merchant Foresight cards remain in hand. Deliver Merchant again: take the fourth copy. Choose any one of the four to discard to Merchant\'s reserve. Held rewards are never confiscated to supply another reward.'),
        ('Passage ends a cycle','Only Poet is aboard. Play Passage: deliver Poet for Foresight, without fog, anger or outward-counter change. Return immediately. Passage already used that return\'s memory allowance; the new Foresight cannot be played during the same return.')
    ]
    for h,b in examples:y=section(h,b,y)
    text('These are worked rule examples and agent desk checks, not records of human play.',12,y,186,10,color=RED)

def rules6():
    y=section('Facilitator owns the route','Provide six distinct destination pictures, excluding the shore. The facilitator chooses, orders, shuffles and hands out offers. There is no prescribed repeating map, guaranteed destination or forced starting order. Each outward round still offers two destinations.',34)
    y=section('Stage three forks with six reusable slips','Mark exactly one destination on each slip. Put two slips in CURRENT, two in NEXT and two in NEXT + 1. Current offers face up; future offers face down on opaque backs. Put the corresponding picture cards beside the current pair when useful. A slip identifies its destination and fog even when a picture is already used elsewhere. Duplicates in the facilitator\'s sequence need no extra rule.',y)
    y=section('Reveal and retain information','Foresight reveals both options in the current fork and the next two forks. Before spending it, make sure the facilitator has supplied all three pairs. If required offers are missing, pause without consuming the card or advancing time. Revealed offers remain visible for the cycle. Before erasing or reusing slips, copy already revealed offers to a visible pencil ledger; add paper as needed.',y)
    y=section('Advance the physical queue','After a crossing, slide NEXT to CURRENT and NEXT + 1 to NEXT. The facilitator refills the last pair according to their chosen ordering. Reveal the new current pair normally. Do not expose an unrevealed future pair while moving it. A missing next offer is a pause for input, not a penalty or game ending.',y)
    y=section('Recycle souls and memories separately','Ordinary souls delivered or expired go to the resolved-soul discard. Shuffle that discard only when the arrival pile runs out while refilling. Never include souls aboard or waiting. If both piles are temporarily empty, do not create duplicates. Used and discarded memories return immediately to their own source reserve. PoLong stays outside ordinary piles; erase old anger before reuse.',y)
    y=section('Reset after a run','Record loss or voluntary stop on page 11. Sort all pieces, recover every held memory to reserve, clear PoLong and anger, set Light 6, round 0, completed cycles 0, deliveries 0 and quest AVAILABLE. Restore the five starting shore souls and shuffle the other three. The facilitator prepares new offers. Add paper when a counter or ledger fills; its edge is never a game cap.',y)

def record():
    y=para('Blank human record. No printing or play results have been entered. Use one sheet per session; add paper for an endless run.',34)
    for label,h in [('Date / observer / player / station',13),('Printer / paper / color / scale setting / measured 50 mm line',18),('Cutting, opacity and marker handling observations',18),('Setup time / play duration / completed cycles / outward rounds / ordinary deliveries',20),('Ending reason: Light reached 0, voluntary stop, or interrupted',14),('Unclear rule, exact game state and page/component ID',28),('Player comments: learning, decisions, pacing, enjoyment, balance',28),('Changes proposed by people, not yet approved rules',20)]:
        text(label,12,y,186,11,True);line(12,y+h,198,y+h,'#84999C');y+=h+8

def shore():
    component('MAT-SHORE','Shore and boarding mat',CURRENT,10,10,190,270,'keep whole')
    art('MAT-SHORE',12,34,186,49)
    box(12,87,186,57);text('WAITING SHORE',17,92,176,17,True)
    text('Spread waiting souls above or beside this zone with anger visible. Start: Mother, Child, Merchant, Mason, Cook. On return, anger +1; at 2, lose 1 Light each. Stop at 0. If alive, recover 2 Light, then refill to 5.',17,104,176,11.5,maxh=33)
    for x,head,t in [(12,'ARRIVAL PILE','Face down. Initial: Soldier, Poet, Keeper, shuffled. Draw only for refill. New arrivals start at anger 0.'),(108,'RESOLVED SOULS','Delivered + expired ordinary souls. Shuffle only when the arrival pile runs out during refill. Never include active souls or PoLong.')]:
        text(head,x+4,150,82,13,True);box(x,162,90,112,PALE);text(t,x+5,171,80,11.5,maxh=70)

def boat(panel):
    component('MAT-BOAT-'+panel,'Boat '+panel+' panel',CURRENT,10,10,190,270,'keep whole')
    nums=(1,2) if panel=='LEFT' else (3,4)
    text('Join the two boat pages side by side. Four ordinary seats total.',12,33,186,11)
    for x,n in zip([12,108],nums):
        box(x,47,90,112,PALE);text(f'SEAT {n}',x+7,52,76,18,True);art('MAT-BOAT',x+6,68,78,37)
        text('Place a soul here.\nSoldier also blocks one other seat.',x+7,115,76,11.5,maxh=36)
    text('ZERO-SEAT POLONG LANE',12,165,186,14,True)
    for x in [12,108]:
        box(x,177,90,98,PAPER);text('PoLong instance',x+5,184,80,13,True);text('Place its card here; it may extend over the bottom edge of the mat. Its 0 seats never displace ordinary souls. Keep each anger track visible.',x+5,199,80,11,maxh=70)

def dashboard():
    component('MAT-STATUS','Status dashboard',CURRENT,10,10,190,270,'keep whole')
    text('LIGHT  |  START 6 / MAX 6',12,35,186,15,True)
    for n in range(7):
        x=12+n*26.5;box(x,46,24,19,WHITE,RED if n==0 else INK);text(str(n),x+8,49,14,21,True,color=RED if n==0 else INK)
    text('0 = immediate loss. Stop before delivery or later recovery.',12,70,186,11.5,True)
    y=87
    for label in ['Global outward round: __________   Start 0; never reset between cycles.','Completed cycles: __________   Start 0; current cycle = this + 1.','Ordinary deliveries: __________   Descriptive count, never a win target.']:
        y=para(label,y,size=11.5)
    y=text('NEXT ROUND REMINDER',12,y+2,186,13,True)+8
    for x,label in [(12,'NEXT: no spawn'),(77,'NEXT: no spawn'),(142,'NEXT: spawn')]:box(x,y,56,17,PALE);text(label,x+3,y+5,50,10.5,True)
    y+=21;y=para('At global round 0, start on the first reminder. Move right after each outward round; after spawn, wrap to the first. Keep the written total too.',y,size=11)
    y=text('FAMILY QUEST  |  PLACE Q ON THE CURRENT STATE',12,y+2,186,12,True)+8
    for i,label in enumerate(['AVAILABLE','CHILD DELIVERED','COMPLETED','FAILED']):
        x=12+(i%2)*96;yy=y+(i//2)*18;box(x,yy,90,15,WHITE);text(label,x+5,yy+4,80,11,True)
    y+=40;y=para('Hand limit 3. Keep held memories beside this mat. Used/discarded memories go back to their source reserve. Keep Passage separate until earned.',y,size=11)
    end=text('One memory before an outward round or return. Passage emptying the boat keeps USED for the immediate return. Add writing paper whenever fields fill.',12,y,186,11,maxh=29)
    for x,label in [(12,'READY'),(78,'USED')]:box(x,end+4,58,17,PALE);text(label,x+5,end+9,48,11,True)

def routemat():
    component('MAT-ROUTE','Route staging mat',CURRENT,10,10,190,270,'keep whole')
    y=34
    for head in ['CURRENT  |  reveal both options','NEXT  |  conceal unless revealed','NEXT + 1  |  conceal unless revealed']:
        text(head,12,y,186,12,True);y+=8
        for x in [12,108]:box(x,y,90,50,PALE)
        y+=56
    text('Use one 90 x 50 mm offer slip in each box. Foresight reveals all six. Move the pairs forward after travel. The facilitator supplies the new last pair; no mandatory ordering applies.',12,230,186,11,maxh=26)
    text('Revealed-offer ledger: keep on extra writing paper beside this mat. Retain all revealed information for this cycle before reusing slips. Missing inputs pause play without time or memory cost.',12,258,186,10.5,maxh=21)

CARDW,CARDH=90,112
POS=[(12,34),(108,34),(12,158),(108,158)]
def idlabel(cid,x,y,w=82):text(cid,x,y,w,7.5)
def anger(x,y,polong=False):
    text('SHIP ANGER' if polong else 'ANGER  |  reset to 0 on boarding',x,y,82,9,True)
    for n in range(5):
        xx=x+n*16;box(xx,y+6,15,15,WHITE,RED if n in ([4] if polong else [2,4]) else INK);text(str(n),xx+5,y+9.5,8,13,True)
def soulcard(s,x,y,idx=None):
    cid=s['id'] if idx is None else f'SOUL-POLONG-{idx:02d}';role='spare instance' if idx and idx>2 else 'play'
    cutbox(cid,s['name'],x,y,CARDW,CARDH,role=role,copy=idx or 1)
    art(s['id'],x+1,y+1,88,33,focus=.14)
    text(s['name']+(f' {idx:02d}' if idx else ''),x+4,y+37,82,18,True)
    text(f"To: {DEST[s['destination']]['name']}  |  {s['seats']} seat"+('s' if s['seats']!=1 else ''),x+4,y+46,82,11,True)
    if idx:
        text('No memory. Fog +0 at anger 0-1; +1 at 2-3.',x+4,y+54,82,11,maxh=15)
    else:text('Memory: '+NAMES.get(s['memory'],'none')+'.',x+4,y+54,82,11,maxh=15)
    anger(x+4,y+69,idx is not None)
    text('At 4: lose 1 Light; remove.' if idx else 'Shore: expire at 2. Ship: at 4.\nEach expiry: lose 1 Light; remove.',x+4,y+94,82,10,maxh=13)
    idlabel(cid+(' / SPARE' if role=='spare instance' else ''),x+4,y+105)
def soulpage(group):
    for s,(x,y) in zip(group,POS):soulcard(s,x,y)
def polongpage():
    for i,(x,y) in enumerate(POS,1):soulcard(souls[-1],x,y,i)
def destpage(ds):
    for d,(x,y) in zip(ds,POS):
        cutbox(d['id'],d['name'],x,y,90,112);art(d['id'],x+1,y+1,88,51)
        text(d['name'],x+4,y+57,82,18,True);text(f"BASE FOG {d['fog']}",x+4,y+69,82,19,True)
        text('Add PoLong fog. Resolve any played memory, then pay Light. At 0, stop. Optional matching delivery.',x+4,y+82,82,11,maxh=22);idlabel(d['id'],x+4,y+105)
    if len(ds)==2:text('Repeat-print option: pages 20-21 supply another picture set if the facilitator wants duplicates. Duplicate pictures do not impose a route pattern. The starting shore is separate.',12,171,186,11.5,maxh=45)
def memorycard(mid,source,idx,x,y):
    cid=f'{source}-MEM-{idx:02d}' if source else 'MEM-PASSAGE-01'
    cutbox(cid,NAMES[mid]+' / '+(source or 'quest'),x,y,90,112,copy=idx)
    art(mid,x+1,y+1,88,33);text(NAMES[mid],x+4,y+38,82,18,True)
    text('FROM '+source.removeprefix('SOUL-') if source else 'FAMILY QUEST / ONCE PER RUN',x+4,y+48,82,8.5,True,color=GOLD)
    effect=memories[mid]
    # Exact shared rule effects. Paragraphs are kept at 11 pt.
    text(effect,x+4,y+55,82,11,maxh=34)
    if mid=='MEM-PASSAGE':text('Empty boat: also uses the return\'s memory allowance.',x+4,y+82,82,10,maxh=10)
    text('Use before a round or return.\nOne use; return to reserve.',x+4,y+94,82,10,maxh=10)
    idlabel(cid,x+4,y+105)
def memorypage(s):
    for i,(x,y) in enumerate(POS,1):memorycard(s['memory'],s['id'],i,x,y)
def passagepage():
    memorycard('MEM-PASSAGE',None,1,*POS[0])
    text('Passage timing',111,37,84,16,True);text('If Passage empties the boat, return immediately. Do not advance the global round or spawn. This use also occupies the immediate return\'s memory allowance.',111,52,84,11.5,maxh=75)
    text('This sheet has one cut piece. The remaining area is explanatory, not extra cards. Quest status persists when souls recycle. Extra copies must not create extra quest rewards.',12,171,186,11.5,maxh=40)
def slips():
    for i in range(6):
        x=12+(i%2)*96;y=34+(i//2)*56;cid=f'ROUTE-OFFER-{i+1:02d}';cutbox(cid,'Reusable route offer',x,y,90,50)
        text('OFFER  |  MARK ONE DESTINATION',x+4,y+4,82,9.5,True)
        for j,d in enumerate(destinations):
            xx=x+4+(j%2)*43;yy=y+13+(j//2)*9
            box(xx,yy+1,3,3,WHITE);text(d['name']+' '+str(d['fog']),xx+5,yy,35,11)
        idlabel(cid+' / number = base fog',x+4,y+43)
    for i,x in enumerate([12,108],1):
        y=210;cid=f'POLONG-TEMPLATE-{i:02d}';cutbox(cid,'Reusable PoLong instance template',x,y,90,66,'spare template')
        text('PoLong  |  instance: ____',x+4,y+4,82,13,True);text('0 seats. To Tartarus. No memory. Fog +0 at 0-1 anger; +1 at 2-3.',x+4,y+14,82,10.5,maxh=17)
        anger(x+4,y+31,True);text('At 4: lose 1 Light; remove.',x+4,y+53,82,10);idlabel(cid,x+4,y+59)
def markers():
    labels=[('L','L'),('Q','Q'),('R','R'),('M','M')]+[(f'A{i:02d}',f'A{i:02d}') for i in range(1,17)]+[('X1','X1'),('X2','X2')]
    for i,(cid,lab) in enumerate(labels):
        x=12+(i%10)*19;y=36+(i//10)*22;cutbox(cid,cid,x,y,15,15,'spare' if cid.startswith('X') else 'play');text(lab,x+2,y+4,12,13,True)
    cutbox('SOLDIER-SECOND-SEAT','Soldier second-seat occupancy',12,110,90,24);text('SOLDIER\'S SECOND SEAT',16,114,82,12,True);text('Occupied until Soldier leaves.',16,121,82,10.5);idlabel('SOLDIER-SECOND-SEAT',16,127)
    y=148
    for head,t in [('Marker key','L: Light. Q: quest. R: spawn reminder. M: memory window. A01-A16: anger, one per active soul. X1-X2 are spare replacements. Pencil marks can replace markers without changing rules.'),('Anger handling','Use the card\'s track for its current location. Shore threshold is 2; ship threshold is 4. A red border is a reminder, not a separate effect. Reset to 0 on boarding. Removed instances clear their tracks before reuse.'),('Memory window','Place M beside READY or USED on the dashboard. Reset READY before the next round or return, except when Passage already used the immediate return allowance.')]:y=section(head,t,y)

add('Print and play / start here',cover)
add('Player guide / keep at the table',guide)
add('Assembly and component inventory',assembly)
add('Table setup / one player station',setup)
add('Full rules / 1. Souls and setup',rules1,group='rules')
add('Full rules / 2. Outward sequence',rules2,group='rules')
add('Full rules / 3. Memories',rules3,group='rules')
add('Full rules / 4. Return and quest',rules4,group='rules')
add('Full rules / 5. Worked examples',rules5,group='rules')
add('Full rules / 6. Routes and recycling',rules6,group='rules')
add('Workshop record / blank human form',record,group='record')
add('Shore / boarding and soul supply',shore,group='mat')
add('Boat / left panel / seats 1-2',lambda:boat('LEFT'),group='mat')
add('Boat / right panel / seats 3-4',lambda:boat('RIGHT'),group='mat')
add('Dashboard / endless counters',dashboard,group='mat')
add('Route staging / facilitator control',routemat,group='mat')
add('Soul cards / starting travelers',lambda:soulpage(souls[:4]),True,'cut')
add('Soul cards / river travelers',lambda:soulpage(souls[4:8]),True,'cut')
add('PoLong / 2 base and 2 spare pieces',polongpage,True,'cut')
add('Destination maps / 1 of 2',lambda:destpage(destinations[:4]),True,'cut')
add('Destination maps / 2 of 2',lambda:destpage(destinations[4:]),True,'cut')
for s in souls[:8]:
    if s['memory']:add('Memories / '+s['name']+' / four copies',lambda s=s:memorypage(s),True,'cut')
add('Passage / one quest memory',passagepage,True,'cut')
add('Route offer slips and PoLong templates',slips,True,'cut')
add('Markers and Soldier occupancy piece',markers,True,'cut')

assert len(PAGES)==31
C=canvas.Canvas(str(OUT/'Print_and_Play_v0.6.pdf'),pagesize=(210*mm,297*mm),pageCompression=1,invariant=1,initialFontName='Vera',initialFontSize=11)
C.setTitle('The Ferryman v0.6 | Complete Print and Play');C.setAuthor('The Ferryman project');C.setSubject('Single-sided color A4 workshop kit; agent-checked digital build')
for i,p in enumerate(PAGES,1):makepage(i,p)
C.save()
reader=PdfReader(OUT/'Print_and_Play_v0.6.pdf')
groups={'Cutout_Sheets_v0.6.pdf':[i+1 for i,p in enumerate(PAGES) if p['cut']],'Player_Guide_v0.6.pdf':[2],'Assembly_and_Setup_v0.6.pdf':[1,3,4],'Full_Rules_v0.6.pdf':list(range(5,11)),'Workshop_Record_v0.6.pdf':[11]}
for name,nums in groups.items():
    writer=PdfWriter()
    for n in nums:writer.add_page(reader.pages[n-1])
    writer.add_metadata({'/Title':'The Ferryman v0.6 | '+name.removesuffix('_v0.6.pdf').replace('_',' '),'/Subject':'Exact extracted master pages: '+','.join(map(str,nums))})
    with (OUT/name).open('wb') as f:writer.write(f)
manifest=dict(version='0.6',master='print/Print_and_Play_v0.6.pdf',page_count=len(PAGES),pages=[dict(page=i+1,title=p['title'],cut=p['cut'],group=p['group']) for i,p in enumerate(PAGES)],extracts=groups,cut_piece_count=sum(x['quantity'] for x in INV if x['status']=='cut'),keep_whole_mats=sum(x['quantity'] for x in INV if x['status']=='keep whole'),components=INV,dimension_note='Cut sizes are finished pieces. Mat dimensions are printed-area bounds; retain each full 210 x 297 mm A4 sheet.')
save(OUT/'COMPONENT_INVENTORY.json',manifest);save(VERIFY/'layout-ledger.json',LEDGER);save(VERIFY/'text-ledger.json',TEXT)
md=['# Component inventory, v0.6','',f"Master: {len(PAGES)} A4 pages, {manifest['cut_piece_count']} cut pieces, {manifest['keep_whole_mats']} keep-whole play mats. Print one full master per station. Extra cutout PDF is for replacement sets only.",'','| ID | Qty | Page | Size mm | Handling | Supply role |','|---|---:|---:|---|---|---|']
for a in INV:md.append(f"| {a['id']} | 1 | {a['page']} | {a['width_mm']} x {a['height_mm']} | {a['status']} | {a['role']} |")
md.extend(['',manifest['dimension_note']])
(OUT/'COMPONENT_INVENTORY.md').write_text('\n'.join(md)+'\n',encoding='utf-8')
save(VERIFY/'build-result.json',dict(status='PASS',page_count=len(PAGES),cut_pieces=manifest['cut_piece_count'],keep_whole_mats=manifest['keep_whole_mats'],pdf_files={p.name:dict(sha256=hashlib.sha256(p.read_bytes()).hexdigest(),pages=len(PdfReader(p).pages),bytes=p.stat().st_size) for p in OUT.glob('*.pdf')},scope='Generation completed. Visual, static and supply verification recorded separately.'))
print(json.dumps({'pages':len(PAGES),'cut_pieces':manifest['cut_piece_count'],'mats':manifest['keep_whole_mats'],'pdfs':len(list(OUT.glob('*.pdf')))}))
