"""Compare already-rendered extracted PDFs with the inspected master PNGs."""
from pathlib import Path
import sys,json,hashlib
from PIL import Image,ImageChops
BASE=Path(__file__).resolve().parents[2];rd=Path(sys.argv[1]);inv=json.loads((BASE/'print/COMPONENT_INVENTORY.json').read_text());results=[]
for name,pages in inv['extracts'].items():
    for i,n in enumerate(pages,1):
        m=rd/f'master-{n:02d}.png';stem=name.removesuffix('.pdf');opts=[rd/stem/f'page-{i}.png',rd/stem/f'page-{i:02d}.png'];p=next(p for p in opts if p.exists())
        a=Image.open(m).convert('RGB');b=Image.open(p).convert('RGB');equal=a.size==b.size and ImageChops.difference(a,b).getbbox() is None
        results.append(dict(file=name,page=i,master_page=n,pixel_equal=equal,sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
out=dict(status='PASS' if all(r['pixel_equal'] for r in results) else 'FAIL',rendered_extracted_pages=len(results),method='Every separate PDF page rendered at 120 dpi and RGB-pixel compared against its visually inspected final master page.',results=results)
(BASE/'verification/print/extracted-render-comparison.json').write_text(json.dumps(out,indent=2),encoding='utf-8');print(json.dumps({'status':out['status'],'pages':len(results)}));sys.exit(out['status']!='PASS')
