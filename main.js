// --- SIDEBAR NAVIGATION ---
function navigateTo(page) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.add('page-section-hidden'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('section-' + page);
    if (target) target.classList.remove('page-section-hidden');
    const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');
    if (page === 'charts' && typeof charts !== 'undefined' && charts.resizeAll) {
        setTimeout(() => charts.resizeAll(), 50);
    }
    if (page === 'budgets') setTimeout(() => loadBudgets().catch(() => {}), 50);
    if (window.innerWidth < 1024) {
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebarOverlay')?.classList.remove('open');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebarOverlay')?.classList.toggle('open');
}

function toggleSidebarCollapse() {
    document.documentElement.classList.toggle('sidebar-collapsed');
    const collapsed = document.documentElement.classList.contains('sidebar-collapsed');
    localStorage.setItem('sidebarCollapsed', collapsed);
    const btn = document.getElementById('sidebarCollapseBtn');
    if (btn) btn.title = collapsed ? 'Expandir menú' : 'Colapsar menú';
}

// --- DARK MODE ---
function updateDarkModeUI(isDark) {
    const sw = document.getElementById('darkModeSwitch');
    if (sw) {
        sw.style.background = isDark ? '#059669' : '#d1d5db';
        const thumb = document.getElementById('darkModeThumb');
        if (thumb) {
            thumb.style.transform = isDark ? 'translateX(28px)' : 'translateX(0)';
            thumb.textContent = isDark ? '🌙' : '☀️';
        }
    }
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeUI(isDark);
    if (typeof charts !== 'undefined' && charts.applyDarkMode) charts.applyDarkMode();
}

function applyDarkModePreference() {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
        document.documentElement.classList.add('dark');
        updateDarkModeUI(true);
        setTimeout(() => { if (typeof charts !== 'undefined' && charts.applyDarkMode) charts.applyDarkMode(); }, 100);
    }
}

// --- AUTENTICACIÓN ---
let currentUser = null;
let authHandled = false;

function decodeJWT(token) {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch { return null; }
}

function handleCredentialResponse(response) {
    if (authHandled) return;
    authHandled = true;
    const data = decodeJWT(response.credential);
    if (!data) return;

    currentUser = {
        googleId: data.sub,
        name: data.name,
        email: data.email,
        picture: data.picture
    };

    localStorage.setItem('current_user', JSON.stringify(currentUser));
    setCurrentUser(currentUser.googleId);
    showApp();
    setupAppListeners();
    loadDataAndCharts();
}

function renderGoogleButton() {
    function tryRender() {
        if (typeof google !== 'undefined' && google.accounts) {
            const container = document.getElementById('googleButton');
            if (!container) return;
            google.accounts.id.initialize({
                client_id: '773029421346-7poodvv0qoaodrco0e0tlmvi9uf52626.apps.googleusercontent.com',
                callback: handleCredentialResponse
            });
            container.innerHTML = '';
            google.accounts.id.renderButton(
                container,
                { type: 'standard', shape: 'pill', theme: 'outline', size: 'large', text: 'signin_with', logo_alignment: 'left' }
            );
        } else {
            setTimeout(tryRender, 200);
        }
    }
    tryRender();
}

function clearBalanceSummary() {
    document.getElementById('incomeAmount').textContent = '$0';
    document.getElementById('expenseAmount').textContent = '$0';
    document.getElementById('balanceAmount').textContent = '$0';
    document.getElementById('balanceAmount').className = 'text-2xl font-bold text-gray-600';
    document.getElementById('incomeChange').textContent = '';
    document.getElementById('expenseChange').textContent = '';
    document.getElementById('balanceLabel').textContent = '';
}

