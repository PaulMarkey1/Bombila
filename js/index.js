import {
  STORAGE,
  getStorage,
  setStorage
} from './settings.js';

const contentEl = document.getElementById('content');
const shiftBtn = document.getElementById('shift-action-btn');
const shiftBlock = document.getElementById('shift-block');
const templateEl = document.getElementById('shift-template');

let timerInterval = null;
let currentShift = null;

// --- Анимация ---
function fadeInElement(el) {
  el.style.opacity = 0;
  el.style.transform = 'translateY(12px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';

  setTimeout(() => {
    el.style.opacity = 1;
    el.style.transform = 'translateY(0)';
  }, 20);
}

// --- Проверка ---
function isShiftActive() {
  return !!getStorage(STORAGE.ACTIVE);
}

// --- Кнопка ---
function updateActionButton(active) {
  if (!shiftBtn) return;

  shiftBtn.textContent = active ? 'Завершить смену' : 'Начать смену';
  shiftBtn.classList.toggle('active', active);
}

// --- Таймер ---
function startTimer(timerEl) {
  if (timerInterval) cancelAnimationFrame(timerInterval);

  if (!currentShift || currentShift.pauseStart || !timerEl) return;

  const start = new Date(currentShift.startTime).getTime();

  function update() {
    if (!currentShift || currentShift.pauseStart) {
      cancelAnimationFrame(timerInterval);
      timerInterval = null;
      return;
    }

    const paused = currentShift.pausedDuration || 0;
    const elapsed = Date.now() - start - paused;

    const h = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
    const m = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');

    timerEl.textContent = `${h}:${m}:${s}`;

    timerInterval = requestAnimationFrame(update);
  }

  update();
}

// --- UI ---
function refreshUI() {
  const active = isShiftActive();
  updateActionButton(active);

  shiftBlock.innerHTML = '';

  if (active) {
    currentShift = getStorage(STORAGE.ACTIVE);
    if (!currentShift) return;

    const start = new Date(currentShift.startTime);

    const clone = templateEl.content.cloneNode(true);

    clone.querySelector('h2').textContent =
      currentShift.pauseStart ? 'Смена на паузе' : 'Смена активна';

    clone.querySelector('strong').textContent =
      start.toLocaleString('ru-RU');

    const buttonsContainer = clone.querySelector('.shift-buttons');
    const timerEl = clone.querySelector('.live-timer');

    if (!currentShift.pauseStart) {
      buttonsContainer.innerHTML =
        '<button class="btn" id="pause-btn">Приостановить</button>';
    } else {
      buttonsContainer.innerHTML =
        '<button class="btn" id="resume-btn">Продолжить</button>';

      if (timerEl) timerEl.remove();
    }

    shiftBlock.appendChild(clone);
    fadeInElement(shiftBlock);

    if (!currentShift.pauseStart) {
      const pauseBtn = document.getElementById('pause-btn');
      pauseBtn?.addEventListener('click', pauseShift);

      startTimer(shiftBlock.querySelector('.live-timer'));
    } else {
      const resumeBtn = document.getElementById('resume-btn');
      resumeBtn?.addEventListener('click', resumeShift);
    }

    updateContent('');
  } else {
    currentShift = null;

    updateContent(`
      <h2>Смена не активна</h2>
      <p>Нажмите «Начать смену», чтобы запустить учёт, или добавьте смену вручную.</p>
    `);
  }
}

// --- Логика ---
function startShift() {
  currentShift = {
    startTime: new Date().toISOString(),
    pausedDuration: 0,
    distance: 0,
    orders: 0,
    revenue: 0,
    expenses: 0,
    bonuses: 0
  };

  setStorage(STORAGE.ACTIVE, currentShift);
  refreshUI();
}

function pauseShift() {
  if (!currentShift) return;

  currentShift.pauseStart = Date.now();
  setStorage(STORAGE.ACTIVE, currentShift);

  refreshUI();
}

function resumeShift() {
  if (!currentShift || !currentShift.pauseStart) return;

  currentShift.pausedDuration =
    (currentShift.pausedDuration || 0) + (Date.now() - currentShift.pauseStart);

  delete currentShift.pauseStart;

  setStorage(STORAGE.ACTIVE, currentShift);

  refreshUI();
}

function stopShift() {
  if (!currentShift) {
    window.location.href = 'index1.html';
    return;
  }

  const start = new Date(currentShift.startTime).getTime();

  let paused = currentShift.pausedDuration || 0;

  if (currentShift.pauseStart) {
    paused += Date.now() - currentShift.pauseStart;
  }

  const diff = Date.now() - start - paused;

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const currentDate = new Date(start).toISOString().split('T')[0];

  setStorage(STORAGE.LAST, {
    date: currentDate,
    hours,
    minutes,
    distance: currentShift.distance || 0,
    orders: currentShift.orders || 0,
    revenue: currentShift.revenue || 0,
    expenses: currentShift.expenses || 0,
    bonuses: currentShift.bonuses || 0
  });

  window.location.href = 'index1.html';
}

// --- Контент ---
function updateContent(html) {
  if (!contentEl) return;

  contentEl.innerHTML = html;
  contentEl.style.display = html ? 'block' : 'none';
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  refreshUI();

  if (shiftBtn) {
    shiftBtn.addEventListener('click', () => {
      isShiftActive() ? stopShift() : startShift();
    });
  }

  const addShiftBtn = document.getElementById('add-shift-btn');
  if (addShiftBtn) {
    addShiftBtn.addEventListener('click', () => {
      window.location.href = 'index1.html';
    });
  }

  const viewShiftsBtn = document.getElementById('view-shifts-btn');
  if (viewShiftsBtn) {
    viewShiftsBtn.addEventListener('click', () => {
      window.location.href = 'index2.html';
    });
  }
});

// --- Оптимизация ---
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (timerInterval) cancelAnimationFrame(timerInterval);
  } else {
    const timerEl = shiftBlock.querySelector('.live-timer');
    startTimer(timerEl);
  }
});