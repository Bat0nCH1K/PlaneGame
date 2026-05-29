// ... весь предыдущий код script.js без изменений ...

// ---------- СИСТЕМА ВЕРСИОНИРОВАНИЯ ----------
const VERSION = '1.0.0';

const changelog = [
  {
    version: '1.0.0',
    type: 'major',
    desc: 'Большое обновление! 3D-конструктор: сборка самолёта из крыльев, хвоста и двигателей. Режим полёта с управлением. Три вида камеры. Детали отваливаются если не приварены.'
  },
  {
    version: '1.0.1',
    type: 'minor',
    desc: 'Добавлен лимит деталей (по 2 каждого типа). Убраны шарики на концах крыльев. Самолёт летит носом вперёд. Камера привязана к самолёту.'
  },
  {
    version: '1.0.2',
    type: 'patch',
    desc: 'Исправлено перекрытие индикатора режима. Добавлена плашка версии и список изменений.'
  }
];

function renderChangelog() {
  const list = document.getElementById('changelog-list');
  list.innerHTML = '';
  
  changelog.forEach(entry => {
    const div = document.createElement('div');
    div.className = `changelog-entry ${entry.type}`;
    
    const tagLabel = entry.type === 'major' ? 'БО' : entry.type === 'minor' ? 'МО' : 'П';
    
    div.innerHTML = `
      <div class="changelog-version">
        v${entry.version} <span class="tag ${entry.type}">${tagLabel}+1</span>
      </div>
      <div class="changelog-desc">${entry.desc}</div>
    `;
    
    list.appendChild(div);
  });
}

document.getElementById('version-badge').textContent = `v${VERSION}`;

document.getElementById('version-badge').addEventListener('click', (e) => {
  e.stopPropagation();
  const popup = document.getElementById('changelog-popup');
  const isVisible = popup.style.display === 'block';
  popup.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) renderChangelog();
});

// Закрытие по клику вне
document.addEventListener('click', (e) => {
  const popup = document.getElementById('changelog-popup');
  const badge = document.getElementById('version-badge');
  if (!badge.contains(e.target) && !popup.contains(e.target)) {
    popup.style.display = 'none';
  }
});
