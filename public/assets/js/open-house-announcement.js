/* Keep the invitation available until explicitly dismissed for this visit. */
(()=>{
  const root=document.getElementById('open-house-announcement');
  if(!root)return;
  const banner=root.querySelector('.oh-banner'),card=root.querySelector('.oh-card');
  const prefix=`petons:${root.dataset.campaign}:invitation-v2:`,seenKey=prefix+'dismissed',bannerKey=prefix+'banner-dismissed',visitKey=prefix+'last-activity';
  const visitTimeout=30*60*1000;
  const expires=Date.parse(root.dataset.end);
  const stores=[];
  // Persistent campaign dismissals from older versions must not suppress a new visit.
  for(const name of ['sessionStorage']){
    try{const storage=window[name],probe=prefix+'probe';storage.setItem(probe,'1');storage.removeItem(probe);stores.push(storage);}catch{}
  }
  const read=key=>stores.some(storage=>{try{return storage.getItem(key)==='1';}catch{return false;}});
  const remember=key=>stores.forEach(storage=>{try{storage.setItem(key,'1');}catch{}});
  const touchVisit=()=>stores.forEach(storage=>{try{storage.setItem(visitKey,String(Date.now()));}catch{}});
  const staleVisit=()=>stores.some(storage=>{try{const last=Number(storage.getItem(visitKey));return !last||Date.now()-last>=visitTimeout;}catch{return false;}});
  const resetVisit=()=>stores.forEach(storage=>{try{storage.removeItem(seenKey);storage.removeItem(bannerKey);}catch{}});
  const navigation=performance.getEntriesByType('navigation')[0];
  // Direct and external arrivals start a visit; internal links and reloads keep it.
  const newArrival=navigation?.type==='navigate'&&(!document.referrer||new URL(document.referrer).origin!==location.origin);
  if(newArrival||staleVisit())resetVisit();
  touchVisit();
  let timer,finished=false,opener=null,readyAt=Date.now()+2000;
  const active=()=>Number.isFinite(expires)&&Date.now()<expires;
  const manual=()=>card.hasAttribute('data-manual');
  const setExpanded=value=>document.querySelectorAll('[data-oh-reopen]').forEach(button=>button.setAttribute('aria-expanded',String(value)));
  function stop(){finished=true;clearTimeout(timer);}
  function hideCard(){card.hidden=true;card.removeAttribute('data-manual');setExpanded(false);stop();}
  function dismissCard(){remember(seenKey);hideCard();}
  function hideAll(){banner.hidden=true;hideCard();document.querySelectorAll('[data-oh-footer]').forEach(el=>el.hidden=true);}
  function showCard(trigger){
    if(!active())return;
    opener=trigger||null;
    card.toggleAttribute('data-manual',Boolean(trigger));
    const illustration=card.querySelector('img');
    if(!illustration.getAttribute('src'))illustration.src=illustration.dataset.src;
    card.hidden=false;card.scrollTop=0;setExpanded(true);stop();
    if(trigger)card.querySelector('[data-oh-close-card]').focus({preventScroll:true});
  }
  function closeCard(){
    const focused=card.contains(document.activeElement);
    dismissCard();
    if(focused){
      const target=opener?.isConnected?opener:(!banner.hidden?banner.querySelector('.oh-banner-cta'):document.querySelector('.cm-brand'));
      target?.focus({preventScroll:true});
    }
    opener=null;
  }
  function attempt(){
    clearTimeout(timer);
    if(finished)return;
    if(!active()){hideAll();return;}
    if(read(seenKey)||read(bannerKey)){hideCard();return;}
    // Without session storage, keep the manual entry point to avoid repeated interruptions.
    if(!stores.length)return;
    const remaining=readyAt-Date.now();
    if(remaining>0){timer=setTimeout(attempt,remaining);return;}
    if(document.hidden)return;
    const busy=document.querySelector('dialog[open],.cm-menu-toggle[aria-expanded="true"]')||document.activeElement?.closest('form,input,textarea,select,[contenteditable="true"]');
    if(busy){timer=setTimeout(attempt,4000);return;}
    showCard();
  }
  if(!active())return;
  banner.hidden=read(bannerKey);
  root.querySelector('[data-oh-close-card]').addEventListener('click',closeCard);
  root.querySelector('[data-oh-close-banner]').addEventListener('click',()=>{
    remember(bannerKey);remember(seenKey);banner.hidden=true;hideCard();
    document.querySelector('.cm-brand')?.focus({preventScroll:true});
  });
  root.querySelectorAll('[data-oh-action]').forEach(link=>link.addEventListener('click',dismissCard));
  function resumeVisit(){
    if(!active()){hideAll();return;}
    if(staleVisit()){
      resetVisit();hideCard();opener=null;
      finished=false;readyAt=Date.now()+2000;banner.hidden=false;
    }
    touchVisit();attempt();
  }
  addEventListener('pagehide',touchVisit);
  addEventListener('visibilitychange',()=>{
    if(document.hidden)touchVisit();else resumeVisit();
  });
  addEventListener('pageshow',event=>{
    if(!active())hideAll();
    else if(event.persisted){
      if(staleVisit())resumeVisit();
      else{if(read(seenKey)&&!manual())hideCard();if(read(bannerKey))banner.hidden=true;}
    }
  });
  document.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-oh-reopen]');
    if(trigger){showCard(trigger);return;}
    if(event.target.closest('[data-open="open-house-dialog"]'))dismissCard();
    else if(!card.hidden&&event.target.closest('[data-open],.cm-menu-toggle'))hideCard();
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!card.hidden&&!document.querySelector('dialog[open]'))closeCard();
  });
  function ready(){
    if(!active())return;
    document.querySelectorAll('[data-oh-footer]').forEach(el=>el.hidden=false);
    // An explicit preview link also works after both surfaces have been dismissed.
    const url=new URL(location.href);
    if(url.searchParams.get('invitation')==='portes-ouvertes'){
      banner.hidden=false;
      showCard(banner.querySelector('.oh-banner-cta'));
      url.searchParams.delete('invitation');history.replaceState(null,'',url.pathname+url.search+url.hash);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  const expire=()=>{
    const remaining=expires-Date.now();
    if(remaining<=0)hideAll();else setTimeout(expire,Math.min(remaining,2147483647));
  };
  expire();attempt();
})();
