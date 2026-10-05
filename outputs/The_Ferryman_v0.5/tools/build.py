"""Rebuild browser data and print PDFs from shared source files."""
from pathlib import Path
import json, hashlib, shutil, re, io
from datetime import datetime, timezone
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader, PdfWriter

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
D=json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
RULES=json.loads((ROOT/'rules.json').read_text(encoding='utf-8'))
OUT=ROOT/'print'; OUT.mkdir(exist_ok=True)
ASSETS=ROOT/'assets'; ASSETS.mkdir(exist_ok=True)
VERIFY=ROOT/'verification'; VERIFY.mkdir(exist_ok=True)
FONT=ASSETS/'fonts'; FONT.mkdir(exist_ok=True)
SOURCE=REPO/'outputs/The_Ferryman_Digital_Demo_v0.4/assets'
ART={'mother.png':'S01.png','child.png':'S02.png','red-soldier.png':'S04.png','blue-soldier.png':'S06.png','merchant.png':'S03.png','cook.png':'S07.png','mason.png':'S08.png','musician.png':'S11.png',
     # Browser scenes and memory cards reused from v0.4 (screen only, not printed).
     'shore.png':'shore-r2.png','elysium.png':'elysium-r2.png','asphodel.png':'asphodel-r2.png','tartarus.png':'tartarus-r2.png','haven.png':'haven-r2.png','wraith.png':'wraith-r2.png',
     'memory-fog.png':'memory-R01.png','memory-light.png':'memory-R02.png','memory-calm.png':'memory-R03.png'}
# New v0.6 artwork copied unchanged for reuse (PoLong portrait, Acheron and Styx destinations).
V06=REPO/'outputs/The_Ferryman_v0.6/assets/art'
V06_ART={'polong.png':'polong.png','acheron.png':'acheron.png','styx.png':'styx.png'}
provenance=[]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
previous=json.loads((ASSETS/'PROVENANCE.json').read_text(encoding='utf-8')) if (ASSETS/'PROVENANCE.json').exists() else {'files':[]}
def reuse(source,destination):
    if source.exists():
        shutil.copyfile(source,destination)
    else:
        relative=destination.relative_to(ROOT).as_posix()
        recorded=next((x for x in previous['files'] if x['file']==relative),None)
        if not recorded or not destination.exists() or digest(destination)!=recorded['sha256']:
            raise ValueError('Missing original and unverified bundled asset: '+relative)
for target,source in ART.items():
    reuse(SOURCE/source,ASSETS/target)
    provenance.append({'file':'assets/'+target,'source':str((SOURCE/source).relative_to(REPO)).replace('\\','/'),'sha256':digest(ASSETS/target),'modification':'None; original bytes copied.'})
for target,source in V06_ART.items():
    reuse(V06/source,ASSETS/target)
    provenance.append({'file':'assets/'+target,'source':str((V06/source).relative_to(REPO)).replace('\\','/'),'sha256':digest(ASSETS/target),'modification':'None; original bytes copied. Generated for v0.6; see that folder\'s art/ASSET_MANIFEST.json.'})
font_source=REPO/'outputs/The_Ferryman_Workshop_Kit_v0.3/assets/fonts'
for name in ['Vera.ttf','VeraBd.ttf','VeraIt.ttf']:
    reuse(font_source/name,FONT/name)
    provenance.append({'file':'assets/fonts/'+name,'source':str((font_source/name).relative_to(REPO)).replace('\\','/'),'sha256':digest(FONT/name)})
if font_source.exists():
    for item in font_source.iterdir():
        if item.suffix.lower() in ['.txt','.md']:shutil.copyfile(item,FONT/item.name)
if not (FONT/'bitstream-vera-license.txt').exists():raise ValueError('Bundled font license is missing.')
# Khmer night theme fonts, as in the browser: Kantumruy Pro body, Battambang display (SIL OFL, bundled with licenses).
theme_source=REPO/'outputs/The_Ferryman_v0.6/tools/print/fonts'
for name in ['Battambang-Bold.ttf','Battambang-Black.ttf','KantumruyPro-Regular.ttf','KantumruyPro-SemiBold.ttf','Battambang-OFL.txt','KantumruyPro-OFL.txt']:
    reuse(theme_source/name,FONT/name)
    if name.endswith('.ttf'):provenance.append({'file':'assets/fonts/'+name,'source':str((theme_source/name).relative_to(REPO)).replace('\\','/'),'sha256':digest(FONT/name)})
