import { STORAGE, getStorage, setStorage } from './settings.js';

// --- элементы ---
const listEl = document.getElementById('shift-list');
const backBtn = document.getElementById('back-btn');

// --- модалка удаления ---
const deleteModal = document.getElementById('delete-modal');
const deleteConfirmBtn = document.getElementById('delete-confirm');
const deleteCancelBtn = document.getElementById('delete-cancel');

// --- backup меню ---
const headerMenuBtn = document.getElementById('header-menu-btn');
const backupModal = document.getElementById('backup-modal');
const backupSaveBtn = document.getElementById('backup-save');
const backupLoadBtn = document.getElementById('backup-load');
const backupCloseBtn = document.getElementById('backup-close');
const backupFileInput = document.getElementById('backup-file');

let shiftToDeleteId = null;

// --- TOAST ---
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2000);
}

// --- формат даты ---
function formatDate(dateString) {
  if (!dateString) return '';

  const inputDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const d1 = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
  const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d3 = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (d1.getTime() === d2.getTime()) return 'Сегодня';
  if (d1.getTime() === d3.getTime()) return 'Вчера';

  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

// --- время ---
function formatDuration(hours, minutes) {
  const total = hours + minutes / 60;
  const rounded = Math.round(total * 10) / 10;
  return `~${rounded} ч`;
}

function formatHeader(date, hours, minutes) {
  return `${formatDate(date)} • ${formatDuration(hours, minutes)}`;
}

// --- storage ---
function getShifts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.SHIFTS)) || [];
  } catch {
    return [];
  }
}

function saveShifts(shifts) {
  localStorage.setItem(STORAGE.SHIFTS, JSON.stringify(shifts));
}

// --- УДАЛЕНИЕ ---
function requestDelete(id) {
  shiftToDeleteId = id;
  deleteModal.classList.add('show');
}

function confirmDelete() {
  let shifts = getShifts();
  shifts = shifts.filter(s => s.id !== shiftToDeleteId);
  saveShifts(shifts);

  deleteModal.classList.remove('show');
  shiftToDeleteId = null;

  render();
  showToast('Смена удалена');
}

function cancelDelete() {
  deleteModal.classList.remove('show');
  shiftToDeleteId = null;
}

// --- редактирование ---
function editShift(shift) {
  setStorage('edit_shift', shift);
  setStorage('return_to', 'index2.html');
  window.location.href = 'index1.html';
}

// --- 🔥 СТАБИЛЬНЫЙ BACKUP ---
async function saveBackup() {
  const shifts = localStorage.getItem(STORAGE.SHIFTS);

  const data = {
    shifts: JSON.parse(shifts || "[]"),
    exportDate: new Date().toISOString()
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  backupModal.classList.remove('show');

  // 📱 пробуем Share
  try {
    if (navigator.share) {
      const file = new File([blob], "yabombila-backup.json", {
        type: "application/json"
      });

      await navigator.share({
        title: "Backup Я.Бомбила",
        text: "Сохранить backup",
        files: [file]
      });

      showToast("Выбери куда сохранить");
      return;
    }
  } catch (e) {
    console.log("Share отменён или не поддерживается");
  }

  // 💻 fallback — скачивание
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "yabombila-backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showToast("Файл скачан");

  } catch (e) {
    console.error(e);
    showToast("Не удалось сохранить");
  }
}

// --- ЗАГРУЗКА BACKUP ---
function loadBackup(file) {
  const reader = new FileReader();

  reader.onload = function(event) {
    try {
      const data = JSON.parse(event.target.result);

      if (!data.shifts) {
        alert("Неверный файл");
        return;
      }

      localStorage.setItem(
        STORAGE.SHIFTS,
        JSON.stringify(data.shifts)
      );

      render();
      showToast("Backup загружен");
      backupModal.classList.remove('show');

    } catch {
      alert("Ошибка файла");
    }
  };

  reader.readAsText(file);
}

// --- РЕНДЕР ---
function render() {
  const shifts = getShifts().sort((a, b) => b.id - a.id);

  listEl.innerHTML = '';

  if (!shifts.length) {
    listEl.innerHTML = '<p>Смен пока нет</p>';
    return;
  }

  shifts.forEach(s => {
    const item = document.createElement('div');
    item.className = 'shift-item';

    const profit = (s.revenue + s.bonuses - s.expenses);

    item.innerHTML = `
      <div class="menu">
        <button class="menu-btn">⋯</button>
        <div class="menu-dropdown hidden">
          <button class="menu-item edit">Редактировать</button>
          <button class="menu-item delete">Удалить</button>
        </div>
      </div>

      <div class="shift-top">
        <span class="shift-date">
          ${formatHeader(s.date, s.hours, s.minutes)}
        </span>
      </div>

      <div class="shift-main">
        <div class="metric">
          <span>Доход</span>
          <strong>${s.revenue}</strong>
        </div>

        <div class="metric">
          <span>Расход</span>
          <strong>${s.expenses}</strong>
        </div>

        <div class="metric profit ${profit >= 0 ? 'positive' : 'negative'}">
          <span>Прибыль</span>
          <strong>${profit}</strong>
        </div>
      </div>

      <div class="shift-bottom">
        <span>🚗 ${s.distance || 0} км</span>
        <span>📦 ${s.orders || 0} заказов</span>
      </div>
    `;

    const menuBtn = item.querySelector('.menu-btn');
    const dropdown = item.querySelector('.menu-dropdown');

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      document.querySelectorAll('.menu-dropdown').forEach(d => {
        d.classList.add('hidden');
      });

      dropdown.classList.toggle('hidden');
    });

    dropdown.addEventListener('click', (e) => e.stopPropagation());

    dropdown.querySelector('.edit').addEventListener('click', () => {
      editShift(s);
    });

    dropdown.querySelector('.delete').addEventListener('click', () => {
      requestDelete(s.id);
    });

    listEl.appendChild(item);
  });
}

// --- СОБЫТИЯ ---
document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu')) {
    document.querySelectorAll('.menu-dropdown').forEach(d => {
      d.classList.add('hidden');
    });
  }
});

deleteConfirmBtn?.addEventListener('click', confirmDelete);
deleteCancelBtn?.addEventListener('click', cancelDelete);

deleteModal?.addEventListener('click', (e) => {
  if (e.target === deleteModal) cancelDelete();
});

headerMenuBtn?.addEventListener('click', () => {
  backupModal.classList.add('show');
});

backupCloseBtn?.addEventListener('click', () => {
  backupModal.classList.remove('show');
});

backupModal?.addEventListener('click', (e) => {
  if (e.target === backupModal) {
    backupModal.classList.remove('show');
  }
});

backupSaveBtn?.addEventListener('click', saveBackup);

backupLoadBtn?.addEventListener('click', () => {
  backupFileInput.click();
});

backupFileInput?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) loadBackup(file);
});

backBtn?.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  render();

  const toastType = getStorage('toast', null);

  if (toastType === 'updated') showToast('Смена обновлена');
  if (toastType === 'created') showToast('Смена добавлена');

  if (toastType) localStorage.removeItem('toast');
});