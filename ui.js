// ui.js — кнопки, версия, чейнджлог, цикл

window.selectedPartType = 'wing';

const btnW = document.getElementById('btn-wing');
const btnT = document.getElementById('btn-tail');
const btnE = document.getElementById('btn-engine');
const flyBtn = document.getElementById('fly-btn');
const resetBtn = document.getElementById('reset-btn');
const modeInd = document.getElementById('mode-indicator');
const instrDiv = document.getElementById('instr');
const nudgeCtrl = document.getElementById('nudge-controls');
const viewBtn = document.getElementById('view-btn');

function setActive(t) {
  [btnW,btnT,btnE].forEach(b=>b.classList.remove('active'));
  if (t==='wing') btnW.classList.add('active');
  if (t==='tail') btnT.classList.add('active');
  if (t==='engine') btnE.classList.add('active');
  window.selectedPartType = t;
}

btnW.addEventListener('click', ()=>setActive('wing'));
btnT.addEventListener('click', ()=>setActive('tail'));
btnE.addEventListener('click', ()=>setActive('engine'));

flyBtn.addEventListener('click', ()=>{
  if (window.isFlying) {
    window.exitFlight(window.airplaneGroup, window.camera, window.controls);
    flyBtn.textContent = '✈️ ВЗЛЕТ';
    flyBtn.style.background = '#2ecc71';
    modeInd.textContent = '🛠️ СБОРКА';
    modeInd.style.background = 'rgba(0,0,0,0.7)';
    document.body.classList.remove('flying');
    instrDiv.textContent = '👆 Тап по фюзеляжу: деталь | Кнопки: двигать | ✌️: вращать';
    if (window.selectedPart) nudgeCtrl.style.display = 'flex';
    if (viewBtn) viewBtn.style.display = 'none';
    // возврат отвалившихся
    for (const d of window.flyingDetachedParts) {
      window.partsLayer.add(d.part);
      window.placedParts.push(d.part);
    }
    window.flyingDetachedParts = [];
    return;
  }
  if (window.startFlight(window.airplaneGroup, window.camera, window.controls, window.placedParts, window.partsLayer)) {
    flyBtn.textContent = '🛬 ЗЕМЛЯ';
    flyBtn.style.background = '#e74c3c';
    modeInd.textContent = '✈️ ПОЛЕТ';
    modeInd.style.background = '#e74c3c';
    document.body.classList.add('flying');
    instrDiv.textContent = '🎮 Кнопки внизу | W/S: газ | Стрелки: управление | 📷: смена вида';
    nudgeCtrl.style.display = 'none';
    if (viewBtn) { viewBtn.style.display = 'block'; viewBtn.textContent = '📷 Сзади'; }
  }
});

resetBtn.addEventListener('click', ()=>{
  if (window.isFlying) {
    window.exitFlight(window.airplaneGroup, window.camera, window.controls);
    flyBtn.textContent = '✈️ ВЗЛЕТ';
    flyBtn.style.background = '#2ecc71';
    modeInd.textContent = '🛠️ СБОРКА';
    modeInd.style.background = 'rgba(0,0,0,0.7)';
    document.body.classList.remove('flying');
    instrDiv.textContent = '👆 Тап по фюзеляжу: деталь | Кнопки: двигать | ✌️: вращать';
    if (viewBtn) viewBtn.style.display = 'none';
    for (const d of window.flyingDetachedParts) {
      window.partsLayer.add(d.part);
      window.placedParts.push(d.part);
    }
    window.flyingDetachedParts = [];
  }
  window.clearAllParts();
  setActive('wing');
  nudgeCtrl.style.display = 'none';
});

// Nudge buttons
document.querySelectorAll('.nudge-btn').forEach(b => {
  b.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    if (!window.selectedPart || window.isFlying) return;
    const axis = b.dataset.axis;
    const dir = parseFloat(b.dataset.dir);
    window.selectedPart.position[axis] += dir * 0.08;
    window.selectedPart.position.y = Math.max(-2.5, Math.min(3, window.selectedPart.position.y));
    window.selectedPart.position.x = Math.max(-2.5, Math.min(2.5, window.selectedPart.position.x));
    window.selectedPart.position.z = Math.max(-2, Math.min(2, window.selectedPart.position.z));
  });
});

// Стартовая деталь
setActive('wing');
const demo = window.createPart('wing');
demo.position.set(0,0.05,0);
window.partsLayer.add(demo);
window.placedParts.push(demo);
window.selectPart(demo);

// Версия
const VERSION = '1.0.3';
const changelog = [
  {version:'1.0.0',type:'major',desc:'3D-конструктор: сборка самолёта, режим полёта.'},
  {version:'1.0.1',type:'minor',desc:'Лимит деталей, убраны шарики, нос вперёд, три вида камеры.'},
  {version:'1.0.2',type:'patch',desc:'Исправлен баг загрузки flight.js, индикатор не перекрывается.'},
  {version:'1.0.3',type:'patch',desc:'Код разбит на 4 модуля (flight/scene/airplane/ui) — стабильность.'}
];

function renderCL() {
  const list = document.getElementById('changelog-list');
  if (!list) return;
  list.innerHTML = '';
  changelog.forEach(e => {
    const d = document.createElement('div');
    d.className = `changelog-entry ${e.type}`;
    const tag = e.type==='major'?'БО':e.type==='minor'?'МО':'П';
    d.innerHTML = `<div class="changelog-version">v${e.version} <span class="tag ${e.type}">${tag}+1</span></div><div class="changelog-desc">${e.desc}</div>`;
    list.appendChild(d);
  });
}

const vBadge = document.getElementById('version-badge');
if (vBadge) {
  vBadge.textContent = `v${VERSION}`;
  vBadge.addEventListener('click', e => {
    e.stopPropagation();
    const pop = document.getElementById('changelog-popup');
    if (!pop) return;
    const vis = pop.style.display === 'block';
    pop.style.display = vis ? 'none' : 'block';
    if (!vis) renderCL();
  });
}
document.addEventListener('click', e => {
  const pop = document.getElementById('changelog-popup');
  if (!pop || !vBadge) return;
  if (!vBadge.contains(e.target) && !pop.contains(e.target)) pop.style.display = 'none';
});

// Главный цикл
window.animateLoop((dt) => {
  window.updateFlight(window.airplaneGroup, window.camera, window.controls, dt);
  window.updateDetachedParts(window.flyingDetachedParts, dt);
});
