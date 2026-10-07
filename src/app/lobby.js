// Main app, ported verbatim from reference/checkpoint-8.html.
// MEDIA and DATA were globals there; here they're imported.
import MEDIA from '../media.js';
import DATA from '../data/data.json';

(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const URL_ = {};
// Turn embedded video into blob URLs once
for (const k in MEDIA){
  const v = MEDIA[k];
  if (v.startsWith('data:video')){
    const b = atob(v.split(',')[1]); const a = new Uint8Array(b.length);
    for (let i=0;i<b.length;i++) a[i]=b.charCodeAt(i);
    URL_[k] = URL.createObjectURL(new Blob([a],{type:'video/mp4'}));
  } else URL_[k] = v;
}
const TR=id=>URL_['tr_'+id]||URL_['trhd_'+id], TRP=id=>URL_['tr_'+id+'_p']||URL_['trhd_'+id+'_p'];
const HD=id=>URL_['trhd_'+id]||URL_['tr_'+id], HDP=id=>URL_['trhd_'+id+'_p']||URL_['tr_'+id+'_p'];
const G = DATA.games, H = DATA.heroes;
const byName = Object.fromEntries(G.map(g=>[g.n,g]));
const heroBy = Object.fromEntries(H.map(h=>[h.id,h]));
const heroByName = Object.fromEntries(H.map(h=>[h.n,h]));
const ARTN={"10001 Nights Megaways":"art_f0","4Squad":"art_f1","Archdragon King":"art_f2","Big Bang Boom":"art_f3","Bubble Up!":"art_f4","Cash Volt":"art_f5","Crab Trap":"art_f6","Crabby's Gold":"art_f7","Fury of Anubis":"art_f8","Great Ghosts!":"art_f9","Hell Butcher":"art_f10","Jackpot Train":"art_f11","Nitropolis":"art_f12","Piggy Blitz Disco Gold":"art_f13","Rome: The Golden Age":"art_f14","Sweet Bonanza 1000":"art_f15","Tombstone":"art_f16","Wheel of Happiness":"art_f17","Wolf Hunters":"art_f18",'777 Strike':'art_strike','Alien Invaders':'art_alien','Oink Oink Oink':'art_oink','Sweet Bonanza':'art_sweet','Zeus vs Hades – Gods of War':'art_zeus','Starburst Galaxy':'art_starburst','Honey Rush':'art_honey','Sweet Alchemy':'art_alchemy','Shah Mat':'art_shahmat',"Big Size Fishin'":'art_fishin','Ice Wolf':'art_icewolf'};
const artOf=n=>{const h=heroByName[n];return h?URL_['tile_'+h.id]:(ARTN[n]?URL_[ARTN[n]]:'')};
const fmt = n => n.toLocaleString('en-GB')+'x';
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const vol = {'Low':1,'Medium-low':2,'Medium':3,'Medium-high':4,'High':5,'Very high':6};

function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),2200)}

// ---------- GameDNA similarity (themes, features, volatility, studio) ----------
function sim(a,b){
  const ja=(x,y)=>{const s=new Set(x),t=new Set(y);let i=0;s.forEach(v=>t.has(v)&&i++);const u=new Set([...x,...y]).size;return u?i/u:0};
  return ja(a.t,b.t)*1.3 + ja(a.f,b.f)*1.0 + (1-Math.abs((vol[a.v]||3)-(vol[b.v]||3))/5)*0.4 + (a.s===b.s?0.15:0);
}
function similar(name,n){const a=byName[name];return G.filter(g=>g.n!==name).map(g=>[sim(a,g),g]).sort((x,y)=>y[0]-x[0]).slice(0,n).map(x=>x[1])}

// ---------- Rendering helpers ----------
function tileHTML(h){
  return `<button class="tile" data-game="${h.id}"><div class="art" data-vid="${h.id}"><img src="${URL_['tile_'+h.id]}" alt="" loading="lazy"><span class="live-tag"><i></i>Preview</span></div><div class="nm">${esc(h.n)}</div><div class="st">${esc(h.s||'Studio being verified')}</div></button>`;
}
function dcardHTML(g,hits){
  const tags=(hits&&hits.length?hits:[g.v+' volatility']).slice(0,2);
  const hero=heroByName[g.n];
  return `<button class="dcard" ${hero?`data-game="${hero.id}"`:`data-dna="${esc(g.n)}"`} style="--sw:${g.c||'#3a2a5a'}"><div class="sw">${artOf(g.n)?`<img src="${artOf(g.n)}" alt="" loading="lazy">`:''}<b>${fmt(g.m)}</b></div><div class="bd"><div class="nm">${esc(g.n)}</div><div class="st">${esc(g.s)}</div><div class="tg">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div></button>`;
}
function row(title,sub,inner,pw,why){
  return `<section class="row"><div class="row-h"><div><h4>${title}</h4>${sub?`<p>${sub}</p>`:''}</div>${why?`<span class="why">${why}</span>`:''}</div><div class="rail">${inner}</div>${pw?`<div class="pw"><b>Live</b><span>${pw}</span></div>`:''}</section>`;
}

