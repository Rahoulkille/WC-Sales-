/* Explore feed, desktop: side panel mirrors the visible clip; arrow keys step clips */
(function(){
var q=function(s){return document.querySelector(s)};
var sheet=q('#exploreSheet'),panel=q('#explorePanel'),xp=q('#xp');if(!sheet||!panel||!xp)return;
var desk=function(){return document.body.dataset.layout==='desktop'};
var bg=document.createElement('div');bg.className='xbg';bg.setAttribute('aria-hidden','true');
var side=document.createElement('aside');side.className='xside';side.setAttribute('aria-live','polite');
panel.insertBefore(bg,panel.firstChild);panel.appendChild(side);
var cur=null,t=null;
function cards(){return Array.prototype.slice.call(xp.querySelectorAll('.card'))}
function current(){var cs=cards();if(!cs.length)return null;var i=Math.round(xp.scrollTop/Math.max(1,xp.clientHeight));return cs[Math.max(0,Math.min(cs.length-1,i))]}
function sync(force){
  if(!sheet.classList.contains('open'))return;
  var c=current();if(!c||(c===cur&&!force))return;cur=c;
  var cs=cards(),i=cs.indexOf(c),v=c.querySelector('video'),img=c.querySelector('.who img'),nm=c.querySelector('.who b'),ln=c.querySelector('.who small'),fav=c.querySelector('.fav'),play=c.querySelector('.play'),head=c.querySelector('.head');
  var poster=v&&v.getAttribute('poster');if(poster)bg.style.backgroundImage='url("'+poster+'")';
  var on=!!(fav&&fav.classList.contains('on'));
  side.innerHTML='<span class="xs-eb"></span>'+(img?'<img class="xs-art" alt="">':'')+'<h2 class="xs-nm"></h2><p class="xs-ln"></p><div class="xs-acts"><button type="button" class="xs-play"></button><button type="button" class="xs-fav'+(on?' on':'')+'" aria-label="Save to favourites" aria-pressed="'+on+'"></button></div><button type="button" class="xs-gp">Game page</button><div class="xs-dots" aria-hidden="true">'+cs.map(function(_,j){return '<i'+(j===i?' class="on"':'')+'></i>'}).join('')+'</div>';
  side.querySelector('.xs-eb').textContent=head?head.textContent:'';
  if(img)side.querySelector('.xs-art').src=img.src;
  side.querySelector('.xs-nm').textContent=nm?nm.textContent:'';
  side.querySelector('.xs-ln').textContent=ln?ln.textContent:'';
  side.querySelector('.xs-play').textContent=play?play.textContent:'';
  if(fav)side.querySelector('.xs-fav').innerHTML=fav.innerHTML;
}
side.addEventListener('click',function(e){
  var c=cur;if(!c)return;var b;
  if(e.target.closest('.xs-play')){var p=c.querySelector('.play');if(p)p.click()}
  else if((b=e.target.closest('.xs-fav'))){var f=c.querySelector('.fav');if(f){f.click();var o=f.classList.contains('on');b.classList.toggle('on',o);b.setAttribute('aria-pressed',o)}}
  else if(e.target.closest('.xs-gp')){var g=c.querySelector('.acts [data-game]');if(g)g.click()}
});
xp.addEventListener('scroll',function(){clearTimeout(t);t=setTimeout(function(){sync(false)},70)},{passive:true});
new MutationObserver(function(){cur=null;if(sheet.classList.contains('open')){sync(true);setTimeout(function(){sync(false)},400)}}).observe(sheet,{attributes:true,attributeFilter:['class']});
new MutationObserver(function(){cur=null;sync(true)}).observe(xp,{childList:true});
document.addEventListener('keydown',function(e){
  if(!desk()||!sheet.classList.contains('open'))return;
  var d={ArrowDown:1,PageDown:1,ArrowUp:-1,PageUp:-1}[e.key];if(!d)return;
  e.preventDefault();var b=panel.querySelector('[data-xnav="'+d+'"]');if(b)b.click();
});
})();
