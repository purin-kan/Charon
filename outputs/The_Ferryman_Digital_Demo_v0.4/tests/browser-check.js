/* Run through the approved Playwright browser tool. Start the local HTTP server first.
   Generate fixtures with node tests/browser-fixtures.cjs. A fresh isolated browser
   context preserves existing user storage. Confirms test-fixture imports only.
   Not a human playtest. Return value is saved as verification/browser-results.json. */
async currentPage => {
  const context=await currentPage.context().browser().newContext();
  const page=await context.newPage();
  const results=[], errors=[];
  const key='ferryman-v0.4-run';
  const base='http://localhost:8044/outputs/The_Ferryman_Digital_Demo_v0.4/';
  const root='/Users/supa/projects/SIIT/charon/';
  const check=(name,ok,detail)=>{results.push({name,status:ok?'PASS':'FAIL',detail});if(!ok)throw Error(name);};
  const click=name=>page.getByRole('button',{name,exact:true}).click();
  const text=async()=>(await page.locator('main').innerText())+'\n'+(await page.locator('#popup').innerText());
  const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  const capture=async name=>{await page.evaluate(()=>scrollTo(0,0));return page.screenshot({path:root+'outputs/The_Ferryman_Digital_Demo_v0.4/verification/'+name+'.png',fullPage:true});};
  const importFixture=async name=>{
    await click('Guide & save');page.once('dialog',d=>d.accept());
    await page.locator('#import-file').setInputFiles(root+'work/v04/fixtures/'+name+'.json');
    await page.locator('#menu').waitFor({state:'hidden'});
  };
  const crossing=async(to,mem='Use no memory')=>{await click('Travel to '+to);await click(mem);await click('Confirm crossing');await click('Continue');};
  const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  try {
    await page.goto(base);
    await page.setViewportSize({width:1280,height:900});
    check('Intro explains objective',await page.getByRole('button',{name:'Begin the journey',exact:true}).isVisible());
    await click('Begin the journey');
    await page.locator('#stage').focus();await page.keyboard.press('Tab');
    check('Keyboard enters current decision',await page.evaluate(()=>document.activeElement.getAttribute('aria-label'))==='Board Mother');
    await page.keyboard.press('Enter');
    check('Keyboard boarding retains focused soul control',await page.evaluate(()=>document.activeElement.getAttribute('aria-label'))==='Leave Mother ashore');
    await click('Board Child');await click('Board Merchant');
    check('Four-seat capacity disables extra boarding',await page.getByRole('button',{name:'Board Poet',exact:true}).isDisabled());
    await capture('boarding-desktop');
    await click('Choose a route');await crossing('Elysium');
    await click('Select: Mother');await click('Select: Child');
    check('Linked delivery preview has two Joined rewards',(await page.locator('.delivery-preview').innerText()).split('Joined Memory').length===3);
    await click('Deliver 2 passengers');
    check('Shared Farewell reveals only after delivery',(await text()).includes('Shared Farewell')&&(await saved()).light===5);
    await click('Continue');
    await click('Guide & save');check('Event discovery retained separately',(await page.locator('#menu-content').innerText()).includes('Discovered: Shared Farewell'));
    await click('Clear remembered discovery');await click('Close');
    check('Return disabled with Merchant aboard',await page.getByRole('button',{name:'Travel to Starting Shore',exact:true}).isDisabled());
    await click('Travel to Tartarus');await click('Choose Joined Memory M1');await page.getByRole('button',{name:/\(C01-S04\)$/}).click();
    const before=await saved();await click('Back');const after=await saved();
    check('Back leaves memory and protection uncommitted',before.hand.join()===after.hand.join()&&!after.guarded.length&&!after.pending.memory);
    await click('Choose Joined Memory M1');await page.getByRole('button',{name:/\(C01-S04\)$/}).click();
    check('Review shows exact fog and guarded forecast',(await text()).includes('0 fog · 5 light left')&&(await text()).includes('Red Soldier (C01-S04): anger 0 → 0'));
    await capture('review-desktop');await click('Confirm crossing');await click('Continue');await click('Select: Merchant');await click('Deliver 1 passenger');await click('Continue');
    await crossing('Starting Shore');
    await click('Guide & save');check('Cleared discovery stays cleared on later actions',!(await page.locator('#menu-content').innerText()).includes('Discovered: Shared Farewell'));await click('Close');
    const trip=await saved();
    check('Complete multi-destination trip and refill',trip.completed===1&&trip.light===6&&trip.delivered.length===3&&trip.shore.length===5&&trip.souls['C01-S04'].anger===0&&trip.souls['C01-S05'].anger===1);
    await page.reload();await click('Resume cycle 2');check('Reload/resume retains exact run',JSON.stringify(await saved())===JSON.stringify(trip));
    await click('Guide & save');const downloadPromise=page.waitForEvent('download');await click('Export JSON');const download=await downloadPromise;const exportPath=root+'work/v04/browser-export.json';await download.saveAs(exportPath);
    check('JSON export download has versioned filename',download.suggestedFilename()==='ferryman-v0.4-cycle-2.json');
    await page.locator('#import-json').fill('{"version":"0.3"}');await click('Import pasted JSON');
    check('Incompatible import retains current run',(await page.locator('#menu-content').innerText()).includes('Import rejected')&&JSON.stringify(await saved())===JSON.stringify(trip));
    page.once('dialog',d=>d.accept());await page.locator('#import-file').setInputFiles(exportPath);await page.locator('#menu').waitFor({state:'hidden'});
    check('Exported file reimports without changing state',JSON.stringify(await saved())===JSON.stringify(trip));
    await click('Guide & save');await page.keyboard.press('Escape');
    check('Escape closes guide and restores focus',await page.evaluate(()=>!document.querySelector('#menu').open&&document.activeElement.id==='menu-button'));
    await importFixture('soldiers');await click('Travel to Tartarus');
    check('Soldier conflict visible before memory',(await text()).includes('3 fog · 1 light left'));
    await page.getByRole('button',{name:/^Choose Accord /}).click();
    check('Accord review cancels conflict and costs one light',(await text()).includes('1 fog · 3 light left')&&(await text()).includes('conflict 0'));
    await click('Back');await page.getByRole('button',{name:/^Choose Vigil /}).click();
    check('Vigil recognizes two-seat passenger',(await text()).includes('0 fog · 4 light left')&&(await text()).includes('memory 3'));
    await importFixture('keeper');await click('Travel to Asphodel');await click('Use no memory');check('Keeper solo protection in review',(await text()).includes('0 fog · 4 light left')&&(await text()).includes('passengers 1'));
    await importFixture('poet');await click('Travel to Asphodel');await click('Use no memory');check('Poet with two others protects crossing',(await text()).includes('0 fog · 4 light left'));
    await importFixture('release');await page.getByText('Release a wraith · 2 light each',{exact:true}).click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:/^Release Blue Soldier /}).click();await click('Continue');
    check('Wraith release to zero is legal and immediate',(await saved()).light===0&&(await saved()).wraiths.length===0&&(await text()).includes('0 fog · 0 light left'));
    await importFixture('final');check('Final destination warning before route choice',(await text()).includes('Everyone still aboard must disembark here'));
    await crossing('Tartarus');check('Final delivery cannot leave passenger aboard',await page.getByRole('button',{name:'Keep everyone aboard',exact:true}).isDisabled());
    await click('Select: Merchant');await click('Deliver 1 passenger');await click('Continue');check('Final delivery opens legal return',await page.getByRole('button',{name:'Travel to Starting Shore',exact:true}).isEnabled());
    await importFixture('failure');await click('Choose a route');await click('Travel to Tartarus');await click('Use no memory');check('Lethal crossing explicitly labeled',await page.getByRole('button',{name:'Accept failure and cross',exact:true}).isVisible());await click('Accept failure and cross');check('Failure result before arrival or rewards',(await saved()).node==='shore'&&(await saved()).delivered.length===0);await click('Continue');check('Run summary reached',(await text()).includes('The river remembers'));await capture('failure-desktop');
    await importFixture('soldiers');await page.setViewportSize({width:390,height:844});await capture('route-mobile');
    check('Narrow route viewport has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await click('Travel to Tartarus');await capture('memory-mobile');check('Narrow memory viewport has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.getByRole('button',{name:/^Choose Recollection /}).click();await capture('review-mobile');
    check('Narrow review has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.reload();await click('Resume cycle 1');check('Reload resumes review without spending memory',(await saved()).phase==='review'&&(await saved()).hand.length===3);
    await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));check('Light and boat summary stays visible while scrolling',await page.evaluate(()=>{const r=document.querySelector('#status').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
    await click('Guide & save');page.once('dialog',d=>d.dismiss());const keep=await saved();await click('New run');check('Cancel new run preserves progress',JSON.stringify(await saved())===JSON.stringify(keep));
    await click('Guide & save');page.once('dialog',d=>d.accept());await click('New run');check('Confirmed new run clears game resources and flags',(await saved()).light===2&&!(await saved()).hand.length&&!(await saved()).events.length);
    await capture('boarding-mobile');check('Narrow boarding viewport has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    check('All rendered images loaded',await page.evaluate(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0)));
    await importFixture('literal');check('Imported result strings render as inert text',await page.locator('#popup-title').innerText()==='<img src=x onerror="window.importExecuted=true">'&&await page.evaluate(()=>!window.importExecuted&&!document.querySelector('img[src="x"]')));
    check('No JavaScript runtime errors',errors.length===0,errors);
  } catch(e){results.push({name:'Browser runner completion',status:'FAIL',detail:e.message});}
  finally {page.off('pageerror',onError);}
  const report={kind:'Automated browser interactions in isolated context; fixtures are constructed; not human playtesting',recordedAt:new Date().toISOString(),url:page.url(),userAgent:await page.evaluate(()=>navigator.userAgent),viewports:[{width:1280,height:900},{width:390,height:844}],counts:{passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length},results,errors};
  await context.close();return report;
}
