// ui.js v1.2.0
import * as THREE from 'three';

window.selectedPartType='wing';
const mi=document.getElementById('mode-indicator'),vb=document.getElementById('view-btn'),fb=document.getElementById('fly-btn'),rb=document.getElementById('reset-btn');
const bw=document.getElementById('btn-wing'),bt=document.getElementById('btn-tail'),be=document.getElementById('btn-engine');
const bs=document.getElementById('btn-fus-small'),bm=document.getElementById('btn-fus-med'),bb=document.getElementById('btn-fus-big');
const nc=document.getElementById('nudge-controls'),sb=document.getElementById('snap-btn'),id=document.getElementById('instr');
const vg=document.getElementById('version-badge'),vp=document.getElementById('changelog-popup'),vl=document.getElementById('changelog-list');

function sa(t){[bw,bt,be].forEach(b=>b.classList.remove('active'));if(t==='wing')bw.classList.add('active');if(t==='tail')bt.classList.add('active');if(t==='engine')be.classList.add('active');window.selectedPartType=t;}
function sf(t){[bs,bm,bb].forEach(b=>b.classList.remove('active'));if(t==='small')bs.classList.add('active');if(t==='med')bm.classList.add('active');if(t==='big')bb.classList.add('active');}
bw.addEventListener('click',()=>sa('wing'));bt.addEventListener('click',()=>sa('tail'));be.addEventListener('click',()=>sa('engine'));
bs.addEventListener('click',()=>{sf('small');window.setFuselage('small');});bm.addEventListener('click',()=>{sf('med');window.setFuselage('med');});bb.addEventListener('click',()=>{sf('big');window.setFuselage('big');});sf('med');

fb.addEventListener('click',()=>{
  if(window.isFlying){window.exitFlight(window.airplaneGroup,window.camera,window.controls);fb.textContent='✈️ ВЗЛЕТ';fb.style.background='#2ecc71';mi.textContent='🛠️ СБОРКА';mi.style.background='rgba(0,0,0,0.7)';id.textContent='👆 Тап: деталь | Кнопки: двигать/приварить | ✌️: вращать';if(window.selectedPart){nc.style.display='flex';sb.style.display='block';}if(vb)vb.style.display='none';for(const d of window.flyingDetached){window.partsLayer.add(d.part);window.placedParts.push(d.part);}window.flyingDetached.length=0;return;}
  if(window.startFlight(window.airplaneGroup,window.camera,window.controls,window.placedParts,window.partsLayer)){fb.textContent='🛬 ЗЕМЛЯ';fb.style.background='#e74c3c';mi.textContent='✈️ ПОЛЕТ';mi.style.background='#e74c3c';id.textContent='🎮 ▲▼: тангаж | ◀▶: поворот | ⚡: газ | 📷: вид';nc.style.display='none';sb.style.display='none';if(vb){vb.style.display='block';vb.textContent='📷 Сзади';}}
});

rb.addEventListener('click',()=>{if(window.isFlying){window.exitFlight(window.airplaneGroup,window.camera,window.controls);fb.textContent='✈️ ВЗЛЕТ';fb.style.background='#2ecc71';mi.textContent='🛠️ СБОРКА';mi.style.background='rgba(0,0,0,0.7)';id.textContent='👆 Тап: деталь | Кнопки: двигать/приварить | ✌️: вращать';if(vb)vb.style.display='none';for(const d of window.flyingDetached){window.partsLayer.add(d.part);window.placedParts.push(d.part);}window.flyingDetached.length=0;}window.clearAllParts();sa('wing');nc.style.display='none';sb.style.display='none';});

document.querySelectorAll('.nudge-btn').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!window.selectedPart||window.isFlying)return;const ax=b.dataset.axis,dr=parseFloat(b.dataset.dir);window.selectedPart.position[ax]+=dr*0.08;window.selectedPart.position.y=Math.max(-2.5,Math.min(3,window.selectedPart.position.y));window.selectedPart.position.x=Math.max(-2.5,Math.min(2.5,window.selectedPart.position.x));window.selectedPart.position.z=Math.max(-2,Math.min(2,window.selectedPart.position.z));});});
sb.addEventListener('click',()=>{if(!window.selectedPart||window.isFlying)return;const sn=window.selectedPart.userData.snapPos;if(sn)window.selectedPart.position.copy(sn);});

sa('wing');const demo=window.createPart('wing');demo.position.set(0,0.05,0);window.partsLayer.add(demo);window.placedParts.push(demo);window.selectPart(demo);

const VER='1.2.0';
const cl=[{v:'1.2.0',t:'major',d:'Цвета фюзеляжей, лимиты деталей, шасси, физика исправлена, холмы не на полосе.'},{v:'1.1.0',t:'major',d:'Три фюзеляжа. Ландшафт 200×200.'},{v:'1.0.5',t:'minor',d:'Кнопка «Приварить».'},{v:'1.0.4',t:'patch',d:'Индикатор отдельно.'}];
function rcl(){vl.innerHTML='';cl.forEach(e=>{const d=document.createElement('div');d.className='changelog-entry '+e.t;d.innerHTML='<div class="changelog-version">v'+e.v+' <span class="tag '+e.t+'">'+(e.t==='major'?'БО':e.t==='minor'?'МО':'П')+'+1</span></div><div class="changelog-desc">'+e.d+'</div>';vl.appendChild(d);});}
vg.textContent='v'+VER;vg.addEventListener('click',e=>{e.stopPropagation();const vis=vp.style.display==='block';vp.style.display=vis?'none':'block';if(!vis)rcl();});
document.addEventListener('click',e=>{if(!vg.contains(e.target)&&!vp.contains(e.target))vp.style.display='none';});

const clk=new THREE.Clock();(function l(){requestAnimationFrame(l);const dt=Math.min(clk.getDelta(),0.1);window.updateFlight(window.airplaneGroup,window.camera,window.controls,dt);window.updateDetached(window.flyingDetached,dt);window.controls.update();window.renderer.render(window.scene,window.camera);window.labelRenderer.render(window.scene,window.camera);})();
