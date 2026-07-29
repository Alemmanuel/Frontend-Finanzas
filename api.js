const API_URL = 'https://backend-finanzas-m3fb.onrender.com/api';
let CURRENT_USER_ID = null;

function setCurrentUser(googleId) {
  CURRENT_USER_ID = googleId;
}

function isLocalStorageAvailable() {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch(e) {
    return false;
  }
}

function getLocalStorageKey() {
  return CURRENT_USER_ID ? `financial_transactions_${CURRENT_USER_ID}` : 'financial_transactions';
}

function getBudgetKey() {
  return CURRENT_USER_ID ? `budgets_${CURRENT_USER_ID}` : 'budgets';
}

async function fallbackGetTransactions() {
  const storedData = localStorage.getItem(getLocalStorageKey());
  return { data: storedData ? JSON.parse(storedData) : [] };
}

async function fallbackAddTransaction(data) {
  const storedData = localStorage.getItem(getLocalStorageKey());
  const transactions = storedData ? JSON.parse(storedData) : [];
  const newTransaction = {
    ...data,
    id: Date.now() + Math.random(),
    type: data.tipo === 'Ingreso' ? 'income' : 'expense',
    amount: Number(data.monto),
    description: data.descripcion,
    date: data.fecha,
    category: data.tipo === 'Ingreso' ? null : (data.categoria || null)
  };
  transactions.push(newTransaction);
  localStorage.setItem(getLocalStorageKey(), JSON.stringify(transactions));
  return { message: 'Transacción agregada', transaction: newTransaction };
}

async function fallbackDeleteTransaction(id) {
  const storedData = localStorage.getItem(getLocalStorageKey());
  if (!storedData) return { message: 'No hay transacciones' };
  const transactions = JSON.parse(storedData);
  const filtered = transactions.filter(t => t.id !== id);
  localStorage.setItem(getLocalStorageKey(), JSON.stringify(filtered));
  return { message: 'Transacción eliminada', id };
}

async function fallbackDeleteAllTransactions() {
  localStorage.removeItem(getLocalStorageKey());
  return { message: 'Todos los datos han sido eliminados' };
}

async function fallbackUpdateTransaction(id, updates) {
  const storedData = localStorage.getItem(getLocalStorageKey());
  const transactions = storedData ? JSON.parse(storedData) : [];
  let updated = false;
  const updatedTransactions = transactions.map(t => {
    if (t.id !== id) return t;
    updated = true;
    return { ...t, ...updates };
  });
  if (!updated) throw new Error('No se encontró la transacción');
  localStorage.setItem(getLocalStorageKey(), JSON.stringify(updatedTransactions));
  return { message: 'Transacción actualizada', id };
}

const api = {
  async getTransactions() {
    if (!CURRENT_USER_ID) return { data: [] };
    try {
      const res = await fetch(`${API_URL}/transactions?user_id=${CURRENT_USER_ID}`);
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      console.warn('API no disponible, usando localStorage como fallback');
      apiFallbackWarning();
      return fallbackGetTransactions();
    }
  },

  async addTransaction(transaction) {
    if (!CURRENT_USER_ID) throw new Error('Usuario no autenticado');
    const body = {
      type: transaction.tipo === 'Ingreso' ? 'income' : 'expense',
      amount: Number(transaction.monto),
      description: transaction.descripcion,
      date: transaction.fecha,
      category: transaction.tipo === 'Gasto' ? (transaction.categoria || null) : null,
      user_id: CURRENT_USER_ID
    };
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      console.warn('API no disponible, guardando en localStorage');
      apiFallbackWarning();
      return fallbackAddTransaction(transaction);
    }
  },

  async deleteTransaction(id) {
    if (!CURRENT_USER_ID) throw new Error('Usuario no autenticado');
    try {
      const res = await fetch(`${API_URL}/transactions/${id}?user_id=${CURRENT_USER_ID}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      console.warn('API no disponible, eliminando en localStorage');
      apiFallbackWarning();
      return fallbackDeleteTransaction(id);
    }
  },

  async deleteAllTransactions() {
    if (!CURRENT_USER_ID) throw new Error('Usuario no autenticado');
    try {
      const res = await fetch(`${API_URL}/transactions/all?user_id=${CURRENT_USER_ID}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      console.warn('API no disponible, limpiando localStorage');
      apiFallbackWarning();
      return fallbackDeleteAllTransactions();
    }
  },

  async updateTransaction(id, updates) {
    if (!CURRENT_USER_ID) throw new Error('Usuario no autenticado');
    const body = {
      ...updates,
      user_id: CURRENT_USER_ID
    };
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      console.warn('API no disponible, actualizando en localStorage');
      apiFallbackWarning();
      return fallbackUpdateTransaction(id, updates);
    }
  },

  // --- BUDGETS ---

  async getBudgets() {
    if (!CURRENT_USER_ID) return { data: [] };
    try {
      const res = await fetch(`${API_URL}/budgets?user_id=${CURRENT_USER_ID}`);
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      console.warn('API no disponible, usando localStorage');
      apiFallbackWarning();
      const data = JSON.parse(localStorage.getItem(getBudgetKey()) || '[]');
      return { data };
    }
  },

  async saveBudget(category, limit_amount) {
    if (!CURRENT_USER_ID) throw new Error('Usuario no autenticado');
    try {
      const res = await fetch(`${API_URL}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: CURRENT_USER_ID, category, limit_amount })
      });
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      console.warn('API no disponible, guardando en localStorage');
      apiFallbackWarning();
      const budgets = JSON.parse(localStorage.getItem(getBudgetKey()) || '[]');
      const existing = budgets.find(b => b.category === category);
      if (existing) existing.limit_amount = limit_amount;
      else budgets.push({ category, limit_amount });
      localStorage.setItem(getBudgetKey(), JSON.stringify(budgets));
      return { data: { category, limit_amount } };
    }
  },

  async deleteBudget(category) {
    if (!CURRENT_USER_ID) throw new Error('Usuario no autenticado');
    try {
      const res = await fetch(`${API_URL}/budgets/${encodeURIComponent(category)}?user_id=${CURRENT_USER_ID}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('API no disponible');
      return await res.json();
    } catch {
      console.warn('API no disponible, eliminando en localStorage');
      apiFallbackWarning();
      let budgets = JSON.parse(localStorage.getItem(getBudgetKey()) || '[]');
      budgets = budgets.filter(b => b.category !== category);
      localStorage.setItem(getBudgetKey(), JSON.stringify(budgets));
      return { message: 'Presupuesto eliminado' };
    }
  }
};

function apiFallbackWarning() {
    if (typeof window.updateApiStatus === 'function') {
        window.updateApiStatus(false);
    }
}

window.setCurrentUser = setCurrentUser;
window.getStorageKey = getLocalStorageKey;
window.getBudgetKey = getBudgetKey;
window.API_URL = API_URL;
window.apiFallbackWarning = apiFallbackWarning;
