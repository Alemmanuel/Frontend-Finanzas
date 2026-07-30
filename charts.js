class FinanceCharts {
    static isDark() {
        return document.documentElement.classList.contains('dark');
    }

    static chartColor(light, dark) {
        return FinanceCharts.isDark() ? dark : light;
    }

    static get scaleDefaults() {
        const color = FinanceCharts.chartColor('#6b7280', '#94a3b8');
        const grid = FinanceCharts.chartColor('rgba(0,0,0,0.08)', 'rgba(255,255,255,0.08)');
        return { color, grid };
    }

    constructor() {

        this.balanceChart = null;
        this.distributionChart = null;
        this.historyChart = null;
    
        this.initCharts();
    
        // HISTÓRICO FINANCIERO
        this.historyChart = new Chart(
            document.getElementById('historyChart'),
            {
                type: 'line',
    
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Histórico',
                        data: [],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        tension: 0.3,
                        fill: true
                    }]
                },
    
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            ticks: { color: FinanceCharts.scaleDefaults.color },
                            grid: { color: FinanceCharts.scaleDefaults.grid }
                        },
                        y: {
                            ticks: { color: FinanceCharts.scaleDefaults.color },
                            grid: { color: FinanceCharts.scaleDefaults.grid }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: FinanceCharts.scaleDefaults.color }
                        }
                    }
                }
            }
        );
    }

    static categoryColors = {
        Mercado: 'rgb(255, 159, 64)',
        Bancos: 'rgb(54, 162, 235)',
        Entretenimiento: 'rgb(153, 102, 255)',
        Transporte: 'rgb(86, 249, 255)',
        Salud: 'rgb(246, 134, 158)',
        Hogar: 'rgb(201, 203, 207)',
        // Rojo tipo Independiente Santa Fe
        Mensualidades: 'rgb(220, 38, 38)',
        Comida: 'rgb(190, 56, 137)',
        Servicios: 'rgb(246, 255, 0)',
        'Sin categoría': 'rgb(148, 163, 184)'
    };

    updateLegend(categoryLabels) {
        const legendEl = document.getElementById('categoryLegend');
        if (!legendEl) return;

        if (!categoryLabels || categoryLabels.length === 0) {
            legendEl.innerHTML = '';
            return;
        }

        legendEl.innerHTML = `
            <div class="font-semibold mb-2">Categorías</div>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
                ${categoryLabels.map(label => {
            const color = FinanceCharts.categoryColors[label] || 'rgb(148, 163, 184)';
            return `
                        <div class="flex items-center gap-2">
                            <span class="inline-block w-3 h-3 rounded" style="background:${color}"></span>
                            <span>${label}</span>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
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
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: { color: FinanceCharts.scaleDefaults.color },
                        grid: { color: FinanceCharts.scaleDefaults.grid }
                    },
                    y: {
                        ticks: { color: FinanceCharts.scaleDefaults.color },
                        grid: { color: FinanceCharts.scaleDefaults.grid }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: FinanceCharts.scaleDefaults.color }
                    }
                }
            }
        });

        // Gráfica de distribución
        this.distributionChart = new Chart(document.getElementById('distributionChart'), {
            type: 'doughnut',
            data: {
                labels: ['Ingresos', 'Gastos'],
                datasets: [
                    // Centro (sin hueco): categorías (gastos)
                    {
                        label: 'Categorías (gastos)',
                        data: [0, 0],
                        backgroundColor: ['rgba(0,0,0,0)', 'rgba(0,0,0,0)'],
                        // Sin hueco blanco al centro (pie)
                        cutout: '0%',
                        radius: '62%'
                    },
                    // Anillo externo: Ingresos vs Gastos
                    {
                        label: 'Ingresos vs Gastos',
                        data: [0, 0],
                        backgroundColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
                        radius: '92%'
                    }
                ]
            },
            options: {
                responsive: true,

                layout: {
                    padding: { top: 6 }
                },

                onClick: (event, elements) => {
                    if (!elements.length) return;

                    const elementIndex = elements[0].index;
                    const clickedLabel = this.distributionChart.data.labels[elementIndex];

                    if (!clickedLabel) return;

                    const filterTypeEl = document.getElementById('filterType');
                    const filterCategoryEl = document.getElementById('filterCategory');

                    // Reset filtros
                    if (filterTypeEl) filterTypeEl.value = 'all';
                    if (filterCategoryEl) filterCategoryEl.value = '';

                    // Ingresos
                    if (clickedLabel === 'Ingresos') {
                        if (filterTypeEl) {
                            filterTypeEl.value = 'income';
                        }
                    }

                    // Gastos
                    else if (clickedLabel === 'Gastos') {
                        if (filterTypeEl) {
                            filterTypeEl.value = 'expense';
                        }
                    }

                    // Categorías
                    else {
                        if (filterTypeEl) {
                            filterTypeEl.value = 'expense';
                        }

                        if (filterCategoryEl) {
                            filterCategoryEl.value = clickedLabel;
                        }
                    }

                    // Actualizar filtros
                    updateChartsWithFilters();

                    setTimeout(() => {

                        // Abrir todos los meses
                        document.querySelectorAll('[id^="month-"]').forEach(el => {
                            el.classList.remove('hidden');
                        });

                        // Rotar iconos meses
                        document.querySelectorAll('[id$="-icon"]').forEach(icon => {
                            icon.style.transform = 'rotate(180deg)';
                        });

                        // Abrir todas las semanas
                        document.querySelectorAll('[id*="-week-"]').forEach(el => {
                            el.classList.remove('hidden');
                        });

                        const tableSection = document.getElementById('groupedTransactions');

                        if (tableSection) {
                            tableSection.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                        }

                    }, 100);
                    // Expandir todas las transacciones filtradas   
                    expandAllFilteredTransactions();

                    // Scroll suave a tabla
                    const tableSection = document.getElementById('groupedTransactions');

                    if (tableSection) {
                        tableSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                },

                plugins: {
                    legend: {
                        display: false
                    },

                    tooltip: {
                        backgroundColor: FinanceCharts.chartColor('white', '#1e293b'),
                        titleColor: FinanceCharts.chartColor('#111827', '#f1f5f9'),
                        bodyColor: FinanceCharts.chartColor('#6b7280', '#94a3b8'),
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = Number(context.raw || 0);

                                const formatted = new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                }).format(value);

                                return `${label}: ${formatted}`;
                            }
                        }
                    }
                },

                cutout: '68%'
            }
        });
    }

    updateCharts(transactions, distributionRange = 'currentCycle') {

        if (!transactions || transactions.length === 0) {
            this.clearCharts();
            return;
        }

        const filteredTransactions =
            this.getDistributionFilteredTransactions(
                transactions,
                distributionRange
            );

        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenseByCategory = {};

        filteredTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {

                const category =
                    t.category || 'Sin categoría';

                expenseByCategory[category] =
                    (expenseByCategory[category] || 0)
                    + Number(t.amount);
            });

        const categoryLabels =
            Object.keys(expenseByCategory)
                .sort((a, b) => a.localeCompare(b, 'es'));

        const allLabels = [
            'Ingresos',
            'Gastos',
            ...categoryLabels
        ];

        this.distributionChart.data.labels = allLabels;

        this.distributionChart.data.datasets[0].data = [
            0,
            0,
            ...categoryLabels.map(c => expenseByCategory[c])
        ];

        this.distributionChart.data.datasets[0].backgroundColor = [
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0)',
            ...categoryLabels.map(label =>
                FinanceCharts.categoryColors[label]
                || FinanceCharts.categoryColors['Sin categoría']
            )
        ];

        this.distributionChart.data.datasets[1].data = [
            income,
            expense,
            ...categoryLabels.map(() => 0)
        ];

        this.distributionChart.data.datasets[1].backgroundColor = [
            'rgb(75, 192, 192)',
            'rgb(255, 99, 132)',
            ...categoryLabels.map(() => 'rgba(0,0,0,0)')
        ];

        this.updateLegend(categoryLabels);

        this.distributionChart.update();

        // BALANCE GENERAL SIGUE NORMAL
        const dates = [...new Set(
            transactions.map(t => t.date.split('T')[0])
        )].sort();

        let balance = 0;

        const balances = dates.map(date => {

            const dayTransactions =
                transactions.filter(t =>
                    t.date.startsWith(date)
                );

            dayTransactions.forEach(t => {
                balance +=
                    t.type === 'income'
                        ? Number(t.amount)
                        : -Number(t.amount);
            });

            return balance;
        });

        this.balanceChart.data.labels =
            dates.map(date => formatearFecha(date));

        this.balanceChart.data.datasets[0].data =
            balances;

        this.balanceChart.update();
    }

    getDistributionFilteredTransactions(
        transactions,
        range
    ) {

        const today = new Date();

        const now = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );
        function parseLocalDate(dateString) {
            const datePart = dateString.split(' ')[0];
            const [year, month, day] =
                datePart.split('-').map(Number);
            return new Date(year, month - 1, day);
        }


        // HISTÓRICO
        // CICLO ACTUAL
        if (range === 'currentCycle') {

            let start;
            let end;

            if (now.getDate() >= 25) {

                start = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    25,
                    0, 0, 0, 0
                );

                end = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    24,
                    23, 59, 59, 999
                );

            } else {

                start = new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    25,
                    0, 0, 0, 0
                );

                end = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    24,
                    23, 59, 59, 999
                );
            }

            return transactions.filter(t => {

                const date = parseLocalDate(t.date);

                return (
                    date >= start &&
                    date <= end
                );
            });
        }

        // ESTE AÑO
        if (range === 'year') {

            return transactions.filter(t => {

                const date =
                    parseLocalDate(t.date);

                return (
                    date.getFullYear()
                    === now.getFullYear()
                );
            });
        }

        // ÚLTIMOS 3 / 6 CICLOS
        if (range === '3cycles'
            || range === '6cycles') {

            const months =
                range === '3cycles'
                    ? 3
                    : 6;

            const limitDate = new Date(
                now.getFullYear(),
                now.getMonth() - months,
                now.getDate()
            );

            return transactions.filter(t => {

                const date =
                    parseLocalDate(t.date);

                return date >= limitDate;
            });
        }

        return transactions;
    }

    updateHistoryChart(transactions) {

        console.log('HISTORICO DATA:', transactions);
        console.log('HISTORICO CHART:', this.historyChart);
        if (!this.historyChart) return;

        const category =
            document.getElementById('historyCategory')?.value || 'all';

        const period =
            document.getElementById('historyPeriod')?.value || 'monthly';

        const chartType =
            document.getElementById('historyChartType')?.value || 'line';

        let filtered = [...transactions];

        // FILTRADO
        if (category === 'income') {
            filtered = filtered.filter(t => t.type === 'income');
        }

        else if (category !== 'all') {
            filtered = filtered.filter(t =>
                t.type === 'expense' &&
                t.category === category
            );
        }

        else {
            filtered = filtered.filter(t => t.type === 'expense');
        }

        const grouped = {};

        filtered.forEach(t => {

            const date = new Date(t.date);

            let key;

            // MENSUAL
            if (period === 'monthly') {

                key = date.toLocaleString('es-ES', {
                    month: 'short',
                    year: 'numeric'
                });
            }

            // ANUAL
            else {

                key = date.getFullYear().toString();
            }

            grouped[key] =
                (grouped[key] || 0) + Number(t.amount);
        });

        const labels = Object.keys(grouped);

        const values = Object.values(grouped);

        // CAMBIAR TIPO DINÁMICAMENTE
        this.historyChart.destroy();

        this.historyChart = new Chart(
            document.getElementById('historyChart'),
            {
                type: chartType === 'area'
                    ? 'line'
                    : chartType,

                data: {
                    labels,

                    datasets: [{
                        label: 'Histórico Financiero',

                        data: values,

                        borderColor: 'rgb(59, 130, 246)',

                        backgroundColor:
                            chartType === 'doughnut'
                                ? labels.map(() =>
                                    `hsl(${Math.random() * 360},70%,60%)`)
                                : 'rgba(59, 130, 246, 0.2)',

                        tension: 0.3,

                        fill:
                            chartType === 'line' ||
                            chartType === 'area'
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            ticks: { color: FinanceCharts.scaleDefaults.color },
                            grid: { color: FinanceCharts.scaleDefaults.grid }
                        },
                        y: {
                            ticks: { color: FinanceCharts.scaleDefaults.color },
                            grid: { color: FinanceCharts.scaleDefaults.grid }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: FinanceCharts.scaleDefaults.color }
                        }
                    }
                }
            }
        );
    }

    resizeAll() {
        [this.balanceChart, this.distributionChart, this.historyChart].forEach(chart => {
            if (chart) chart.resize();
        });
    }

    applyDarkMode() {
        const color = FinanceCharts.scaleDefaults.color;
        const grid = FinanceCharts.scaleDefaults.grid;
        const bg = FinanceCharts.chartColor('white', '#1e293b');
        const titleColor = FinanceCharts.chartColor('#111827', '#f1f5f9');

        [this.balanceChart, this.historyChart].forEach(chart => {
            if (!chart) return;
            if (chart.options.scales?.x) {
                chart.options.scales.x.ticks.color = color;
                chart.options.scales.x.grid.color = grid;
            }
            if (chart.options.scales?.y) {
                chart.options.scales.y.ticks.color = color;
                chart.options.scales.y.grid.color = grid;
            }
            if (chart.options.plugins?.legend?.labels) {
                chart.options.plugins.legend.labels.color = color;
            }
            chart.update('none');
        });

        if (this.distributionChart) {
            const tp = this.distributionChart.options.plugins?.tooltip;
            if (tp) {
                tp.backgroundColor = bg;
                tp.titleColor = titleColor;
                tp.bodyColor = color;
            }
            this.distributionChart.update('none');
        }
    }

    clearCharts() {
        // Limpiar gráfica de distribución
        this.distributionChart.data.labels = ['Ingresos', 'Gastos'];
        this.distributionChart.data.datasets[0].data = [0, 0];
        this.distributionChart.data.datasets[0].backgroundColor = ['rgba(0,0,0,0)', 'rgba(0,0,0,0)'];
        this.distributionChart.data.datasets[1].data = [0, 0];
        this.distributionChart.data.datasets[1].backgroundColor = ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'];
        this.updateLegend([]);
        this.distributionChart.update();

        // Limpiar gráfica de balance
        this.balanceChart.data.labels = [];
        this.balanceChart.data.datasets[0].data = [];
        this.balanceChart.update();
    }
}
