// ===== Storage Keys =====
const STORAGE_KEY_TRANSACTIONS = 'expense_transactions';
const STORAGE_KEY_LIMIT        = 'expense_limit';
const STORAGE_KEY_THEME        = 'expense_theme';
const STORAGE_KEY_CATEGORIES   = 'expense_categories';
const STORAGE_KEY_CURRENCY     = 'expense_currency';

// ===== Currency Config =====
const CURRENCIES = {
  IDR: { locale: 'id-ID', currency: 'IDR', label: 'IDR (Rp)', decimals: 0 },
  USD: { locale: 'en-US', currency: 'USD', label: 'USD ($)',  decimals: 2 },
};
let activeCurrency = 'IDR';

// ===== Built-in Categories =====
const BUILTIN_CATEGORIES = ['Food', 'Transport', 'Fun'];

// Palette for custom category colors
const COLOR_PALETTE = [
  '#f97316','#6366f1','#22c55e','#ec4899','#14b8a6',
  '#f59e0b','#8b5cf6','#06b6d4','#84cc16','#ef4444',
];

// ===== App State =====
let transactions     = [];
let spendingLimit    = 0;
let chartInstance    = null;
let pendingDeleteId  = null;
let customCategories = []; // [{ name, color }]

// ===== DOM References =====
const form            = document.getElementById('transaction-form');
const itemNameInput   = document.getElementById('item-name');
const amountInput     = document.getElementById('amount');
const categorySelect  = document.getElementById('category');
const formError       = document.getElementById('form-error');
const transactionList = document.getElementById('transaction-list');
const totalBalanceEl  = document.getElementById('total-balance');
const limitInput      = document.getElementById('spending-limit');
const setLimitBtn     = document.getElementById('set-limit-btn');
const sortSelect      = document.getElementById('sort-select');
const themeToggle     = document.getElementById('theme-toggle');
const themeLabel      = document.getElementById('theme-label');
const themeIcon       = document.getElementById('theme-icon');
const chartCanvas     = document.getElementById('spending-chart');
const toastContainer  = document.getElementById('toast-container');
const currencyToggle  = document.getElementById('currency-toggle');
const amountLabel     = document.getElementById('amount-label');
const limitLabel      = document.getElementById('limit-label');
// Delete modal
const confirmModal  = document.getElementById('confirm-modal');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalCancel   = document.getElementById('modal-cancel');
const modalConfirm  = document.getElementById('modal-confirm');
// Category modal
const categoryModal = document.getElementById('category-modal');
const manageCatBtn  = document.getElementById('manage-cat-btn');
const newCatInput   = document.getElementById('new-cat-input');
const newCatBtn     = document.getElementById('new-cat-btn');
const catError      = document.getElementById('cat-error');
const catListEl     = document.getElementById('cat-list');
const catModalClose = document.getElementById('cat-modal-close');
// Limit bar
const limitBarWrap = document.getElementById('limit-bar-wrap');
const limitBar     = document.getElementById('limit-bar');
const limitCaption = document.getElementById('limit-caption');

// ===== Currency =====
function formatCurrency(amount) {
  const c = CURRENCIES[activeCurrency];
  return new Intl.NumberFormat(c.locale, {
    style: 'currency', currency: c.currency,
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  }).format(amount);
}

function applyCurrencyLabels() {
  const c = CURRENCIES[activeCurrency];
  // Update form labels
  amountLabel.textContent = `Amount (${c.currency === 'IDR' ? 'Rp' : '$'})`;
  limitLabel.textContent  = `Monthly Spending Limit (${c.currency === 'IDR' ? 'Rp' : '$'})`;
  // Update toggle button text
  const other = activeCurrency === 'IDR' ? 'USD' : 'IDR';
  currencyToggle.textContent = `Switch to ${CURRENCIES[other].label}`;
}

function saveCurrency() {
  localStorage.setItem(STORAGE_KEY_CURRENCY, activeCurrency);
}

currencyToggle.addEventListener('click', () => {
  activeCurrency = activeCurrency === 'IDR' ? 'USD' : 'IDR';
  saveCurrency();
  applyCurrencyLabels();
  renderAll();
  showToast(`Currency switched to ${CURRENCIES[activeCurrency].label}`, 'info');
});

// ===== Category Helpers =====
function getAllCategories() {
  const builtinColors = { Food: '#f97316', Transport: '#6366f1', Fun: '#22c55e' };
  const builtins = BUILTIN_CATEGORIES.map(n => ({ name: n, color: builtinColors[n], builtin: true }));
  return [...builtins, ...customCategories.map(c => ({ ...c, builtin: false }))];
}

function getCategoryColor(name) {
  const cat = getAllCategories().find(c => c.name === name);
  return cat ? cat.color : '#94a3b8';
}

function nextPaletteColor() {
  const used = getAllCategories().map(c => c.color);
  return COLOR_PALETTE.find(c => !used.includes(c)) || COLOR_PALETTE[customCategories.length % COLOR_PALETTE.length];
}

