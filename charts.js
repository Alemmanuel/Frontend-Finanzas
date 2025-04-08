class FinanceCharts {
    constructor() {
        this.balanceChart = null;
        this.distributionChart = null;
        this.initCharts();
    }

    initCharts() {
        // Gráfica de balance
        this.balanceChart = new Chart(document.getElementById('balanceChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Balance',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            }
        });

        // Gráfica de distribución
        this.distributionChart = new Chart(document.getElementById('distributionChart'), {
            type: 'doughnut',
            data: {
                labels: ['Ingresos', 'Gastos'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)']
                }]
            }
        });
    }

    updateCharts(transactions) {
        const income = transactions.filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = transactions.filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // Actualizar gráfica de distribución
        this.distributionChart.data.datasets[0].data = [income, expense];
        this.distributionChart.update();

        // Actualizar gráfica de balance
        const dates = [...new Set(transactions.map(t => t.date.split('T')[0]))].sort();
        let balance = 0;
        const balances = dates.map(date => {
            const dayTransactions = transactions.filter(t => t.date.startsWith(date));
            dayTransactions.forEach(t => {  
                balance += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
            });
            return balance;
        });

        this.balanceChart.data.labels = dates;
        this.balanceChart.data.datasets[0].data = balances;
        this.balanceChart.update();
    }
}