async function sendLoginCode() {
    const email = document.getElementById('loginEmail').value.trim();
    const errorEl = document.getElementById('loginEmailError');
    const btn = document.getElementById('sendCodeBtn');
    if (!email || !email.includes('@')) {
        errorEl.textContent = 'Ingresa un correo válido';
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
        const res = await fetch(window.API_URL + '/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!res.ok) throw new Error('Error al enviar código');
        document.getElementById('loginDisplayEmail').textContent = email;
        document.getElementById('loginStepEmail').classList.add('hidden');
        document.getElementById('loginStepCode').classList.remove('hidden');
        document.getElementById('loginCode').value = '';
        document.getElementById('loginCodeError').classList.add('hidden');
    } catch (e) {
        errorEl.textContent = 'No se pudo enviar el código. ¿El backend está corriendo?';
        errorEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar código';
    }
}

async function verifyLoginCode() {
    const email = document.getElementById('loginDisplayEmail').textContent;
    const code = document.getElementById('loginCode').value.trim();
    const errorEl = document.getElementById('loginCodeError');
    const btn = document.getElementById('verifyCodeBtn');
    if (!code || code.length < 6) {
        errorEl.textContent = 'Ingresa el código de 6 dígitos';
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = 'Verificando...';
    try {
        const res = await fetch(window.API_URL + '/auth/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Código incorrecto');
        }
        const data = await res.json();
        currentUser = {
            googleId: data.user_id,
            name: data.name,
            email: data.email,
            picture: null
        };
        localStorage.setItem('current_user', JSON.stringify(currentUser));
        setCurrentUser(currentUser.googleId);
        showApp();
        setupAppListeners();
        loadDataAndCharts();
    } catch (e) {
        errorEl.textContent = e.message;
        errorEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Ingresar';
    }
}

function backToEmail() {
    document.getElementById('loginStepCode').classList.add('hidden');
    document.getElementById('loginStepEmail').classList.remove('hidden');
    document.getElementById('loginEmailError').classList.add('hidden');
}

function showApp() {
    currentTransactions = [];
    currentFilteredTransactions = [];
    clearBalanceSummary();
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appContent').classList.remove('hidden');
    renderAvatar();
    navigateTo('dashboard');
    if (typeof initializeFilters === 'function') initializeFilters();
}

function renderAvatar() {
    const img = document.getElementById('avatarImg');
    const initials = document.getElementById('avatarInitials');
    const nameEl = document.getElementById('menuUserName');
    const emailEl = document.getElementById('menuUserEmail');

    nameEl.textContent = currentUser.name;
    emailEl.textContent = currentUser.email;

    if (currentUser.picture) {
        img.src = currentUser.picture;
        img.classList.remove('hidden');
        initials.classList.add('hidden');
    } else {
        img.classList.add('hidden');
        initials.classList.remove('hidden');
        initials.textContent = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
}

function toggleAvatarMenu() {
    const menu = document.getElementById('avatarMenu');
    menu.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
    const menu = document.getElementById('avatarMenu');
    const btn = document.getElementById('avatarButton');
    if (menu && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

function logout() {
    showConfirmationModal(
        'Cerrar sesión',
        '¿Estás seguro de que quieres cerrar sesión?',
        () => {
            document.getElementById('confirmationModal').style.display = 'none';
            localStorage.removeItem('current_user');
            currentUser = null;
            setCurrentUser(null);
            currentTransactions = [];
            currentFilteredTransactions = [];
            clearBalanceSummary();
            if (charts && typeof charts.clearCharts === 'function') charts.clearCharts();
            document.getElementById('loginStepCode').classList.add('hidden');
            document.getElementById('loginStepEmail').classList.remove('hidden');
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginEmailError').classList.add('hidden');
            authHandled = false;
            document.querySelectorAll('.page-section').forEach(el => el.classList.add('page-section-hidden'));
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('appContent').classList.add('hidden');
            renderGoogleButton();
        },
        false
    );
}

function openProfileModal() {
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileModal').style.display = 'block';
    document.getElementById('avatarMenu').classList.add('hidden');
}

function saveProfile() {
    const newName = document.getElementById('profileName').value.trim();
    if (!newName) {
        showInfoModal('Error', 'El nombre no puede estar vacío');
        return;
    }
    currentUser.name = newName;
    localStorage.setItem('current_user', JSON.stringify(currentUser));
    renderAvatar();
    document.getElementById('profileModal').style.display = 'none';
    showInfoModal('Éxito', 'Perfil actualizado correctamente');
}

const charts = new FinanceCharts();
let currentTransactions = [];
let currentFilteredTransactions = [];

// Mantener el estado de la tabla (meses/semanas abiertos) aunque se re-renderice
const openMonthIds = new Set();
const openWeekIds = new Set();

// Checkboxes para eliminar múltiples transacciones
const selectedTransactionIds = new Set();

function toggleSelectAll(checked) {
    selectedTransactionIds.clear();
    if (checked) currentFilteredTransactions.forEach(t => selectedTransactionIds.add(t.id));
    document.querySelectorAll('.transaction-checkbox').forEach(cb => cb.checked = checked);
    updateDeleteSelectedBtn();
}

function toggleSelect(id) {
    if (selectedTransactionIds.has(id)) selectedTransactionIds.delete(id);
    else selectedTransactionIds.add(id);
    updateDeleteSelectedBtn();
}

function updateDeleteSelectedBtn() {
    const btn = document.getElementById('deleteSelectedBtn');
    if (!btn) return;
    const count = selectedTransactionIds.size;
    btn.disabled = count === 0;
    btn.textContent = count > 0 ? `Eliminar seleccionadas (${count})` : 'Eliminar seleccionadas';
}

function deleteSelected() {
    if (selectedTransactionIds.size === 0) return;
    showConfirmationModal(
        'Eliminar seleccionadas',
        `¿Eliminar ${selectedTransactionIds.size} transacciones?`,
        async () => {
            document.getElementById('confirmationModal').style.display = 'none';
            const ids = [...selectedTransactionIds];
            selectedTransactionIds.clear();
            try {
                for (const id of ids) {
                    await api.deleteTransaction(id);
                }
                const openedMonths = new Set(openMonthIds);
                const openedWeeks = new Set(openWeekIds);
                await loadTransactions();
                openedMonths.forEach(id => openMonthIds.add(id));
                openedWeeks.forEach(id => openWeekIds.add(id));
                updateTransactionsList(currentFilteredTransactions);
                updateDeleteSelectedBtn();
                showInfoModal('Éxito', `${ids.length} transacciones eliminadas.`);
            } catch (error) {
                showInfoModal('Error', error.message);
            }
        },
        true
    );
}

function parseLocalDate(dateString) {
    if (!dateString) return null;
    const datePart = dateString.split(' ')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function parseCOP(input) {
    if (typeof input !== 'string') return Number(input) || 0;
    // Mantener solo dígitos (sin decimales para COP en esta app)
    const digits = input.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
}

function formatCOPInput(value) {
    const num = parseCOP(value);
    return new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 0
    }).format(num);
}

function getFilteredTransactions(transactions) {
    const typeFilter = document.getElementById('filterType')?.value || 'all';
    const categoryFilter = document.getElementById('filterCategory')?.value || '';
    const descFilter = (document.getElementById('filterDescription')?.value || '').trim().toLowerCase();
    const filterDate = document.getElementById('calendarFilterDate')?.value || '';

    let filtered = [...(transactions || [])];

    // Tipo (opcional)
    if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
    }

    // Categoría (opcional). Si se elige categoría, se asume filtro sobre gastos.
    if (categoryFilter) {
        filtered = filtered.filter(t => t.type === 'expense' && (t.category || '') === categoryFilter);
    }

    // Descripción (opcional)
    if (descFilter) {
        filtered = filtered.filter(t => (t.description || '').toLowerCase().includes(descFilter));
    }

    // Filtro por fecha desde el calendario
    if (filterDate) {
        filtered = filtered.filter(t => t.date === filterDate);
    }

    return filtered;
}

async function loadTransactions() {
    try {
        const response = await api.getTransactions();
        currentTransactions = response.data;

        // Usar directamente el array de transacciones
        updateChartsWithFilters();

    } catch (error) {
        console.error('Error loading transactions:', error);
        showInfoModal('Error', 'Error al cargar las transacciones: ' + error.message);
    }
}

function filterTransactions(transactions, filterType, filterDate) {
    if (filterType === 'all') {
        return transactions;
    }

    let filtered = [...transactions]; // Copia para no modificar el original

    if (filterType === 'day' && filterDate) {
        filtered = filtered.filter(t => t.date.startsWith(filterDate));
    }
    // ...existing week, month, custom filters...

    return filtered;
}

function updateChartsWithFilters() {
    // Filtros SOLO para la tabla
    currentFilteredTransactions = getFilteredTransactions(currentTransactions);
    // Abrir automáticamente todos los grupos filtrados


    const grouped = groupTransactionsByMonthAndWeek(currentFilteredTransactions);

    Object.keys(grouped).forEach((month, monthIndex) => {
        const monthId = `month-${monthIndex}`;

        openMonthIds.add(monthId);

        Object.keys(grouped[month]).forEach(week => {
            const weekId = `${monthId}-week-${String(week)}`;
            openWeekIds.add(weekId);
        });
    });
    updateTransactionsList(currentFilteredTransactions);

    // Charts siempre con todos los datos
    const distributionRange =
        document.getElementById('distributionRange')?.value || 'currentCycle';

    try { charts.updateCharts(currentTransactions, distributionRange); } catch (e) { console.error('charts error:', e); }
    try { updateTopCategories(currentTransactions); } catch (e) { console.error('topCategories error:', e); }
    try { generateFinancialInsights(currentTransactions); } catch (e) { console.error('insights error:', e); }
    try { updateBalanceSummary(currentTransactions); } catch (e) { console.error('balance error:', e); }
    try { renderCalendarHeatmap(currentTransactions); } catch (e) { console.error('calendar error:', e); }

    // Configurar event listeners para los botones de descarga
    // Evitar registrar listeners repetidos en cada recarga
    const pdfBtn = document.getElementById('downloadPdf');
    const excelBtn = document.getElementById('downloadExcel');

    if (!pdfBtn.dataset.listenerAttached) {
        pdfBtn.addEventListener('click', () => downloadPdf(currentTransactions));
        pdfBtn.dataset.listenerAttached = 'true';
    }

    if (!excelBtn.dataset.listenerAttached) {
        excelBtn.addEventListener('click', () => downloadExcel(currentTransactions));
        excelBtn.dataset.listenerAttached = 'true';
    }
}

function downloadPdf(transactions) {
    const startDateStr = document.getElementById('startDate').value;
    const endDateStr = document.getElementById('endDate').value;

    if (!startDateStr || !endDateStr) {
        showInfoModal('Error', 'Por favor seleccione un rango de fechas');
        return;
    }

    // Convertir fechas a UTC para comparación
    const startDate = new Date(startDateStr);
    const startUTC = new Date(Date.UTC(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
    )).toISOString().split('T')[0];

    const endDate = new Date(endDateStr);
    const endUTC = new Date(Date.UTC(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
    )).toISOString().split('T')[0];

    // Filtrar transacciones por rango de fechas usando fechas UTC
    const filteredTransactions = transactions.filter(t =>
        t.date >= startUTC && t.date <= endUTC
    );

    if (filteredTransactions.length === 0) {
        showInfoModal('Sin datos', 'No hay transacciones en el rango seleccionado');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Configurar fuente
    doc.setFont('Comfortaa', 'normal');
    doc.setFontSize(24);

    // Título centrado
    const title = 'Reporte de Transacciones';
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleWidth = doc.getStringUnitWidth(title) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(title, titleX, 20);

    // Agregar subtítulo con rango de fechas
    doc.setFontSize(12);
    const dateRange = `Período: ${formatearFecha(startDateStr)} - ${formatearFecha(endDateStr)}`;
    const dateWidth = doc.getStringUnitWidth(dateRange) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const dateX = (pageWidth - dateWidth) / 2;
    doc.text(dateRange, dateX, 30);

    // Definir columnas
    const columns = [
        { header: 'Fecha', dataKey: 'date' },
        { header: 'Tipo', dataKey: 'type' },
        { header: 'Descripción', dataKey: 'description' },
        { header: 'Categoría', dataKey: 'category' },
        { header: 'Monto', dataKey: 'amount' }
    ];

    // Preparar datos para la tabla con validación de montos
    const tableData = filteredTransactions.map(transaction => {
        // Usar la propiedad 'amount' en lugar de 'monto'
        const monto = parseFloat(transaction.amount) || 0;
        return {
            date: formatearFecha(transaction.date),
            type: transaction.type === 'income' ? 'Ingreso' : 'Gasto',
            description: transaction.description,
            category: transaction.type === 'expense' ? (transaction.category || 'Sin categoría') : '-',
            amount: formatCOP(monto)
        };
    });

    // Opciones de la tabla
    const options = {
        startY: 40,
        headStyles: {
            fillColor: [22, 163, 74],
            textColor: '#fff',
            fontSize: 12,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 11
        },
        columnStyles: {
            date: { columnWidth: 35 },
            type: { columnWidth: 30 },
            description: { columnWidth: 95 },
            amount: { columnWidth: 40, halign: 'right' }
        },
        margin: { horizontal: 10 },
        didDrawPage: function (data) {
            doc.setFontSize(9);
            doc.text('Control de Finanzas - Reporte de Transacciones', data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
        }
    };

    doc.autoTable({
        columns: columns,
        body: tableData,
        ...options
    });

    doc.save('reporte_transacciones.pdf');
}

function downloadExcel(transactions) {
    const startDateStr = document.getElementById('startDate').value;
    const endDateStr = document.getElementById('endDate').value;

    if (!startDateStr || !endDateStr) {
        showInfoModal('Error', 'Por favor seleccione un rango de fechas');
        return;
    }

    // Convertir fechas a UTC para comparación
    const startDate = new Date(startDateStr);
    const startUTC = new Date(Date.UTC(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
    )).toISOString().split('T')[0];

    const endDate = new Date(endDateStr);
    const endUTC = new Date(Date.UTC(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
    )).toISOString().split('T')[0];

    // Filtrar transacciones por rango de fechas usando fechas UTC
    const filteredTransactions = transactions.filter(t =>
        t.date >= startUTC && t.date <= endUTC
    );

    if (filteredTransactions.length === 0) {
        showInfoModal('Sin datos', 'No hay transacciones en el rango seleccionado');
        return;
    }

    const wb = XLSX.utils.book_new();

    // Agregar título y rango de fechas
    const excelData = [
        [`Reporte de Transacciones`],
        [`Período: ${formatearFecha(startDateStr)} - ${formatearFecha(endDateStr)}`],
        [], // Línea en blanco
        ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Monto']
    ];

    // Agregar datos
    filteredTransactions.forEach(transaction => {
        excelData.push([
            formatearFecha(transaction.date),
            transaction.type === 'income' ? 'Ingreso' : 'Gasto',
            transaction.description,
            transaction.type === 'expense' ? (transaction.category || 'Sin categoría') : '-',
            formatCOP(transaction.amount)
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Transacciones");
    XLSX.writeFile(wb, 'reporte_transacciones.xlsx');
}

function formatCOP(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function getCurrentFinancialCycleDates() {
    const now = new Date();

    let start, end;

    if (now.getDate() >= 25) {
        start = new Date(now.getFullYear(), now.getMonth(), 25);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 24);
    } else {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 25);
        end = new Date(now.getFullYear(), now.getMonth(), 24);
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
}

function updateTopCategories(transactions) {
    const container = document.getElementById('topCategoriesList');

    if (!container) return;

    const { start, end } = getCurrentFinancialCycleDates();

    // Filtrar transacciones del ciclo actual
    const cycleTransactions = transactions.filter(t => {
        const date = parseLocalDate(t.date);

        return date >= start && date <= end;
    });

    // Total ingresos
    const totalIncome = cycleTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    // Gastos por categoría
    const categoryTotals = {};

    cycleTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const category = t.category || 'Sin categoría';

            categoryTotals[category] =
                (categoryTotals[category] || 0) + Number(t.amount);
        });

    // Ordenar top 5
    const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Sin datos
    if (topCategories.length === 0) {
        container.innerHTML = `
            <div class="text-gray-500 text-sm">
                No hay gastos registrados en este ciclo.
            </div>
        `;
        return;
    }

    container.innerHTML = topCategories.map(([category, amount]) => {

        const percentage =
            totalIncome > 0
                ? ((amount / totalIncome) * 100).toFixed(1)
                : 0;

        return `
            <div>
                <div class="flex justify-between mb-1">
                    <div class="font-medium">
                        ${category}
                    </div>

                    <div class="text-sm text-gray-600">
                        ${formatCOP(amount)} • ${percentage}%
                    </div>
                </div>

                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div
                        class="h-3 rounded-full bg-emerald-500"
                        style="width: ${Math.min(percentage, 100)}%"
                    ></div>
                </div>
            </div>
        `;
    }).join('');
}

function generateFinancialInsights(transactions) {

    const container =
        document.getElementById('financialInsights');

    if (!container) return;

    if (!transactions || transactions.length === 0) {

        container.innerHTML = `
            <div class="text-gray-500">
                No hay suficientes datos para generar insights.
            </div>
        `;

        return;
    }

    const insights = [];

    const { start, end } =
        getCurrentFinancialCycleDates();

    const currentCycleTransactions =
        transactions.filter(t => {

            const date = new Date(t.date);

            return date >= start && date <= end;
        });

    const expenses =
        currentCycleTransactions.filter(
            t => t.type === 'expense'
        );

    const incomes =
        currentCycleTransactions.filter(
            t => t.type === 'income'
        );

    const totalExpenses =
        expenses.reduce(
            (sum, t) => sum + Number(t.amount),
            0
        );

    const totalIncome =
        incomes.reduce(
            (sum, t) => sum + Number(t.amount),
            0
        );

    /*
    =========================================
    ALERTA 1
    =========================================
    */

    if (
        totalIncome > 0 &&
        totalExpenses >= totalIncome * 0.8
    ) {

        insights.push({
            type: 'danger',
            icon: '💸',
            title: 'Gastos elevados',
            text: `Ya has utilizado el ${((totalExpenses / totalIncome) * 100).toFixed(0)}% de tus ingresos en este ciclo.`
        });
    }

    /*
    =========================================
    ALERTA 2
    =========================================
    */

    const categoryTotals = {};

    expenses.forEach(t => {

        const category =
            t.category || 'Sin categoría';

        const amount =
            Number(String(t.amount).replace(/[^\d.-]/g, '')) || 0;

        categoryTotals[category] =
            (categoryTotals[category] || 0)
            + amount;
    });

    const topCategory =
        Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {

        const cleanTopAmount =
            Number(topCategory[1]) || 0;

        const cleanTotalExpenses =
            Number(totalExpenses) || 0;

        const percentage =
            cleanTotalExpenses > 0
                ? ((cleanTopAmount / cleanTotalExpenses) * 100).toFixed(1)
                : 0;

        insights.push({
            type: 'warning',
            icon: '⚠️',
            title: 'Categoría dominante',
            text: `${topCategory[0]} representa el ${percentage}% de tus gastos.`
        });
    }

    /*
    =========================================
    ALERTA 3
    =========================================
    */

    if (totalIncome > totalExpenses) {

        insights.push({
            type: 'success',
            icon: '📈',
            title: 'Buen balance financiero',
            text: `Este ciclo llevas un ahorro de ${formatCOP(totalIncome - totalExpenses)}.`
        });
    }

    /*
    =========================================
    ALERTA 4
    =========================================
    */

    const biggestExpense =
        expenses.sort((a, b) =>
            b.amount - a.amount
        )[0];

    if (biggestExpense) {

        insights.push({
            type: 'info',
            icon: '🧾',
            title: 'Gasto más alto',
            text: `${biggestExpense.description} fue tu gasto más alto con ${formatCOP(biggestExpense.amount)}.`
        });
    }

    container.innerHTML =
        insights.map(insight => `

            <div class="insight-card">

                <div class="insight-icon insight-${insight.type}">
                    ${insight.icon}
                </div>

                <div class="insight-content">
                    <h3>${insight.title}</h3>

                    <p>${insight.text}</p>
                </div>

            </div>

        `).join('');
}

function animateCount(element, target) {
    const start = performance.now();
    const duration = 700;
    const startVal = 0;

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(startVal + (target - startVal) * eased);
        element.textContent = formatCOP(current);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function updateBalanceSummary(transactions) {
    if (!transactions || transactions.length === 0) {
        clearBalanceSummary();
        return;
    }

    const { start, end } = getCurrentFinancialCycleDates();

    const currentCycle = transactions.filter(t => {
        const date = parseLocalDate(t.date);
        return date && date >= start && date <= end;
    });
    const income = currentCycle.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = currentCycle.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const balance = income - expense;

    // Calcular ciclo anterior para comparación
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, start.getDate());
    const prevEnd = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate());

    const prevCycle = transactions.filter(t => {
        const date = parseLocalDate(t.date);
        return date >= prevStart && date <= prevEnd;
    });

    const prevIncome = prevCycle.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const prevExpense = prevCycle.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    function pctChange(current, previous) {
        if (previous === 0 && current === 0) return '';
        if (previous === 0) return 'Nuevo';
        const change = ((current - previous) / previous) * 100;
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}%`;
    }

    document.getElementById('incomeChange').textContent = pctChange(income, prevIncome);
    document.getElementById('expenseChange').textContent = pctChange(expense, prevExpense);

    const balEl = document.getElementById('balanceAmount');
    const balLabel = document.getElementById('balanceLabel');
    if (balance > 0) {
        balEl.className = 'text-2xl font-bold text-emerald-600';
        balLabel.textContent = '✅ Buen ritmo';
        balLabel.className = 'text-xs font-semibold text-emerald-500';
    } else if (balance < 0) {
        balEl.className = 'text-2xl font-bold text-red-600';
        balLabel.textContent = '⚠️ En déficit';
        balLabel.className = 'text-xs font-semibold text-red-500';
    } else {
        balEl.className = 'text-2xl font-bold text-gray-600';
        balLabel.textContent = '⚖️ En cero';
        balLabel.className = 'text-xs font-semibold text-gray-500';
    }

    animateCount(document.getElementById('incomeAmount'), income);
    animateCount(document.getElementById('expenseAmount'), expense);
    animateCount(balEl, balance);
}

// Calendario de calor
let calendarDate = new Date();

function calendarPrevMonth() {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendarHeatmap(currentTransactions);
}

function calendarNextMonth() {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendarHeatmap(currentTransactions);
}

function renderCalendarHeatmap(transactions) {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('calendarMonthLabel');
    if (!grid || !label) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    label.textContent = new Date(year, month).toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Gastos por día (usando parseLocalDate para evitar desfase de timezone)
    const dailyExpenses = {};
    (transactions || []).filter(t => t.type === 'expense').forEach(t => {
        const d = parseLocalDate(t.date);
        if (d.getFullYear() === year && d.getMonth() === month) {
            const key = d.getDate();
            dailyExpenses[key] = (dailyExpenses[key] || 0) + Number(t.amount);
        }
    });

    // Escala fija: 2,000,000 como referencia máxima
    const fixedMax = 2000000;

    function getColor(amount) {
        if (!amount || amount === 0) return 'bg-gray-100';
        const ratio = Math.min(amount / fixedMax, 1);
        if (ratio <= 0.05) return 'bg-green-200';
        if (ratio <= 0.15) return 'bg-green-300';
        if (ratio <= 0.30) return 'bg-green-400';
        if (ratio <= 0.50) return 'bg-yellow-300';
        if (ratio <= 0.75) return 'bg-orange-400';
        return 'bg-red-500';
    }

    let html = '';
    for (let i = 0; i < startOffset; i++) {
        html += '<div></div>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const amount = dailyExpenses[day] || 0;
        const color = getColor(amount);
        const today = new Date();
        const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        html += `<div class="${color} rounded p-1.5 text-center text-xs cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all ${isToday ? 'ring-2 ring-emerald-500 font-bold' : ''}" onclick="filterByDate('${dateStr}')" title="${formatCOP(amount)}">${day}</div>`;
    }

    grid.innerHTML = html;
}

function filterByDate(dateStr) {
    document.getElementById('filterType').value = 'all';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterDescription').value = '';
    document.getElementById('calendarFilterDate').value = dateStr;
    updateChartsWithFilters();
    expandAllFilteredTransactions();
    document.getElementById('groupedTransactions').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function formatearFecha(fechaString) {
    if (!fechaString) return '';

    // Crear fecha en zona horaria local sin ajustes
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC' // Forzar UTC para evitar ajustes de zona horaria
    }).replace(/\//g, '-');
}

function updateTransactionsList(transactions) {
    const container = document.getElementById('groupedTransactions');

    if (!transactions || transactions.length === 0) {
        // Restaurar automáticamente meses abiertos
        openMonthIds.forEach(monthId => {
            const monthEl = document.getElementById(monthId);

            if (monthEl) {
                monthEl.classList.remove('hidden');

                const icon =
                    document.getElementById(`${monthId}-icon`);

                if (icon) {
                    icon.style.transform = 'rotate(180deg)';
                }
            }
        });

        // Restaurar automáticamente semanas abiertas
        openWeekIds.forEach(weekId => {
            const weekEl = document.getElementById(weekId);

            if (weekEl) {
                weekEl.classList.remove('hidden');

                const icon =
                    document.getElementById(`${weekId}-icon`);

                if (icon) {
                    icon.style.transform = 'rotate(180deg)';
                }
            }
        });
        selectedTransactionIds.clear();
        updateDeleteSelectedBtn();
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p class="text-xl mb-2">No hay transacciones registradas</p>
                <p>Registra una nueva transacción o importa desde Excel</p>
            </div>
        `;
        return;
    }

    const grouped = groupTransactionsByMonthAndWeek(transactions);
    let html = '';

    // Ordenar meses cronológicamente (mantenemos el orden original de los meses)
    const sortedMonths = Object.keys(grouped).sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        const dateA = new Date(Date.parse(`${monthA} 1, ${yearA}`));
        const dateB = new Date(Date.parse(`${monthB} 1, ${yearB}`));
        return dateA - dateB;
    });

    sortedMonths.forEach((month, index) => {
        const monthId = `month-${month.replace(/\s+/g, '-')}`;
        const isMonthOpen = openMonthIds.has(monthId) && openMonthIds.size > 0;
        html += `
            <div class="mb-6">
                <button class="w-full text-left hover:bg-gray-200 transition-colors duration-200" onclick="toggleMonth('${monthId}')">
                    <h4 class="text-lg font-bold bg-gray-100 p-3 rounded-t flex justify-between items-center">
                        <span>${capitalizeFirstLetter(month)}</span>
                        <svg class="w-6 h-6 transform transition-transform duration-200" id="${monthId}-icon" style="transform: rotate(${isMonthOpen ? 180 : 0}deg);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </h4>
                </button>
                <div id="${monthId}" class="space-y-4 hidden">
        `;

        // Ordenar semanas de más reciente a más antigua
        const sortedWeeks = Object.keys(grouped[month]).sort((a, b) => b - a);

        sortedWeeks.forEach(week => {
            const weekId = `${monthId}-week-${String(week)}`;
            const isWeekOpen = openWeekIds.has(weekId) && openWeekIds.size > 0;
            const weekTransactions = grouped[month][week].sort((a, b) =>
                new Date(b.date) - new Date(a.date)  // Ordenar transacciones de más reciente a más antigua
            );

            html += `
                <div class="ml-4 mb-4">
                    <button class="w-full text-left hover:bg-gray-50 transition-colors duration-200" onclick="toggleWeek('${weekId}')">
                        <h5 class="font-semibold text-gray-700 p-2 flex justify-between items-center">
                            <span>Semana ${week} del mes</span>
                            <svg class="w-4 h-4 transform transition-transform duration-200" id="${weekId}-icon" style="transform: rotate(${isWeekOpen ? 180 : 0}deg);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </h5>
                    </button>
                    <div id="${weekId}" class="hidden">
                        <table class="w-full table-auto">
                            <thead>
                                <tr class="bg-gray-50">
                                    <th class="px-2 py-2 text-center w-8">
                                        <input type="checkbox" onchange="toggleSelectAll(this.checked)" class="rounded">
                                    </th>
                                    <th class="px-4 py-2 text-left w-1/6">Fecha</th>
                                    <th class="px-4 py-2 text-left w-1/6">Tipo</th>
                                    <th class="px-4 py-2 text-left w-2/6">Descripción</th>
                                    <th class="px-4 py-2 text-left w-1/6">Categoría</th>
                                    <th class="px-4 py-2 text-right w-1/6">Monto</th>
                                    <th class="px-4 py-2 text-center w-1/6">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${weekTransactions.map(t => `
                                    <tr class="border-b hover:bg-gray-50">
                                        <td class="px-2 py-2 text-center">
                                            <input type="checkbox" ${selectedTransactionIds.has(t.id) ? 'checked' : ''} onchange="toggleSelect(${t.id})" class="rounded transaction-checkbox">
                                        </td>
                                        <td class="px-4 py-2">${formatearFecha(t.date)}</td>
                                        <td class="px-4 py-2">${t.type === 'income' ? 'Ingreso' : 'Gasto'}</td>
                                        <td class="px-4 py-2">${t.description}</td>
                                        <td class="px-4 py-2">
                                            ${t.type === 'expense'
                    ? (t.category ? t.category : `<span class="text-gray-400">Sin categoría</span>`)
                    : '-'}
                                        </td>
                                        <td class="px-4 py-2 text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                            ${t.type === 'income' ? '+' : '-'}${formatCOP(parseFloat(t.amount))}
                                        </td>
                                        <td class="px-4 py-2 text-center space-x-3">
                                            <button onclick="openEditModal(${t.id})" class="text-emerald-600 hover:text-emerald-800">
                                                Editar
                                            </button>
                                            <button onclick="deleteTransaction(${t.id})" class="text-red-600 hover:text-red-800">
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Restaurar meses abiertos
    openMonthIds.forEach(monthId => {

        const monthEl =
            document.getElementById(monthId);

        const icon =
            document.getElementById(`${monthId}-icon`);

        if (monthEl) {
            monthEl.classList.remove('hidden');
        }

        if (icon) {
            icon.style.transform = 'rotate(180deg)';
        }
    });

    // Restaurar semanas abiertas
    openWeekIds.forEach(weekId => {

        const weekEl =
            document.getElementById(weekId);

        const icon =
            document.getElementById(`${weekId}-icon`);

        if (weekEl) {
            weekEl.classList.remove('hidden');
        }

        if (icon) {
            icon.style.transform = 'rotate(180deg)';
        }
    });
}

// Función para capitalizar la primera letra
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Función para alternar la visibilidad del contenido del mes
function toggleMonth(monthId) {

    const content = document.getElementById(monthId);
    const icon = document.getElementById(`${monthId}-icon`);

    if (content.classList.contains('hidden')) {

        content.classList.remove('hidden');

        icon.style.transform = 'rotate(180deg)';

    } else {

        content.classList.add('hidden');

        icon.style.transform = 'rotate(0deg)';
    }
}

// Hacer la función toggleMonth disponible globalmente
window.toggleMonth = toggleMonth;

// Función para alternar la visibilidad de las semanas
function toggleWeek(weekId) {

    const content = document.getElementById(weekId);
    const icon = document.getElementById(`${weekId}-icon`);

    if (content.classList.contains('hidden')) {

        content.classList.remove('hidden');

        icon.style.transform = 'rotate(180deg)';

    } else {

        content.classList.add('hidden');

        icon.style.transform = 'rotate(0deg)';
    }
}

function expandAllFilteredTransactions() {



    const grouped = groupTransactionsByMonthAndWeek(currentFilteredTransactions);

    const sortedMonths = Object.keys(grouped).sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');

        const dateA = new Date(Date.parse(`${monthA} 1, ${yearA}`));
        const dateB = new Date(Date.parse(`${monthB} 1, ${yearB}`));

        return dateA - dateB;
    });

    sortedMonths.forEach((month, index) => {

        const monthId = `month-${month.replace(/\s+/g, '-')}`;

        openMonthIds.add(monthId);

        const sortedWeeks = Object.keys(grouped[month]);

        sortedWeeks.forEach(week => {

            const weekId = `${monthId}-week-${String(week)}`;

            openWeekIds.add(weekId);
        });
    });

    updateTransactionsList(currentFilteredTransactions);
}

// Hacer la función toggleWeek disponible globalmente
window.toggleWeek = toggleWeek;

function groupTransactionsByMonthAndWeek(transactions) {
    const grouped = {};

    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthYear = date.toLocaleString('es-ES', {
            month: 'long',
            year: 'numeric'
        });

        // Calcular la semana del mes (1-4)
        const day = date.getDate();
        const weekOfMonth = Math.ceil(day / 7);

        if (!grouped[monthYear]) {
            grouped[monthYear] = {};
        }
        if (!grouped[monthYear][weekOfMonth]) {
            grouped[monthYear][weekOfMonth] = [];
        }

        grouped[monthYear][weekOfMonth].push(transaction);
    });

    return grouped;
}

function showConfirmationModal(title, message, onConfirm, isDelete = false) {
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('confirmationModalTitle');
    const modalMessage = document.getElementById('confirmationModalMessage');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    // Ajustar el estilo del botón según el tipo de confirmación
    if (isDelete) {
        confirmButton.className = 'btn-delete';
        confirmButton.textContent = 'Eliminar';
    } else {
        confirmButton.className = 'btn-confirm';
        confirmButton.textContent = 'Confirmar';
    }

    confirmButton.onclick = () => {
        onConfirm();
        modal.style.display = "none";
    };
    cancelButton.onclick = () => {
        modal.style.display = "none";
    };

    modal.style.display = "block";
}

function showInfoModal(title, message) {
    const modal = document.getElementById('infoModal');
    const modalTitle = document.getElementById('infoModalTitle');
    const modalMessage = document.getElementById('infoModalMessage');
    const okButton = document.getElementById('okButton');

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    okButton.onclick = () => {
        modal.style.display = "none";
    };

    modal.style.display = "block";
}

document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    showConfirmationModal(
        'Confirmar Transacción',
        '¿Estás seguro de que quieres registrar esta transacción?',
        async () => {
            document.getElementById('confirmationModal').style.display = "none";
            const tipo = document.getElementById('type').value === 'income' ? 'Ingreso' : 'Gasto';
            const monto = parseCOP(document.getElementById('amount').value);
            const descripcion = document.getElementById('description').value;
            const categoriaSeleccionada = document.getElementById('category')?.value || 'Sin categoría';

            if (tipo === 'Gasto' && (!categoriaSeleccionada || categoriaSeleccionada === 'Sin categoría')) {
                showInfoModal('Error', 'Selecciona una categoría para registrar un gasto.');
                return;
            }

            // Obtener la fecha actual en formato YYYY-MM-DD sin ajuste de zona horaria
            const fecha = new Date();
            const fechaISO = new Date(Date.UTC(
                fecha.getFullYear(),
                fecha.getMonth(),
                fecha.getDate()
            )).toISOString().split('T')[0];

            const transaction = {
                tipo: tipo,
                monto: monto,
                descripcion: descripcion,
                fecha: fechaISO,
                categoria: tipo === 'Gasto' ? categoriaSeleccionada : null
            };

            try {
                await api.addTransaction(transaction);
                showInfoModal('Éxito', 'Transacción registrada exitosamente.');
                loadTransactions();
                e.target.reset();
                if (tipo === 'Gasto') {
                    checkBudgetAlerts().catch(() => {});
                }
            } catch (error) {
                console.error('Error adding transaction:', error);
                showInfoModal('Error', 'Error al registrar la transacción: ' + error.message);
            }
        },
        false // No es eliminación
    );
});

