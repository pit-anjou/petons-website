/* One campaign across all pages. The announcement never takes keyboard focus. */
(()=>{
  const root=document.getElementById('open-house-announcement');
  if(!root)return;
  const banner=root.querySelector('.oh-banner'),card=root.querySelector('.oh-card');
  const prefix=`petons:${root.dataset.campaign}:`,seenKey=prefix+'seen',bannerKey=prefix+'banner-dismissed';
  const expires=Date.parse(root.dataset.end);
  const desktop=matchMedia('(min-width:900px) and (min-height:650px)');
  // If storage is blocked, keep the banner but do not risk repeating a popup.
  const stores=[];
  for(const name of ['localStorage','sessionStorage']){
    try{const storage=window[name],probe=prefix+'probe';storage.setItem(probe,'1');storage.removeItem(probe);stores.push(storage);}catch{}
  }
  const read=key=>stores.some(storage=>{try{return storage.getItem(key)==='1';}catch{return false;}});
  const remember=key=>stores.forEach(storage=>{try{storage.setItem(key,'1');}catch{}});
  let interacted=false,timer,finished=false;
  const readyAt=Date.now()+8000;
  const active=()=>Number.isFinite(expires)&&Date.now()<expires;
  function stop(){finished=true;clearTimeout(timer);}
  function hideCard(){card.hidden=true;stop();}
  function dismissCard(){remember(seenKey);hideCard();}
  function hideAll(){banner.hidden=true;hideCard();}
  function attempt(){
    clearTimeout(timer);
    if(finished)return;
    if(!active()){hideAll();return;}
    if(read(seenKey)||read(bannerKey)){hideCard();return;}
    if(!stores.length||!desktop.matches)return;
    const remaining=readyAt-Date.now();
    if(remaining>0){timer=setTimeout(attempt,remaining);return;}
    if(!interacted||document.hidden)return;
    const busy=document.querySelector('dialog[open],.cm-menu-toggle[aria-expanded="true"]')||document.activeElement?.closest('form,input,textarea,select,[contenteditable="true"]');
    if(busy){timer=setTimeout(attempt,4000);return;}
    card.querySelector('img').src=card.querySelector('img').dataset.src;
    remember(seenKey);
    card.hidden=false;
    stop();
  }
  if(!active())return;
  banner.hidden=read(bannerKey);
  root.querySelector('[data-oh-close-card]').addEventListener('click',()=>{
    // A user who tabs into the card returns to a stable link on closing it.
    const focused=card.contains(document.activeElement);
    dismissCard();
    if(focused)(!banner.hidden?banner.querySelector('a'):document.querySelector('.cm-brand'))?.focus({preventScroll:true});
  });
  root.querySelector('[data-oh-close-banner]').addEventListener('click',()=>{
    remember(bannerKey);remember(seenKey);hideAll();
    document.querySelector('.cm-brand')?.focus({preventScroll:true});
  });
  root.querySelectorAll('[data-oh-action]').forEach(link=>link.addEventListener('click',dismissCard));
  for(const type of ['scroll','pointerdown','keydown']){
    addEventListener(type,()=>{interacted=true;attempt();},{once:true,passive:true});
  }
  addEventListener('visibilitychange',()=>{if(!active())hideAll();else attempt();});
  addEventListener('pageshow',()=>{if(!active())hideAll();else if(read(seenKey))hideCard();if(read(bannerKey))banner.hidden=true;});
  addEventListener('storage',event=>{
    if(event.key===seenKey&&event.newValue==='1')hideCard();
    if(event.key===bannerKey&&event.newValue==='1')hideAll();
  });
  desktop.addEventListener('change',()=>{if(!desktop.matches&&!card.hidden)hideCard();else attempt();});
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-open="open-house-dialog"]'))dismissCard();
    else if(!card.hidden&&event.target.closest('[data-open],.cm-menu-toggle'))hideCard();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!card.hidden&&!document.querySelector('dialog[open]')){
      const focused=card.contains(document.activeElement);dismissCard();
      if(focused)(!banner.hidden?banner.querySelector('a'):document.querySelector('.cm-brand'))?.focus({preventScroll:true});
    }
  });
  // Remove the campaign at the event's end, even on a page left open all day.
  const expire=()=>{
    const remaining=expires-Date.now();
    if(remaining<=0)hideAll();else setTimeout(expire,Math.min(remaining,2147483647));
  };
  expire();
  attempt();
})();
