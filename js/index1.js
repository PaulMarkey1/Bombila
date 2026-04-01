import {
  STORAGE,
  getStorage,
  setStorage,
  removeStorage,
  toPositiveNumber,
  calculateProfit,
  generateId
} from './settings.js';

// --- Элементы ---
const form = document.getElementById('shift-form');

const inputDate = document.getElementById('shift-date');
const inputHours = document.getElementById('shift-hours');
const inputMinutes = document.getElementById('shift-minutes');
const inputDistance = document.getElementById('shift-distance');
const inputOrders = document.getElementById('shift-orders');
const inputRevenue = document.getElementById('shift-revenue');
const inputExpenses = document.getElementById('shift-expenses');
const inputBonuses = document.getElementById('shift-bonuses');

const cancelBtn = document.getElementById('cancel-btn');
const finishBtn = document.getElementById('finish-without-save');

const modal = document.getElementById('back-modal');
const modalOk = document.getElementById('back-modal-ok');

const confirmModal = document.getElementById('confirm-modal');
const confirmYes = document.getElementById('confirm-yes');
const confirmNo = document.getElementById('confirm-no');

// --- режим редактирования ---
let editingShiftId = null;

// --- Дата по умолчанию ---
if (inputDate) {
  inputDate.value = new Date().toISOString().split('T')[0];
}

// --- LAST ---
const lastShift = getStorage(STORAGE.LAST, null);

if (lastShift) {
  inputDate.value = lastShift.date || inputDate.value;
  inputHours.value = lastShift.hours ?? 0;
  inputMinutes.value = lastShift.minutes ?? 0;

  inputDistance.value = lastShift.distance || '';
  inputOrders.value = lastShift.orders || '';
  inputRevenue.value = lastShift.revenue || '';
  inputExpenses.value = lastShift.expenses || '';
  inputBonuses.value = lastShift.bonuses || '';

  removeStorage(STORAGE.LAST);
}

// --- EDIT ---
const editShift = getStorage('edit_shift', null);

if (editShift) {
  editingShiftId = editShift.id;

  inputDate.value = editShift.date;
  inputHours.value = editShift.hours;
  inputMinutes.value = editShift.minutes;

  inputDistance.value = editShift.distance || '';
  inputOrders.value = editShift.orders || '';
  inputRevenue.value = editShift.revenue || '';
  inputExpenses.value = editShift.expenses || '';
  inputBonuses.value = editShift.bonuses || '';

  if (finishBtn) finishBtn.style.display = 'none';

  removeStorage('edit_shift');
}

// --- SAVE ---
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();

    const shifts = getStorage(STORAGE.SHIFTS, []);

    const newShift = {
      id: editingShiftId || generateId(),
      date: inputDate.value,
      hours: toPositiveNumber(inputHours.value),
      minutes: toPositiveNumber(inputMinutes.value),
      distance: toPositiveNumber(inputDistance.value),
      orders: toPositiveNumber(inputOrders.value),
      revenue: toPositiveNumber(inputRevenue.value),
      expenses: toPositiveNumber(inputExpenses.value),
      bonuses: toPositiveNumber(inputBonuses.value)
    };

    newShift.profit = calculateProfit(newShift);

    if (editingShiftId) {
      const index = shifts.findIndex(s => s.id === editingShiftId);
      if (index !== -1) shifts[index] = newShift;
    } else {
      shifts.push(newShift);
    }

    setStorage(STORAGE.SHIFTS, shifts);
    removeStorage(STORAGE.ACTIVE);

    // 🔥 toast
    setStorage('toast', editingShiftId ? 'updated' : 'created');

    const returnTo = getStorage('return_to', 'index2.html');
    removeStorage('return_to');

    window.location.href = returnTo;
  });
}

// --- BACK ---
cancelBtn?.addEventListener('click', () => {
  const returnTo = getStorage('return_to', null);

  if (returnTo) {
    removeStorage('return_to');
    window.location.href = returnTo;
  } else {
    window.location.href = 'index.html';
  }
});

// --- FINISH ---
finishBtn?.addEventListener('click', () => {
  confirmModal.classList.add('show');
});

confirmNo?.addEventListener('click', () => {
  confirmModal.classList.remove('show');
});

confirmYes?.addEventListener('click', () => {
  confirmModal.classList.remove('show');
  removeStorage(STORAGE.ACTIVE);
  modal.classList.add('show');
});

modalOk?.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// --- CLOSE OUTSIDE ---
confirmModal?.addEventListener('click', (e) => {
  if (e.target === confirmModal) confirmModal.classList.remove('show');
});

modal?.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('show');
});