async function deleteTransaction(id) {
    showConfirmationModal(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar esta transacción?',
        async () => {
            document.getElementById('confirmationModal').style.display = "none";
            try {
                await api.deleteTransaction(id);

                const openedMonths = new Set(openMonthIds);
                const openedWeeks = new Set(openWeekIds);

                showInfoModal('Éxito', 'Transacción eliminada exitosamente.');

                await loadTransactions();

                openedMonths.forEach(id => openMonthIds.add(id));
                openedWeeks.forEach(id => openWeekIds.add(id));

                updateTransactionsList(currentFilteredTransactions);
            } catch (error) {
                console.error('Error deleting transaction:', error);
                showInfoModal('Error', 'Error al eliminar la transacción: ' + error.message);
            }
        },
        true // Es eliminación
    );
}

// Hacer la función deleteTransaction disponible globalmente
window.deleteTransaction = deleteTransaction;

function deleteAllTransactions() {
    showConfirmationModal(
        'Primera Confirmación',
        '¿Estás seguro de que quieres eliminar TODAS las transacciones?',
        () => {
            showConfirmationModal(
                'Confirmación Final',
                'Esta acción NO SE PUEDE DESHACER. ¿Realmente deseas continuar?',
                async () => {
                    try {
                        await api.deleteAllTransactions();
                        showInfoModal('Éxito', 'Todas las transacciones han sido eliminadas.');
                        await loadTransactions();
                    } catch (error) {
                        console.error('Error deleting all transactions:', error);
                        showInfoModal('Error', 'Error al eliminar las transacciones: ' + error.message);
                    }
                },
                true
            );
        },
        true
    );
}

