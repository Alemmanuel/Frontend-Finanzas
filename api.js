const STORAGE_KEY = 'financial_transactions';

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
            const storedData = localStorage.getItem(STORAGE_KEY);
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

            const storedData = localStorage.getItem(STORAGE_KEY);
            const transactions = storedData ? JSON.parse(storedData) : [];
            
            const newTransaction = {
                ...transaction,
                id: Date.now() + Math.random(), // ID único
                type: transaction.tipo === 'Ingreso' ? 'income' : 'expense',
                amount: Number(transaction.monto),
                description: transaction.descripcion,
                date: transaction.fecha
            };
            
            transactions.push(newTransaction);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
            
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

            const storedData = localStorage.getItem(STORAGE_KEY);
            if (!storedData) return { message: 'No hay transacciones' };

            const transactions = JSON.parse(storedData);
            const filteredTransactions = transactions.filter(t => t.id !== id);
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredTransactions));
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
            
            localStorage.removeItem(STORAGE_KEY);
            return { message: 'Todas las transacciones han sido eliminadas' };
        } catch (error) {
            console.error('LocalStorage Error:', error);
            throw new Error('No se pudieron eliminar las transacciones: ' + error.message);
        }
    }
};
