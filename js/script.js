// ===== Storage Keys =====
const STORAGE_KEY_TRANSACTIONS = 'expense_transactions';
const STORAGE_KEY_LIMIT        = 'expense_limit';
const STORAGE_KEY_THEME        = 'expense_theme';

// ===== Currency Config =====
const CURRENCY = { locale: 'id-ID', currency: 'IDR', symbol: 'Rp' };

// ===== App State =====
let transactions  = [];
let spendingLimit = 0;
let chartInstance = null;
let pendingDeleteId = null; // id waiting for modal confirmation

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
const chartCanvas     = document.getElementById('spending-chart');
const toastContainer  = document.getElementById('toast-container');
const confirmModal    = document.getElementById('confirm-modal');
const modalSubtitle   = document.getElementById('modal-subtitle');
const modalCancel     = document.getElementById('modal-cancel');
const modalConfirm    = document.getElementById('modal-confirm');

// ===== Currency Formatter =====
function formatCurrency(amount) {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ===== Toast Notifications =====
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

// ===== Delete Confirmation Modal =====
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
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) closeConfirmModal();
});
modalConfirm.addEventListener('click', () => {
  if (pendingDeleteId !== null) {
    const tx = transactions.find(t => t.id === pendingDeleteId);
    transactions = transactions.filter(t => t.id !== pendingDeleteId);
    saveTransactions();
    renderAll();
    closeConfirmModal();
    showToast(`Deleted "${tx?.name}"`, 'error');
  }
});

// ===== Init =====
function init() {
  loadFromStorage();
  applyTheme();
  renderAll();
}

// ===== Storage =====
function loadFromStorage() {
  const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
  transactions = stored ? JSON.parse(stored) : [];

  const storedLimit = localStorage.getItem(STORAGE_KEY_LIMIT);
  spendingLimit = storedLimit ? parseFloat(storedLimit) : 0;
  if (spendingLimit > 0) limitInput.value = spendingLimit;
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
}

function saveLimit() {
  localStorage.setItem(STORAGE_KEY_LIMIT, spendingLimit);
}

function saveTheme(isDark) {
  localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
}

// ===== Theme =====
function applyTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  const isDark = saved === 'dark';
  document.body.classList.toggle('dark', isDark);
  themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark');
  themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  saveTheme(isDark);
  renderChart();
});

// ===== Form Submit =====
form.addEventListener('submit', (e) => {
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
  if (spendingLimit > 0) {
    showToast(`Spending limit set to ${formatCurrency(spendingLimit)}`, 'info');
  }
});

function checkSpendingLimit() {
  const total = getTotal();
  if (spendingLimit > 0 && total > spendingLimit) {
    showToast(`⚠️ You've exceeded your spending limit of ${formatCurrency(spendingLimit)}!`, 'warning', 4000);
  }
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

// Category emoji map
const CATEGORY_EMOJI = { Food: '🍔', Transport: '🚗', Fun: '🎮' };

function renderTransactionList() {
  const sorted = getSortedTransactions();
  transactionList.innerHTML = '';

  if (sorted.length === 0) {
    transactionList.innerHTML = `
      <li class="empty-state">
        <span class="empty-icon">💸</span>
        <span class="empty-title">No transactions yet</span>
        <span class="empty-sub">Add one above to get started</span>
      </li>`;
    return;
  }

  sorted.forEach(t => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.innerHTML = `
      <span class="category-badge" aria-hidden="true">${CATEGORY_EMOJI[t.category] || '📦'}</span>
      <div class="transaction-info">
        <div class="transaction-name">${escapeHtml(t.name)}</div>
        <div class="transaction-meta">${t.category}</div>
      </div>
      <span class="transaction-amount">${formatCurrency(t.amount)}</span>
      <button class="btn-delete" aria-label="Delete ${escapeHtml(t.name)}" data-id="${t.id}" title="Delete">✕</button>
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

  const categories = ['Food', 'Transport', 'Fun'];
  const rawData = categories.map(cat =>
    transactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0)
  );

  const isDark     = document.body.classList.contains('dark');
  const labelColor = isDark ? '#f1f5f9' : '#1a1a2e';
  const hasData    = rawData.some(v => v > 0);

  const chartData = {
    labels: hasData ? categories : ['No data'],
    datasets: [{
      data:            hasData ? rawData : [1],
      backgroundColor: hasData ? ['#f97316', '#6366f1', '#22c55e'] : ['#cbd5e1'],
      borderColor:     isDark ? '#1e293b' : '#ffffff',
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
            labels: { color: labelColor, padding: 14, font: { size: 13 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => hasData ? ` ${formatCurrency(ctx.parsed)}` : '',
            },
          },
        },
      },
    });
  }
}

// ===== XSS Guard =====
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== Boot =====
init();