// Hacer la función deleteAllTransactions disponible globalmente
window.deleteAllTransactions = deleteAllTransactions;

let editModalTransactionId = null;

function openEditModal(transactionId) {
    editModalTransactionId = transactionId;

    const tx = currentTransactions.find(t => t.id === transactionId);
    if (!tx) {
        showInfoModal('Error', 'No se encontró la transacción.');
        return;
    }

    const modal = document.getElementById('editModal');
    const typeEl = document.getElementById('editType');
    const amountEl = document.getElementById('editAmount');
    const descEl = document.getElementById('editDescription');
    const dateEl = document.getElementById('editDate');
    const categoryField = document.getElementById('editCategoryField');
    const categoryEl = document.getElementById('editCategory');
    const cancelBtn = document.getElementById('editCancel');
    const saveBtn = document.getElementById('editSave');

    const isExpense = tx.type === 'expense';
    if (typeEl) typeEl.value = tx.type;
    if (amountEl) amountEl.value = formatCOPInput(String(tx.amount ?? '0'));
    if (descEl) descEl.value = tx.description || '';
    if (dateEl) dateEl.value = (tx.date || '').split('T')[0];
    if (categoryEl) categoryEl.value = tx.category || '';
    if (categoryField) categoryField.style.display = isExpense ? '' : 'none';
    if (categoryEl) categoryEl.required = isExpense;

    function syncEditCategoryVisibility() {
        const exp = typeEl?.value === 'expense';
        if (categoryField) categoryField.style.display = exp ? '' : 'none';
        if (categoryEl) {
            categoryEl.required = exp;
            if (!exp) categoryEl.value = '';
        }
    }

    typeEl?.addEventListener('change', syncEditCategoryVisibility);
    syncEditCategoryVisibility();

    amountEl?.addEventListener('input', (e) => {
        const el = e.target;
        el.value = formatCOPInput(el.value);
    });

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.style.display = "none";
            editModalTransactionId = null;
        };
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const newType = typeEl?.value;
            const newAmount = parseCOP(amountEl?.value || '0');
            const newDesc = (descEl?.value || '').trim();
            const newDate = dateEl?.value;
            const newCategory = categoryEl?.value || null;

            if (!newType || !['income', 'expense'].includes(newType)) {
                showInfoModal('Error', 'Tipo inválido.');
                return;
            }
            if (!newDesc) {
                showInfoModal('Error', 'La descripción es obligatoria.');
                return;
            }
            if (!newDate) {
                showInfoModal('Error', 'La fecha es obligatoria.');
                return;
            }
            if (newType === 'expense' && !newCategory) {
                showInfoModal('Error', 'Selecciona una categoría para el gasto.');
                return;
            }

            try {
                await api.updateTransaction(editModalTransactionId, {
                    type: newType,
                    amount: newAmount,
                    description: newDesc,
                    date: newDate,
                    category: newType === 'expense' ? newCategory : null
                });
                const openedMonths = new Set(openMonthIds);
                const openedWeeks = new Set(openWeekIds);

                modal.style.display = "none";
                editModalTransactionId = null;

                await loadTransactions();

                openedMonths.forEach(id => openMonthIds.add(id));
                openedWeeks.forEach(id => openWeekIds.add(id));

                updateTransactionsList(currentFilteredTransactions);
            } catch (error) {
                showInfoModal('Error', error.message);
            }
        };
    }

    modal.style.display = "block";
}

