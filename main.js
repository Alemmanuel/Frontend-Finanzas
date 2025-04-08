const charts = new FinanceCharts();
let currentTransactions = [];

async function loadTransactions() {
    try {
        currentTransactions = await api.getTransactions();
        updateTransactionsList(currentTransactions);
        updateChartsWithFilters();
    } catch (error) {
        console.error('Error loading transactions:', error);
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
    const filterType = document.getElementById('filterType').value;
    let filterDate = null;
    const reportType = document.getElementById('reportType').value;

    switch(filterType) {
        case 'day':
            filterDate = document.getElementById('filterDate').value;
            break;
        case 'week':
            // ...existing week code...
            break;
        case 'month':
            // ...existing month code...
            break;
        case 'custom':
            // ...existing custom code...
            break;
    }

    // Filtrar las transacciones
    let filteredTransactions = filterTransactions(currentTransactions, filterType, filterDate);

    // Generar reporte si se selecciona un tipo de reporte
    if (reportType !== 'none') {
        filteredTransactions = charts.generateReport(currentTransactions, reportType);
    }
    
    // Verificar si hay resultados
    if (filteredTransactions.length === 0) {
        showInfoModal('Sin resultados', 'No se encontraron transacciones para los filtros seleccionados.');
        return; // Salir de la función si no hay resultados
    }

    // Actualizar la lista y las gráficas si hay resultados
    updateTransactionsList(filteredTransactions);
    charts.updateCharts(filteredTransactions);

    // Agregar event listeners para los botones de descarga
    document.getElementById('downloadPdf').addEventListener('click', () => {
        downloadPdf(filteredTransactions);
    });

    document.getElementById('downloadExcel').addEventListener('click', () => {
        downloadExcel(filteredTransactions);
    });
}

function downloadPdf(transactions) {
    if (typeof window.jspdf === 'undefined') {
        showInfoModal('Error', 'La librería jsPDF no se ha cargado correctamente. Por favor, recargue la página.');
        return;
    }

    const { jsPDF } = window.jspdf;
    
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    doc.setFontSize(20);
    doc.text('Reporte de Transacciones', 10, 10);

    // Definir columnas
    const columns = [
        { header: 'Fecha', dataKey: 'date' },
        { header: 'Tipo', dataKey: 'type' },
        { header: 'Descripción', dataKey: 'description' },
        { header: 'Monto', dataKey: 'amount' }
    ];

    // Preparar datos para la tabla con validación de montos
    const tableData = transactions.map(transaction => {
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
        startY: 25,
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
    const wb = XLSX.utils.book_new();

    // Preparar los datos para el Excel con validación de montos
    const excelData = transactions.map(transaction => {
        // Usar la propiedad 'amount' en lugar de 'monto'
        const monto = parseFloat(transaction.amount) || 0;
        return {
            Fecha: formatearFecha(transaction.date),
            Tipo: transaction.type === 'income' ? 'Ingreso' : 'Gasto',
            Descripción: transaction.description,
            Monto: formatCOP(monto)
        };
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Transacciones");
    XLSX.writeFile(wb, 'reporte_transacciones.xlsx');
}

// Función para formatear montos en pesos colombianos
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

// Inicializar los filtros
function initializeFilters() {
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('filterYear');
    
    // Llenar años (desde 2020 hasta el año actual)
    for (let year = 2020; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;

    // Manejar cambios en el tipo de filtro
    document.getElementById('filterType').addEventListener('change', function() {
        const filterType = this.value;
        document.getElementById('dayFilter').classList.add('hidden');
        document.getElementById('weekFilter').classList.add('hidden');
        document.getElementById('monthFilter').classList.add('hidden');
        document.getElementById('customFilter').classList.add('hidden');

        switch(filterType) {
            case 'day':
                document.getElementById('dayFilter').classList.remove('hidden');
                break;
            case 'week':
                document.getElementById('weekFilter').classList.remove('hidden');
                updateWeekOptions();
                break;
            case 'month':
                document.getElementById('monthFilter').classList.remove('hidden');
                break;
            case 'custom':
                document.getElementById('customFilter').classList.remove('hidden');
                break;
        }
    });
}

function updateWeekOptions() {
    const weekSelect = document.getElementById('filterWeek');
    weekSelect.innerHTML = '';

    const now = new Date();
    const currentWeek = getWeekNumber(now);
    
    for (let i = 1; i <= 52; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Semana ${i}`;
        if (i === currentWeek) {
            option.selected = true;
        }
        weekSelect.appendChild(option);
    }
}

// Inicializar filtros al cargar la página
initializeFilters();

// Agregar event listeners para los filtros
document.getElementById('applyFilter').addEventListener('click', updateChartsWithFilters);
document.getElementById('filterType').addEventListener('change', () => {
    if (document.getElementById('filterType').value === 'all') {
        document.getElementById('filterDate').value = '';
        updateChartsWithFilters();
    }
});

// Asegurarse de que el filtro de día tenga una fecha por defecto
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filterDate').value = today;
});

// Cargar transacciones al iniciar
loadTransactions();