function saveCategories() {
  localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(customCategories));
}

function populateCategorySelect() {
  const current = categorySelect.value;
  categorySelect.innerHTML = '<option value="">-- Select --</option>';
  getAllCategories().forEach(({ name }) => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    categorySelect.appendChild(opt);
  });
  if ([...categorySelect.options].some(o => o.value === current)) {
    categorySelect.value = current;
  }
}

// ===== Toast =====
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

// ===== Delete Modal =====
function openConfirmModal(id, name) {
  pendingDeleteId = id;
  modalSubtitle.textContent = `"${name}" will be permanently removed.`;
  confirmModal.classList.remove('hidden');
  modalConfirm.focus();
}
function closeConfirmModal() {
  confirmModal.classList.add('hidden');
  pendingDeleteId = null;
}
modalCancel.addEventListener('click', closeConfirmModal);
confirmModal.addEventListener('click', e => { if (e.target === confirmModal) closeConfirmModal(); });
modalConfirm.addEventListener('click', () => {
  if (pendingDeleteId === null) return;
  const tx = transactions.find(t => t.id === pendingDeleteId);
  transactions = transactions.filter(t => t.id !== pendingDeleteId);
  saveTransactions();
  renderAll();
  closeConfirmModal();
  showToast(`Deleted "${tx?.name}"`, 'error');
});

// ===== Category Modal =====
manageCatBtn.addEventListener('click', () => {
  renderCatList();
  catError.classList.add('hidden');
  newCatInput.value = '';
  categoryModal.classList.remove('hidden');
  newCatInput.focus();
});
catModalClose.addEventListener('click', () => categoryModal.classList.add('hidden'));
categoryModal.addEventListener('click', e => { if (e.target === categoryModal) categoryModal.classList.add('hidden'); });
newCatBtn.addEventListener('click', addCustomCategory);
newCatInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); } });

function addCustomCategory() {
  const name = newCatInput.value.trim();
  const allNames = getAllCategories().map(c => c.name.toLowerCase());
  if (!name || allNames.includes(name.toLowerCase())) {
    catError.classList.remove('hidden');
    return;
  }
  catError.classList.add('hidden');
  customCategories.push({ name, color: nextPaletteColor() });
  saveCategories();
  populateCategorySelect();
  renderCatList();
  renderChart();
  newCatInput.value = '';
  showToast(`Category "${name}" added`, 'success');
}

function deleteCustomCategory(name) {
  customCategories = customCategories.filter(c => c.name !== name);
  saveCategories();
  populateCategorySelect();
  renderCatList();
  renderAll();
  showToast(`Category "${name}" removed`, 'info');
}

