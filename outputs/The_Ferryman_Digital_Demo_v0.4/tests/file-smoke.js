/* Historical executed smoke script, isolated context, no existing saves changed.
   The dedicated navigator subsequently reported file: URLs blocked. Do not rerun
   through another surface where this restriction applies; use HTTP for agent QA. */
async currentPage => {
  const context=await currentPage.context().browser().newContext();const page=await context.newPage();let report;
  try {
    await page.goto('file:///Users/supa/projects/SIIT/charon/outputs/The_Ferryman_Digital_Demo_v0.4/index.html');
    await page.getByRole('button',{name:'Begin the journey',exact:true}).click();
    await page.getByRole('button',{name:'Board Mother',exact:true}).click();
    await page.reload();await page.getByRole('button',{name:'Resume cycle 1',exact:true}).click();
    const images=await page.evaluate(async()=>Promise.all([...document.images].map(async img=>{try{await img.decode();}catch{}return {src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0};})));
    const resumed=await page.getByRole('button',{name:'Leave Mother ashore',exact:true}).isVisible();
    report={kind:'Direct-file smoke check, isolated browser context; not a human playtest',recordedAt:new Date().toISOString(),status:resumed&&images.every(x=>x.loaded)?'PASS':'FAIL',url:page.url(),userAgent:await page.evaluate(()=>navigator.userAgent),checks:{launched:true,boarded:true,reloadedAndResumed:resumed,images}};
  }catch(e){report={status:'NOT_COMPLETED',error:e.message};}
  await context.close();return report;
}