window.openEditModal = openEditModal;

// Reemplazar la función initializeFilters por una versión simplificada
function initializeFilters() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
}

function setupAppListeners() {
    initializeFilters();

    // UX: mostrar categoría solo para gastos
    const typeEl = document.getElementById('type');
    const categoryField = document.getElementById('categoryField');
    const categoryEl = document.getElementById('category');

    function syncCategoryVisibility() {
        const isExpense = typeEl?.value === 'expense';
        if (categoryField) categoryField.style.display = isExpense ? '' : 'none';
        if (categoryEl) {
            categoryEl.required = isExpense;
            if (!isExpense) categoryEl.value = '';
        }
    }

    typeEl?.addEventListener('change', syncCategoryVisibility);
    syncCategoryVisibility();

    const formEl = document.getElementById('transactionForm');
    formEl?.addEventListener('reset', () => {
        setTimeout(syncCategoryVisibility, 0);
    });

    // Separadores de miles en monto
    const amountEl = document.getElementById('amount');
    amountEl?.addEventListener('input', (e) => {
        const el = e.target;
        const formatted = formatCOPInput(el.value);
        el.value = formatted;
    });

    // Separadores de miles en presupuesto
    const budgetLimitEl = document.getElementById('budgetLimit');
    budgetLimitEl?.addEventListener('input', (e) => {
        const el = e.target;
        el.value = formatCOPInput(el.value);
    });

    // Filtros
    const filterTypeEl = document.getElementById('filterType');
    const filterCategoryEl = document.getElementById('filterCategory');
    const filterDescEl = document.getElementById('filterDescription');
    const clearFiltersBtn = document.getElementById('clearFilters');

    function syncFilterCategoryAvailability() {
        if (filterTypeEl?.value === 'income') {
            if (filterCategoryEl) {
                filterCategoryEl.value = '';
                filterCategoryEl.disabled = true;
                filterCategoryEl.classList.add('opacity-60');
            }
        } else {
            if (filterCategoryEl) {
                filterCategoryEl.disabled = false;
                filterCategoryEl.classList.remove('opacity-60');
            }
        }
    }

    let filterTimer = null;
    function applyFiltersDebounced() {
        clearTimeout(filterTimer);
        filterTimer = setTimeout(() => {
            syncFilterCategoryAvailability();
            updateChartsWithFilters();
            expandAllFilteredTransactions();
            document.getElementById('groupedTransactions').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    }

    filterTypeEl?.addEventListener('change', applyFiltersDebounced);
    filterCategoryEl?.addEventListener('change', applyFiltersDebounced);
    filterDescEl?.addEventListener('input', applyFiltersDebounced);

    clearFiltersBtn?.addEventListener('click', () => {
        if (filterTypeEl) filterTypeEl.value = 'all';
        if (filterCategoryEl) filterCategoryEl.value = '';
        if (filterDescEl) filterDescEl.value = '';
        document.getElementById('calendarFilterDate').value = '';
        initializeFilters();
        syncFilterCategoryAvailability();
        updateChartsWithFilters();
        expandAllFilteredTransactions();
    });

    const distributionRangeEl = document.getElementById('distributionRange');
    distributionRangeEl?.addEventListener('change', () => {
        updateChartsWithFilters();
    });

    syncFilterCategoryAvailability();

    // Histórico financiero
    const historyCategory = document.getElementById('historyCategory');
    const historyPeriod = document.getElementById('historyPeriod');
    const historyChartType = document.getElementById('historyChartType');

    function updateHistorySection() {
        charts.updateHistoryChart(currentTransactions);
    }

    historyCategory?.addEventListener('change', updateHistorySection);
    historyPeriod?.addEventListener('change', updateHistorySection);
    historyChartType?.addEventListener('change', updateHistorySection);
}

function loadDataAndCharts() {
    loadTransactions().then(() => {
        if (charts && typeof charts.updateHistoryChart === 'function') {
            charts.updateHistoryChart(currentTransactions);
        }
        loadCategories().catch(() => {});
        checkBudgetAlerts().catch(() => {});
        loadNotificationSettings().catch(() => {});
    });
}

document.addEventListener('DOMContentLoaded', function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.error('SW registration error:', err));
    }
    applyDarkModePreference();
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        document.documentElement.classList.add('sidebar-collapsed');
        const btn = document.getElementById('sidebarCollapseBtn');
        if (btn) btn.title = 'Expandir menú';
    }
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        setCurrentUser(currentUser.googleId);
        showApp();
        setupAppListeners();
        loadDataAndCharts();
    } else {
        renderGoogleButton();
    }
});

