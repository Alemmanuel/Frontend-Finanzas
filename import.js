// Hacer las funciones disponibles globalmente
window.abrirModalImportar = function() {
    document.getElementById('modalImportar').classList.remove('hidden');
}

window.cerrarModalImportar = function() {
    document.getElementById('modalImportar').classList.add('hidden');
    document.getElementById('archivoExcel').value = '';
}

window.importarExcel = async function() {
    const inputArchivo = document.getElementById('archivoExcel');
    const archivo = inputArchivo.files[0];

    if (!archivo) {
        showInfoModal('Error', 'Por favor seleccione un archivo Excel');
        return;
    }

    // Mostrar indicador de carga
    const loadingModal = document.getElementById('loadingModal');
    loadingModal.style.display = "block";

    const botonImportar = document.getElementById('botonImportar');
    botonImportar.disabled = true;
    botonImportar.textContent = 'Importando...';

    try {
        const datos = await leerArchivoExcel(archivo);
        if (validarDatosExcel(datos)) {
            await importarTransacciones(datos);
            cerrarModalImportar();
            loadTransactions(); // Recargar la lista de transacciones
            showInfoModal('Éxito', 'Importación completada exitosamente.');
        }
    } catch (error) {
        showInfoModal('Error', 'Error al importar el archivo: ' + error.message);
    } finally {
        // Restaurar el botón, independientemente del resultado
        loadingModal.style.display = "none";
        botonImportar.disabled = false;
        botonImportar.textContent = 'Importar';
    }
}

function leerArchivoExcel(archivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const datos = e.target.result;
                const workbook = XLSX.read(datos, { 
                    type: 'binary',
                    codepage: 65001, // UTF-8
                    raw: true
                });
                const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
                const datosJson = XLSX.utils.sheet_to_json(primeraHoja);
                
                // Limpiar caracteres especiales en las descripciones
                const datosLimpios = datosJson.map(fila => ({
                    ...fila,
                    descripcion: limpiarTexto(fila.descripcion)
                }));
                
                resolve(datosLimpios);
            } catch (error) {
                reject(new Error('Error al leer el archivo Excel'));
            }
        };
        reader.onerror = reject;
        reader.readAsBinaryString(archivo);
    });
}

// Función para limpiar texto de caracteres especiales
function limpiarTexto(texto) {
    if (typeof texto !== 'string') return texto;
    
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^\x20-\x7E]/g, '') // Mantener solo caracteres ASCII imprimibles
        .trim();
}

function validarDatosExcel(datos) {
    if (!Array.isArray(datos) || datos.length === 0) {
        showInfoModal('Error', 'El archivo está vacío o no tiene el formato correcto');
        return false;
    }

    const columnasRequeridas = ['tipo', 'monto', 'descripcion', 'fecha'];
    const primeraFila = datos[0];

    for (const columna of columnasRequeridas) {
        if (!(columna in primeraFila)) {
            showInfoModal('Error', `Falta la columna requerida: ${columna}`);
            return false;
        }
    }

    // Validar tipos de datos
    for (const fila of datos) {
        // Convertir tipo a inglés para la base de datos
        const tipoValido = fila.tipo.toLowerCase();
        if (!['ingreso', 'gasto'].includes(tipoValido)) {
            showInfoModal('Error', `Tipo inválido en fila ${datos.indexOf(fila) + 1}. Debe ser 'ingreso' o 'gasto'`);
            return false;
        }
        if (typeof fila.monto !== 'number') {
            showInfoModal('Error', `Monto inválido en fila ${datos.indexOf(fila) + 1}: ${fila.monto}`);
            return false;
        }
        if (!fila.descripcion) {
            showInfoModal('Error', `Descripción vacía en fila ${datos.indexOf(fila) + 1}`);
            return false;
        }
        if (!esFechaValida(fila.fecha)) {
            showInfoModal('Error', `Fecha inválida en fila ${datos.indexOf(fila) + 1}. Use el formato DD-MM-AAAA`);
            return false;
        }
    }

    return true;
}

function esFechaValida(fechaString) {
    // Asegurarse de que la fecha sea un string
    if (typeof fechaString !== 'string') {
        // Si es un número, podría ser una fecha de Excel
        if (typeof fechaString === 'number') {
            try {
                // Convertir fecha de Excel a fecha JS
                const fecha = new Date((fechaString - 25569) * 86400 * 1000);
                return !isNaN(fecha);
            } catch (error) {
                return false;
            }
        }
        return false;
    }

    // Verificar formato D/MM/AAAA o DD/MM/AAAA
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = fechaString.match(regex);
    
    if (!match) return false;
    
    let [, dia, mes, anio] = match;
    // Asegurarse de que día y mes tengan dos dígitos
    dia = dia.padStart(2, '0');
    mes = mes.padStart(2, '0');
    
    // Convertir a Date (mes-1 porque en JS los meses van de 0-11)
    const fecha = new Date(anio, mes - 1, dia);
    
    // Verificar que la fecha sea válida
    return fecha.getDate() == parseInt(dia) &&
           fecha.getMonth() == parseInt(mes) - 1 &&
           fecha.getFullYear() == parseInt(anio);
}

async function importarTransacciones(datos) {
    console.log('Datos a importar:', datos); // Debug

    for (const fila of datos) {
        try {
            let fechaISO;
            
            console.log('Procesando fila:', fila); // Debug

            // Convertir la fecha según su tipo
            if (typeof fila.fecha === 'number') {
                const fecha = new Date((fila.fecha - 25569) * 86400 * 1000);
                fechaISO = fecha.toISOString().split('T')[0];
            } else if (typeof fila.fecha === 'string') {
                const [dia, mes, anio] = fila.fecha.split('/');
                fechaISO = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            } else {
                console.log('Formato de fecha no válido:', fila.fecha);
                throw new Error('Formato de fecha no válido');
            }

            // Asegurarse de que el monto sea un número
            let monto = fila.monto;
            if (typeof monto === 'string') {
                monto = parseFloat(monto.replace(/[^0-9.,]+/g, '').replace(',', '.'));
            } else {
                monto = Number(monto);
            }

            if (isNaN(monto)) {
                console.log('Monto no válido:', fila.monto);
                throw new Error('Monto no válido');
            }

            // Mejorar la detección del tipo
            const tipoLower = fila.tipo.toString().toLowerCase().trim();
            const tipo = tipoLower.includes('ingreso') ? 'Ingreso' : 'Gasto';

            const transaccion = {
                tipo: tipo,
                monto: monto,
                descripcion: (fila.descripcion || '').toString().trim(),
                fecha: fechaISO
            };

            console.log('Transacción preparada:', transaccion); // Debug

            const resultado = await api.addTransaction(transaccion);
            console.log('Respuesta del servidor:', resultado);

        } catch (error) {
            console.error('Error detallado:', error);
            throw new Error(`Error en la fila "${fila.descripcion}": ${error.message}`);
        }
    }
    
    showInfoModal('Éxito', 'Importación completada exitosamente');
    loadTransactions();
}