for name,file in [('Body','KantumruyPro-Regular.ttf'),('BodyBold','KantumruyPro-SemiBold.ttf'),('Display','Battambang-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,str(FONT/file)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='Body',boldItalic='BodyBold')
pdfmetrics.registerFontFamily('Display',normal='Display',bold='Display',italic='Display',boldItalic='Display')
pdfmetrics.registerFont(TTFont('Vera',str(FONT/'Vera.ttf')))
pdfmetrics.registerFont(TTFont('VeraBd',str(FONT/'VeraBd.ttf')))
pdfmetrics.registerFont(TTFont('VeraIt',str(FONT/'VeraIt.ttf')))
pdfmetrics.registerFontFamily('Vera',normal='Vera',bold='VeraBd',italic='VeraIt',boldItalic='VeraBd')
(ROOT/'content.js').write_text('/* Generated from content.json by tools/build.py. */\nwindow.FerryData = '+json.dumps(D,ensure_ascii=True,indent=2)+';\n',encoding='utf-8')
(ROOT/'RULES.md').write_text('# The Ferryman v0.5 rules\n\nProvisional single-player workshop rules. See DESIGN_DECISIONS.md for feedback sources and adaptations.\n\n'+'\n\n'.join('## '+x['title']+'\n\n'+x['text'] for x in RULES)+'\n',encoding='utf-8')
(ROOT/'QUICK_START.md').write_text('# One-page player guide text\n\n'+'\n\n'.join('## '+x['title']+'\n\n'+x['text'] for x in D['guide'])+'\n',encoding='utf-8')
(ASSETS/'PROVENANCE.json').write_text(json.dumps({'note':'Existing portraits copied unchanged. Letter emblems are provisional vector/text graphics, not AI-generated artwork. No final art approval is claimed.','files':provenance},indent=2),encoding='utf-8')

W,H=A4
INK='#DCD1B8'; GOLD='#B8914F'; GOLDHI='#D9B573'; CREAM='#15100C'; MUTE='#9C9180'; PALE='#1A130E'; RED='#D9826C'
BG='#080605'; BAR='#0F0B08'; CARD='#120D0A'; RULE='#3A2D20'; WRITE='#EFE4C8'; WRITEINK='#1A120B'
PAGE_NAMES=['Print and assembly','One-page player guide','Rules / prepare and cross','Rules / souls and memories','Rules / return and example','River dashboard','Boat mat','Soul cards / 1','Soul cards / 2','Soul cards / 3 and table labels','Route cards / 1','Route cards / 2','Memory cards','Arrival tickets','Event cards','Markers and workshop record']
PDF=OUT/'Print_and_Play_v0.5.pdf'
c=canvas.Canvas(str(PDF),pagesize=A4,pageCompression=1)
c.setTitle(D['title']+' | Print-and-play v0.5')
c.setAuthor('Charon project | provisional workshop prototype')
c.setSubject('Single player, A4 color, single-sided, actual-size print-and-play. 16 pages.')
page_no=0; bounds=[]; components=[]
def rect(x,y,w,h,fill=CREAM,stroke=None,width=.5):
    c.setFillColor(HexColor(fill));c.setStrokeColor(HexColor(stroke or fill));c.setLineWidth(width);c.rect(x,H-y-h,w,h,fill=1,stroke=bool(stroke))
def line(x,y,x2,y2,color=MUTE,width=.5):
    c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x,H-y,x2,H-y2)
def para(text,x,y,w,size=11,leading=None,color=INK,bold=False,max_height=None):
    style=ParagraphStyle('local',fontName=('Display' if size>=12 else 'BodyBold') if bold else 'Body',fontSize=size,leading=leading or size*1.32,textColor=HexColor(color),spaceAfter=0)
    p=Paragraph(text,style);pw,ph=p.wrap(w,2000)
    if max_height is not None and ph>max_height+.1:raise ValueError(f'Page {page_no}: text overflows {text[:60]!r}: {ph:.1f} > {max_height:.1f}')
    if x<10*mm-.2 or x+w>W-10*mm+.2 or y+ph>H-10*mm+.2:raise ValueError(f'Page {page_no}: text outside safe area: {text[:60]}')
    p.drawOn(c,x,H-y-ph);bounds.append({'page':page_no,'text':re.sub('<[^>]+>','',text),'x':round(x,2),'y':round(y,2),'width':round(w,2),'height':round(ph,2),'fontSize':size})
    return ph
def page(title,subtitle='ONE NIGHT ON THE RIVER / SINGLE PLAYER'):
    global page_no
    if page_no:c.showPage()
    page_no+=1
    c.setFillColor(HexColor(BG));c.rect(0,0,W,H,fill=1,stroke=0)
    rect(10*mm,10*mm,190*mm,17*mm,BAR,GOLD,.5);line(10*mm,27*mm,200*mm,27*mm,GOLD,.7)
    para('THE FERRYMAN <font color="#D9B573">/ v0.5</font>',14*mm,13*mm,182*mm,11,bold=True,color=INK)
    para(title,10*mm,31*mm,190*mm,22,bold=True)
    para(subtitle,10*mm,42*mm,190*mm,9,color=MUTE)
    line(10*mm,281*mm,200*mm,281*mm,'#8A6B3A')
    para(f'{page_no:02d} / {len(PAGE_NAMES)}   ·   '+PAGE_NAMES[page_no-1],10*mm,282*mm,150*mm,8,color=MUTE)
    para('A4 · 100% · single-sided',160*mm,282*mm,40*mm,7.5,color=MUTE)
def section(title,text,x,y,w,size=11):
    h=para(title,x,y,w,size+1,bold=True,color=GOLDHI)+5
    return h+para(text,x,y+h,w,size=size)+11
def card_frame(x,y,w,h,band,label,cid):
    """Website-style card: dark lacquer, bronze cut line, rounded inner frame, accent band in the type colour."""
    rect(x,y,w,h,CARD,GOLD,.8)
    c.saveState();c.setStrokeColor(HexColor(RULE));c.setLineWidth(.4);c.roundRect(x+1.2*mm,H-y-h+1.2*mm,w-2.4*mm,h-2.4*mm,2.2*mm,fill=0,stroke=1)
    c.setFillColor(HexColor(band));c.rect(x+1.2*mm,H-y-2.4*mm,w-2.4*mm,1.2*mm,fill=1,stroke=0);c.restoreState()
    para(cid+'  ·  '+escape(label),x+3*mm,y+h-5.6*mm,w-6*mm,6.6,color=MUTE)
    components.append({'page':page_no,'id':cid,'x_mm':round(x/mm,2),'y_mm':round(y/mm,2),'width_mm':round(w/mm,2),'height_mm':round(h/mm,2)})
PDF_IMAGES={}
def pdf_image(file,maxpx=1200):
    """PDF-only JPEG copy (quality 92, longest side maxpx, about 500 ppi on a card); the original PNG is untouched."""
    if file not in PDF_IMAGES:
        from PIL import Image
        im=Image.open(ASSETS/file).convert('RGB');im.thumbnail((maxpx,maxpx),Image.LANCZOS)
        b=io.BytesIO();im.save(b,format='JPEG',quality=92,subsampling=0,optimize=True);b.seek(0);PDF_IMAGES[file]=(ImageReader(b),im.size)
    return PDF_IMAGES[file]
def arch_art(file,x,y,w,h,focus=.5,tint=None):
    """Picture inside a temple-doorway arch with a bronze outline and lotus finial; tint fills an arch when there is no art."""
    c.saveState();clip=archpath(x,y,w,h);c.clipPath(clip,stroke=0,fill=0)
    if file:
        rd,(iw,ih)=pdf_image(file);sc=max(w/iw,h/ih);dw,dh=iw*sc,ih*sc
        c.drawImage(rd,x-(dw-w)/2,H-y-h-(dh-h)*(1-focus),width=dw,height=dh,mask='auto')
    else:
        c.setFillColor(HexColor('#0B0907'));c.rect(x,H-y-h,w,h,fill=1,stroke=0)
        if tint:c.setFillColor(HexColor(tint));c.setFillAlpha(.35);c.rect(x,H-y-h*.45,w,h*.45,fill=1,stroke=0)
    c.restoreState()
    c.saveState();o=archpath(x,y,w,h);c.setFillColor(Color(.03,.02,.02,alpha=.16 if file else 0));c.setStrokeColor(HexColor(GOLD));c.setLineWidth(.5);c.drawPath(o,stroke=1,fill=1);c.restoreState()
    lotus(x+w/2,y-.9*mm,2.6*mm)
def lotusrule(cx,y,w):
    """Bronze divider with diamonds and a lotus, as under the website headings."""
    c.saveState();c.setStrokeColor(HexColor(GOLD));c.setLineWidth(.45);Y=H-y
    c.line(cx-w/2,Y,cx-4.6*mm,Y);c.line(cx+4.6*mm,Y,cx+w/2,Y)
    for dx in (-3.2*mm,3.2*mm):
        P=c.beginPath();P.moveTo(cx+dx-.8*mm,Y);P.lineTo(cx+dx,Y+.6*mm);P.lineTo(cx+dx+.8*mm,Y);P.lineTo(cx+dx,Y-.6*mm);P.close();c.drawPath(P,stroke=1,fill=0)
    c.restoreState();lotus(cx,y,2.2*mm)
def facts(items,x,y,w,maxy,size=7.8):
    """Lotus-bud bullet list like the website card facts. items: (text, colour)."""
    for t,col in items:
        P=c.beginPath();cx=x+1.2*mm;cy=H-y-1.55*mm;r=.75*mm
        P.moveTo(cx,cy+r);P.lineTo(cx+r*.6,cy);P.lineTo(cx,cy-r);P.lineTo(cx-r*.6,cy);P.close()
        c.setStrokeColor(HexColor(GOLD));c.setLineWidth(.4);c.drawPath(P,stroke=1,fill=0)
        y+=para(escape(t),x+3.4*mm,y,w-3.4*mm,size,leading=size*1.26,color=col,max_height=maxy-y)+1.1*mm
    return y
def mini_portrait(soul,cx,cy,r):
    """Round portrait or letter emblem, like the website trip panel."""
    c.saveState();P=c.beginPath();P.circle(cx,H-cy,r);c.clipPath(P,stroke=0,fill=0)
    if soul['art']:
        rd,(iw,ih)=pdf_image(soul['art'],500);sc=max(2*r/iw,2*r/ih);dw,dh=iw*sc,ih*sc
        c.drawImage(rd,cx-dw/2,H-cy-r-(dh-2*r)*.82,width=dw,height=dh,mask='auto')
    else:
        c.setFillColor(HexColor('#0B0907'));c.rect(cx-r,H-cy-r,2*r,2*r,fill=1,stroke=0)
        c.setFillColor(HexColor(GOLDHI));c.setFont('Display',r*.8);c.drawCentredString(cx,H-cy-r*.28,''.join(w[0] for w in soul['name'].split()[:2]))
    c.restoreState();c.setStrokeColor(HexColor(GOLD));c.setLineWidth(.6);c.circle(cx,H-cy,r,fill=0,stroke=1)
def archpath(x,y,w,h):
    """Temple-doorway arch (points): elliptical top corners, square bottom."""
    ry=min(7*mm,h*.42);rx=w/2;k=.5523;P=c.beginPath();Y=lambda v:H-v
    P.moveTo(x,Y(y+h));P.lineTo(x,Y(y+ry))
    P.curveTo(x,Y(y+ry-ry*k),x+rx-rx*k,Y(y),x+rx,Y(y));P.curveTo(x+rx+rx*k,Y(y),x+w,Y(y+ry-ry*k),x+w,Y(y+ry))
    P.lineTo(x+w,Y(y+h));P.close();return P
def lotus(cx,cy,s):
    """Small bronze lotus-bud finial centred at (cx,cy), size s (points)."""
    Y=lambda v:H-v;c.saveState();c.setStrokeColor(HexColor(GOLD));c.setFillColor(HexColor(CARD));c.setLineWidth(.45)
    P=c.beginPath();P.moveTo(cx,Y(cy+s*.55));P.curveTo(cx-s*.32,Y(cy+s*.1),cx-s*.2,Y(cy-s*.45),cx,Y(cy-s*.7));P.curveTo(cx+s*.2,Y(cy-s*.45),cx+s*.32,Y(cy+s*.1),cx,Y(cy+s*.55));c.drawPath(P,stroke=1,fill=1)
    for d in (-1,1):
        Q=c.beginPath();Q.moveTo(cx-d*s*.08,Y(cy+s*.5));Q.curveTo(cx+d*s*.5,Y(cy+s*.42),cx+d*s*.78,Y(cy+s*.05),cx+d*s*.82,Y(cy-s*.18));Q.curveTo(cx+d*s*.5,Y(cy-s*.1),cx+d*s*.25,Y(cy+s*.15),cx+d*s*.12,Y(cy+s*.38));c.drawPath(Q,stroke=1,fill=0)
    c.restoreState()
def coords(i,height=88):return (10*mm+(i%3)*63.5*mm,54*mm+(i//3)*(height+4)*mm,63*mm,height*mm)
def emblem(name,x,y,w,h,color):
    rect(x,y,w,h,color)
    initials=''.join(part[0] for part in name.split()[:2])
    c.setStrokeColor(HexColor(GOLD));c.setLineWidth(.8)
    cx=x+w/2;cy=H-y-h/2;sz=h*.34
    p=c.beginPath();p.moveTo(cx,cy+sz);p.lineTo(cx+sz,cy);p.lineTo(cx,cy-sz);p.lineTo(cx-sz,cy);p.close();c.drawPath(p)
    c.setFillColor(HexColor(GOLDHI));c.setFont('Display',17);c.drawCentredString(cx,cy-5,initials)
def soul_card(s,i):
    x,y,w,h=coords(i);dest=D['destinations'][s['wish']];card_frame(x,y,w,h,dest['color'],'SOUL',s['id'])
    if s['art']:arch_art(s['art'],x+3*mm,y+6*mm,w-6*mm,32*mm,focus=.2)
    else:
        arch_art(None,x+3*mm,y+6*mm,w-6*mm,32*mm)
        cx=x+w/2;cy=H-y-23*mm;sz=8*mm;c.setStrokeColor(HexColor(GOLD));c.setLineWidth(.8)
        P=c.beginPath();P.moveTo(cx,cy+sz);P.lineTo(cx+sz,cy);P.lineTo(cx,cy-sz);P.lineTo(cx-sz,cy);P.close();c.drawPath(P,stroke=1,fill=0)
        c.setFillColor(HexColor(GOLDHI));c.setFont('Display',17);c.drawCentredString(cx,cy-6,''.join(w[0] for w in s['name'].split()[:2]))
    tag=f'{s["id"]} · {s["seats"]} seat'+('s' if s['seats']>1 else '')
    para(tag+(' · <font color="#D9826C">Tainted</font>' if s['tainted'] else ''),x+3*mm,y+39.5*mm,w-6*mm,6.8,color=GOLDHI)
    para(escape(s['name']),x+3*mm,y+43*mm,w-6*mm,13,bold=True,max_height=7*mm)
    lotusrule(x+w/2,y+51.2*mm,w-14*mm)
    text=s['text'].replace(' This is a provisional filler soul.','').replace(' Provisional filler soul.','')
    if s['id']=='S05':text='Aboard: pay 1 light before fog on every move. Deliver by move 2.'
    if s['id']=='S06':text='Waiting deadline: anger +3. Deliver by move 2.'
    if s['id']=='S01':text='Quest: deliver with Child and match both wishes to earn Passage.'
    if s['id']=='S08':text='Wishes for Styx. Other ordinary stops accept Achilles unmatched.'
    mem=next((m['name'] for m in D['memories'] if m['id']==s['memory']),None)
    facts([('Wishes for '+dest['name'],GOLDHI),(text,INK),('Memory: '+mem if mem else 'Leaves no memory',MUTE)],x+3*mm,y+53.5*mm,w-6*mm,y+74*mm)
    rect(x+2.5*mm,y+74.6*mm,w-5*mm,6*mm,WRITE,GOLD,.4);para('DEADLINE: ______  (anger +'+str(s['patience'])+')',x+3.5*mm,y+75.5*mm,w-7*mm,8,bold=True,color=WRITEINK)
SCENE={'elysium':'elysium.png','asphodel':'asphodel.png','tartarus':'tartarus.png','styx':'styx.png','haven':'haven.png'}
def route_card(r,i):
    x,y,w,h=coords(i);d=D['destinations'][r['to']];card_frame(x,y,w,h,d['color'],'ROUTE',r['id'])
    arch_art(SCENE.get(r['to']),x+3*mm,y+6*mm,w-6*mm,30*mm,tint=d['color'])
    para(escape(r['name']),x+3*mm,y+38*mm,w-6*mm,6.8,color=GOLDHI)
    para(escape(d['name']),x+3*mm,y+41.5*mm,w-6*mm,15,bold=True,max_height=8*mm)
    lotusrule(x+w/2,y+51.5*mm,w-14*mm)
    para(escape(r['text']),x+3*mm,y+54*mm,w-6*mm,8.6,leading=11,color=GOLDHI,max_height=16*mm)
    para(str(r['fog']),x+3*mm,y+70*mm,14*mm,24,bold=True,color=GOLDHI)
    para('BASE FOG',x+15*mm,y+75*mm,w-18*mm,8,bold=True,color=MUTE)
def utility(i,title,text,code):
    x,y,w,h=coords(i);card_frame(x,y,w,h,'#6B4F25','TABLE LABEL',code)
    para(title,x+4*mm,y+10*mm,w-8*mm,16,bold=True,max_height=16*mm)
    lotusrule(x+w/2,y+31*mm,w-14*mm)
    para(text,x+4*mm,y+35*mm,w-8*mm,9.6,leading=13,color=GOLDHI,max_height=42*mm)

page('Print, cut, begin.','COLOR WORKSHOP KIT / ONE COMPLETE SET PER PLAYER')
y=56*mm
y+=section('A complete solo game','Carry souls through one night on the river. Fulfill eight wishes in four trips and survive the final return. The rules, cards and browser version are v0.5. Do not mix earlier-version pieces into this kit.',10*mm,y,190*mm,12)
y+=section('Send this whole PDF to the printer','Print all 16 pages on A4, color, single-sided, at <b>actual size / 100%</b>. Turn off fit-to-page and booklet printing. Use opaque 180-250 gsm cardstock for pages 8-15 and the markers on page 16, or mount ordinary paper to opaque card. Blank backs are intentional. Do not duplex.',10*mm,y,190*mm,11.5)
y+=section('Keep these sheets whole','Page 2: one-page player guide. Pages 3-5: complete rules and example. Pages 6-7: river dashboard and boat mat. Page 16 below the cut line: optional workshop record. The separate Player Guide PDF repeats page 2 for extra copies.',10*mm,y,190*mm,11.5)
y+=section('Cut these pieces','Pages 8-10: 14 Soul cards and 4 table labels. Pages 11-12: 10 Routes and 2 reminder cards. Page 13: 13 Memories. Page 14: 12 Arrival tickets. Page 15: 4 Events and 2 reference cards. Page 16: 6 markers. Cut on each outer rectangle; trim square corners. No folding or aligned backs are required.',10*mm,y,190*mm,11.5)
y+=section('Arrange the table','Dashboard on the left, boat mat in the middle, waiting Soul cards on the right. Keep face-up Soul and Memory reserves above them. Shuffle Arrivals, Routes and Events separately, face down. Keep distinct Route discard, spent Memory, delivered Soul and Wraith areas. Use the cut-out labels. Bring a pencil and eraser for deadlines.',10*mm,y,190*mm,11.5)
para('Check this line measures exactly 50 mm after printing.',10*mm,255*mm,190*mm,10,bold=True)
line(10*mm,268*mm,60*mm,268*mm,INK,1);line(10*mm,265*mm,10*mm,271*mm,INK,1);line(60*mm,265*mm,60*mm,271*mm,INK,1)

page('Your one-page river guide','SINGLE PLAYER / 20-30 MINUTE TARGET / KEEP BESIDE THE BOAT')
for col,items in enumerate([D['guide'][:4],D['guide'][4:]]):
    y=54*mm;x=(10+col*99)*mm
    for item in items:y+=section(escape(item['title']),escape(item['text']),x,y,91*mm,10.3)
    if y>278*mm:raise ValueError('Guide column overflow '+str(y/mm))
for name,blocks in [('Rules / prepare and cross',RULES[:3]),('Rules / souls and memories',RULES[3:6]),('Rules / return and example',RULES[6:])]:
    page(name,'COMPLETE RULES / PROVISIONAL WORKSHOP VALUES');y=54*mm
    for b in blocks:y+=section(escape(b['title']),escape(b['text']),10*mm,y,190*mm,10.8)
    if y>276*mm:raise ValueError('Rules page overflow '+str(y/mm))
    if len(blocks)==2:
        y+=7*mm
        y+=section('No hidden reference work','All Soul, Memory, Route and Event effects are printed on their pieces. Keep passenger information visible. When a partner or rival has not arrived, its interaction is inactive. Pair tickets guarantee simultaneous arrival, not that the player must board both.',10*mm,y,190*mm,11)
        y+=section('Pressure, not busywork','One shared anger marker replaces per-soul anger markers. One boat counter replaces individual passenger timers. Write a deadline only when a soul arrives or when a card changes that deadline. The rules can be run without a browser or a facilitator.',10*mm,y,190*mm,11)

def track(title,values,x,y,w,cols,caption=''):
    para(title,x,y,w,11,bold=True);y+=7*mm
    cell=w/cols
    for i,n in enumerate(values):
        xx=x+(i%cols)*cell;yy=y+(i//cols)*12*mm
        rect(xx,yy,cell-1*mm,11*mm,PALE,GOLD,.45)
        para(str(n),xx+1.5*mm,yy+1.6*mm,cell-4*mm,13,bold=True)
    y+=((len(values)+cols-1)//cols)*12*mm
    if caption:para(caption,x,y+1*mm,w,8.8,color=MUTE)
    return y+11*mm
page('The river dashboard','KEEP WHOLE / FIVE TRACK MARKERS / KEEP PASSAGE BY ITS REFERENCE CARD')
y=54*mm
y=track('LIGHT / start at 5',list(range(7)),10*mm,y,190*mm,7,'Zero survives. If a crossing costs more than available light, lose.')
y=track('WISHES / start at 0',list(range(15)),10*mm,y,190*mm,8,'Reach at least 8 and survive the final return.')
y=track('ANGER / start at 0',list(range(17)),10*mm,y,190*mm,9,'After every surviving move, advance once. Waiting deadline reached = Wraith.')
bottom=y
track('TRIP / start at 1',[1,2,3,4],10*mm,bottom,91*mm,4,'Pressure: 0, 0, +1, +1. Events: trips 2 and 4.')
track('BOAT MOVES / reset to 0',[0,1,2,3],109*mm,bottom,91*mm,4,'After delivery: tainted expire at 2, others at 3.')
para('FOG = base + pressure + Wraiths + rival pair + Event - Memory. Minimum 0.<br/>Pay Killer drain separately. New Wraiths affect the next move.',10*mm,245*mm,190*mm,10,bold=True)

page('The boat','FOUR SEATS / ACHILLES OCCUPIES TWO / ALL PASSENGERS STAY VISIBLE')
for i in range(4):
    x=(38+(i%2)*67)*mm;y=(54+(i//2)*92)*mm
    rect(x,y,63*mm,88*mm,CREAM,GOLD,.7)
    para('SEAT '+str(i+1),x+4*mm,y+8*mm,55*mm,13,bold=True,color=MUTE)
    para('Place a Soul card here. Achilles also occupies an adjacent empty seat.',x+5*mm,y+43*mm,53*mm,10.5,color=MUTE)
para('Narrow Channel: cover one seat for this trip. Board only at shore.<br/>At every arrival, deliver first, then check Ship Wraith expiry.',10*mm,246*mm,190*mm,11,bold=True)
for k in range(3):
    page('Souls / '+str(k+1),'CUT OUTER BORDERS / 63 x 88 mm / WRITE DEADLINES IN PENCIL')
    for i,s in enumerate(D['souls'][k*6:(k+1)*6]):soul_card(s,i)
    if k==2:
        utility(2,'WRAITHS','Put expired waiting souls and Ship Wraiths here. Each adds 1 fog to every later move. No removal action.','L01')
        utility(3,'DELIVERED','Keep delivered souls here. Count matched wishes with the WISH marker. No soul returns to the supply.','L02')
        utility(4,'SPENT MEMORIES','Used and overflow Memories leave the night permanently. Do not shuffle or reuse them.','L03')
        utility(5,'ROUTE DISCARD','Put both offered Routes here after choosing. Retire a chosen Sanctuary separately. Reshuffle only when the draw pile runs out.','L04')
    para('Pairs arrive together via tickets. Soul cards and their effects stay face up once they arrive.',10*mm,253*mm,190*mm,10,color=MUTE)
for k in range(2):
    page('Routes / '+str(k+1),'CUT OUTER BORDERS / SHUFFLE ALL TEN ROUTES / REVEAL TWO')
    for i,r in enumerate(D['routes'][k*6:(k+1)*6]):route_card(r,i)
    if k==1:
        utility(4,'RETURN','Not shuffled. Empty boat only. Base fog 0. Pressure and Wraiths apply. One Memory allowed. Advance anger, no light recovery.','L05')
        utility(5,'LAST CHANCE','After arrival delivery: tainted still aboard at boat move 2 become Wraiths. All others still aboard at move 3 do so. Haven also checks this.','L06')
page('Memories','CUT OUTER BORDERS / KEEP IN RESERVE / DO NOT SHUFFLE')
MEMART={'fog':'memory-fog.png','light':'memory-light.png','calm':'memory-calm.png'}
for i,m in enumerate(D['memories']):
    x,y,w,h=coords(i,40);source=next(s for s in D['souls'] if s['memory']==m['id'])
    card_frame(x,y,w,h,'#6B4F25','MEMORY',m['id'])
    arch_art(MEMART[m['kind']],x+3*mm,y+5*mm,19*mm,26*mm)
    para(escape(m['name']),x+24*mm,y+5*mm,w-27*mm,10.5,bold=True,max_height=10*mm)
    para('From '+escape(source['name']),x+24*mm,y+14.5*mm,w-27*mm,6.8,color=GOLDHI)
    para(escape(m['text']),x+24*mm,y+19*mm,w-27*mm,8,leading=10,color=INK,max_height=14*mm)
para('Earn only from matched ordinary deliveries. One Memory per move. Keep at most three. Permanently discard used and excess cards.',10*mm,272*mm,190*mm,9,color=MUTE,max_height=9*mm)
page('Arrival tickets','CUT OUTER BORDERS / SHUFFLE FACE DOWN / DO NOT RECYCLE')
SOUL={s['id']:s for s in D['souls']}
for i,a in enumerate(D['arrivals']):
    x,y,w,h=coords(i,40);card_frame(x,y,w,h,'#4A3720','ARRIVAL',a['id'])
    for k,sid in enumerate(a['souls']):mini_portrait(SOUL[sid],x+11*mm+k*15*mm,y+15*mm,6.5*mm)
    para(escape(a['name']),x+3*mm,y+23.5*mm,w-6*mm,10.5,bold=True,max_height=6*mm)
    para('Bring '+', '.join(a['souls'])+' to the shore.',x+3*mm,y+29*mm,w-6*mm,7.8,color=GOLDHI,max_height=5*mm)
para('Refill until at least five souls wait or tickets run out. A paired ticket brings both souls and may make six. Write each new deadline using the current anger. Never reuse a ticket this night.',10*mm,239*mm,190*mm,11)
page('River events','CUT OUTER BORDERS / SHUFFLE FOUR EVENTS / REVEAL ON TRIPS 2 AND 4')
for i,e in enumerate(D['events']):
    x,y,w,h=coords(i);card_frame(x,y,w,h,'#685375','EVENT',e['id'])
    arch_art('wraith.png',x+3*mm,y+6*mm,w-6*mm,28*mm,focus=.5)
    para(escape(e['name']),x+3*mm,y+37*mm,w-6*mm,13,bold=True,max_height=12*mm)
    lotusrule(x+w/2,y+51*mm,w-14*mm)
    para(escape(e['text']),x+3*mm,y+54*mm,w-6*mm,9,leading=12,color=GOLDHI,max_height=26*mm)
utility(4,'PASSAGE','Earn once: Mother and Child delivered together, both wishes matched. Before a move, spend to send one waiting soul to its wish. Gain 1 wish only.','L07')
utility(5,'START A TRIP','Reset boat moves. Clear last Event. On trips 2 and 4, reveal and resolve an Event. Refill waiting shore. Reveal two Routes. Then board.','L08')
page('Markers and workshop record','CUT ONLY THE SIX MARKERS / KEEP THE RECORD AREA WHOLE')
for i,title in enumerate(['LIGHT','WISH','ANGER','TRIP','BOAT','PASSAGE']):
    x=(10+i*31.8)*mm;y=54*mm
    rect(x,y,10*mm,10*mm,GOLD,GOLDHI,.8);para(['L','W','T','TR','B','P'][i],x+2*mm,y+2.5*mm,7*mm,9,bold=True,color=WRITEINK)
    para(title,x,y+12*mm,29*mm,8,bold=True)
    components.append({'page':page_no,'id':'TOKEN-'+title,'x_mm':round(x/mm,2),'y_mm':54,'width_mm':10,'height_mm':10})
line(10*mm,78*mm,200*mm,78*mm,INK,.7)
para('PHYSICAL WORKSHOP RECORD',10*mm,88*mm,190*mm,16,bold=True)
y=105*mm
for text in ['Date / player / observer: ______________________________________________','Printer / paper / 50 mm scale check: ____________________________________','Setup started / ready / first move / finish: ______________________________','Ending / trips / wishes / Wraiths: _______________________________________','First confusing rule or component: ____________________________________','A difficult decision and why: __________________________________________','A choice that felt automatic and why: __________________________________','Missing or awkward components: ______________________________________','One change requested after this session: _______________________________']:
    rect(10*mm,y-1.6*mm,190*mm,8.4*mm,WRITE,GOLD,.4);para(text,12*mm,y,186*mm,11,color=WRITEINK);y+=15*mm
para('Record real observations, not inferred enjoyment or balance. An observer does not choose routes, arrivals or passengers. One player controls the game.',10*mm,250*mm,190*mm,10,color=MUTE)
c.save()
reader=PdfReader(str(PDF));assert len(reader.pages)==16
writer=PdfWriter();writer.add_page(reader.pages[1]);writer.add_metadata({'/Title':'The Ferryman v0.5 | One-page player guide','/Author':'Charon project'})
with (OUT/'Player_Guide_v0.5.pdf').open('wb') as f:writer.write(f)
inventory={'pages':16,'paper':'A4','print':'color, single-sided, actual size / 100%','perPlayer':{'souls':14,'routes':10,'memories':13,'arrivalTickets':12,'events':4,'labelsAndReferences':8,'markers':6},'pageMap':[{'page':i+1,'title':name} for i,name in enumerate(PAGE_NAMES)],'components':components}
(OUT/'COMPONENT_INVENTORY.json').write_text(json.dumps(inventory,indent=2),encoding='utf-8')
(VERIFY/'layout-bounds.json').write_text(json.dumps({'textBlocks':bounds,'safeMarginsMm':10,'components':components},indent=2),encoding='utf-8')
manifest={'builtAt':datetime.now(timezone.utc).isoformat(),'sourceHashes':{p.name:digest(p) for p in [ROOT/'content.json',ROOT/'rules.json',Path(__file__)]},'outputs':{p.name:{'sha256':digest(p),'pages':len(PdfReader(str(p)).pages)} for p in [PDF,OUT/'Player_Guide_v0.5.pdf']},'inventory':inventory['perPlayer']}
(VERIFY/'build-results.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({'pdfs':manifest['outputs'],'components':inventory['perPlayer']}))