function renderCatList() {
  catListEl.innerHTML = '';
  getAllCategories().forEach(({ name, color, builtin }) => {
    const li = document.createElement('li');
    li.className = 'cat-item';
    li.innerHTML = `
      <span class="cat-dot" style="background:${color}"></span>
      <span class="cat-name">${escapeHtml(name)}</span>
      ${builtin
        ? '<span class="cat-built-in">built-in</span>'
        : `<button class="btn-cat-delete" data-name="${escapeHtml(name)}" title="Remove">&#x2715;</button>`
      }
    `;
    catListEl.appendChild(li);
  });
  catListEl.querySelectorAll('.btn-cat-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteCustomCategory(btn.dataset.name));
  });
}

// ===== Init =====
function init() {
  loadFromStorage();
  applyTheme();
  applyCurrencyLabels();
  populateCategorySelect();
  renderAll();
}

// ===== Storage =====
function loadFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
  transactions = stored ? JSON.parse(stored) : [];

  const storedLimit = localStorage.getItem(STORAGE_KEY_LIMIT);
  spendingLimit = storedLimit ? parseFloat(storedLimit) : 0;
  if (spendingLimit > 0) limitInput.value = spendingLimit;

  const storedCats = localStorage.getItem(STORAGE_KEY_CATEGORIES);
  customCategories = storedCats ? JSON.parse(storedCats) : [];

  const storedCurrency = localStorage.getItem(STORAGE_KEY_CURRENCY);
  if (storedCurrency && CURRENCIES[storedCurrency]) activeCurrency = storedCurrency;
}

function saveTransactions() { localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions)); }
function saveLimit()        { localStorage.setItem(STORAGE_KEY_LIMIT, spendingLimit); }
function saveTheme(isDark)  { localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light'); }

// ===== Theme =====
function applyTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  const isDark = saved === 'dark';
  document.body.classList.toggle('dark', isDark);
  themeIcon.textContent  = isDark ? '🌙' : '☀️';
  themeLabel.textContent = isDark ? 'Turn on Flashlight' : 'Turn off Flashlight';
}
themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  themeIcon.textContent  = isDark ? '🌙' : '☀️';
  themeLabel.textContent = isDark ? 'Turn on Flashlight' : 'Turn off Flashlight';
  saveTheme(isDark);
  renderChart();
});

// ===== Form Submit =====
form.addEventListener('submit', e => {
  e.preventDefault();
  const name     = itemNameInput.value.trim();
  const amount   = parseFloat(amountInput.value);
  const category = categorySelect.value;

  if (!name || isNaN(amount) || amount <= 0 || !category) {
    formError.classList.remove('hidden');
    return;
  }
  formError.classList.add('hidden');
  transactions.push({ id: Date.now(), name, amount, category });
  saveTransactions();
  renderAll();
  form.reset();
  showToast(`Added "${name}" — ${formatCurrency(amount)}`, 'success');
});

// ===== Spending Limit =====
setLimitBtn.addEventListener('click', () => {
  const val = parseFloat(limitInput.value);
  spendingLimit = (!isNaN(val) && val > 0) ? val : 0;
  saveLimit();
  renderAll();
  if (spendingLimit > 0) showToast(`Limit set to ${formatCurrency(spendingLimit)}`, 'info');
});

function updateLimitBar() {
  const total = getTotal();
  if (spendingLimit <= 0) {
    limitBarWrap.classList.add('hidden');
    limitCaption.classList.add('hidden');
    return;
  }
  const pct = Math.min((total / spendingLimit) * 100, 100);
  limitBarWrap.classList.remove('hidden');
  limitCaption.classList.remove('hidden');
  limitBar.style.width = pct + '%';
  limitBar.classList.toggle('over', total > spendingLimit);
  limitCaption.textContent = `${formatCurrency(total)} / ${formatCurrency(spendingLimit)}`;
}

function checkSpendingLimit() {
  const total = getTotal();
  if (spendingLimit > 0 && total > spendingLimit) {
    showToast(`Spending limit exceeded! (${formatCurrency(spendingLimit)})`, 'warning', 4000);
  }
  updateLimitBar();
}

// ===== Sorting =====
function getSortedTransactions() {
  const mode = sortSelect.value;
  const copy = [...transactions];
  if (mode === 'amount-asc')  copy.sort((a, b) => a.amount - b.amount);
  if (mode === 'amount-desc') copy.sort((a, b) => b.amount - a.amount);
  if (mode === 'category')    copy.sort((a, b) => a.category.localeCompare(b.category));
  return copy;
}
sortSelect.addEventListener('change', () => renderTransactionList());

// ===== Render =====
function getTotal() {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

function renderAll() {
  renderBalance();
  renderTransactionList();
  renderChart();
  checkSpendingLimit();
}

function renderBalance() {
  totalBalanceEl.textContent = formatCurrency(getTotal());
}

function renderTransactionList() {
  const sorted = getSortedTransactions();
  transactionList.innerHTML = '';

  if (sorted.length === 0) {
    transactionList.innerHTML = `
      <li class="empty-state">
        <span class="empty-title">No transactions yet</span>
        <span class="empty-sub">Add one above to get started</span>
      </li>`;
    return;
  }

  sorted.forEach(t => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    const color = getCategoryColor(t.category);
    li.innerHTML = `
      <span class="category-dot" style="background:${color}" aria-hidden="true"></span>
      <div class="transaction-info">
        <div class="transaction-name">${escapeHtml(t.name)}</div>
        <div class="transaction-meta">${escapeHtml(t.category)}</div>
      </div>
      <span class="transaction-amount">${formatCurrency(t.amount)}</span>
      <button class="btn-delete" aria-label="Delete ${escapeHtml(t.name)}" data-id="${t.id}" title="Delete">&#x2715;</button>
    `;
    transactionList.appendChild(li);
  });

  transactionList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const tx = transactions.find(t => t.id === Number(btn.dataset.id));
      if (tx) openConfirmModal(tx.id, tx.name);
    });
  });
}

function renderChart() {
  if (typeof Chart === 'undefined') return;

  const allCats = getAllCategories();
  const labels  = allCats.map(c => c.name);
  const rawData = allCats.map(c =>
    transactions.filter(t => t.category === c.name).reduce((sum, t) => sum + t.amount, 0)
  );
  const colors = allCats.map(c => c.color);

  const isDark     = document.body.classList.contains('dark');
  const labelColor = isDark ? '#f1f5f9' : '#0f172a';
  const hasData    = rawData.some(v => v > 0);

  const chartData = {
    labels: hasData ? labels : ['No data'],
    datasets: [{
      data:            hasData ? rawData : [1],
      backgroundColor: hasData ? colors  : ['#cbd5e1'],
      borderColor:     isDark ? '#161f30' : '#ffffff',
      borderWidth: 2,
    }],
  };

  if (chartInstance) {
    chartInstance.data = chartData;
    chartInstance.options.plugins.legend.labels.color = labelColor;
    chartInstance.update();
  } else {
    chartInstance = new Chart(chartCanvas, {
      type: 'pie',
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: labelColor, padding: 14, font: { size: 12, family: 'Inter' } },
          },
          tooltip: {
            callbacks: {
              label: ctx => hasData ? ` ${formatCurrency(ctx.parsed)}` : '',
            },
          },
        },
      },
    });
  }
}

// ===== XSS Guard =====
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== Boot =====
init();
