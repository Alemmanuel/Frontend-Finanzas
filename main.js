const charts = new FinanceCharts();
let currentTransactions = [];

async function loadTransactions() {
    try {
        const response = await api.getTransactions();
        currentTransactions = response.data; // Usar directamente el array de transacciones
        updateTransactionsList(currentTransactions);
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
    // Ya no necesitamos obtener filterType ni reportType
    // Actualizar directamente las gráficas con las transacciones actuales
    updateTransactionsList(currentTransactions);
    charts.updateCharts(currentTransactions);

    // Configurar event listeners para los botones de descarga
    document.getElementById('downloadPdf').addEventListener('click', () => {
        downloadPdf(currentTransactions);
    });

    document.getElementById('downloadExcel').addEventListener('click', () => {
        downloadExcel(currentTransactions);
    });
}

function downloadPdf(transactions) {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        showInfoModal('Error', 'Por favor seleccione un rango de fechas');
        return;
    }

    // Filtrar transacciones por rango de fechas
    const filteredTransactions = transactions.filter(t => 
        t.date >= startDate && t.date <= endDate
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
    const dateRange = `Período: ${formatearFecha(startDate)} - ${formatearFecha(endDate)}`;
    const dateWidth = doc.getStringUnitWidth(dateRange) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const dateX = (pageWidth - dateWidth) / 2;
    doc.text(dateRange, dateX, 30);

    // Definir columnas
    const columns = [
        { header: 'Fecha', dataKey: 'date' },
        { header: 'Tipo', dataKey: 'type' },
        { header: 'Descripción', dataKey: 'description' },
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
        didDrawPage: function(data) {
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
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
        showInfoModal('Error', 'Por favor seleccione un rango de fechas');
        return;
    }

    // Filtrar transacciones por rango de fechas
    const filteredTransactions = transactions.filter(t => 
        t.date >= startDate && t.date <= endDate
    );

    if (filteredTransactions.length === 0) {
        showInfoModal('Sin datos', 'No hay transacciones en el rango seleccionado');
        return;
    }

    const wb = XLSX.utils.book_new();

    // Agregar título y rango de fechas
    const excelData = [
        [`Reporte de Transacciones`],
        [`Período: ${formatearFecha(startDate)} - ${formatearFecha(endDate)}`],
        [], // Línea en blanco
        ['Fecha', 'Tipo', 'Descripción', 'Monto']
    ];

    // Agregar datos
    filteredTransactions.forEach(transaction => {
        excelData.push([
            formatearFecha(transaction.date),
            transaction.type === 'income' ? 'Ingreso' : 'Gasto',
            transaction.description,
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

function formatearFecha(fechaString) {
    // Ajustar la fecha para la zona horaria local
    const fecha = new Date(fechaString);
    const fechaLocal = new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
    return fechaLocal.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '-');
}

function updateTransactionsList(transactions) {
    const container = document.getElementById('groupedTransactions');
    
    if (!transactions || transactions.length === 0) {
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
        const monthId = `month-${index}`;
        html += `
            <div class="mb-6">
                <button class="w-full text-left hover:bg-gray-200 transition-colors duration-200" onclick="toggleMonth('${monthId}')">
                    <h4 class="text-lg font-bold bg-gray-100 p-3 rounded-t flex justify-between items-center">
                        <span>${capitalizeFirstLetter(month)}</span>
                        <svg class="w-6 h-6 transform transition-transform duration-200" id="${monthId}-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </h4>
                </button>
                <div id="${monthId}" class="space-y-4 hidden">
        `;

        // Ordenar semanas de más reciente a más antigua
        const sortedWeeks = Object.keys(grouped[month]).sort((a, b) => b - a);

        sortedWeeks.forEach(week => {
            const weekId = `${monthId}-week-${week}`;
            const weekTransactions = grouped[month][week].sort((a, b) => 
                new Date(b.date) - new Date(a.date)  // Ordenar transacciones de más reciente a más antigua
            );

            html += `
                <div class="ml-4 mb-4">
                    <button class="w-full text-left hover:bg-gray-50 transition-colors duration-200" onclick="toggleWeek('${weekId}')">
                        <h5 class="font-semibold text-gray-700 p-2 flex justify-between items-center">
                            <span>Semana ${week} del mes</span>
                            <svg class="w-4 h-4 transform transition-transform duration-200" id="${weekId}-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </h5>
                    </button>
                    <div id="${weekId}" class="hidden">
                        <table class="w-full table-auto">
                            <thead>
                                <tr class="bg-gray-50">
                                    <th class="px-4 py-2 text-left w-1/6">Fecha</th>
                                    <th class="px-4 py-2 text-left w-1/6">Tipo</th>
                                    <th class="px-4 py-2 text-left w-2/6">Descripción</th>
                                    <th class="px-4 py-2 text-right w-1/6">Monto</th>
                                    <th class="px-4 py-2 text-center w-1/6">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${weekTransactions.map(t => `
                                    <tr class="border-b hover:bg-gray-50">
                                        <td class="px-4 py-2">${formatearFecha(t.date)}</td>
                                        <td class="px-4 py-2">${t.type === 'income' ? 'Ingreso' : 'Gasto'}</td>
                                        <td class="px-4 py-2">${t.description}</td>
                                        <td class="px-4 py-2 text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                                            ${t.type === 'income' ? '+' : '-'}${formatCOP(parseFloat(t.amount))}
                                        </td>
                                        <td class="px-4 py-2 text-center">
                                            <button onclick="deleteTransaction(${t.id})" 
                                                    class="text-red-600 hover:text-red-800">
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
      const monto = Number(document.getElementById('amount').value);
      const descripcion = document.getElementById('description').value;
      const fecha = new Date().toISOString().split('T')[0];

      const transaction = {
        tipo: tipo,
        monto: monto,
        descripcion: descripcion,
        fecha: fecha
      };

      try {
        await api.addTransaction(transaction);
        showInfoModal('Éxito', 'Transacción registrada exitosamente.');
        loadTransactions();
        e.target.reset();
      } catch (error) {
        console.error('Error adding transaction:', error);
        showInfoModal('Error', 'Error al registrar la transacción: ' + error.message);
      }
    },
    false // No es eliminación
  );
});

// Hacer la función deleteTransaction disponible globalmente
window.deleteTransaction = deleteTransaction;

async function deleteTransaction(id) {
    showConfirmationModal(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar esta transacción?',
        async () => {
            document.getElementById('confirmationModal').style.display = "none";
            try {
                await api.deleteTransaction(id);
                showInfoModal('Éxito', 'Transacción eliminada exitosamente.');
                loadTransactions();
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

// Reemplazar la función initializeFilters por una versión simplificada
function initializeFilters() {
    // Establecer fecha actual en los campos de fecha
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;
}

// Eliminar los event listeners antiguos de filtros y simplificar la inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    loadTransactions();
});

// Cargar transacciones al iniciar
loadTransactions();