// ---------- Taster profile + scoring ----------
const STYLES=[
  {k:'classic',l:'Classic reels',row:'Classic reels',d:'Lines and scatters, nothing fussy',f:['Paylines','Scatter pays','Win both ways'],ic:'M4 6h16M4 12h16M4 18h16'},
  {k:'megaways',l:'Megaways',row:'Megaways',d:'Reels that change size every spin',f:['Megaways','Dynamic ways'],ic:'M5 18V9M10 18V5M15 18v-7M20 18V8'},
  {k:'hold',l:'Hold and win',row:'Hold and win',d:'Lock the coins and fill the grid',f:['Hold and win','Cash on reels','Cash collect'],ic:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v8M9 11h6'},
  {k:'cascade',l:'Cascades',row:'Cascades',d:'Wins clear and new symbols drop in',f:['Cascades'],ic:'M12 4v12M7 11l5 5 5-5M5 20h14'},
  {k:'cluster',l:'Cluster pays',row:'Cluster pays',d:'Match groups of symbols, not lines',f:['Cluster pays'],ic:'M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7z'},
  {k:'bonus',l:'Pick your bonus',row:'Choose your bonus',d:'Decide how the feature plays out',f:['Bonus choice','Pick bonus','Wheel bonus'],ic:'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z'},
];

let P=null; // the player's taster answers, null until they finish it
const TASTE=['Gates of Olympus 2500','Pirots 3','Sweet Bonanza','Duck Hunters Happy Hour','Starburst Galaxy','Game of Thrones','Honey Rush',"Gonzo's Quest Megaways",'Alien Invaders',"Big Size Fishin'",'Cash Volt Tap-A-Roo','Ice Wolf','Zeus vs Hades – Gods of War','Sweet Alchemy','Oink Oink Oink','777 Strike','Shah Mat'];
// Positive signals: picked games count fully, loved clips fully, kept clips a bit less
function posList(p){p=p||P;if(!p)return[];const o=(p.picks||[]).map(n=>[n,1]);(p.loves||[]).forEach(n=>o.push([n,1]));(p.keeps||[]).forEach(n=>o.push([n,.6]));return o.filter(([n])=>byName[n])}
function score(g,p){
  p=p||P; if(!p)return 0; let s=0;
  const pos=posList(p);
  if(pos.length){let w=0;pos.forEach(([n,wt])=>{s+=wt*(n===g.n?0.9:sim(byName[n],g));w+=wt});s/=w}
  const sk=(p.skips||[]).filter(n=>byName[n]);
  if(sk.length)s-=0.18*sk.reduce((a,n)=>a+(n===g.n?1:sim(byName[n],g)),0)/sk.length;
  const st=STYLES.filter(x=>(p.styles||[]).includes(x.k));
  if(st.length)s+=0.5*st.filter(x=>x.f.some(f=>g.f.includes(f))).length/st.length;
  return s;
}
const byScore=(list,p)=>list.map(g=>[score(g,p),g]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
function heroesRanked(){
  if(!P)return H.slice();
  const fav=new Set([...(P.picks||[]),...(P.loves||[])]), kept=new Set(P.keeps||[]);
  return H.map(h=>[score(byName[h.n])+(fav.has(h.n)?1:kept.has(h.n)?.5:0),h]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
}
function hitsFor(g){
  const out=[], pos=posList().map(x=>byName[x[0]]);
  STYLES.filter(x=>P.styles.includes(x.k)&&x.f.some(f=>g.f.includes(f))).forEach(x=>out.push(x.l));
  pos.forEach(p=>p.t.forEach(t=>{if(g.t.includes(t)&&!out.includes(t))out.push(t)}));
  pos.forEach(p=>p.f.forEach(f=>{if(g.f.includes(f)&&!out.includes(f))out.push(f)}));
  return out.slice(0,3);
}
function profileLine(){
  const bits=[], liked=[...P.picks,...(P.loves||[])];
  if(liked.length)bits.push(liked.length>2?`${liked[0]}, ${liked[1]} and ${liked.length-2} more`:liked.join(' and '));
  const st=STYLES.filter(x=>P.styles.includes(x.k)).map(x=>x.l);
  if(st.length)bits.push(st.join(', '));
  return 'From '+bits.join(' · ');
}
function xcardHTML(h){return `<button class="xcard" data-explore="${h.id}"><img src="${URL_['ex_'+h.id+'_p']}" alt="" loading="lazy"><span class="pl"><svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M8 5.5v13l11-6.5z"/></svg></span><span>${esc(h.n)}</span></button>`}

// ---------- Lobby rows ----------
const ANC=['Egypt','Greek','Ancient','Rome','Mythical'];
const ancient = G.filter(g=>g.t.some(t=>ANC.includes(t))).sort((a,b)=>b.m-a.m);
const big = G.filter(g=>g.m>=20000).sort((a,b)=>b.m-a.m);
const hold = G.filter(g=>g.f.includes('Hold and win')).sort((a,b)=>b.m-a.m);
const recs = similar('Pirots 3',10);
const affinity=list=>byScore(list).slice(0,6).reduce((a,g)=>a+score(g),0)/6;
function renderRows(){
  const HO=heroesRanked();
  const picksRow=row('Spina Zonke picks',P?'Based on your picks':'Tap any game for its full page', HO.map(tileHTML).join(''),
      'Tiles are produced from each game\'s art in the style you set, and play a short preview as they scroll into view.');
  const exploreRow=row('Explore','Swipe through gameplay, one game at a time', HO.map(xcardHTML).join(''),
      'Vertical clips cut per game, ready for an Explore feed or social. They play as they come into view.');
  const themed=[
    {k:'anc',list:ancient,html:l=>row('Ancient worlds','Gods, pharaohs and emperors', l.slice(0,12).map(g=>dcardHTML(g,g.t.filter(t=>ANC.includes(t)))).join(''),'Themed rows build themselves from GameDNA and update as new games land in your lobby.')},
    {k:'big',list:big,html:l=>row('Max win 20,000x and up','The biggest ceilings in your lobby', l.slice(0,12).map(g=>dcardHTML(g,[g.v+' volatility'])).join(''),'Any field in the record can drive a row: max win, volatility, mechanic, theme.')},
    {k:'hold',list:hold,html:l=>row('Hold and win','Lock the coins, chase the jackpot', l.slice(0,12).map(g=>dcardHTML(g,['Hold and win'])).join(''), null)},
  ];
  if(!P){
    $('#rows').innerHTML = picksRow + exploreRow +
      row('Because you played Pirots 3','Picked by GameDNA, not by provider', recs.map(g=>dcardHTML(g,[...g.t.filter(t=>byName['Pirots 3'].t.includes(t)),...g.f.filter(f=>byName['Pirots 3'].f.includes(f))])).join(''),
        'Recommendations compare themes, features and volatility across every record, so a player gets more of what they actually liked.','For you') +
      themed.map(t=>t.html(t.list)).join('');
    return;
  }
  const picked=new Set(P.picks), top=byName[P.picks[0]];
  const forYou=byScore(G).filter(g=>!picked.has(g.n)).slice(0,10), seen=new Set(forYou.map(g=>g.n));
  const styleRows=STYLES.filter(x=>P.styles.includes(x.k)).slice(0,2).map(x=>{
    const l=byScore(G.filter(g=>x.f.some(f=>g.f.includes(f))&&!picked.has(g.n)&&!seen.has(g.n)));
    return l.length>=3?row(x.row,'Because you chose '+x.l, l.slice(0,12).map(g=>dcardHTML(g,hitsFor(g))).join(''), null,'For you'):'';
  });
  const th=themed.filter(t=>!(t.k==='hold'&&P.styles.includes('hold'))).map(t=>[affinity(t.list),t]).sort((a,b)=>b[0]-a[0]).map(([,t])=>t.html(byScore(t.list)));
  $('#rows').innerHTML =
    row('Picked for you',P.sample?'Matched to a sample player':'Matched to your answers', forYou.map(g=>dcardHTML(g,hitsFor(g))).join(''),
      'Every row in this lobby is reordered from the player\'s answers, matched against each game\'s GameDNA record.','For you') +
    picksRow + (styleRows[0]||'') + exploreRow +
    row('Because you picked '+top.n,'Picked by GameDNA, not by provider', similar(top.n,16).filter(g=>!forYou.slice(0,5).includes(g)).slice(0,10).map(g=>dcardHTML(g,[...g.t.filter(t=>top.t.includes(t)),...g.f.filter(f=>top.f.includes(f))])).join(''), null) +
    (th[0]||'') + (styleRows[1]||'') + th.slice(1).join('');
}
renderRows();

function renderTune(){
  const ic='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>';
  $('#tune').innerHTML = P&&P.sample
    ? `<button class="tune on" data-tune><span class="ic">${ic}</span><span class="tx"><b>Showing a sample player</b><small>${esc(profileLine())}</small></span><span class="go">Make it yours</span></button>`
    : P
    ? `<button class="tune on" data-tune><span class="ic">${ic}</span><span class="tx"><b>Tuned to you</b><small>${esc(profileLine())}</small></span><span class="go">Retune</span></button>`
    : `<button class="tune" data-tune><span class="ic">${ic}</span><span class="tx"><b>Make this lobby yours</b><small>Three taps and it rebuilds around what you like</small></span><span class="go">Start</span></button>`;
}
renderTune();

// ---------- Chips ----------
const CHIPS=[['For you',null],['Explore','explore'],['Megaways','Megaways'],['Hold and win','Hold and win'],['Bonus buy','Bonus buy'],['Ancient worlds','Ancient'],['Very high volatility','very high volatility'],['Christmas','Christmas']];
const STYLEQ={classic:'Paylines',megaways:'Megaways',hold:'Hold and win',cascade:'Cascades',cluster:'Cluster pays',bonus:'Bonus choice'};
function renderChips(){
  let list=CHIPS.slice();
  if(P){const mine=STYLES.filter(x=>P.styles.includes(x.k)).map(x=>[x.l,STYLEQ[x.k]]);list=[list[0],list[1],...mine,...list.slice(2).filter(([l])=>!mine.some(m=>m[0]===l))]}
  $('#chips').innerHTML = list.map(([l,q],i)=>`<button class="chip${i===0?' on':''}" data-q="${q||''}">${i===0?'<span class="dot"></span>':''}${l}</button>`).join('');
}
renderChips();
$('#chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;const q=b.dataset.q;if(q==='explore')openExplore(0);else if(q)openSearch(q)});

// ---------- Hero carousel ----------
let HERO_ORDER=['gates','got','duck','gonzo']; const HOOK={gates:'High volatility, up to 25,000x',got:'4,096 ways, up to 10,000x',duck:'Very high volatility, up to 33,333x',gonzo:'Megaways, up to 117,649 ways'};
const BADGE={gates:'New this week',got:'Blockbuster',duck:'Players love it',gonzo:'Classic, rebuilt',pirots:'Players love it',cashvolt:'Something different'};
HOOK.pirots='Cluster pays, up to 10,000x'; HOOK.cashvolt='Tap for instant wins';
const badgeOf=id=>P?(P.picks.includes(heroBy[id].n)?(P.sample?'Sample pick':'You picked this'):(P.sample?'Matched to the sample':'Matched to your picks')):BADGE[id];
let hi=0, heroTimer=null;
$('#heroDots').innerHTML=HERO_ORDER.map(()=>'<i></i>').join('');
function showHero(i){
  hi=(i+HERO_ORDER.length)%HERO_ORDER.length; const h=heroBy[HERO_ORDER[hi]], v=$('#heroVid');
  v.poster=TRP(h.id); v.src=TR(h.id);
  if(!reduce){v.play().catch(()=>{})}
  $('#heroName').textContent=h.n; $('#heroHook').textContent=HOOK[h.id]; $('#heroBadge').textContent=badgeOf(h.id);
  $('#heroBtn').dataset.game=h.id; $$('#heroDots i').forEach((d,j)=>d.classList.toggle('on',j===hi));
}
$('#heroVid').addEventListener('ended',()=>showHero(hi+1));
$('#hero').addEventListener('click',e=>{if(e.target.closest('#heroBtn'))return;openGame(HERO_ORDER[hi])});
showHero(0);
if(reduce){heroTimer=setInterval(()=>showHero(hi+1),6000)}

// ---------- Tiles play when in view ----------
const tio=new IntersectionObserver(es=>es.forEach(en=>{
  const art=en.target; let v=art.querySelector('video');
  if(en.isIntersecting && !reduce){
    if(!v){v=document.createElement('video');v.muted=true;v.loop=true;v.playsInline=true;v.src=TR(art.dataset.vid);art.appendChild(v)}
    v.play().then(()=>art.classList.add('live')).catch(()=>{});
  } else if(v){v.pause();art.classList.remove('live')}
}),{threshold:.6});
function xplay(c,on){
  let v=c.querySelector('video');
  if(on){if(reduce)return;if(!v){v=document.createElement('video');v.muted=true;v.loop=true;v.playsInline=true;v.preload='auto';v.src=URL_['ex_'+c.dataset.explore];c.insertBefore(v,c.querySelector('.pl'))}v.play().then(()=>c.classList.add('live')).catch(()=>{})}
  else if(v){v.pause();c.classList.remove('live')}
}
const xrio=new IntersectionObserver(es=>es.forEach(en=>xplay(en.target,en.isIntersecting)),{threshold:.6});
function observeRows(){tio.disconnect();xrio.disconnect();$$('#rows .tile .art').forEach(a=>tio.observe(a));$$('#rows .xcard').forEach(c=>xrio.observe(c))}
observeRows();

// ---------- Typed search prompt ----------
const PROMPTS=['Egyptian, high volatility','Megaways with bonus buy','Max win over 20,000x','Hold and win jackpots','Something like Pirots 3'];
(function type(){
  const el=$('#typed'); if(reduce){el.textContent=PROMPTS[0];return}
  let p=0,c=0,del=false;
  (function tick(){const s=PROMPTS[p];el.textContent=s.slice(0,c);
    if(!del&&c<s.length){c++;setTimeout(tick,55)}else if(!del){del=true;setTimeout(tick,1600)}
    else if(c>0){c--;setTimeout(tick,22)}else{del=false;p=(p+1)%PROMPTS.length;setTimeout(tick,300)}})();
})();

// ---------- Sheets ----------
let openSheet=null;
function open(id){openSheet=$(id);openSheet.classList.add('open');document.body.style.overflow='hidden'}
function closeAll(){
  $$('.sheet.open').forEach(s=>{s.classList.remove('open');s.querySelectorAll('video').forEach(v=>v.pause())});
  document.body.style.overflow='';openSheet=null; resumeHero();
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-close]'))return closeAll();
  const g=e.target.closest('[data-game]'); if(g){e.preventDefault();return openGame(g.dataset.game)}
  const d=e.target.closest('[data-dna]'); if(d)return openDna(d.dataset.dna);
  const x=e.target.closest('[data-explore]'); if(x)return openExplore(x.dataset.explore);
  const o=e.target.closest('[data-open]'); if(o)return o.dataset.open==='search'?openSearch(''):openExplore(0);
  const p=e.target.closest('.play'); if(p&&!p.id){toast('In your lobby, this launches the game.')}
  const f=e.target.closest('.fav'); if(f){f.classList.toggle('on');toast(f.classList.contains('on')?'Saved to favourites':'Removed from favourites')}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&openSheet)closeAll()});

// ---------- Game page ----------
const isDesk=()=>document.body.dataset.layout==='desktop';
const heart='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
const backX='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>';
function dnaPanel(h){return `<div class="dna">
      <div class="r"><span>Volatility</span><b>${h.v}</b></div>
      <div class="r"><span>Max win</span><b>${fmt(h.m)}</b></div>
      <div class="r"><span>How it pays</span><b>${esc(h.win)}</b></div>
      <div class="r"><span>Grid</span><b>${esc(h.grid)}</b></div>
      <div class="tags">${h.f.map(f=>`<span class="tg"><span>${esc(f)}</span></span>`).join('')}</div>
      <div class="tags">${h.t.map(t=>`<span class="tg"><span>${esc(t)}</span></span>`).join('')}</div>
      <div class="cap">A sample of the fields in this game's record.</div></div>`}
function miniRow(g){const h=heroByName[g.n];return `<button class="res" ${h?`data-game="${h.id}"`:`data-dna="${esc(g.n)}"`}><div class="sq" style="--sw:${g.c||'#3a2a5a'}">${artOf(g.n)?`<img src="${artOf(g.n)}" alt="">`:''}</div><div class="tx"><div class="nm">${esc(g.n)}</div><div class="st">${g.v} volatility, up to ${fmt(g.m)}</div></div></button>`}
function portrait(h,label){return `<div class="pc-art" style="--tile:url('${URL_['tile_'+h.id]}')"><img src="${URL_['tile_'+h.id]}" alt="">${label?`<div class="pc-lab"><b>${esc(h.n)}</b><small>${h.v} volatility, up to ${fmt(h.m)}</small></div>`:''}</div>`}
function openGame(id){
  const h=heroBy[id]; pauseHeroes();
  const more=similar(h.n,8);
  if(isDesk()){
    const fromStudio=h.s?G.filter(g=>g.s===h.s&&g.n!==h.n).sort((a,b)=>b.m-a.m).slice(0,5):[];
    $('#gamePanel').innerHTML=`
    <button class="x" data-close aria-label="Close game page">${backX}</button>
    <div class="dgp">
      <div class="dgp-main">
        <div class="dgp-player"><video src="${HD(id)}" poster="${HDP(id)}" muted loop playsinline ${reduce?'':'autoplay'}></video></div>
        <div class="dgp-head">
          <div><h2>${esc(h.n)}</h2><div class="studio">${h.s?esc(h.s):'<span class="verify">Studio being verified</span>'}${h.s?' <button class="follow" data-follow>Follow studio</button>':''}</div></div>
          <div class="ctas"><button class="ghost fav" aria-label="Save to favourites">${heart}</button><button class="play">Play</button></div>
        </div>
        <div class="facts"><div class="fact"><small>Volatility</small><b>${h.v}</b></div><div class="fact"><small>Max win</small><b>${fmt(h.m)}</b></div><div class="fact"><small>How it pays</small><b>${esc(h.win)}</b></div><div class="fact"><small>Bonus buy</small><b>${h.buy}</b></div></div>
        <div class="pw"><b>Live</b><span>Game pages are generated for every game in your lobby: video, copy and data, kept up to date.</span></div>
        <div class="dgp-cols">
          <div><h5>Why players pick it</h5><p class="copy">${esc(h.copy)}</p><p class="src">Written from this game's GameDNA record.</p>
            <h5>Watch before you play</h5>
            <div class="ex"><div class="clip"><video src="${URL_['ex_'+id]}" poster="${URL_['ex_'+id+'_p']}" muted loop playsinline preload="none"></video></div>
            <div class="ph"><b>Feature walkthrough</b><small>A narrated guide to the bonus round. Placeholder: made on request for each game.</small></div></div></div>
          <div><h5>GameDNA</h5>${dnaPanel(h)}</div>
        </div>
      </div>
      <aside class="dgp-side">
        ${portrait(h,true)}
        ${fromStudio.length?`<h5>More from ${esc(h.s)} <small>in this preview</small></h5><div class="mini">${fromStudio.map(miniRow).join('')}</div>`:''}
        <h5>Similar DNA</h5><div class="mini">${more.slice(0,5).map(miniRow).join('')}</div>
      </aside>
    </div>`;
    const clip=$('#gamePanel .clip video'); clip.addEventListener('mouseenter',()=>{if(!reduce)clip.play().catch(()=>{})}); clip.addEventListener('mouseleave',()=>clip.pause());
  } else {
  $('#gamePanel').innerHTML=`
  <button class="x" data-close aria-label="Close game page">${backX}</button>
  <div class="gp-hero"><video src="${TR(id)}" poster="${TRP(id)}" muted loop playsinline ${reduce?'':'autoplay'}></video></div>
  <div class="gp">
    <h2>${esc(h.n)}</h2>
    <div class="studio">${h.s?esc(h.s):'<span class="verify">Studio being verified</span>'}</div>
    <div class="facts"><div class="fact"><small>Volatility</small><b>${h.v}</b></div><div class="fact"><small>Max win</small><b>${fmt(h.m)}</b></div><div class="fact"><small>Bonus buy</small><b>${h.buy}</b></div></div>
    <div class="ctas"><button class="play">Play</button><button class="ghost fav" aria-label="Save to favourites">${heart}</button></div>
    <div class="pw" style="margin:12px 0 0"><b>Live</b><span>Game pages are generated for every game in your lobby: video, copy and data, kept up to date.</span></div>
    <h5>Why players pick it</h5>
    <p class="copy">${esc(h.copy)}</p>
    <p class="src">Written from this game's GameDNA record.</p>
    <h5>GameDNA</h5>${dnaPanel(h)}
    <h5>Watch before you play</h5>
    <div class="ex">
      <div class="clip"><video src="${URL_['ex_'+id]}" poster="${URL_['ex_'+id+'_p']}" muted loop playsinline ${reduce?'':'autoplay'}></video></div>
      <div class="ph"><b>Feature walkthrough</b><small>A narrated guide to the bonus round. Placeholder: made on request for each game.</small></div>
    </div>
    <h5>Games with similar DNA</h5>
  </div>
  <div class="rail" style="padding-bottom:40px">${more.map(g=>dcardHTML(g,g.t.filter(t=>h.t.includes(t)).concat(g.f.filter(f=>h.f.includes(f))))).join('')}</div>`;
  }
  $('#gamePanel').scrollTop=0; open('#gameSheet');
}
function openDna(name){
  const g=byName[name]; const more=similar(name,8);
  if(isDesk()){
    const fromStudio=G.filter(x=>x.s===g.s&&x.n!==g.n).sort((a,b)=>b.m-a.m).slice(0,5);
    $('#gamePanel').innerHTML=`
    <button class="x" data-close aria-label="Close game page">${backX}</button>
    <div class="dgp"><div class="dgp-main">
      <div class="dgp-player keyc" style="--sw:${g.c||'#3a2a5a'}"><span>${esc(g.n)}</span><small>Key colour ${g.c||'not set'}, from this game's record. Video and tiles are generated on request.</small></div>
      <div class="dgp-head"><div><h2>${esc(g.n)}</h2><div class="studio">${esc(g.s)} <button class="follow" data-follow>Follow studio</button></div></div>
      <div class="ctas"><button class="ghost fav" aria-label="Save to favourites">${heart}</button><button class="play">Play</button></div></div>
      <div class="facts"><div class="fact"><small>Volatility</small><b>${g.v}</b></div><div class="fact"><small>Max win</small><b>${fmt(g.m)}</b></div></div>
      <h5>GameDNA</h5><div class="dna"><div class="r"><span>Volatility</span><b>${g.v}</b></div><div class="r"><span>Max win</span><b>${fmt(g.m)}</b></div>
      ${g.f.length?`<div class="tags">${g.f.map(f=>`<span class="tg"><span>${esc(f)}</span></span>`).join('')}</div>`:''}
      ${g.t.length?`<div class="tags">${g.t.map(t=>`<span class="tg"><span>${esc(t)}</span></span>`).join('')}</div>`:''}
      <div class="cap">A sample of the fields in this game's record.</div></div>
    </div><aside class="dgp-side">
      ${fromStudio.length?`<h5>More from ${esc(g.s)} <small>in this preview</small></h5><div class="mini">${fromStudio.map(miniRow).join('')}</div>`:''}
      <h5>Similar DNA</h5><div class="mini">${more.slice(0,6).map(miniRow).join('')}</div>
    </aside></div>`;
    $('#gamePanel').scrollTop=0; open('#gameSheet'); return;
  }
  $('#gamePanel').innerHTML=`
  <button class="x" data-close aria-label="Close game page"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg></button>
  <div class="gp-hero" style="background:${g.c||'#3a2a5a'};aspect-ratio:16/8"></div>
  <div class="gp">
    <h2>${esc(g.n)}</h2><div class="studio">${esc(g.s)}</div>
    <div class="facts"><div class="fact"><small>Volatility</small><b>${g.v}</b></div><div class="fact"><small>Max win</small><b>${fmt(g.m)}</b></div></div>
    <div class="ctas"><button class="play">Play</button><button class="ghost fav" aria-label="Save to favourites"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button></div>
    <h5>GameDNA</h5>
    <div class="dna">
      <div class="r"><span>Volatility</span><b>${g.v}</b></div><div class="r"><span>Max win</span><b>${fmt(g.m)}</b></div>
      ${g.f.length?`<div class="tags">${g.f.map(f=>`<span class="tg"><span>${esc(f)}</span></span>`).join('')}</div>`:''}
      ${g.t.length?`<div class="tags">${g.t.map(t=>`<span class="tg"><span>${esc(t)}</span></span>`).join('')}</div>`:''}
      <div class="cap">Key colour ${g.c||'not set'} comes from the record too. Tiles and video for this game are generated on request.</div>
    </div>
    <h5>Games with similar DNA</h5>
  </div>
  <div class="rail" style="padding-bottom:40px">${more.map(x=>dcardHTML(x,x.t.filter(t=>g.t.includes(t)).concat(x.f.filter(f=>g.f.includes(f))))).join('')}</div>`;
  $('#gamePanel').scrollTop=0; open('#gameSheet');
}

// ---------- Search over GameDNA ----------
const VOLW={'very high':'Very high','high':'High','medium high':'Medium-high','medium-high':'Medium-high','medium':'Medium','low':'Low'};
const SYN={egyptian:'Egypt',egypt:'Egypt',greek:'Greek',gods:'Mythical',myth:'Mythical',xmas:'Christmas',christmas:'Christmas',fish:'Fishing',fishing:'Fishing',pirate:'Pirates',pirates:'Pirates',candy:'Candy',sweets:'Candy',fruit:'Fruit',fruits:'Fruit',space:'Space',ocean:'Ocean',sea:'Ocean',dragon:'Dragon',dragons:'Dragon',pig:'Pig',pigs:'Pig',gold:'Gold',horror:'Horror',spooky:'Halloween',halloween:'Halloween',retro:'Retro',jungle:'Jungle',aztec:'Aztec',animals:'Animals',party:'Party',wild:'Wild West',western:'Wild West',medieval:'Medieval',fantasy:'Fantasy',treasure:'Treasure',fire:'Fire',neon:'Neon',rome:'Rome',roman:'Rome',ancient:'Ancient',mermaid:'Mermaid',summer:'Summer',beach:'Beach'};
const FSYN={'megaways':'Megaways','bonus buy':'Bonus buy','buy bonus':'Bonus buy','hold and win':'Hold and win','hold & win':'Hold and win','cascade':'Cascades','cascades':'Cascades','tumble':'Cascades','cluster':'Cluster pays','free spins':'Free spins','jackpot':'Jackpots','jackpots':'Jackpots','sticky':'Sticky wilds','multiplier':'Climbing multiplier','multipliers':'Multipliers','wheel':'Wheel bonus','respin':'Respins','respins':'Respins','cash collect':'Cash collect','tap':'Lucky tap'};
function search(q){
  const s=q.toLowerCase().trim(); if(!s) return null;
  const want={t:[],f:[],v:null,min:0,like:null,txt:[]};
  let r=s;
  const lk=r.match(/(?:like|similar to)\s+(.+)$/); if(lk){const nm=G.find(g=>g.n.toLowerCase().includes(lk[1].trim()));if(nm){want.like=nm.n;r=r.replace(lk[0],'')}}
  const mw=r.match(/(\d[\d,\.]*)\s*(k)?\s*x?\s*\+?/); 
  if(/(max win|over|above|\+|x)/.test(r)&&mw){let n=parseFloat(mw[1].replace(/,/g,''));if(mw[2])n*=1000;if(n>=100){want.min=n;r=r.replace(mw[0],' ')}}
  for(const k of Object.keys(VOLW).sort((a,b)=>b.length-a.length)){if(r.includes(k+' vol')||r.includes(k+' volatility')){want.v=VOLW[k];r=r.replace(new RegExp(k+'\\s*vol\\w*'),' ');break}}
  for(const k of Object.keys(FSYN).sort((a,b)=>b.length-a.length)){if(r.includes(k)){want.f.push(FSYN[k]);r=r.replace(k,' ')}}
  r.split(/[^a-z0-9']+/).filter(Boolean).forEach(w=>{if(SYN[w])want.t.push(SYN[w]);else if(!['and','with','a','the','games','game','slots','slot','over','max','win','something','x','me','show','high','very','low','medium'].includes(w))want.txt.push(w)});
  let pool=G.map(g=>{
    let score=0,hits=[],ok=true;
    want.t.forEach(t=>{if(g.t.includes(t)){score+=2;hits.push(t)}else ok=false});
    want.f.forEach(f=>{if(g.f.includes(f)){score+=2;hits.push(f)}else ok=false});
    if(want.v){const okv=want.v==='High'?['High','Very high']:want.v==='Medium'?['Medium','Medium-high']:[want.v];if(okv.includes(g.v)){score+=1.5;hits.push(g.v+' volatility')}else ok=false}
    if(want.min){if(g.m>=want.min){score+=1;hits.push(fmt(g.m))}else ok=false}
    want.txt.forEach(w=>{const inN=g.n.toLowerCase().includes(w),inS=g.s.toLowerCase().includes(w);if(inN||inS){score+=3;hits.push(inS?g.s:'Name match')}else ok=false});
    if(want.like){score+=sim(byName[want.like],g)*3}
    return {g,score,hits,ok:ok&&(want.like?g.n!==want.like:true)};
  }).filter(x=>x.ok&&(x.score>0)).sort((a,b)=>b.score-a.score||b.g.m-a.g.m);
  if(want.like&&!want.t.length&&!want.f.length&&!want.v&&!want.min)pool=pool.slice(0,12);
  return {want,res:pool};
}
const SUG=['Egyptian, high volatility','Megaways','Hold and win jackpots','Max win over 20,000x','Christmas','Something like Pirots 3','Bonus buy, very high volatility','Pragmatic Play'];
$('#sug').innerHTML=SUG.map(s=>`<button data-s="${esc(s)}">${esc(s)}</button>`).join('');
$('#sug').addEventListener('click',e=>{const b=e.target.closest('button');if(b){$('#q').value=b.dataset.s;runSearch()}});
function runSearch(){
  const q=$('#q').value, out=search(q);
  if(!out){$('#sum').innerHTML=`<b>${G.length}</b> games from your lobby with GameDNA records in this preview. Search by theme, feature, volatility, max win, studio or a game you like.`;$('#results').innerHTML='';return}
  const {res}=out;
  $('#sum').innerHTML=res.length?`<b>${res.length}</b> ${res.length===1?'game':'games'} in your lobby match`:'';
  $('#results').innerHTML=res.length?res.slice(0,40).map(({g,hits})=>{const h=heroByName[g.n];
    return `<button class="res" ${h?`data-game="${h.id}"`:`data-dna="${esc(g.n)}"`}><div class="sq" style="--sw:${g.c||'#3a2a5a'}">${artOf(g.n)?`<img src="${artOf(g.n)}" alt="">`:''}</div><div class="tx"><div class="nm">${esc(g.n)}</div><div class="st">${esc(g.s)}, ${g.v} volatility, up to ${fmt(g.m)}</div><div class="tg">${[...new Set(hits)].slice(0,3).map(t=>`<span class="hit">${esc(t)}</span>`).join('')}</div></div></button>`}).join('')
    :`<div class="empty">No games in this preview match all of that. Try fewer words, or a theme like ‘pirates’ or a feature like ‘Megaways’.</div>`;
}
$('#q').addEventListener('input',runSearch);
function openSearch(q){pauseHeroes();$('#q').value=q||'';runSearch();open('#searchSheet');if(!q)setTimeout(()=>$('#q').focus(),320)}

// ---------- Explore feed ----------
function renderXp(){
  $('#xp').innerHTML=heroesRanked().map(h=>`<div class="card" data-i="${h.id}"><span class="head">Explore</span><video data-src="${URL_['ex_'+h.id]}" poster="${URL_['ex_'+h.id+'_p']}" muted loop playsinline preload="none"></video>
 <span class="hint">Swipe up</span>
 <div class="foot"><div class="who"><img src="${URL_['tile_'+h.id]}" alt=""><div><b>${esc(h.n)}</b><small>${h.v} volatility, up to ${fmt(h.m)}</small></div></div>
 <div class="acts"><button class="ghost fav" aria-label="Save to favourites"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button><button class="play">Play now</button><button class="ghost" data-game="${h.id}" aria-label="Game details"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg></button></div></div></div>`).join('');
  xio.disconnect(); $$('#xp .card').forEach(c=>xio.observe(c));
}
const xio=new IntersectionObserver(es=>es.forEach(en=>{const v=en.target.querySelector('video');
  if(en.isIntersecting){if(!v.src)v.src=v.dataset.src;if(!reduce)v.play().catch(()=>{})}else v.pause()}),{root:$('#xp'),threshold:.7});
renderXp();
function openExplore(i){pauseHeroes();open('#exploreSheet');const cs=$$('#xp .card');const c=typeof i==='string'?(cs.find(x=>x.dataset.i===i)||cs[0]):cs[Math.max(0,i)];$('#xp').scrollTop=c.offsetTop}
// From the explore feed, the info button opens the game page on top
$('#xp').addEventListener('click',e=>{const g=e.target.closest('[data-game]');if(g){e.stopPropagation();$('#exploreSheet').classList.remove('open');$$('#xp video').forEach(v=>v.pause());openGame(g.dataset.game)}},true);

function align(){const r=$('#app').getBoundingClientRect();document.documentElement.style.setProperty('--dx',(r.left+r.width/2-innerWidth/2)+'px')}
addEventListener('resize',align);align();

// ================= DESKTOP =================
const TPLOGO=document.querySelector('#tpstrip img').src, MASCOT=document.querySelector('.intro .mascot').src;
const studios=Object.entries(G.reduce((m,g)=>(m[g.s]=(m[g.s]||0)+1,m),{})).filter(([s])=>s&&s!=='N/A').sort((a,b)=>b[1]-a[1]).slice(0,8);
const initials=n=>n.replace(/[^A-Za-z' ]/g,'').split(/\s+/).filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase();
function wcardHTML(g,hits){
  const h=heroByName[g.n];
  const tags=[...new Set(hits&&hits.length?hits:[g.v+' volatility'])].slice(0,4);
  return `<button class="wcard" ${h?`data-game="${h.id}"`:`data-dna="${esc(g.n)}"`} style="--sw:${g.c||'#3a2a5a'}"><div class="wa">${h?`<img src="${HDP(h.id)}" alt="" loading="lazy">`:ARTN[g.n]?`<img src="${URL_[ARTN[g.n]]}" alt="" loading="lazy">`:`<span class="big">${esc(g.n)}</span>`}<b>${fmt(g.m)}</b></div><div class="wb">${h||ARTN[g.n]?`<div class="nm">${esc(g.n)}</div>`:''}<div class="st">${esc(g.s)}, ${g.v} volatility</div><div class="tg">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div></button>`;
}
function pcardHTML(h){
  return `<button class="pcard" data-game="${h.id}" data-pc="${h.id}">${portrait(h)}<div class="pc-meta"><b>${esc(h.n)}</b><small>${esc(h.s||'Studio being verified')}</small><div class="pc-x"><div class="f"><span>${h.v} volatility</span><span>Up to ${fmt(h.m)}</span></div><span class="go">Game page</span></div></div></button>`;
}
function band(key,title,blurb,list,hitsFn,featured,q){
  return `<section class="band" style="--key:${key}"><div class="dw"><div class="bl"><h3>${title}</h3><p>${blurb}</p><div class="cnt">${list.length} games in this preview</div><div class="acts">${featured?`<button class="p" data-game="${featured}">Watch the trailer</button>`:''}<button data-showall="${esc(q)}">Show all (${list.length})</button></div></div><div class="lane">${list.slice(0,12).map(g=>wcardHTML(g,hitsFn(g))).join('')}</div></div></section>`;
}
function dRow(title,sub,cards,pw,why,id){
  return `<section class="d-row"${id?` id="${id}"`:''}><div class="dw"><div class="row-h"><div><h4>${title}</h4><p>${sub}</p></div>${why?`<span class="why">${why}</span>`:''}</div><div class="lane">${cards}</div>${pw?`<div class="pw"><b>Live</b><span>${pw}</span></div>`:''}</div></section>`;
}
function renderDesk(){
  const P3=byName['Pirots 3'];
  const anc=ANC, HO=heroesRanked();
  const bandA=band('#c3623b','Ancient worlds','Gods, pharaohs and emperors, gathered by theme from GameDNA.',P?byScore(ancient):ancient,g=>g.t.filter(t=>anc.includes(t)),'gates','ancient');
  const bandB=band('#512a0f','Max win 20,000x and up','The biggest ceilings in your lobby, sorted straight from the record.',P?byScore(big):big,g=>[g.v+' volatility'],'duck','max win over 20,000x');
  const bands=P&&affinity(big)>affinity(ancient)?[bandB,bandA]:[bandA,bandB];
  let forRows, styleRows=['',''];
  if(!P){
    forRows=dRow('Because you played Pirots 3','Picked by GameDNA, not by provider',recs.map(g=>wcardHTML(g,[...g.t.filter(t=>P3.t.includes(t)),...g.f.filter(f=>P3.f.includes(f))])).join(''),'Recommendations compare themes, features and volatility across every record, so a player gets more of what they actually liked.','For you');
  } else {
    const picked=new Set(P.picks), top=byName[P.picks[0]], fy=byScore(G).filter(g=>!picked.has(g.n)).slice(0,10), seen=new Set(fy.map(g=>g.n));
    forRows=dRow('Picked for you',(P.sample?'Matched to a sample player: ':'Matched to your answers: ')+esc(profileLine().replace(/^From /,'')),fy.map(g=>wcardHTML(g,hitsFor(g))).join(''),'Every row in this lobby is reordered from the player\'s answers, matched against each game\'s GameDNA record.','For you')
      + dRow('Because you picked '+esc(top.n),'Picked by GameDNA, not by provider',similar(top.n,16).filter(g=>!fy.slice(0,5).includes(g)).slice(0,10).map(g=>wcardHTML(g,[...g.t.filter(t=>top.t.includes(t)),...g.f.filter(f=>top.f.includes(f))])).join(''));
    styleRows=STYLES.filter(x=>P.styles.includes(x.k)).slice(0,2).map(x=>{const l=byScore(G.filter(g=>x.f.some(f=>g.f.includes(f))&&!picked.has(g.n)&&!seen.has(g.n)));return l.length>=3?dRow(x.row,'Because you chose '+x.l,l.slice(0,12).map(g=>wcardHTML(g,hitsFor(g))).join(''),null,'For you'):''});
    while(styleRows.length<2)styleRows.push('');
  }
  $('#desk').innerHTML=`
  <section class="d-intro"><div class="dw"><div>
    <h1>We looked at your lobby. Matched it to our data. <span>Then upgraded it.</span></h1>
    <p>4,033 slots in Spina Zonke. Around 2,000 already in GameDNA. Here's what they look like on Turbo Pickle.</p>
    <a class="btn-tp" href="#dlobby">Step inside</a></div>
    <img class="mascot" src="${MASCOT}" alt=""></div></section>
  <div id="dlobby">
  <header class="d-bar"><div class="dw">
    <span class="logo-slot">Hollywoodbets logo</span>
    <nav class="d-nav"><button class="on">Spina Zonke</button><button data-dnav="explore">Explore</button><button data-dnav="studios">Studios</button><button data-dnav="search">Search</button></nav>
    <span class="sp"></span>
    ${P?`<button class="d-tune on" data-tune><i></i>${P.sample?'Sample player · Make it yours':'Tuned to you · Retune'}</button>`:`<button class="d-tune" data-tune>Make this lobby yours</button>`}
    <button class="d-search" data-open="search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="typed" id="dtyped"></span><span class="caret"></span></button>
  </div></header>
  <section class="d-hero" id="dhero">
    <div class="hv"><video id="dHeroVid" muted playsinline preload="auto"></video></div>
    <div class="d-dots" id="ddots">${HERO_ORDER.map((id,i)=>`<button aria-label="Show ${esc(heroBy[id].n)}" data-dh="${i}"></button>`).join('')}</div>
    <div class="d-info"><div class="dw"><div class="card">
      <span class="badge" id="dBadge"></span><h2 id="dName"></h2><div class="studio" id="dStudio"></div><div class="hook" id="dHook"></div><p class="copy" id="dCopy"></p>
      <div class="btns"><button class="play">Play</button><button class="more" id="dMore">Game page</button></div>
    </div></div></div>
  </section>
  <section class="d-spot"><div class="dw">
    <div class="row-h"><div><h4>Spina Zonke picks</h4><p>${P?'Based on your picks':'Hover to preview, click for the full game page'}</p></div></div>
    <div class="lane">${HO.map(pcardHTML).join('')}</div>
    <div class="pw"><b>Live</b><span>Trailers are a blend of studio footage and gameplay we capture ourselves, cut and sized for every placement. Tiles are produced from each game's art in the style you set.</span></div>
  </div></section>
  ${forRows}
  ${bands[0]}
  ${styleRows[0]}
  <section class="d-row" id="dexplore"><div class="dw">
    <div class="row-h"><div><h4>Explore</h4><p>Hover to play, click to open the feed</p></div></div>
    <div class="lane xstrip">${HO.map(xcardHTML).join('')}</div>
    <div class="pw"><b>Live</b><span>Vertical clips cut per game, ready for an Explore feed or social.</span></div>
  </div></section>
  <section class="d-row" id="dstudios"><div class="dw">
    <div class="row-h"><div><h4>Studio channels</h4><p>Follow a studio and its new games come to you</p></div></div>
    <div class="studios">${studios.map(([n,c])=>`<button class="sch" data-showall="${esc(n)}"><span class="mono">${initials(n)}</span><span class="tx"><b>${esc(n)}</b><small>${c} games in this preview</small></span><span class="follow" data-follow role="button">Follow</span></button>`).join('')}</div>
  </div></section>
  ${styleRows[1]}
  ${bands[1]}
  <section class="d-close"><div class="dw"><div>
    <h2>Fancy a proper look?</h2>
    <p>Every game in this preview is already in your lobby, and we already hold GameDNA for most of them.</p>
    <a href="mailto:Rahoul@wearewildcards.ai?subject=Hollywoodbets%20on%20tap">Rahoul@wearewildcards.ai</a>
    <div><button class="restart" data-restart>Start the preview over</button></div>
    <p class="fine">Game names, artwork and footage belong to their studios and are shown here only as a private preview. Game data comes from Turbo Pickle GameDNA records.</p>
  </div><img src="${MASCOT}" alt=""></div></section>
  </div>`;
}
renderDesk();

// desktop hero
let dhi=0;
function showDHero(i){
  dhi=(i+HERO_ORDER.length)%HERO_ORDER.length; const h=heroBy[HERO_ORDER[dhi]], v=$('#dHeroVid');
  v.poster=HDP(h.id); v.src=HD(h.id); if(!reduce&&isDesk()&&!openSheet)v.play().catch(()=>{});
  $('#dName').textContent=h.n; $('#dStudio').textContent=h.s||'Studio being verified'; $('#dHook').textContent=HOOK[h.id]; $('#dCopy').textContent=h.copy; $('#dBadge').textContent=badgeOf(h.id);
  $('#dMore').dataset.game=h.id; $$('#ddots button').forEach((d,j)=>d.classList.toggle('on',j===dhi));
}
document.addEventListener('ended',e=>{if(e.target.id==='dHeroVid')showDHero(dhi+1)},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-dh]');if(b)showDHero(+b.dataset.dh)});
showDHero(0);
setInterval(()=>{if(reduce&&isDesk()&&!openSheet)showDHero(dhi+1)},7000);
// hero splits once you start scrolling
addEventListener('scroll',()=>{if(!isDesk())return;const y=scrollY,hero=$('#dhero');const top=hero.getBoundingClientRect().top;
  hero.classList.toggle('split', top < 100)},{passive:true});

// hover-to-expand: one card at a time, short delay so it feels deliberate
let hoverT=null, liveCard=null;
function collapse(){if(liveCard){liveCard.classList.remove('exp');const v=liveCard.querySelector('video');if(v)v.pause();liveCard=null}}
function expand(c){if(liveCard===c)return;collapse();liveCard=c;c.classList.add('exp');if(reduce)return;
  let v=c.querySelector('video');if(!v){v=document.createElement('video');v.muted=true;v.loop=true;v.playsInline=true;v.src=HD(c.dataset.pc);c.insertBefore(v,c.querySelector('.pc-meta'))}v.play().catch(()=>{})}
$('#desk').addEventListener('mouseover',e=>{const c=e.target.closest('.pcard');if(!c)return;clearTimeout(hoverT);hoverT=setTimeout(()=>expand(c),260)});
$('#desk').addEventListener('mouseout',e=>{const c=e.target.closest('.pcard');if(c&&!c.contains(e.relatedTarget)){clearTimeout(hoverT);if(liveCard===c)collapse()}});
$('#desk').addEventListener('focusin',e=>{const c=e.target.closest('.pcard');if(c)expand(c)});
$('#desk').addEventListener('focusout',e=>{const c=e.target.closest('.pcard');if(c)collapse()});

// typed prompt on desktop search
(function(){if(reduce){$('#dtyped').textContent=PROMPTS[0];return}let p=0,c=0,del=false;
 (function tick(){const s=PROMPTS[p],el=$('#dtyped');if(el)el.textContent=s.slice(0,c);if(!del&&c<s.length){c++;setTimeout(tick,55)}else if(!del){del=true;setTimeout(tick,1600)}else if(c>0){c--;setTimeout(tick,22)}else{del=false;p=(p+1)%PROMPTS.length;setTimeout(tick,300)}})()})();

// desktop clicks: nav, show all, follow
document.addEventListener('click',e=>{
  const f=e.target.closest('[data-follow]');if(f){e.stopPropagation();e.preventDefault();f.classList.toggle('on');f.textContent=f.classList.contains('on')?'Following':(f.closest('.sch')?'Follow':'Follow studio');return}
  const sa=e.target.closest('[data-showall]');if(sa){openSearch(sa.dataset.showall);return}
  const n=e.target.closest('[data-dnav]');if(n){const t=n.dataset.dnav;if(t==='search')openSearch('');else $('#d'+t).scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});return}
  const x=e.target.closest('[data-xnav]');if(x){const xp=$('#xp');xp.scrollBy({top:xp.clientHeight*+x.dataset.xnav,behavior:reduce?'auto':'smooth'})}
},true);

// shared video control
function pauseHeroes(){$('#heroVid').pause();$('#dHeroVid').pause();collapse()}
function resumeHero(){if(reduce)return;(isDesk()?$('#dHeroVid'):$('#heroVid')).play().catch(()=>{})}

// layout toggle
function setLayout(l,keep){
  const ratio=keep?scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight):0;
  if(openSheet)closeAll();
  document.body.dataset.layout=l;
  $$('[data-layout-btn]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.layoutBtn===l));
  pauseHeroes(); resumeHero(); align();
  if(keep)requestAnimationFrame(()=>scrollTo(0,ratio*(document.documentElement.scrollHeight-innerHeight)));
}
$$('[data-layout-btn]').forEach(b=>b.addEventListener('click',()=>setLayout(b.dataset.layoutBtn,true)));
const wide=matchMedia('(min-width:1024px)');
setLayout(wide.matches?'desktop':'mobile');
wide.addEventListener('change',m=>{if(!m.matches)setLayout('mobile')});


// ---------- Explore strip: hover to play (desktop) ----------
let xhT=null;
$('#desk').addEventListener('mouseover',e=>{const c=e.target.closest('.xcard');if(!c||c.classList.contains('live'))return;clearTimeout(xhT);xhT=setTimeout(()=>{$$('#desk .xcard.live').forEach(o=>o!==c&&xplay(o,false));xplay(c,true)},160)});
$('#desk').addEventListener('mouseout',e=>{const c=e.target.closest('.xcard');if(c&&!c.contains(e.relatedTarget)){clearTimeout(xhT);xplay(c,false)}});
$('#desk').addEventListener('focusin',e=>{const c=e.target.closest('.xcard');if(c)xplay(c,true)});
$('#desk').addEventListener('focusout',e=>{const c=e.target.closest('.xcard');if(c)xplay(c,false)});

// ---------- Theme taster (v2) ----------
// Slot DNA headline: a few written patterns, avoiding generic themes
const GENT=/^(Animals|Adventure|Fantasy|Money|Gold|Treasure|Coins|Nature|Jewels|Bell|Fire|Luxury|Retro|Mystery|Magic|Food|American|Party)$/;
const SING={Pirates:'Pirate',Animals:'Animal',Birds:'Bird',Jewels:'Jewel',Coins:'Coin',Cars:'Car',Dragons:'Dragon'};
const STYLE_NOUN={classic:'classic reels',megaways:'Megaways',hold:'hold and win',cascade:'cascades',cluster:'cluster pays',bonus:'bonus picks'};
function dnaHeadline(d,p){
  const lc=s=>s?(/^Megaways/.test(s)?s:s.charAt(0).toLowerCase()+s.slice(1)):'';
  const th=(d.themes.find(([t])=>!GENT.test(t))||[])[0];
  const theme=th?(SING[th]||th):null;
  const style=STYLES.find(x=>(p.styles||[]).includes(x.k));
  const feat=d.feats.find(f=>!style||f!==style.l)||null;
  if(theme&&style)return `<em>${esc(theme)}</em> worlds, ${esc(STYLE_NOUN[style.k])} at heart`;
  if(theme&&feat)return `<em>${esc(theme)}</em> worlds with ${esc(lc(feat))}`;
  if(style&&feat)return `<em>${esc(style.l)}</em> fan, here for the ${esc(lc(feat))}`;
  if(theme)return `Drawn to <em>${esc(theme)}</em> worlds`;
  if(feat)return `Here for the <em>${esc(lc(feat))}</em>`;
  return `A taste <em>all your own</em>`;
}

const SFCLIP={'777 Strike':'strike','Alien Invaders':'alien','Oink Oink Oink':'oink','Sweet Bonanza':'sweet'};
const clipOf=n=>{const h=heroByName[n];if(h)return{v:URL_['ex_'+h.id],p:URL_['ex_'+h.id+'_p']};const k=SFCLIP[n];return k?{v:URL_['sfx_'+k],p:URL_['sfp_'+k]}:null};
const CLIPN=[...H.map(h=>h.n),...Object.keys(SFCLIP)];
const STYLE_ART={classic:'777 Strike',megaways:"Gonzo's Quest Megaways",hold:"Big Size Fishin'",cascade:'Sweet Bonanza',cluster:'Pirots 3',bonus:'Gates of Olympus 2500'};
const styleClip=k=>{const n=STYLE_ART[k],h=heroByName[n];if(h)return TR(h.id);const c=SFCLIP[n];return c?URL_['sfx_'+c]:''};
const T={step:0,styles:[],picks:[],keeps:[],loves:[],skips:[],grid:[],pulled:{},fresh:new Set(),deck:[],di:0};
const tmpP=()=>({styles:T.styles,picks:T.picks,keeps:T.keeps,loves:T.loves,skips:T.skips});
const MAXP=5;
const ini2=n=>n.replace(/[^A-Za-z0-9' ]/g,' ').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const colOf=n=>(byName[n]&&byName[n].c)||'#5C2D91';
const TZPW='<div class="pw"><b>Concept</b><span>Each answer is read against the GameDNA records for the games already in your lobby, and the lobby reorders itself around the player.</span></div>';
const tick='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';
const DNAIC='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 3c0 6 10 6 10 12s-10 3-10 6M17 3c0 6-10 6-10 12s10 3 10 6M8.5 7h7M8.5 17h7"/></svg>';
function setWash(c){if(c)$('#taster').style.setProperty('--wash',c)}

// small celebratory burst on select
function burst(el,c){
  if(reduce||!el)return; const r=el.getBoundingClientRect(), b=document.createElement('div');
  b.className='bst'; b.style.left=(r.left+r.width/2)+'px'; b.style.top=(r.top+r.height/2)+'px';
  const cols=['#FFC629','#7F68EB','#fff',c||'#FFC629'];
  b.innerHTML=Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2, d=34+Math.random()*30;return `<i style="--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d}px;--c:${cols[i%4]}"></i>`}).join('');
  document.body.appendChild(b); setTimeout(()=>b.remove(),700);
}
function animateNum(el,to){
  if(!el)return; const from=+el.dataset.v||0; el.dataset.v=to;
  if(reduce||from===to){el.textContent=to;return}
  const t0=performance.now(), d=520; (function f(t){const k=Math.min(1,(t-t0)/d);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)})(t0);
}

// ---------- live taste panel ----------
function tasteData(p){
  p=p||tmpP(); const pos=posList(p);
  if(!pos.length&&!p.styles.length)return null;
  const tc={},fc={};
  STYLES.filter(x=>p.styles.includes(x.k)).forEach(x=>fc[x.l]=(fc[x.l]||0)+1.5);
  pos.forEach(([n,w])=>{byName[n].t.filter(t=>!/^(Adventure|Branded|TV show)$/.test(t)).forEach(t=>tc[t]=(tc[t]||0)+w);byName[n].f.forEach(f=>{const k=f==='Cascades'?'Cascades':f;fc[k]=(fc[k]||0)+w})});
  const themes=Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const feats=Object.entries(fc).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);
  const own=new Set(pos.map(x=>x[0]));
  const sc=G.filter(g=>!own.has(g.n)).map(g=>[score(g,p),g]).sort((a,b)=>b[0]-a[0]);
  const top=sc[0][0]; const matched=sc.filter(x=>x[0]>=top*0.8&&x[0]>0).length;
  return {themes,feats,matched,lead:sc.slice(0,3).map(x=>x[1]),maxT:themes.length?themes[0][1]:1};
}
function discHTML(n,cls){const a=artOf(n);return `<span class="disc ${cls||''}" style="--c:${colOf(n)}">${a?`<img src="${a}" alt="">`:`<em>${ini2(n)}</em>`}</span>`}
function renderTaste(){
  const d=tasteData(), a=$('#tzAside'), bar=$('#tzBar');
  if(!d){
    a.innerHTML=`<div class="ta"><div class="ta-h">${DNAIC}<b>Your taste so far</b></div><p class="ta-empty">Pick a style or a game and watch this fill in. Every answer is matched against ${G.length} games from your lobby.</p></div>`;
    bar.innerHTML=`${DNAIC}<span>Your taste builds here as you answer</span>`; return;
  }
  a.innerHTML=`<div class="ta"><div class="ta-h">${DNAIC}<b>Your taste so far</b></div>
    <div class="ta-count"><b data-v="${a.querySelector('.ta-count b')?.dataset.v||0}">0</b><span>games in your lobby<br>match strongly</span></div>
    ${d.themes.length?`<div class="ta-sec"><small>Worlds you're drawn to</small>${d.themes.map(([t,v])=>`<div class="ta-bar"><span>${esc(t)}</span><i style="--w:${Math.round(v/d.maxT*100)}%"></i></div>`).join('')}</div>`:''}
    <div class="ta-sec"><small>How you like it to play</small><div class="ta-chips">${d.feats.map(f=>`<span>${esc(f)}</span>`).join('')}</div></div>
    <div class="ta-sec"><small>Leading matches</small>${d.lead.map(g=>`<div class="ta-lead">${discHTML(g.n)}<span><b>${esc(g.n)}</b><em>${esc(g.s)}</em></span></div>`).join('')}</div>
    <p class="ta-foot">Read from the GameDNA themes and features of each game you choose.</p></div>`;
  animateNum(a.querySelector('.ta-count b'),d.matched);
  const prev=bar.querySelector('b')?.dataset.v||0;
  bar.innerHTML=`${DNAIC}<b data-v="${prev}">0</b><span>strong matches${d.themes.length?' · '+d.themes.slice(0,2).map(x=>esc(x[0])).join(' · '):''}${d.feats.length?' · '+esc(d.feats[0]):''}</span>`;
  animateNum(bar.querySelector('b'),d.matched);
}

// ---------- intro mosaic ----------
function fillMosaic(){
  const m=$('#tzMosaic'); if(m.childElementCount)return;
  const arts=TASTE.map(artOf).filter(Boolean), cols=5;
  m.innerHTML=Array.from({length:cols},(_,c)=>{const list=arts.filter((_,i)=>i%cols===c).concat(arts.filter((_,i)=>(i+2)%cols===c)).slice(0,5);
    return `<div class="col ${c%2?'up':'dn'}" style="animation-duration:${38+c*7}s">${[...list,...list].map(s=>`<img src="${s}" alt="">`).join('')}</div>`}).join('');
}

// ---------- steps ----------
function footer(state,label,disabled,back,tray){
  $('#tzFoot').hidden=false; $('[data-tz="back"]').hidden=!back; $('[data-tz="skip"]').hidden=false;
  $('#tzState').innerHTML=state; const nx=$('#tzNext'); nx.textContent=label; nx.disabled=!!disabled;
  $('#tzTray').innerHTML=tray?T.picks.slice(0,4).map(n=>`<i style="--c:${colOf(n)};${artOf(n)?`background-image:url('${artOf(n)}')`:''}"></i>`).join('')+(T.picks.length>4?`<i class="more">+${T.picks.length-4}</i>`:''):'';
}
function prog(){$$('#tzProg .s').forEach((d,j)=>{d.className='s'+(j===T.step?' on':j<T.step?' done':'')})}
function styleCardHTML(x){
  const n=STYLE_ART[x.k], on=T.styles.includes(x.k), cnt=G.filter(g=>x.f.some(f=>g.f.includes(f))).length;
  return `<button class="st-card" data-style="${x.k}" data-clip="${styleClip(x.k)}" aria-pressed="${on}" style="--c:${colOf(n)}">
    <img src="${artOf(n)}" alt=""><span class="cnt">${cnt} in this preview</span><span class="ck">${tick}</span>
    <span class="tx"><b>${x.l}</b><span>${x.d}</span><em>Like ${esc(n)}</em></span></button>`;
}
function renderStyles(){
  $('#tzBody').innerHTML=`<div class="tz-eb">1 of 3 · Style</div><h2>What kind of slot <em>hooks you?</em></h2><p class="lede">Pick as many as you like. Each one reshapes the lobby you're about to see.</p>${TZPW}
  <div class="st-grid">${STYLES.map(styleCardHTML).join('')}</div>`;
  footStyles();
}
function footStyles(){footer(T.styles.length?`<b>${T.styles.length}</b> picked`:'Pick any, or none','Continue',false,false,false)}

function buildGrid(){
  const want=x=>STYLES.some(s=>T.styles.includes(s.k)&&s.f.some(f=>byName[x].f.includes(f)))?0:1;
  const base=TASTE.slice().sort((a,b)=>want(a)-want(b));
  const keep=T.grid.filter(n=>T.picks.includes(n)&&!base.includes(n));
  T.grid=[...base,...keep];
}
function pickTileHTML(n){
  const on=T.picks.includes(n), src=T.pulled[n], g=byName[n];
  return `<button class="pk${T.fresh.has(n)?' new':''}" data-pick="${esc(n)}" aria-pressed="${on}" style="--c:${colOf(n)}">
    <span class="cw">${discHTML(n,'ci')}<span class="ck">${tick}</span></span><b>${esc(n)}</b>${src?`<small class="like">Plays like ${esc(src)}</small>`:`<small>${esc(g.s)}</small>`}</button>`;
}
function renderPicks(){
  $('#tzBody').innerHTML=`<div class="tz-eb">2 of 3 · Games</div><h2>Which of these <em>would you play?</em></h2><p class="lede">Tap one to five. Each tap pulls in games that play like it, straight from GameDNA.</p>
  <div class="pk-grid${T.picks.length>=MAXP?' full':''}" id="pkGrid">${T.grid.map(pickTileHTML).join('')}</div>`;
  T.fresh.clear(); footPicks();
}
function footPicks(){footer(T.picks.length?`<b>${T.picks.length}</b> of ${MAXP}`:'Pick at least one','Continue',!T.picks.length,true,true)}
function togglePick(n,el){
  if(T.picks.includes(n)){T.picks=T.picks.filter(x=>x!==n)}
  else{
    if(T.picks.length>=MAXP){toast('Up to five. Tap one to swap it out.');return}
    T.picks=[...T.picks,n]; burst(el.querySelector('.ci'),colOf(n)); setWash(colOf(n));
    const inGrid=new Set(T.grid);
    const nb=G.filter(g=>!inGrid.has(g.n)).map(g=>[sim(byName[n],g),g.n]).sort((a,b)=>b[0]-a[0]).slice(0,T.grid.length<27?2:0).map(x=>x[1]);
    if(nb.length){const at=T.grid.indexOf(n)+1;T.grid.splice(at,0,...nb);nb.forEach(x=>{T.pulled[x]=n;T.fresh.add(x)})}
  }
  const y=$('#tzBody').scrollTop;
  $('#pkGrid').innerHTML=T.grid.map(pickTileHTML).join(''); $('#pkGrid').classList.toggle('full',T.picks.length>=MAXP);
  T.fresh.clear(); $('#tzBody').scrollTop=y; footPicks(); renderTaste();
}

// ---------- swipe round ----------
function buildDeck(){
  const p=tmpP(), ex=new Set(p.picks);
  const c=CLIPN.filter(n=>!ex.has(n)).map(n=>[score(byName[n],p),n]).sort((a,b)=>b[0]-a[0]).map(x=>x[1]);
  const top=c.slice(0,4), low=c.slice(4).slice(-2);
  T.deck=[top[0],top[1],low[1],top[2],top[3],low[0]].filter(Boolean); T.di=0; T.keeps=[]; T.loves=[]; T.skips=[];
}
function renderSwipe(){
  $('#tzBody').innerHTML=`<div class="tz-eb">3 of 3 · React</div><h2>Would you <em>play it?</em></h2><p class="lede sw-lede">${isDesk()?"Drag right to keep, left to skip, up if you'd love it. Arrow keys work too.":"Swipe right to keep, left to skip, up to love it."}</p>
  <div class="sw"><div class="sw-deck" id="swDeck"></div>
  <div class="sw-acts"><button data-sw="skip" aria-label="Not for me"><span>✕</span><small>Not for me</small></button><button data-sw="love" class="love" aria-label="Love it"><span>♥</span><small>Love it</small></button><button data-sw="keep" class="keep" aria-label="I'd play it"><span>✓</span><small>I'd play it</small></button></div>
  <div class="sw-dots" id="swDots"></div></div>`;
  renderDeck();
}
function footSwipe(){const n=T.keeps.length+T.loves.length+T.skips.length;footer(`<b>${n}</b> of ${T.deck.length} rated`,'See my Slot DNA',n<2,true,false)}
function swCardHTML(n){
  const c=clipOf(n), g=byName[n], tags=[...new Set([...g.t.slice(0,1),...g.f.slice(0,2)])];
  return `<div class="sw-card" data-n="${esc(n)}"><img class="ps" src="${c.p}" alt="" draggable="false"><video muted loop playsinline preload="auto" src="${c.v}"></video>
    <span class="stamp keep">PLAY IT</span><span class="stamp skip">NOPE</span><span class="stamp love">LOVE IT</span>
    <div class="sw-info"><b>${esc(n)}</b><span>${esc(g.s)}</span><div class="tg">${tags.map(t=>`<em>${esc(t)}</em>`).join('')}</div></div></div>`;
}
function renderDeck(){
  const d=$('#swDeck'); if(!d)return;
  $('#swDots').innerHTML=T.deck.map((n,i)=>{const k=T.loves.includes(n)?'love':T.keeps.includes(n)?'keep':T.skips.includes(n)?'skip':i===T.di?'cur':'';return `<i class="${k}"></i>`}).join('');
  footSwipe();
  if(T.di>=T.deck.length){d.innerHTML=`<div class="sw-done">${tick}<b>That's plenty.</b><span>Reading your Slot DNA…</span></div>`;setTimeout(()=>{if(T.step===2&&$('#taster').classList.contains('open'))buildLobby()},reduce?0:650);return}
  d.innerHTML=T.deck.slice(T.di,T.di+2).reverse().map(swCardHTML).join('');
  const cards=d.querySelectorAll('.sw-card'); if(cards.length>1)cards[0].classList.add('behind');
  const top=d.lastElementChild, v=top.querySelector('video');
  setWash(colOf(top.dataset.n));
  if(!reduce)v.play().then(()=>top.classList.add('live')).catch(()=>{});
  bindDrag(top);
}
function bindDrag(card){
  let sx=0,sy=0,dx=0,dy=0,drag=false;
  const st={keep:card.querySelector('.stamp.keep'),skip:card.querySelector('.stamp.skip'),love:card.querySelector('.stamp.love')};
  const set=()=>{card.style.transition='none';card.style.transform=`translate(${dx}px,${dy}px) rotate(${dx/18}deg)`;
    st.keep.style.opacity=Math.max(0,Math.min(1,dx/90));st.skip.style.opacity=Math.max(0,Math.min(1,-dx/90));st.love.style.opacity=Math.max(0,Math.min(1,-dy/110))*(Math.abs(dx)<60?1:0)};
  card.addEventListener('pointerdown',e=>{drag=true;sx=e.clientX;sy=e.clientY;card.setPointerCapture(e.pointerId)});
  card.addEventListener('pointermove',e=>{if(!drag)return;dx=e.clientX-sx;dy=Math.min(0,e.clientY-sy);set()});
  const end=()=>{if(!drag)return;drag=false;
    if(dx>90)fling('keep');else if(dx<-90)fling('skip');else if(dy<-110)fling('love');
    else{card.style.transition='transform .3s cubic-bezier(.2,.8,.2,1)';card.style.transform='';Object.values(st).forEach(s=>s.style.opacity=0)}};
  card.addEventListener('pointerup',end);card.addEventListener('pointercancel',end);
}
function fling(act){
  const d=$('#swDeck'), card=d&&d.lastElementChild; if(!card||!card.classList.contains('sw-card'))return;
  const n=card.dataset.n; ({keep:T.keeps,love:T.loves,skip:T.skips})[act].push(n);
  card.querySelector('.stamp.'+act).style.opacity=1;
  const tx=act==='keep'?520:act==='skip'?-520:0, ty=act==='love'?-760:40;
  card.style.transition='transform .38s cubic-bezier(.3,.7,.2,1),opacity .38s';card.style.transform=`translate(${tx}px,${ty}px) rotate(${tx/14}deg)`;card.style.opacity=0;
  if(act!=='skip'){burst(card,colOf(n))}
  card.querySelector('video').pause();
  setTimeout(()=>{T.di++;renderDeck();renderTaste()},reduce?0:300);
}

function renderTaster(){
  prog(); $('#tzIntro').classList.toggle('mini',T.step>0);
  $('#tzBody').scrollTop=0;
  if(T.step===0)renderStyles(); else if(T.step===1){buildGrid();renderPicks()} else {buildDeck();renderSwipe()}
  renderTaste(); syncStyleClips();
}
// style cards: one clip at a time (hover on desktop, last selected on touch)
let stLive=null;
function playStyle(card){
  if(stLive&&stLive!==card){const v=stLive.querySelector('video');if(v)v.pause();stLive.classList.remove('live')}
  stLive=card; if(!card||reduce||!card.dataset.clip)return;
  let v=card.querySelector('video'); if(!v){v=document.createElement('video');v.muted=true;v.loop=true;v.playsInline=true;v.src=card.dataset.clip;card.insertBefore(v,card.querySelector('.cnt'))}
  v.play().then(()=>card.classList.add('live')).catch(()=>{});
}
function syncStyleClips(){stLive=null}
$('#tzBody').addEventListener('mouseover',e=>{const c=e.target.closest('.st-card');if(c&&c!==stLive)playStyle(c)});
$('#tzBody').addEventListener('mouseleave',()=>playStyle(null));
$('#tzBody').addEventListener('scroll',e=>{if(T.step===0)$('#tzIntro').classList.toggle('mini',e.target.scrollTop>24)},{passive:true});

function openTaster(){
  if(openSheet)closeAll(); pauseHeroes();
  if(P&&!P.sample){T.styles=P.styles.slice();T.picks=P.picks.slice()}else{T.styles=[];T.picks=[]}
  T.keeps=[];T.loves=[];T.skips=[];T.grid=[];T.pulled={};
  $('#tzMasc').src=MASCOT; fillMosaic(); setWash('#5C2D91');
  T.step=0; $('#taster').classList.remove('revealed'); $('#taster').classList.add('open'); document.body.classList.add('tasting'); document.body.style.overflow='hidden';
  renderTaster();
}
function closeTaster(){ playStyle(null); $$('#taster video').forEach(v=>v.pause()); $('#taster').classList.remove('open'); document.body.classList.remove('tasting'); document.body.style.overflow=''; }
function gotoLobby(){
  const t=isDesk()?$('#dlobby'):$('#lobby');
  requestAnimationFrame(()=>t.scrollIntoView({behavior:'auto',block:'start'}));
  resumeHero();
}

// ---------- build: 91 games re-rank in front of you ----------
function buildLobby(){
  playStyle(null); $$('#taster video').forEach(v=>v.pause());
  $$('#tzProg .s').forEach(d=>d.className='s done'); $('#tzFoot').hidden=true; $('[data-tz="skip"]').hidden=true;
  const p=tmpP(), ranked=byScore(G,p), own=new Set(posList(p).map(x=>x[0]));
  const lines=[`Reading the DNA of your ${posList(p).length} picks`,`Ranking all ${G.length} games in your lobby`,'Rebuilding your rows and trailers'];
  $('#tzBody').innerHTML=`<div class="bd"><div class="tz-eb">Building your lobby</div><h2>Ranking <em>${G.length} games</em> for you</h2>
    <div class="bd-grid" id="bdGrid"></div><ul class="bd-lines">${lines.map(l=>`<li><i>${tick}</i>${l}</li>`).join('')}</ul></div>`;
  const box=$('#bdGrid'), W=box.clientWidth, gap=4, cols=Math.max(9,Math.min(16,Math.floor((W+gap)/30))), cell=Math.floor((W-gap*(cols-1))/cols);
  box.style.height=(Math.ceil(G.length/cols)*(cell+gap))+'px';
  const shuffled=G.slice().sort(()=>Math.random()-.5);
  const pos=i=>`translate(${(i%cols)*(cell+gap)}px,${Math.floor(i/cols)*(cell+gap)}px)`;
  box.innerHTML=shuffled.map((g,i)=>`<i data-n="${esc(g.n)}" style="width:${cell}px;height:${cell}px;transform:${pos(i)};--c:${g.c||'#3a2a5a'}${artOf(g.n)?`;background-image:url('${artOf(g.n)}')`:''}"></i>`).join('');
  const rank=Object.fromEntries(ranked.map((g,i)=>[g.n,i]));
  setTimeout(()=>{box.querySelectorAll('i').forEach(el=>{const r=rank[el.dataset.n];el.style.transitionDelay=(reduce?0:Math.min(r,60)*8)+'ms';el.style.transform=pos(r);if(r<12&&!own.has(el.dataset.n))el.classList.add('hot');if(r>=40)el.classList.add('dim')})},reduce?0:250);
  const lis=$$('.bd-lines li'), gapT=reduce?0:620;
  lis.forEach((li,j)=>setTimeout(()=>li.classList.add('on'),gapT*(j+1)));
  setTimeout(()=>{
    P={styles:T.styles.slice(),picks:T.picks.slice(),keeps:T.keeps.slice(),loves:T.loves.slice(),skips:T.skips.slice()};
    saveP(); applyProfile(); showReveal();
  },gapT*(lines.length+1)+(reduce?0:500));
}
const STORE='hbtp:profile:v2';
function saveP(){try{localStorage.setItem(STORE,JSON.stringify(P))}catch(e){}}
function loadP(){try{const v=JSON.parse(localStorage.getItem(STORE)||'null');if(v&&Array.isArray(v.picks)&&[...v.picks,...(v.keeps||[]),...(v.loves||[])].every(n=>byName[n]))return v}catch(e){}return null}
function clearP(){try{localStorage.removeItem(STORE)}catch(e){}}
const SAMPLE={styles:['cascade','bonus'],picks:['Gates of Olympus 2500','Pirots 3'],keeps:['Sweet Bonanza'],loves:[],skips:[],sample:true};

// ---------- reveal: Your Slot DNA ----------
function showReveal(){
  const d=tasteData(P), hero=heroBy[HERO_ORDER[0]], own=new Set(posList().map(x=>x[0]));
  const fy=byScore(G).filter(g=>!own.has(g.n)).slice(0,10), st=STYLES.filter(x=>P.styles.includes(x.k));
  const top6=fy.slice(0,6), top3=[...top6.filter(g=>artOf(g.n)),...top6.filter(g=>!artOf(g.n))].slice(0,3);
  const likeOf=g=>{const b=posList().map(([n])=>[sim(byName[n],g),n]).sort((a,c)=>c[0]-a[0])[0];return b?b[1]:null};
  const changes=[
    `<b>${esc(hero.n)}</b> now leads your lobby, trailer first`,
    `A new <b>Picked for you</b> row of ${fy.length} games, led by ${esc(fy[0].n)}`,
    st.length?`<b>${esc(st.map(x=>x.row).join(' and '))}</b> ${st.length>1?'get their own rows':'gets its own row'}, and every other row is reordered`:`Every row is reordered around what you kept`
  ];
  const bgs=[...own].map(artOf).filter(Boolean).slice(0,6);
  $('#tzBody').innerHTML=`<div class="sdna">
    <div class="dna-card"><div class="dna-bg">${bgs.map(s=>`<img src="${s}" alt="">`).join('')}</div>
      <div class="dna-in"><div class="tz-eb">${DNAIC} Your Slot DNA</div>
      <h2>${dnaHeadline(d,P)}</h2>
      ${d.themes.length?`<div class="ta-sec"><small>Worlds you're drawn to</small>${d.themes.map(([t,v])=>`<div class="ta-bar"><span>${esc(t)}</span><i style="--w:${Math.round(v/d.maxT*100)}%"></i></div>`).join('')}</div>`:''}
      <div class="ta-sec"><small>How you like it to play</small><div class="ta-chips">${d.feats.map(f=>`<span>${esc(f)}</span>`).join('')}</div></div>
      <div class="ta-sec"><small>Your top matches</small><div class="dna-top">${top3.map(g=>`<div>${discHTML(g.n,'big')}<b>${esc(g.n)}</b><em>${likeOf(g)?'Plays like '+esc(likeOf(g)):esc(g.s)}</em></div>`).join('')}</div></div>
      </div></div>
    <div class="dna-side"><h3>Here's what that changed</h3>
      <ol>${changes.map((t,j)=>`<li><i>${j+1}</i><span>${t}</span></li>`).join('')}</ol>
      <div class="btns"><button class="p" data-reveal="lobby">See your lobby</button><button class="g" data-reveal="how">How it works</button></div>
      <p class="fine">Matched across the ${G.length} games from your lobby in this preview, using each game's GameDNA record. ${d.matched} of them match you strongly.</p></div></div>`;
  $('#tzBody').scrollTop=0; $('#taster').classList.add('revealed');
}
function markFresh(){
  const re=/^(Picked for you|Because you picked|Because you chose)/;
  $$('#rows .row, #desk .d-row').forEach(sec=>{const h=sec.querySelector('.row-h h4'),p=sec.querySelector('.row-h p');
    if(h&&(re.test(h.textContent)||(p&&re.test(p.textContent)))){sec.classList.remove('fresh');void sec.offsetWidth;sec.classList.add('fresh')}});
}
function finishTaster(how){closeTaster();gotoLobby();markFresh();if(how&&!document.body.classList.contains('powered'))togglePw()}
function skipTaster(){
  if(!P){P={...SAMPLE};saveP();applyProfile();closeTaster();gotoLobby();toast('Showing a sample player. Tap "Make it yours" any time.')}
  else{closeTaster();gotoLobby()}
}
function applyHeroOrder(){
  HERO_ORDER=P?heroesRanked().slice(0,4).map(h=>h.id):['gates','got','duck','gonzo'];
  $('#heroDots').innerHTML=HERO_ORDER.map(()=>'<i></i>').join('');
  showHero(0);
}
function applyProfile(){
  collapse(); renderChips(); renderTune(); renderRows(); observeRows(); applyHeroOrder(); renderXp();
  renderDesk(); showDHero(0); pauseHeroes(); resumeHero();
}

document.addEventListener('click',e=>{
  const rs=e.target.closest('[data-restart]'); if(rs){e.preventDefault();e.stopPropagation();clearP();P=null;applyProfile();scrollTo(0,0);openTaster();return}
  const tu=e.target.closest('[data-tune]'); if(tu){e.preventDefault();e.stopPropagation();openTaster();return}
  if(!e.target.closest('#taster'))return;
  const rv=e.target.closest('[data-reveal]'); if(rv){finishTaster(rv.dataset.reveal==='how');return}
  const sb=e.target.closest('[data-style]'); if(sb){const k=sb.dataset.style,on=!T.styles.includes(k);
    T.styles=on?[...T.styles,k]:T.styles.filter(x=>x!==k); sb.setAttribute('aria-pressed',on);
    if(on){burst(sb,colOf(STYLE_ART[k]));setWash(colOf(STYLE_ART[k]));playStyle(sb)}
    footStyles(); renderTaste(); return}
  const pk=e.target.closest('[data-pick]'); if(pk){togglePick(pk.dataset.pick,pk);return}
  const sw=e.target.closest('[data-sw]'); if(sw){fling(sw.dataset.sw);return}
  const a=e.target.closest('[data-tz]'); if(!a)return;
  const act=a.dataset.tz;
  if(act==='skip'){skipTaster();return}
  if(act==='back'){T.step=Math.max(0,T.step-1);renderTaster();return}
  if(act==='next'){if(T.step<2){T.step++;renderTaster()}else buildLobby()}
},true);
document.addEventListener('keydown',e=>{
  if(!$('#taster').classList.contains('open'))return;
  if(e.key==='Escape'){if($('.sdna'))finishTaster(false);else skipTaster();return}
  if(T.step===2&&$('#swDeck .sw-card')){const k={ArrowRight:'keep',ArrowLeft:'skip',ArrowUp:'love'}[e.key];if(k){e.preventDefault();fling(k)}}
});

// ---------- Video budget: never more than three clips playing at once ----------
const VCAP=3, playingV=[];
document.addEventListener('play',e=>{
  const v=e.target; if(!(v instanceof HTMLVideoElement))return;
  for(let k=playingV.length-1;k>=0;k--)if(playingV[k]===v||playingV[k].paused||!playingV[k].isConnected)playingV.splice(k,1);
  playingV.push(v);
  const keep=x=>x===v||x.id==='heroVid'||x.id==='dHeroVid'||!!x.closest('.sheet.open,.sw-card');
  while(playingV.length>VCAP){const old=playingV.find(x=>!keep(x));if(!old)break;old.pause();const live=old.closest('.live');if(live)live.classList.remove('live');playingV.splice(playingV.indexOf(old),1)}
},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)$$('video').forEach(v=>v.pause());else if(!$('#taster').classList.contains('open')&&!openSheet)resumeHero()});

// ---------- Powering layer ----------
function togglePw(){const on=!document.body.classList.contains('powered');document.body.classList.toggle('powered',on);$('#pwtoggle').setAttribute('aria-pressed',on);$('#stripPw').setAttribute('aria-pressed',on);if(on)toast('Showing what Turbo Pickle powers')}
$('#pwtoggle').addEventListener('click',togglePw);$('#stripPw').addEventListener('click',togglePw);

// ---------- Boot: the taster is the first scene ----------
(function boot(){
  const saved=loadP();
  if(saved){P=saved;applyProfile()}
  else openTaster();
})();
})();
