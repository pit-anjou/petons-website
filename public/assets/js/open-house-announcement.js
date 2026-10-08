/* Automatic display is once per campaign; explicit invitations remain reopenable. */
(()=>{
  const root=document.getElementById('open-house-announcement');
  if(!root)return;
  const banner=root.querySelector('.oh-banner'),card=root.querySelector('.oh-card');
  const prefix=`petons:${root.dataset.campaign}:`,seenKey=prefix+'seen',bannerKey=prefix+'banner-dismissed';
  const expires=Date.parse(root.dataset.end);
  const desktop=matchMedia('(min-width:900px) and (min-height:650px)');
  const stores=[];
  for(const name of ['localStorage','sessionStorage']){
    try{const storage=window[name],probe=prefix+'probe';storage.setItem(probe,'1');storage.removeItem(probe);stores.push(storage);}catch{}
  }
  const read=key=>stores.some(storage=>{try{return storage.getItem(key)==='1';}catch{return false;}});
  const remember=key=>stores.forEach(storage=>{try{storage.setItem(key,'1');}catch{}});
  let interacted=false,timer,finished=false,opener=null;
  const readyAt=Date.now()+8000;
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
    remember(seenKey);card.hidden=false;card.scrollTop=0;setExpanded(true);stop();
    if(trigger)card.querySelector('[data-oh-close-card]').focus({preventScroll:true});
  }
  function closeCard(){
    const focused=card.contains(document.activeElement);
    dismissCard();
    if(focused){
      const target=opener?.isConnected?opener:(!banner.hidden?banner.querySelector('[data-oh-reopen]'):document.querySelector('.cm-brand'));
      target?.focus({preventScroll:true});
    }
    opener=null;
  }
  function attempt(){
    clearTimeout(timer);
    if(finished)return;
    if(!active()){hideAll();return;}
    if(read(seenKey)||read(bannerKey)){hideCard();return;}
    // Automatic display stays off when storage is blocked or the screen is small.
    if(!stores.length||!desktop.matches)return;
    const remaining=readyAt-Date.now();
    if(remaining>0){timer=setTimeout(attempt,remaining);return;}
    if(!interacted||document.hidden)return;
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
  for(const type of ['scroll','pointerdown','keydown']){
    addEventListener(type,()=>{interacted=true;attempt();},{once:true,passive:true});
  }
  addEventListener('visibilitychange',()=>{if(!active())hideAll();else attempt();});
  addEventListener('pageshow',event=>{
    if(!active())hideAll();
    else if(event.persisted){if(read(seenKey)&&!manual())hideCard();if(read(bannerKey))banner.hidden=true;}
  });
  addEventListener('storage',event=>{
    if(event.key===seenKey&&event.newValue==='1'&&!manual())hideCard();
    if(event.key===bannerKey&&event.newValue==='1'){banner.hidden=true;if(!manual())hideCard();}
  });
  desktop.addEventListener('change',()=>{if(!desktop.matches&&!card.hidden&&!manual())hideCard();else attempt();});
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
      showCard(banner.querySelector('[data-oh-reopen]'));
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
