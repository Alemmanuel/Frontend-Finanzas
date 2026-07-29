const API_URL = 'https://backend-finanzas-m3fb.onrender.com/api';
let CURRENT_USER_ID = null;

function setCurrentUser(googleId) {
  CURRENT_USER_ID = googleId;
}

async function apiFetch(path, options = {}) {
  if (!CURRENT_USER_ID) throw new Error('Usuario no autenticado');
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error del servidor');
  return data;
}

const api = {
  async getTransactions() {
    if (!CURRENT_USER_ID) return { data: [] };
    return apiFetch(`/transactions?user_id=${CURRENT_USER_ID}`);
  },

  async addTransaction(transaction) {
    return apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        type: transaction.tipo === 'Ingreso' ? 'income' : 'expense',
        amount: Number(transaction.monto),
        description: transaction.descripcion,
        date: transaction.fecha,
        category: transaction.tipo === 'Gasto' ? (transaction.categoria || null) : null,
        user_id: CURRENT_USER_ID
      })
    });
  },

  async deleteTransaction(id) {
    return apiFetch(`/transactions/${id}?user_id=${CURRENT_USER_ID}`, {
      method: 'DELETE'
    });
  },

  async deleteAllTransactions() {
    return apiFetch(`/transactions/all?user_id=${CURRENT_USER_ID}`, {
      method: 'DELETE'
    });
  },

  async updateTransaction(id, updates) {
    return apiFetch(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, user_id: CURRENT_USER_ID })
    });
  },

  async getBudgets() {
    if (!CURRENT_USER_ID) return { data: [] };
    return apiFetch(`/budgets?user_id=${CURRENT_USER_ID}`);
  },

  async saveBudget(category, limit_amount) {
    return apiFetch('/budgets', {
      method: 'POST',
      body: JSON.stringify({ user_id: CURRENT_USER_ID, category, limit_amount })
    });
  },

  async deleteBudget(category) {
    return apiFetch(`/budgets/${encodeURIComponent(category)}?user_id=${CURRENT_USER_ID}`, {
      method: 'DELETE'
    });
  }
};

window.setCurrentUser = setCurrentUser;
window.API_URL = API_URL;