// --- CATEGORÍAS PERSONALIZADAS ---

const DEFAULT_CATEGORIES = ['Mercado', 'Bancos', 'Entretenimiento', 'Transporte', 'Salud', 'Hogar', 'Mensualidades', 'Comida', 'Servicios'];

const CATEGORY_PALETTE = [
    'rgb(255, 159, 64)',
    'rgb(54, 162, 235)',
    'rgb(153, 102, 255)',
    'rgb(86, 249, 255)',
    'rgb(246, 134, 158)',
    'rgb(190, 56, 137)',
    'rgb(246, 255, 0)',
    'rgb(34, 197, 94)',
    'rgb(249, 115, 22)'
];

async function loadCategories() {
    if (!currentUser) return;
    const res = await api.getCategories();
    const customCategories = (res.data || []).map(c => ({ name: c.name, color: c.color }));

    if (typeof FinanceCharts !== 'undefined') {
        const colors = {};
        customCategories.forEach((c, i) => {
            colors[c.name] = c.color || CATEGORY_PALETTE[i % CATEGORY_PALETTE.length];
        });
        FinanceCharts.registerCategoryColors(colors);
    }

    const all = [...DEFAULT_CATEGORIES, ...customCategories.map(c => c.name)];
    populateCategorySelects(all);
    renderCategoriesList(customCategories);
}

