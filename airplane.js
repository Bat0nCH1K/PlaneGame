// ui.js
import * as THREE from 'three';

window.selectedPartType='wing';

const modeInd=document.getElementById('mode-indicator');
const viewBtn=document.getElementById('view-btn');
const flyBtn=document.getElementById('fly-btn');
const resetBtn=document.getElementById('reset-btn');
const btnW=document.getElementById('btn-wing');
const btnT=document.getElementById('btn-tail');
const btnE=document.getElementById('btn-engine');
const btnFS=document.getElementById('btn-fus-small');
const btnFM=document.getElementById('btn-fus-med');
const btnFB=document.getElementById('btn-fus-big');
const nudgeCtrl=document.getElementById('nudge-controls');
const snapBtn=document.getElementById('snap-btn');
const instrDiv=document.getElementById('instr');
const vBadge=document.getElementById('version-badge');
const vPopup=document.getElementById('changelog-popup');
const vList=document.getElementById('changelog-list');

function setActive(t){[btnW,btnT,btnE].forEach(b=>b.classList.remove('active'));if(t==='wing')btnW.classList.add('active');if(t==='tail')btnT.classList.add('active');if(t==='engine')btnE.classList.add('active');window.selectedPartType=t;}
function setFusActive(t){[btnFS,btnFM,btnFB].forEach(b=>b.classList.remove('active'));if(t==='small')btnFS.classList.add('active');if(t==='med')btnFM.classList.add('active');if(t==='big')btnFB.classList.add('active');}

btnW.addEventListener('click',()=>setActive('wing'));
btnT.addEventListener('click',()=>setActive('tail'));
btnE.addEventListener('click',()=>setActive('engine'));
btnFS.addEventListener('click',()=>{setFusActive('small');window.setFuselage('small');});
btnFM.addEventListener('click',()=>{setFusActive('med');window.setFuselage('med');});
btnFB.addEventListener('click',()=>{setFusActive('big');window.setFuselage('big');});
setFusActive('med');

flyBtn.addEventListener('click',()=>{
  if(window.isFlying){
    window.exitFlight(window.airplaneGroup,window.camera,window.controls);
    flyBtn.textContent='✈️ ВЗЛЕТ';flyBtn.style.background='#2ecc71';modeInd.textContent='🛠️ СБОРКА';modeInd.style.background='rgba(0,0,0,0.7)';
    document.body.classList.remove('flying');instrDiv.textContent='👆 Тап: деталь | Тап по детали: выделить | Кнопки: двигать/приварить | ✌️: вращать';
    if(window.selectedPart){nudgeCtrl.style.display='flex';snapBtn.style.display='block';}
    if(viewBtn)viewBtn.style.display='none';
    for(const d of window.flyingDetached){window.partsLayer.add(d.part);window.placedParts.push(d.part);}window.flyingDetached.length=0;return;
  }
  if(window.startFlight(window.airplaneGroup,window.camera,window.controls,window.placedParts,window.partsLayer)){
    flyBtn.textContent='🛬 ЗЕМЛЯ';flyBtn.style.background='#e74c3c';modeInd.textContent='✈️ ПОЛЕТ';modeInd.style.background='#e74c3c';
    document.body.classList.add('flying');instrDiv.textContent='🎮 ▲▼: тангаж | ◀▶: поворот | ⚡: газ | 📷: вид';
    nudgeCtrl.style.display='none';snapBtn.style.display='none';
    if(viewBtn){viewBtn.style.display='block';viewBtn.textContent='📷 Сзади';}
  }
});

resetBtn.addEventListener('click',()=>{
  if(window.isFlying){
    window.exitFlight(window.airplaneGroup,window.camera,window.controls);
    flyBtn.textContent='✈️ ВЗЛЕТ';flyBtn.style.background='#2ecc71';modeInd.textContent='🛠️ СБОРКА';modeInd.style.background='rgba(0,0,0,0.7)';
    document.body.classList.remove('flying');instrDiv.textContent='👆 Тап: деталь | Тап по детали: выделить | Кнопки: двигать/приварить | ✌️: вращать';
    if(viewBtn)viewBtn.style.display='none';
    for(const d of window.flyingDetached){window.partsLayer.add(d.part);window.placedParts.push(d.part);}window.flyingDetached.length=0;
  }
  window.clearAllParts();setActive('wing');nudgeCtrl.style.display='none';snapBtn.style.display='none';
});

document.querySelectorAll('.nudge-btn').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!window.selectedPart||window.isFlying)return;const axis=b.dataset.axis,dir=parseFloat(b.dataset.dir);window.selectedPart.position[axis]+=dir*0.08;window.selectedPart.position.y=Math.max(-2.5,Math.min(3,window.selectedPart.position.y));window.selectedPart.position.x=Math.max(-2.5,Math.min(2.5,window.selectedPart.position.x));window.selectedPart.position.z=Math.max(-2,Math.min(2,window.selectedPart.position.z));});});

snapBtn.addEventListener('click',()=>{if(!window.selectedPart||window.isFlying)return;const snap=window.selectedPart.userData.snapPos;if(snap)window.selectedPart.position.copy(snap);});

setActive('wing');const demo=window.createPart('wing');demo.position.set(0,0.05,0);window.partsLayer.add(demo);window.placedParts.push(demo);window.selectPart(demo);

const VERSION='1.1.0';
const changelog=[
  {version:'1.1.0',type:'major',desc:'Три фюзеляжа (лёгкий/средний/тяжёлый). Физика: тангаж навсегда, крен при поворотах. Ландшафт 200×200 с холмами.'},
  {version:'1.0.5',type:'minor',desc:'Кнопка «Приварить», улучшено управление.'},
  {version:'1.0.4',type:'patch',desc:'Индикатор и кнопка вида в отдельном блоке.'},
  {version:'1.0.3',type:'patch',desc:'Код разбит на модули — стабильность.'}
];
function renderCL(){vList.innerHTML='';changelog.forEach(e=>{const d=document.createElement('div');d.className=`changelog-entry ${e.type}`;d.innerHTML=`<div class="changelog-version">v${e.version} <span class="tag ${e.type}">${e.type==='major'?'БО':e.type==='minor'?'МО':'П'}+1</span></div><div class="changelog-desc">${e.desc}</div>`;vList.appendChild(d);});}
vBadge.textContent=`v${VERSION}`;
vBadge.addEventListener('click',e=>{e.stopPropagation();const vis=vPopup.style.display==='block';vPopup.style.display=vis?'none':'block';if(!vis)renderCL();});
document.addEventListener('click',e=>{if(!vBadge.contains(e.target)&&!vPopup.contains(e.target))vPopup.style.display='none';});

const clock=new THREE.Clock();
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),0.1);window.updateFlight(window.airplaneGroup,window.camera,window.controls,dt);window.updateDetached(window.flyingDetached,dt);window.controls.update();window.renderer.render(window.scene,window.camera);window.labelRenderer.render(window.scene,window.camera);}
loop();
