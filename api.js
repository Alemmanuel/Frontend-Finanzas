const API_URL = 'https://backend-finanzas-m3fb.onrender.com/api';

const api = {
    async getTransactions() {
        try {
            const response = await fetch(`${API_URL}/transactions`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('No se pudo conectar al servidor. Asegúrate de que el servidor esté corriendo en http://localhost:3000');
            }
            throw error;
        }
    },

    async addTransaction(transaction) {
        try {
            const response = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transaction)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('No se pudo conectar al servidor. Asegúrate de que el servidor esté corriendo en http://localhost:3000');
            }
            throw error;
        }
    },

    async deleteTransaction(id) {
        try {
            const response = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('No se pudo conectar al servidor. Asegúrate de que el servidor esté corriendo en http://localhost:3000');
            }
            throw error;
        }
    }
};
