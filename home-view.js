export function homeView(){return `
<div class="home-page"><aside class="public-preview-note">branch 公开展示版 · 可浏览示例人生，个人 AI 推演尚未开放</aside>
<header class="home-header">
<a href="#" class="home-brand" data-action="nav" data-page="home" aria-label="branch 首页"><svg viewBox="0 0 40 26" aria-hidden="true"><path d="M2 17 10 5l9 7-5 8 9-7 7 7 8-13"/></svg><span>branch<span class="brand-sub">by parallax</span></span></a>
<nav aria-label="网站导航"><a class="pill active" href="#opening"><i>↗</i>起点</a><a class="pill" href="#life-archives">人生档案</a><button class="pill" data-action="nav" data-page="map">人生剧场</button></nav>
<button class="home-enter" data-action="connect"><i>↗</i><span>连接我的人生</span></button></header>
<section class="touch-opening" id="opening" aria-label="人手与机械手相向的开场">
<div class="touch-aura" aria-hidden="true"></div>
<div class="touch-copy"><span class="section-caption">branch / HUMAN CHOICES. POSSIBLE FUTURES.</span><h1>你的选择，<br><span>触碰未来。</span></h1><p>让尚未发生的人生，与你相遇。</p></div>
<div class="touch-hands" aria-hidden="true"><div class="touch-hand touch-human"><img src="./human-robot-hands.png" alt="" width="1536" height="1024" fetchpriority="high" draggable="false"></div><div class="touch-hand touch-robot"><img src="./human-robot-hands.png" alt="" width="1536" height="1024" draggable="false"></div></div>
<div class="touch-foot"><div><span class="section-caption">A CONNECTION TO ANOTHER YOU</span><p>从现在的自己，<br>伸向未来的另一种可能。</p><button class="touch-start" data-action="new">开启我的人生 <span>↗</span></button></div><a href="#possibility-tunnel" class="touch-scroll" aria-label="继续探索光影隧道">向下探索 <span>↓</span></a><div class="touch-controls"><span>HUMAN</span><i>↔</i><span>POSSIBILITY</span><button class="touch-motion" data-action="hands-pause" aria-label="暂停手部动画">Ⅱ</button></div></div>
</section>
<section class="tunnel-section" id="possibility-tunnel" aria-label="人生探索开场">
<div id="life-tunnel" aria-hidden="true"></div><div class="tunnel-vignette"></div>
<div class="tunnel-coordinate"><span>branch — POSSIBILITY ENGINE</span><span>01 / YOUR NEXT CHAPTER</span></div>
<div class="tunnel-title"><span class="tunnel-pre">ENTER ANOTHER POSSIBILITY</span><h2><span>人生的</span><br><strong>另一种可能</strong></h2><span class="tunnel-caption">WHAT IF YOU CHOOSE AGAIN?</span></div>
<div class="tunnel-bottom"><a href="#life-overview" class="scroll-entry"><span>向下探索</span><i>↓</i></a><button class="motion-control" data-action="tunnel-pause" aria-label="暂停开场动画">Ⅱ</button><div class="tunnel-intro"><p>一次选择，会把你带向哪里？<br>在 branch，打开人生的另一条路径，<br>遇见尚未发生的自己。</p><button data-action="new">创建我的人生 <span>↗</span></button></div></div></section>
<section class="life-overview" id="life-overview"><div class="section-caption"><span>THE POSSIBILITY OF YOU</span><span>从当下出发 / 向未来展开</span></div>
<a class="overview-row" href="#life-archives"><div><strong>01</strong><span>一份属于你的档案</span></div><p>从此刻的你开始。<br>让未来的意象拥有形状。</p><span class="overview-switch"><i>↗</i><b>YOUR STORY</b></span></a>
<button class="overview-row" data-action="nav" data-page="map"><div><strong>06</strong><span>六个人生关键节点</span></div><p>升学、工作、城市与转折。<br>每一次选择，都连向新的可能。</p><span class="overview-switch"><i>↗</i><b>YOUR CHOICES</b></span></button>
<button class="overview-row" data-action="nav" data-page="compare"><div><strong>∞</strong><span>不止一种未来</span></div><p>把「如果当时」变成另一条路径。<br>再把这段探索，带回真实生活。</p><span class="overview-switch"><i>↗</i><b>YOUR POSSIBILITIES</b></span></button></section>
<section class="archive-section" id="life-archives"><div class="archive-stage"><div class="archive-copy"><span class="section-caption">PERSONAL LIFE ARCHIVES</span><h2>打开人生，<span>遇见可能。</span></h2><p>你还没走过的路，已经在这里等待。</p></div><div id="life-archives-scene" aria-hidden="true"></div><div class="archive-bottom"><span>ARCHIVE NO. 0001 — 0005</span><span>滚动，展开你的人生档案 ↓</span><button data-action="new">建立我的档案 ↗</button></div></div></section>
<section class="life-manifesto" id="how-it-works"><span class="section-caption">HUMAN CHOICES. POSSIBLE FUTURES.</span><h2>如果当时，<span>我这样选择。</span></h2><div class="manifesto-intro"><span class="small-orbit" aria-hidden="true">✳</span><p>人生没有标准答案。<br>我们把你的意象、犹豫与期待，<br>连接成可以探索的故事。<br>在一个节点停下来，再选一次。</p><button class="round-link" data-action="nav" data-page="map" aria-label="进入人生剧场">↗</button></div>
<div class="home-steps"><article><span>01 / BEFORE THE EXPERIENCE</span><h3>先写下，现在的你。</h3><p>回答几个关于当下与未来的问题，建立专属的人生档案。</p><button data-action="new">填写人生问卷 ↗</button></article><article><span>02 / ANOTHER POSSIBILITY</span><h3>在转折处，重新选择。</h3><p>进入持续运动的人生网络，改变一个节点，看后面的故事如何展开。</p><button data-action="nav" data-page="map">探索人生网络 ↗</button></article><article><span>03 / A LETTER TO YOURSELF</span><h3>留下一份，未来来信。</h3><p>对照不同路径，收集选择与结局，将探索保存在人生报告中。</p><button data-action="nav" data-page="report">查看人生报告 ↗</button></article></div></section>
<section class="home-ending"><div><span class="section-caption">THE FUTURE IS STILL OPEN.</span><h2>下一页，<span>由你开启。</span></h2></div><button class="ending-cta" data-action="new">开启我的人生<span>↗</span></button><p>你的信息与选择 · AI 生成人生的不同可能</p></section>
<footer class="home-footer"><div class="footer-top"><span>branch / by parallax</span><button data-action="nav" data-page="about">技术来源与开源说明 ↗</button><span>© 2026 parallax</span></div></footer></div>`;}
export function mountHomeMotion(tunnel,folders){
 const header=document.querySelector('.home-header'),title=document.querySelector('.tunnel-title'),section=document.querySelector('.tunnel-section'),reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 function update(){const r=section.getBoundingClientRect();header.classList.toggle('over-light',r.top>70||r.bottom<70);const p=Math.max(0,Math.min(1,-r.top/r.height));title.style.setProperty('--exit',reduced.matches?0:p);const inArchive=document.querySelector('.archive-section').getBoundingClientRect().top<innerHeight*.5;header.querySelectorAll('nav a').forEach(a=>{const active=(a.hash==='#life-archives')===inArchive;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
 window.addEventListener('scroll',update,{passive:true});update();
 const hands=mountTouchHands();
 const pauseButton=document.querySelector('[data-action=tunnel-pause]');if(tunnel.paused){pauseButton.textContent='▷';pauseButton.setAttribute('aria-label','播放开场动画');}
 return {togglePause:()=>tunnel.togglePause(),toggleHandsPause:()=>hands.togglePause(),destroy(){hands.destroy();window.removeEventListener('scroll',update);tunnel.destroy();folders.destroy();}};
}


function mountTouchHands(){
 const section=document.querySelector('.touch-opening'),media=matchMedia('(prefers-reduced-motion: reduce)'),button=document.querySelector('[data-action=hands-pause]');
 let paused=media.matches;
 function sync(){section.classList.toggle('hands-paused',paused);button.hidden=media.matches;button.textContent=paused?'▷':'Ⅱ';button.setAttribute('aria-label',paused?'播放手部动画':'暂停手部动画');}
 function motion(){paused=media.matches;sync();}
 media.addEventListener('change',motion);sync();
 const observer=new IntersectionObserver(entries=>section.classList.toggle('hands-offscreen',!entries[0]?.isIntersecting));observer.observe(section);
 function visibility(){section.classList.toggle('hands-hidden',document.hidden);}
 document.addEventListener('visibilitychange',visibility);
 return {togglePause(){paused=!paused;sync();return paused;},destroy(){observer.disconnect();media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);}};
}