function populateCategorySelects(categories) {
    const selectIds = ['category', 'filterCategory', 'historyCategory', 'budgetCategory', 'categoryModalSelect', 'editCategory'];
    selectIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const current = el.value;
        const isHistory = id === 'historyCategory';
        el.innerHTML = '';
        if (isHistory) {
            el.innerHTML = '<option value="all">Todos los gastos</option><option value="income">Ingresos</option>';
        } else {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = id === 'filterCategory' ? 'Todas' : id === 'budgetCategory' ? 'Categoría' : 'Selecciona una categoría';
            el.appendChild(opt);
        }
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            el.appendChild(opt);
        });
        if (current && (current === 'all' || current === 'income' || categories.includes(current))) {
            el.value = current;
        }
    });
}

function renderCategoriesList(customCategories) {
    const container = document.getElementById('categoriesList');
    const empty = document.getElementById('categoriesEmpty');
    if (!container) return;

    if (!customCategories || customCategories.length === 0) {
        container.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }
    if (empty) empty.classList.add('hidden');
    container.innerHTML = customCategories.map(c => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
                <span class="inline-block w-4 h-4 rounded-full" style="background:${c.color || '#94a3b8'}"></span>
                <span class="font-medium">${c.name}</span>
            </div>
            <button onclick="deleteCustomCategory('${c.name.replace(/'/g, "\\'")}')" class="text-red-500 hover:text-red-700 text-sm">Eliminar</button>
        </div>
    `).join('');
}

async function addCustomCategory(e) {
    e.preventDefault();
    const nameEl = document.getElementById('newCategoryName');
    const colorEl = document.getElementById('newCategoryColor');
    const name = nameEl.value.trim();
    if (!name) {
        showInfoModal('Error', 'Escribe el nombre de la categoría.');
        return;
    }
    if (DEFAULT_CATEGORIES.includes(name)) {
        showInfoModal('Error', 'Esa categoría ya existe por defecto.');
        return;
    }
    const color = colorEl.value || null;
    try {
        await api.addCategory(name, color);
        nameEl.value = '';
        await loadCategories();
        showInfoModal('Éxito', 'Categoría agregada.');
    } catch (err) {
        console.error('Error adding category:', err);
        showInfoModal('Error', 'Error al agregar la categoría: ' + err.message);
    }
}

async function deleteCustomCategory(name) {
    showConfirmationModal(
        'Eliminar categoría',
        `¿Eliminar la categoría "${name}"? Las transacciones existentes se conservan.`,
        async () => {
            document.getElementById('confirmationModal').style.display = 'none';
            try {
                await api.deleteCategory(name);
                await loadCategories();
                showInfoModal('Éxito', 'Categoría eliminada.');
            } catch (err) {
                console.error('Error deleting category:', err);
                showInfoModal('Error', 'Error al eliminar la categoría: ' + err.message);
            }
        },
        false
    );
}

// --- NOTIFICACIONES PUSH ---

function requestNotificationPermission() {
    if (!('Notification' in window)) return Promise.resolve('unsupported');
    if (Notification.permission === 'default') {
        return Notification.requestPermission().catch(() => Notification.permission);
    }
    return Promise.resolve(Notification.permission);
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    if (!currentUser) return false;
    try {
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') return false;

        const keyRes = await fetch(window.API_URL + '/push/vapid-public-key');
        if (!keyRes.ok) return false;
        const keyData = await keyRes.json();

        const reg = await navigator.serviceWorker.ready;
        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
            subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
            });
        }
        await api.savePushSubscription(subscription);
        return true;
    } catch (err) {
        console.error('Error subscribing to push:', err);
        return false;
    }
}

async function checkBudgetAlerts() {
    if (!currentUser) return;
    if (currentUser.email) {
        try {
            await api.checkBudgetAlerts(currentUser.email);
        } catch (err) {
            console.error('Error checking budget alerts:', err);
        }
    }
    subscribeToPush();
}

// --- AJUSTES DE RECORDATORIOS ---

const reminderKeys = { daily: 'daily_enabled', weekly: 'weekly_enabled', inactivity: 'inactivity_enabled' };

function updateReminderSwitch(key, enabled) {
    const sw = document.getElementById(key + 'ReminderSwitch');
    const thumb = document.getElementById(key + 'ReminderThumb');
    if (!sw) return;
    sw.style.background = enabled ? '#059669' : '#d1d5db';
    if (thumb) thumb.style.transform = enabled ? 'translateX(28px)' : 'translateX(0)';
}

async function loadNotificationSettings() {
    if (!currentUser) return;
    try {
        const res = await api.getNotificationSettings();
        const s = res.data || {};
        Object.keys(reminderKeys).forEach(key => {
            updateReminderSwitch(key, s[reminderKeys[key]] !== false);
        });
    } catch (err) {
        console.error('Error loading notification settings:', err);
    }
}

async function toggleReminder(key) {
    if (!currentUser) return;
    const sw = document.getElementById(key + 'ReminderSwitch');
    if (!sw) return;
    const enabled = sw.style.background !== 'rgb(5, 150, 105)';
    updateReminderSwitch(key, enabled);
    try {
        const settings = {};
        Object.keys(reminderKeys).forEach(k => {
            settings[reminderKeys[k]] = k === key ? enabled : document.getElementById(k + 'ReminderSwitch')?.style.background === 'rgb(5, 150, 105)';
        });
        await api.saveNotificationSettings(settings);
    } catch (err) {
        console.error('Error saving notification settings:', err);
        updateReminderSwitch(key, !enabled);
        showInfoModal('Error', 'No se pudieron guardar los ajustes.');
    }
}

// --- PRESUPUESTOS ---

async function saveBudget(e) {
    e.preventDefault();
    const category = document.getElementById('budgetCategory').value;
    const limit = parseCOP(document.getElementById('budgetLimit').value);
    if (!category || !limit) return false;

    try {
        await api.saveBudget(category, limit);
        document.getElementById('budgetForm').reset();
        await loadBudgets();
    } catch (error) {
        showInfoModal('Error', error.message);
    }
    return false;
}

async function deleteBudget(category) {
    try {
        await api.deleteBudget(category);
        await loadBudgets();
    } catch (error) {
        showInfoModal('Error', error.message);
    }
}

function getMonthSpending(category) {
    try {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        const transactions = currentTransactions || [];

        return transactions
            .filter(t => {
                const d = new Date(t.date?.split('T')[0] || t.date);
                return d.getMonth() === month && d.getFullYear() === year
                    && t.type === 'expense'
                    && t.category === category;
            })
            .reduce((sum, t) => sum + Number(t.amount), 0);
    } catch { return 0; }
}

async function loadBudgets() {
    try {
        const res = await api.getBudgets();
        const budgets = res.data || [];
        const container = document.getElementById('budgetsList');
        const empty = document.getElementById('budgetsEmpty');
        if (!container || !empty) return;

        if (budgets.length === 0) {
            container.innerHTML = '';
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');

        container.innerHTML = budgets.map(b => {
            const limit = Number(b.limit_amount);
            const spent = getMonthSpending(b.category);
            const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-400' : 'bg-emerald-500';

            return `
                <div class="bg-white rounded-lg shadow-md p-5 mobile-p-3">
                    <div class="flex justify-between items-center mb-2">
                        <div>
                            <span class="font-bold text-gray-800">${b.category}</span>
                            <span class="text-sm text-gray-400 ml-2">${pct >= 100 ? '¡Excedido!' : ''}</span>
                        </div>
                        <button onclick="deleteBudget('${b.category}')" class="text-red-400 hover:text-red-600 text-sm">Eliminar</button>
                    </div>
                    <div class="flex justify-between text-sm text-gray-500 mb-2">
                        <span>$${spent.toLocaleString('es-CO')} gastados</span>
                        <span>$${limit.toLocaleString('es-CO')} límite</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div class="h-3 rounded-full ${color} transition-all duration-500" style="width: ${Math.min(pct, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error loading budgets:', e);
    }
}

// Cargar transacciones al iniciar (se hace dentro de DOMContentLoaded)
