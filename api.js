let CURRENT_USER_ID = null;

function getStorageKey() {
    return CURRENT_USER_ID ? `financial_transactions_${CURRENT_USER_ID}` : 'financial_transactions';
}

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

const api = {
    async getTransactions() {
        try {
            if (!isLocalStorageAvailable()) {
                throw new Error('LocalStorage no está disponible en este contexto');
            }
            const storedData = localStorage.getItem(getStorageKey());
            return { data: storedData ? JSON.parse(storedData) : [] };
        } catch (error) {
            console.error('LocalStorage Error:', error);
            // Si localStorage no está disponible, retornar un array vacío
            return { data: [] };
        }
    },

    async addTransaction(transaction) {
        try {
            if (!isLocalStorageAvailable()) {
                throw new Error('LocalStorage no está disponible en este contexto');
            }

            const storedData = localStorage.getItem(getStorageKey());
            const transactions = storedData ? JSON.parse(storedData) : [];
            
            const newTransaction = {
                ...transaction,
                id: Date.now() + Math.random(), // ID único
                type: transaction.tipo === 'Ingreso' ? 'income' : 'expense',
                amount: Number(transaction.monto),
                description: transaction.descripcion,
                date: transaction.fecha,
                // Categoría manual (solo para gastos). Para ingresos se guarda null.
                category: transaction.tipo === 'Ingreso' ? null : (transaction.categoria || null)
            };
            
            transactions.push(newTransaction);
            localStorage.setItem(getStorageKey(), JSON.stringify(transactions));
            
            return { 
                message: 'Transacción agregada',
                transaction: newTransaction
            };
        } catch (error) {
            console.error('LocalStorage Error:', error);
            throw new Error('No se pudo guardar la transacción: ' + error.message);
        }
    },

    async deleteTransaction(id) {
        try {
            if (!isLocalStorageAvailable()) {
                throw new Error('LocalStorage no está disponible en este contexto');
            }

            const storedData = localStorage.getItem(getStorageKey());
            if (!storedData) return { message: 'No hay transacciones' };

            const transactions = JSON.parse(storedData);
            const filteredTransactions = transactions.filter(t => t.id !== id);
            
            localStorage.setItem(getStorageKey(), JSON.stringify(filteredTransactions));
            return { message: 'Transacción eliminada', id };
        } catch (error) {
            console.error('LocalStorage Error:', error);
            throw new Error('No se pudo eliminar la transacción: ' + error.message);
        }
    },

    async deleteAllTransactions() {
        try {
            if (!isLocalStorageAvailable()) {
                throw new Error('LocalStorage no está disponible en este contexto');
            }
            
            localStorage.removeItem(getStorageKey());
            return { message: 'Todas las transacciones han sido eliminadas' };
        } catch (error) {
            console.error('LocalStorage Error:', error);
            throw new Error('No se pudieron eliminar las transacciones: ' + error.message);
        }
    }
    ,
    async updateTransaction(id, updates) {
        try {
            if (!isLocalStorageAvailable()) {
                throw new Error('LocalStorage no está disponible en este contexto');
            }
            const storedData = localStorage.getItem(getStorageKey());
            const transactions = storedData ? JSON.parse(storedData) : [];

            let updated = false;
            const updatedTransactions = transactions.map(t => {
                if (t.id !== id) return t;
                updated = true;
                return { ...t, ...updates };
            });

            if (!updated) {
                throw new Error('No se encontró la transacción');
            }

            localStorage.setItem(getStorageKey(), JSON.stringify(updatedTransactions));
            return { message: 'Transacción actualizada', id };
        } catch (error) {
            console.error('LocalStorage Error:', error);
            throw new Error('No se pudo actualizar la transacción: ' + error.message);
        }
    }
};

window.setCurrentUser = setCurrentUser;
window.getStorageKey = getStorageKey;
