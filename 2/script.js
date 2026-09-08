// Arreglo global de socios y referencias DOM
let listaSocios = [];
const socioForm = document.getElementById('socioForm');
const tablaSociosBody = document.getElementById('tablaSocios').querySelector('tbody');
const totalSociosLabel = document.getElementById('totalSocios');

// Cargar datos desde localStorage al iniciar
document.addEventListener('DOMContentLoaded', () => {
  const datosGuardados = localStorage.getItem('socios_agua_potable');
  if (datosGuardados) {
    listaSocios = JSON.parse(datosGuardados);
  } else {
    // Datos iniciales de prueba si la lista está vacía
    listaSocios = [
      { cedula: '1723456781', nombres: 'Pérez Juan', sector: 'Sector Central', medidor: 'MED-1020', lecturaInicial: 0, telefono: '0998765432' },
      { cedula: '1787654321', nombres: 'López María', sector: 'Barrio Alto', medidor: 'MED-1021', lecturaInicial: 10, telefono: '0981234567' }
    ];
    guardarEnLocalStorage();
  }
  renderizarTabla();
});

// 1. REGISTRO O ACTUALIZACIÓN MANUAL (MANEJO DE DUPICADOS CON CÉDULA)
socioForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const socioData = {
    cedula: document.getElementById('cedula').value.trim(),
    nombres: document.getElementById('nombres').value.trim(),
    sector: document.getElementById('sector').value.trim(),
    medidor: document.getElementById('numMedidor').value.trim(),
    lecturaInicial: parseFloat(document.getElementById('lecturaInicial').value) || 0,
    telefono: document.getElementById('telefono').value.trim() || 'S/N'
  };

  const index = listaSocios.findIndex(s => s.cedula === socioData.cedula);

  if (index !== -1) {
    // Cotejo: Actualiza si ya existe la cédula
    listaSocios[index] = socioData;
    alert('Socio existente actualizado con éxito.');
  } else {
    // Agrega nuevo registro
    listaSocios.push(socioData);
    alert('Nuevo socio registrado con éxito.');
  }

  guardarEnLocalStorage();
  renderizarTabla();
  socioForm.reset();
  document.getElementById('lecturaInicial').value = 0;
});

// 2. CARGA MASIVA Y COTEJO DESDE EXCEL (.XLSX)
function cargarExcelMasivo() {
  const fileInput = document.getElementById('inputExcel');
  const file = fileInput.files[0];

  if (!file) {
    alert('Por favor, selecciona un archivo de Excel (.xlsx) primero.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonExcel = XLSX.utils.sheet_to_json(worksheet);

    let creados = 0;
    let actualizados = 0;

    jsonExcel.forEach(item => {
      const cedula = String(item.Cedula || item.CEDULA || '').trim();
      if (!cedula) return;

      const socioData = {
        cedula: cedula,
        nombres: item.Nombres || item.NOMBRES || 'Sin Nombre',
        sector: item.Sector || item.SECTOR || 'General',
        medidor: item.Medidor || item.MEDIDOR || 'S/N',
        lecturaInicial: parseFloat(item.LecturaInicial || item.LECTURA_INICIAL) || 0,
        telefono: String(item.Telefono || item.TELEFONO || 'S/N')
      };

      const index = listaSocios.findIndex(s => s.cedula === socioData.cedula);

      if (index !== -1) {
        listaSocios[index] = socioData;
        actualizados++;
      } else {
        listaSocios.push(socioData);
        creados++;
      }
    });

    guardarEnLocalStorage();
    renderizarTabla();
    fileInput.value = '';
    alert(`Proceso masivo completado:\n• Registros Nuevos: ${creados}\n• Registros Actualizados: ${actualizados}`);
  };

  reader.readAsArrayBuffer(file);
}

// 3. RENDERIZAR TABLA EN PANTALLA
function renderizarTabla() {
  tablaSociosBody.innerHTML = '';

  listaSocios.forEach(socio => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${socio.cedula}</td>
      <td><strong>${socio.nombres}</strong></td>
      <td>${socio.sector}</td>
      <td>${socio.medidor}</td>
      <td>${socio.lecturaInicial} m³</td>
      <td>${socio.telefono}</td>
      <td><span class="badge-active">Activo</span></td>
    `;
    tablaSociosBody.appendChild(tr);
  });

  totalSociosLabel.textContent = `Total: ${listaSocios.length}`;
}

// 4. GUARDAR PERSISTENCIA
function guardarEnLocalStorage() {
  localStorage.setItem('socios_agua_potable', JSON.stringify(listaSocios));
}

// 5. EXPORTAR A EXCEL
function exportarExcel() {
  const tabla = document.getElementById('tablaSocios');
  const wb = XLSX.utils.table_to_book(tabla, { sheet: "Socios" });
  XLSX.writeFile(wb, "Registro_Socios_Agua_Potable.xlsx");
}

// 6. EXPORTAR A PDF
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');

  doc.setFontSize(16);
  doc.setTextColor(2, 132, 199);
  doc.text("Junta de Agua Potable Comunitaria", 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Reporte de Socios | Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 22);

  const headers = [["Cédula", "Socio", "Sector", "N° Medidor", "L. Inicial", "Teléfono", "Estado"]];
  const data = listaSocios.map(s => [s.cedula, s.nombres, s.sector, s.medidor, `${s.lecturaInicial} m³`, s.telefono, 'Activo']);

  doc.autoTable({
    head: headers,
    body: data,
    startY: 27,
    theme: 'grid',
    headStyles: { fillColor: [2, 132, 199] },
    styles: { fontSize: 8, cellPadding: 3 }
  });

  doc.save("Registro_Socios_Agua_Potable.pdf");
}

// 7. VACIAR BASE DE DATOS
function limpiarBaseDatos() {
  if (confirm('¿Estás seguro de borrar todos los socios cargados? Esta acción no se puede deshacer.')) {
    listaSocios = [];
    guardarEnLocalStorage();
    renderizarTabla();
  }
}