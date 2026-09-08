// Importar Firebase y Firestore desde el SDK modular de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración de Firebase (Reemplaza con tus credenciales reales si es necesario)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "juntaaguapotable-56728.firebaseapp.com",
  projectId: "juntaaguapotable-56728",
  storageBucket: "juntaaguapotable-56728.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Parámetros Tarifarios
const TARIFA_BASE = 2.50;
const LIMITE_BASE = 20;
const COSTO_EXCEDENTE = 0.25;

// Variables en memoria sincronizadas con Firestore
let administradores = [];
let socios = [];
let lecturas = [];
let egresos = [];
let capitalesMensuales = {};

// Datos por defecto para inicializar si la base de datos está totalmente vacía
const administradoresDefault = [
  { usuario: "admin", password: "1234" }
];

const sociosDefault = [
  { id: 1, nombre: "Ana Patricia Morales", medidor: "MED-004", cedula: "1755667788", telefono: "0991112233", email: "ana.morales@example.com", lecturaInicial: 0 },
  { id: 2, nombre: "Carlos Alberto Rodríguez", medidor: "MED-003", cedula: "1711223344", telefono: "0992223344", email: "carlos.rod@example.com", lecturaInicial: 0 },
  { id: 3, nombre: "Juan Carlos Pérez", medidor: "MED-001", cedula: "1712345678", telefono: "0993334455", email: "juan.perez@example.com", lecturaInicial: 100 },
  { id: 4, nombre: "María Luisa Gómez", medidor: "MED-002", cedula: "1787654321", telefono: "0994445566", email: "maria.gomez@example.com", lecturaInicial: 210 }
];

const lecturasDefault = [
  { id: 1, socioId: 3, fecha: "2026-09", anterior: 100, actual: 112, consumo: 12, total: 3.00, estado: "Pendiente", fechaPago: null },
  { id: 2, socioId: 4, fecha: "2026-09", anterior: 210, actual: 230, consumo: 20, total: 4.25, estado: "Pagado", fechaPago: "2026-09-03" }
];

const egresosDefault = [
  { id: 1, fecha: "2026-09-02", categoria: "Químicos / Tratamiento", descripcion: "Compra de cloro para tanque principal", monto: 25.00 }
];

// Función general para cargar datos desde Firestore al iniciar
async function cargarDatosDesdeFirebase() {
  try {
    // 1. Cargar Administradores
    const snapAdmins = await getDocs(collection(db, "administradores"));
    if (snapAdmins.empty) {
      for (let admin of administradoresDefault) {
        await addDoc(collection(db, "administradores"), admin);
      }
      administradores = [...administradoresDefault];
    } else {
      administradores = snapAdmins.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    }

    // 2. Cargar Socios
    const snapSocios = await getDocs(collection(db, "socios"));
    if (snapSocios.empty) {
      for (let socio of sociosDefault) {
        await addDoc(collection(db, "socios"), socio);
      }
      socios = [...sociosDefault];
    } else {
      socios = snapSocios.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    }

    // 3. Cargar Lecturas
    const snapLecturas = await getDocs(collection(db, "lecturas"));
    if (snapLecturas.empty) {
      for (let lect of lecturasDefault) {
        await addDoc(collection(db, "lecturas"), lect);
      }
      lecturas = [...lecturasDefault];
    } else {
      lecturas = snapLecturas.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    }

    // 4. Cargar Egresos
    const snapEgresos = await getDocs(collection(db, "egresos"));
    if (snapEgresos.empty) {
      for (let eg of egresosDefault) {
        await addDoc(collection(db, "egresos"), eg);
      }
      egresos = [...egresosDefault];
    } else {
      egresos = snapEgresos.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    }

    // 5. Cargar Capitales Mensuales
    const snapCapitales = await getDocs(collection(db, "capitales"));
    capitalesMensuales = {};
    snapCapitales.forEach(d => {
      const data = d.data();
      capitalesMensuales[data.mes] = data.monto;
    });

  } catch (error) {
    console.error("Error al conectar con Firestore, operando temporalmente con datos locales:", error);
  }

  // Inicializar interfaz una vez cargados los datos
  inicializarInterfazSistema();
}

// Inicialización de Eventos y Login
document.addEventListener("DOMContentLoaded", () => {
  cargarDatosDesdeFirebase();
});

function inicializarInterfazSistema() {
  inicializarModoOscuro();

  const formLogin = document.getElementById('formLogin');
  if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('usuarioLogin').value.trim();
      const pass = document.getElementById('passwordLogin').value.trim();

      const adminEncontrado = administradores.find(a => a.usuario === user && a.password === pass);

      if (adminEncontrado) {
        document.getElementById('modalLogin').style.display = 'none';
        document.body.classList.remove('bloqueado');
        alert("✅ ¡Bienvenido al sistema, " + adminEncontrado.usuario + "!");
      } else {
        alert("❌ Usuario o contraseña incorrectos. Intente nuevamente.");
        document.getElementById('passwordLogin').value = "";
        document.getElementById('passwordLogin').focus();
      }
    });
  }

  const formNuevoAdmin = document.getElementById('formNuevoAdmin');
  if (formNuevoAdmin) {
    formNuevoAdmin.addEventListener('submit', registrarNuevoAdmin);
  }

  document.getElementById('gastoFecha').valueAsDate = new Date();
  
  const anioMesActual = new Date().toISOString().slice(0, 7);
  const inputPeriodoPago = document.getElementById('inputPeriodoPago');
  if (inputPeriodoPago) {
    inputPeriodoPago.value = anioMesActual;
  }

  actualizarRelojYFecha();
  setInterval(actualizarRelojYFecha, 1000);
  
  const inputFiltroMes = document.getElementById('filtroMesContabilidad');
  if (inputFiltroMes) {
    inputFiltroMes.value = anioMesActual;
    inputFiltroMes.addEventListener('change', renderizarContabilidad);
  }

  const inputConfigMes = document.getElementById('inputConfigMes');
  if (inputConfigMes) {
    inputConfigMes.value = anioMesActual;
    inputConfigMes.addEventListener('change', sincronizarInputCapitalDesdeConfig);
  }

  sincronizarInputCapitalDesdeConfig();
  cargarSelectSocios(socios);
  renderizarLecturas();
  renderizarContabilidad();

  document.getElementById('inputFiltroSocio').addEventListener('input', filtrarSelectSocios);
  document.getElementById('selectSocio').addEventListener('change', seleccionarSocio);
  document.getElementById('inputActual').addEventListener('input', calcularValoresEnTiempoReal);
  document.getElementById('formLectura').addEventListener('submit', guardarLectura);
  document.getElementById('formNuevoSocio').addEventListener('submit', guardarNuevoSocio);
  document.getElementById('formEditarSocio').addEventListener('submit', guardarEdicionSocio);
  document.getElementById('formGasto').addEventListener('submit', guardarGasto);
  document.getElementById('inputBuscar').addEventListener('input', renderizarLecturas);

  document.getElementById('formEditar').onsubmit = guardarEdicion;
}

// Funciones para el Modo Oscuro
function inicializarModoOscuro() {
  const modoGuardado = localStorage.getItem('junta_modo_oscuro');
  if (modoGuardado === 'true') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const btn = document.getElementById('btnModoOscuro');
    if (btn) btn.innerText = "☀️ Modo Claro";
  }
}

function toggleModoOscuro() {
  const esOscuro = document.documentElement.getAttribute('data-theme') === 'dark';
  const btn = document.getElementById('btnModoOscuro');

  if (esOscuro) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('junta_modo_oscuro', 'false');
    if (btn) btn.innerText = "🌙 Modo Oscuro";
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('junta_modo_oscuro', 'true');
    if (btn) btn.innerText = "☀️ Modo Claro";
  }
}

// Función para Cerrar Sesión
function cerrarSesion() {
  if (confirm("¿Está seguro de que desea cerrar la sesión actual?")) {
    document.getElementById('usuarioLogin').value = "";
    document.getElementById('passwordLogin').value = "";
    document.body.classList.add('bloqueado');
    document.getElementById('modalLogin').style.display = 'flex';
  }
}

function obtenerMesVisualizado() {
  const inputMes = document.getElementById('filtroMesContabilidad');
  return inputMes && inputMes.value ? inputMes.value : new Date().toISOString().slice(0, 7);
}

function sincronizarInputCapitalDesdeConfig() {
  const inputConfigMes = document.getElementById('inputConfigMes');
  const mesSeleccionado = inputConfigMes ? inputConfigMes.value : new Date().toISOString().slice(0, 7);
  const inputCapital = document.getElementById('inputCapitalInicial');
  
  if (inputCapital) {
    inputCapital.value = capitalesMensuales[mesSeleccionado] !== undefined ? capitalesMensuales[mesSeleccionado] : "";
  }
}

function actualizarRelojYFecha() {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0');
  const elementoReloj = document.getElementById('textoReloj');
  if (elementoReloj) {
    elementoReloj.innerText = `🕒 ${horas}:${minutos}:${segundos}`;
  }

  const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaFormateada = ahora.toLocaleDateString('es-ES', opcionesFecha);
  const fechaCapitalizada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
  
  const elementoFecha = document.getElementById('textoFecha');
  if (elementoFecha) {
    elementoFecha.innerText = `📅 ${fechaCapitalizada}`;
  }
}

function calcularValoresEnTiempoReal() {
  const anterior = parseFloat(document.getElementById('inputAnterior').value);
  const actual = parseFloat(document.getElementById('inputActual').value);
  const campoConsumo = document.getElementById('inputConsumoCalculado');
  const campoValor = document.getElementById('inputValorCalculado');

  if (isNaN(anterior) || isNaN(actual) || actual < anterior) {
    campoConsumo.value = "0 m³";
    campoValor.value = "$0.00";
    return;
  }

  const consumo = actual - anterior;
  const total = calcularTotal(consumo);

  campoConsumo.value = `${consumo} m³`;
  campoValor.value = `$${total.toFixed(2)}`;
}

function obtenerSociosOrdenados() {
  return [...socios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
}

function cambiarPestana(pestana) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  if (pestana === 'facturacion') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('sec-facturacion').classList.add('active');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('sec-contabilidad').classList.add('active');
    renderizarContabilidad();
  }
}

function abrirModalSocio() { document.getElementById('modalSocio').style.display = "flex"; }
function cerrarModalSocio() { document.getElementById('modalSocio').style.display = "none"; document.getElementById('formNuevoSocio').reset(); }
function abrirModalGestionUsuarios() { renderizarTablaUsuarios(); document.getElementById('modalGestionUsuarios').style.display = "flex"; }
function cerrarModalGestionUsuarios() { document.getElementById('modalGestionUsuarios').style.display = "none"; }
function cerrarModalEditar() { document.getElementById('modalEditar').style.display = "none"; }

function abrirModalCredenciales() {
  renderizarTablaAdmins();
  document.getElementById('modalCredenciales').style.display = "flex";
}

function cerrarModalCredenciales() {
  document.getElementById('modalCredenciales').style.display = "none";
  document.getElementById('formNuevoAdmin').reset();
}

async function registrarNuevoAdmin(e) {
  e.preventDefault();
  const usuario = document.getElementById('nuevoAdminUser').value.trim();
  const password = document.getElementById('nuevoAdminPass').value.trim();

  if (administradores.some(a => a.usuario.toLowerCase() === usuario.toLowerCase())) {
    alert("⚠️ El nombre de usuario ya existe. Elija otro.");
    return;
  }

  const nuevoAdmin = { usuario, password };
  const docRef = await addDoc(collection(db, "administradores"), nuevoAdmin);
  nuevoAdmin.firestoreId = docRef.id;

  administradores.push(nuevoAdmin);
  renderizarTablaAdmins();
  document.getElementById('formNuevoAdmin').reset();
  alert("✅ Cuenta de administrador creada con éxito.");
}

function renderizarTablaAdmins() {
  const tbody = document.getElementById('tablaAdminsBody');
  if (!tbody) return;
  tbody.innerHTML = "";

  administradores.forEach((admin) => {
    let botonEliminar = '';
    if (administradores.length > 1) {
      botonEliminar = `<button class="action-btn btn-delete" onclick="eliminarAdmin('${admin.firestoreId}')">🗑️ Eliminar</button>`;
    } else {
      botonEliminar = `<small style="color: var(--text-light);">Principal</small>`;
    }

    tbody.innerHTML += `
      <tr>
        <td><strong>${admin.usuario}</strong></td>
        <td>${botonEliminar}</td>
      </tr>
    `;
  });
}

async function eliminarAdmin(firestoreId) {
  if (administradores.length <= 1) {
    alert("⚠️ No puede eliminar el último administrador del sistema.");
    return;
  }
  const adminAEliminar = administradores.find(a => a.firestoreId === firestoreId);
  if (confirm(`¿Está seguro de eliminar la cuenta de administrador "${adminAEliminar ? adminAEliminar.usuario : ''}"?`)) {
    await deleteDoc(doc(db, "administradores", firestoreId));
    administradores = administradores.filter(a => a.firestoreId !== firestoreId);
    renderizarTablaAdmins();
  }
}

function abrirModalEditarSocio(id) {
  const socio = socios.find(s => s.id === id);
  if (socio) {
    document.getElementById('editSocioId').value = socio.id;
    document.getElementById('editSocioNombre').value = socio.nombre;
    document.getElementById('editSocioCedula').value = socio.cedula;
    document.getElementById('editSocioMedidor').value = socio.medidor;
    document.getElementById('editSocioTelefono').value = socio.telefono || "";
    document.getElementById('editSocioLectura').value = socio.lecturaInicial;
    document.getElementById('editSocioCorreo').value = socio.email || "";
    document.getElementById('modalEditarSocio').style.display = "flex";
  }
}

function cerrarModalEditarSocio() {
  document.getElementById('modalEditarSocio').style.display = "none";
}

function cargarSelectSocios(listaSocios) {
  const select = document.getElementById('selectSocio');
  select.innerHTML = '<option value="">-- Seleccione un Socio --</option>';
  const ordenados = [...listaSocios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
  ordenados.forEach(s => {
    select.innerHTML += `<option value="${s.id}">${s.nombre} (Medidor: ${s.medidor})</option>`;
  });
}

function filtrarSelectSocios() {
  const texto = document.getElementById('inputFiltroSocio').value.toLowerCase().trim();
  if (!texto) {
    cargarSelectSocios(socios);
    return;
  }
  const filtrados = socios.filter(s => 
    s.nombre.toLowerCase().includes(texto) || 
    s.medidor.toLowerCase().includes(texto) || 
    s.cedula.includes(texto)
  );
  cargarSelectSocios(filtrados);
}

async function guardarCapitalInicial() {
  const inputConfigMes = document.getElementById('inputConfigMes');
  const mes = inputConfigMes ? inputConfigMes.value : new Date().toISOString().slice(0, 7);
  const inputCapital = document.getElementById('inputCapitalInicial');
  const monto = parseFloat(inputCapital.value);

  if (!mes) {
    alert("⚠️ Por favor seleccione el mes a iniciar.");
    return;
  }

  if (isNaN(monto) || monto < 0) {
    alert("⚠️ Ingrese un monto válido para el capital inicial.");
    return;
  }

  capitalesMensuales[mes] = monto;
  
  const snapCapitales = await getDocs(collection(db, "capitales"));
  let encontradoDocId = null;
  snapCapitales.forEach(d => {
    if (d.data().mes === mes) {
      encontradoDocId = d.id;
    }
  });

  if (encontradoDocId) {
    await updateDoc(doc(db, "capitales", encontradoDocId), { monto: monto });
  } else {
    await addDoc(collection(db, "capitales"), { mes: mes, monto: monto });
  }

  inputCapital.value = "";
  renderizarContabilidad();
  alert(`✅ Capital inicial para el período ${mes} guardado con éxito.`);
}

async function guardarNuevoSocio(e) {
  e.preventDefault();

  const nombre = document.getElementById('nuevoNombre').value.trim();
  const cedula = document.getElementById('nuevaCedula').value.trim();
  const telefono = document.getElementById('nuevoTelefono').value.trim();
  const medidorIngresado = document.getElementById('nuevoMedidor').value.trim();

  const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!regexNombre.test(nombre)) {
    alert("⚠️ Error en el Nombre Completo: Solo se permite texto (letras y espacios).");
    document.getElementById('nuevoNombre').focus();
    return;
  }

  const regexCedulaRuc = /^\d{10}$|^\d{13}$/;
  if (!regexCedulaRuc.test(cedula)) {
    alert("⚠️ Error en Cédula / RUC: Debe contener únicamente números y tener exactamente 10 dígitos (Cédula) o 13 dígitos (RUC).");
    document.getElementById('nuevaCedula').focus();
    return;
  }

  const regexTelefono = /^0\d{9}$/;
  if (!regexTelefono.test(telefono)) {
    alert("⚠️ Error en Teléfono / WhatsApp: Debe tener exactamente 10 dígitos y empezar obligatoriamente con el número '0'.");
    document.getElementById('nuevoTelefono').focus();
    return;
  }

  const medidorExiste = socios.some(s => s.medidor.toLowerCase() === medidorIngresado.toLowerCase());
  if (medidorExiste) {
    alert(`⚠️ ATENCIÓN: El número de medidor "${medidorIngresado}" ya se encuentra registrado en el sistema con otro usuario.`);
    return;
  }

  const nuevoSocio = {
    id: Date.now(),
    nombre: nombre,
    cedula: cedula,
    medidor: medidorIngresado,
    telefono: telefono,
    email: document.getElementById('nuevoCorreo').value.trim(),
    lecturaInicial: parseFloat(document.getElementById('lecturaInicial').value) || 0
  };

  const docRef = await addDoc(collection(db, "socios"), nuevoSocio);
  nuevoSocio.firestoreId = docRef.id;

  socios.push(nuevoSocio);
  cargarSelectSocios(socios);
  cerrarModalSocio();
  alert(`✅ Usuario registrado correctamente.`);
}

async function guardarEdicionSocio(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('editSocioId').value);
  const nombre = document.getElementById('editSocioNombre').value.trim();
  const cedula = document.getElementById('editSocioCedula').value.trim();
  const telefono = document.getElementById('editSocioTelefono').value.trim();
  const medidorIngresado = document.getElementById('editSocioMedidor').value.trim();

  const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  if (!regexNombre.test(nombre)) {
    alert("⚠️ Error en el Nombre Completo: Solo se permite texto.");
    return;
  }

  const regexCedulaRuc = /^\d{10}$|^\d{13}$/;
  if (!regexCedulaRuc.test(cedula)) {
    alert("⚠️ Error en Cédula / RUC: Debe ser de 10 o 13 dígitos numéricos.");
    return;
  }

  const regexTelefono = /^0\d{9}$/;
  if (!regexTelefono.test(telefono)) {
    alert("⚠️ Error en Teléfono: Debe tener 10 dígitos y empezar por '0'.");
    return;
  }

  const medidorExiste = socios.some(s => s.medidor.toLowerCase() === medidorIngresado.toLowerCase() && s.id !== id);
  if (medidorExiste) {
    alert(`⚠️ ATENCIÓN: El número de medidor "${medidorIngresado}" ya está asignado a otro usuario.`);
    return;
  }

  const socio = socios.find(s => s.id === id);

  if (socio) {
    socio.nombre = nombre;
    socio.cedula = cedula;
    socio.medidor = medidorIngresado;
    socio.telefono = telefono;
    socio.lecturaInicial = parseFloat(document.getElementById('editSocioLectura').value) || 0;
    socio.email = document.getElementById('editSocioCorreo').value.trim();

    if (socio.firestoreId) {
      await updateDoc(doc(db, "socios", socio.firestoreId), {
        nombre: socio.nombre,
        cedula: socio.cedula,
        medidor: socio.medidor,
        telefono: socio.telefono,
        lecturaInicial: socio.lecturaInicial,
        email: socio.email
      });
    }

    cargarSelectSocios(socios);
    renderizarTablaUsuarios();
    renderizarLecturas();
    cerrarModalEditarSocio();
    alert("✅ Información de usuario actualizada exitosamente.");
  }
}

function renderizarTablaUsuarios() {
  const tbody = document.getElementById('tablaUsuariosBody');
  tbody.innerHTML = "";
  obtenerSociosOrdenados().forEach(s => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${s.nombre}</strong><br><small>${s.email || 'Sin correo'}</small></td>
        <td>${s.cedula}</td>
        <td>${s.medidor}</td>
        <td>${s.telefono || 'Sin teléfono'}</td>
        <td>${s.lecturaInicial} m³</td>
        <td>
          <button class="action-btn btn-edit" onclick="abrirModalEditarSocio(${s.id})">✏️ Editar</button>
          <button class="action-btn btn-delete" onclick="eliminarSocio(${s.id})">🗑️ Eliminar</button>
        </td>
      </tr>
    `;
  });
}

async function eliminarSocio(id) {
  if (confirm("¿Está seguro de eliminar este usuario?")) {
    const socio = socios.find(s => s.id === id);
    if (socio && socio.firestoreId) {
      await deleteDoc(doc(db, "socios", socio.firestoreId));
    }
    socios = socios.filter(s => s.id !== id);
    cargarSelectSocios(socios);
    renderizarTablaUsuarios();
    renderizarLecturas();
  }
}

function seleccionarSocio() {
  const socioId = parseInt(this.value);
  const inputMedidor = document.getElementById('inputMedidor');
  const inputAnterior = document.getElementById('inputAnterior');

  if (!socioId) {
    inputMedidor.value = "";
    inputAnterior.value = "";
    calcularValoresEnTiempoReal();
    return;
  }

  const socio = socios.find(s => s.id === socioId);
  inputMedidor.value = socio.medidor;
  const ultimas = lecturas.filter(l => l.socioId === socioId);
  inputAnterior.value = ultimas.length > 0 ? ultimas[ultimas.length - 1].actual : (socio.lecturaInicial || 0);
  calcularValoresEnTiempoReal();
}

function limpiarFormularioLectura() {
  document.getElementById('formLectura').reset();
  document.getElementById('inputPeriodoPago').value = new Date().toISOString().slice(0, 7);
  document.getElementById('inputFiltroSocio').value = "";
  cargarSelectSocios(socios);
  document.getElementById('inputMedidor').value = "";
  document.getElementById('inputAnterior').value = "";
  document.getElementById('inputConsumoCalculado').value = "0 m³";
  document.getElementById('inputValorCalculado').value = "$0.00";
}

function calcularTotal(consumo) {
  if (consumo <= LIMITE_BASE) return TARIFA_BASE;
  return TARIFA_BASE + ((consumo - LIMITE_BASE) * COSTO_EXCEDENTE);
}

async function guardarLectura(e) {
  e.preventDefault();
  const periodoPago = document.getElementById('inputPeriodoPago').value;
  const socioId = parseInt(document.getElementById('selectSocio').value);
  const anterior = parseFloat(document.getElementById('inputAnterior').value);
  const actual = parseFloat(document.getElementById('inputActual').value);

  const tienePendiente = lecturas.some(l => l.socioId === socioId && l.estado === 'Pendiente');
  if (tienePendiente) {
    const socioObj = socios.find(s => s.id === socioId);
    alert(`⚠️ ATENCIÓN: El socio/a "${socioObj ? socioObj.nombre : 'seleccionado'}" tiene una planilla anterior pendiente de pago.`);
    limpiarFormularioLectura();
    return;
  }

  if (actual < anterior) {
    alert("La lectura actual no puede ser menor a la anterior.");
    return;
  }

  const nuevaLectura = {
    id: Date.now(),
    socioId: socioId,
    fecha: periodoPago,
    anterior: anterior,
    actual: actual,
    consumo: actual - anterior,
    total: calcularTotal(actual - anterior),
    estado: "Pendiente",
    fechaPago: null
  };

  const docRef = await addDoc(collection(db, "lecturas"), nuevaLectura);
  nuevaLectura.firestoreId = docRef.id;

  lecturas.push(nuevaLectura);
  renderizarLecturas();
  limpiarFormularioLectura();
  alert("Lectura y período de pago registrados exitosamente.");
}

function obtenerLecturasFiltradas() {
  const busqueda = document.getElementById('inputBuscar').value.toLowerCase();
  return lecturas.filter(l => {
    const socio = socios.find(s => s.id === l.socioId);
    if (!socio) return false;
    return socio.nombre.toLowerCase().includes(busqueda) || socio.cedula.includes(busqueda) || socio.medidor.toLowerCase().includes(busqueda);
  });
}

function renderizarLecturas() {
  const tbody = document.getElementById('tablaBody');
  tbody.innerHTML = "";
  const filtradas = obtenerLecturasFiltradas();

  filtradas.forEach(l => {
    const socio = socios.find(s => s.id === l.socioId);
    
    let botonesAccion = '';
    if (l.estado === 'Pendiente') {
      botonesAccion = `
        <button class="action-btn btn-pay" onclick="marcarComoPagado(${l.id})">💵 Cobrar</button>
        <button class="action-btn btn-edit" onclick="abrirEdicion(${l.id})">✏️</button>
        <button class="action-btn btn-delete" onclick="eliminarLectura(${l.id})">🗑️</button>
      `;
    } else {
      botonesAccion = `
        <button class="action-btn btn-delete" onclick="eliminarLectura(${l.id})" title="Eliminar registro cancelado">🗑️ Eliminar</button>
      `;
    }

    const botonesExtra = `
      <button class="action-btn btn-print" onclick="generarPDFPlanilla(${l.id})" title="Imprimir PDF">📄 PDF</button>
      <button class="action-btn" style="background-color: #25d366; color: white;" onclick="enviarPorWhatsApp(${l.id})" title="Enviar WhatsApp">💬 WA</button>
      <button class="action-btn" style="background-color: #64748b; color: white;" onclick="enviarPorCorreo(${l.id})" title="Enviar Correo">📧 Mail</button>
    `;

    const infoEstado = l.estado === 'Pagado'
      ? `<span class="badge-paid">Pagado</span><br><small style="color: var(--text-light); font-weight: 500;">📅 ${l.fechaPago || 'N/A'}</small>`
      : `<span class="badge-pending">Pendiente</span>`;

    tbody.innerHTML += `
      <tr>
        <td><strong>${l.fecha}</strong></td>
        <td><strong>${socio ? socio.nombre : 'Borrado'}</strong><br><small>C.I: ${socio ? socio.cedula : '-'}</small></td>
        <td>${socio ? socio.medidor : '-'}</td>
        <td>${l.anterior} m³</td>
        <td>${l.actual} m³</td>
        <td><strong>${l.consumo} m³</strong></td>
        <td><strong>$${l.total.toFixed(2)}</strong></td>
        <td>${infoEstado}</td>
        <td>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; align-items: center;">
            ${botonesAccion}
            ${botonesExtra}
          </div>
        </td>
      </tr>
    `;
  });

  document.getElementById('totalPlanillas').innerText = `Mostrando ${filtradas.length} planilla(s)`;
}

function ejecutarExportacionLecturas() {
  const formato = document.getElementById('selectFormatoExportar').value;
  if (!formato) {
    alert("⚠️ Por favor seleccione un formato de exportación (PDF o XLS).");
    return;
  }

  if (formato === 'pdf') {
    exportarLecturasPDF();
  } else if (formato === 'xls') {
    exportarLecturasXLS();
  }
}

function exportarLecturasPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const filtradas = obtenerLecturasFiltradas();

  doc.setFontSize(16);
  doc.text("JUNTA ADMINISTRADORA DE AGUA POTABLE", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text("Reporte General de Registros y Facturas", 105, 22, { align: "center" });

  const filas = filtradas.map(l => {
    const socio = socios.find(s => s.id === l.socioId);
    const estadoConFecha = l.estado === 'Pagado' ? `Pagado (F. Pago: ${l.fechaPago || 'N/A'})` : 'Pendiente';
    return [
      l.fecha,
      socio ? socio.nombre : 'N/A',
      socio ? socio.cedula : 'N/A',
      socio ? socio.medidor : 'N/A',
      `${l.anterior} m³`,
      `${l.actual} m³`,
      `${l.consumo} m³`,
      `$${l.total.toFixed(2)}`,
      estadoConFecha
    ];
  });

  doc.autoTable({
    startY: 30,
    head: [["Período", "Socio", "Cédula", "Medidor", "Anterior", "Actual", "Consumo", "Total", "Estado / F. Pago"]],
    body: filas,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [2, 132, 199] }
  });

  doc.save(`Registros_Facturas_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportarLecturasXLS() {
  const filtradas = obtenerLecturasFiltradas();
  
  const datosExcel = filtradas.map(l => {
    const socio = socios.find(s => s.id === l.socioId);
    return {
      "Período": l.fecha,
      "Socio": socio ? socio.nombre : 'N/A',
      "Cédula": socio ? socio.cedula : 'N/A',
      "Medidor": socio ? socio.medidor : 'N/A',
      "Lectura Anterior (m3)": l.anterior,
      "Lectura Actual (m3)": l.actual,
      "Consumo (m3)": l.consumo,
      "Total ($)": l.total,
      "Estado": l.estado,
      "Fecha de Pago": l.fechaPago || 'No pagado'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(datosExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Registros y Facturas");

  XLSX.writeFile(workbook, `Registros_Facturas_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function ejecutarExportacionUsuarios() {
  const formato = document.getElementById('selectFormatoExportarUsuarios').value;
  if (!formato) {
    alert("⚠️ Por favor seleccione un formato de exportación (PDF o XLS) para los usuarios.");
    return;
  }

  if (formato === 'pdf') {
    exportarUsuariosPDF();
  } else if (formato === 'xls') {
    exportarUsuariosXLS();
  }
}

function exportarUsuariosPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const listaSocios = obtenerSociosOrdenados();

  doc.setFontSize(16);
  doc.text("JUNTA ADMINISTRADORA DE AGUA POTABLE", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text("Reporte General de Usuarios / Socios", 105, 22, { align: "center" });

  const filas = listaSocios.map(s => [
    s.nombre,
    s.cedula,
    s.medidor,
    s.telefono || 'Sin teléfono',
    s.email || 'Sin correo',
    `${s.lecturaInicial} m³`
  ]);

  doc.autoTable({
    startY: 30,
    head: [["Nombre Completo", "Cédula / RUC", "N° Medidor", "Teléfono", "Correo Electrónico", "Lect. Inicial"]],
    body: filas,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [2, 132, 199] }
  });

  doc.save(`Usuarios_Socios_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportarUsuariosXLS() {
  const listaSocios = obtenerSociosOrdenados();
  
  const datosExcel = listaSocios.map(s => ({
    "Nombre Completo": s.nombre,
    "Cédula / RUC": s.cedula,
    "N° Medidor": s.medidor,
    "Teléfono": s.telefono || 'Sin teléfono',
    "Correo Electrónico": s.email || 'Sin correo',
    "Lectura Inicial (m3)": s.lecturaInicial
  }));

  const worksheet = XLSX.utils.json_to_sheet(datosExcel);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios y Socios");

  XLSX.writeFile(workbook, `Usuarios_Socios_${new Date().toISOString().split('T')[0]}.xlsx`);
}

async function eliminarLectura(id) {
  const lectura = lecturas.find(l => l.id === id);
  if (!lectura) return;

  let mensaje = lectura.estado === 'Pagado' 
    ? "¿Está seguro de eliminar este registro que ya se encuentra pagado? Se restará de los ingresos de caja." 
    : "¿Eliminar este registro?";

  if (confirm(mensaje)) {
    if (lectura.firestoreId) {
      await deleteDoc(doc(db, "lecturas", lectura.firestoreId));
    }
    lecturas = lecturas.filter(l => l.id !== id);
    renderizarLecturas();
    renderizarContabilidad();
  }
}

async function marcarComoPagado(id) {
  const lectura = lecturas.find(l => l.id === id);
  if (!lectura) return;

  const socio = socios.find(s => s.id === lectura.socioId);
  const nombreSocio = socio ? socio.nombre : 'Socio';

  const confirmarCobro = confirm(`¿Desea registrar el pago de la planilla del socio/a ${nombreSocio} por un valor de $${lectura.total.toFixed(2)}?`);
  
  if (!confirmarCobro) {
    return; 
  }

  lectura.estado = "Pagado";
  lectura.fechaPago = new Date().toISOString().split('T')[0];

  if (lectura.firestoreId) {
    await updateDoc(doc(db, "lecturas", lectura.firestoreId), {
      estado: lectura.estado,
      fechaPago: lectura.fechaPago
    });
  }

  renderizarLecturas();
  renderizarContabilidad();
  alert(`✅ ¡Pago registrado con éxito!`);

  if (socio && socio.telefono) {
    const enviarWhats = confirm(`💬 ¿Desea enviar la factura del consumo por WhatsApp a ${socio.nombre} (${socio.telefono})?`);
    if (enviarWhats) {
      enviarPorWhatsApp(id);
    }
  } else {
    alert("ℹ️ El socio no tiene un número de teléfono configurado para el envío por WhatsApp.");
  }
}

function enviarPorWhatsApp(id) {
  const lectura = lecturas.find(l => l.id === id);
  const socio = socios.find(s => s.id === lectura.socioId);

  if (!socio || !socio.telefono) {
    alert("⚠️ El socio no tiene un número de teléfono registrado.");
    return;
  }

  let telefonoLimpio = socio.telefono.replace(/\D/g, '');
  if (telefonoLimpio.length === 10 && telefonoLimpio.startsWith('0')) {
    telefonoLimpio = '593' + telefonoLimpio.substring(1);
  }

  const textoMensaje = `Estimado/a *${socio.nombre}*, le saludamos de la Junta de Agua Potable. Su planilla correspondiente al período *${lectura.fecha}* ha sido procesada y pagada con éxito (Fecha de pago: ${lectura.fechaPago || 'N/A'}).\n\n📊 *Detalle de Consumo:*\n- Medidor: ${socio.medidor}\n- Consumo: ${lectura.consumo} m³\n- Total Pagado: *$${lectura.total.toFixed(2)}*\n\nGracias por su puntualidad.`;

  const urlWhatsApp = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${encodeURIComponent(textoMensaje)}`;
  window.open(urlWhatsApp, '_blank');
}

function enviarPorCorreo(id) {
  const lectura = lecturas.find(l => l.id === id);
  const socio = socios.find(s => s.id === lectura.socioId);

  if (!socio || !socio.email) {
    alert("⚠️ El socio no tiene un correo electrónico registrado.");
    return;
  }

  const asunto = encodeURIComponent(`Comprobante de Pago / Planilla de Agua - Período ${lectura.fecha}`);
  const cuerpo = encodeURIComponent(`Estimado/a ${socio.nombre},\n\nLe enviamos el detalle de su consumo de agua potable para el período ${lectura.fecha}:\n\n- N° Medidor: ${socio.medidor}\n- Lectura Anterior: ${lectura.anterior} m³\n- Lectura Actual: ${lectura.actual} m³\n- Consumo Total: ${lectura.consumo} m³\n- Valor Pagado: $${lectura.total.toFixed(2)}\n- Estado: ${lectura.estado}\n- Fecha de Pago: ${lectura.fechaPago || 'N/A'}\n\nAtentamente,\nJunta Administradora de Agua Potable`);

  const urlMailto = `mailto:${socio.email}?subject=${asunto}&body=${cuerpo}`;
  window.location.href = urlMailto;
}

function abrirEdicion(id) {
  const l = lecturas.find(item => item.id === id);
  if (l) {
    if (l.estado === 'Pagado') {
      alert("⚠️ Esta lectura ya se encuentra pagada. No se permite su edición.");
      return;
    }
    document.getElementById('editId').value = l.id;
    document.getElementById('editAnterior').value = l.anterior;
    document.getElementById('editActual').value = l.actual;
    document.getElementById('modalEditar').style.display = "flex";
  }
}

async function guardarEdicion(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('editId').value);
  const anterior = parseFloat(document.getElementById('editAnterior').value);
  const actual = parseFloat(document.getElementById('editActual').value);

  if (actual < anterior) {
    alert("La lectura actual debe ser mayor o igual a la anterior.");
    return;
  }

  const l = lecturas.find(item => item.id === id);
  if (l) {
    if (l.estado === 'Pagado') {
      alert("⚠️ No se puede editar un registro pagado.");
      return;
    }
    l.anterior = anterior;
    l.actual = actual;
    l.consumo = actual - anterior;
    l.total = calcularTotal(l.consumo);

    if (l.firestoreId) {
      await updateDoc(doc(db, "lecturas", l.firestoreId), {
        anterior: l.anterior,
        actual: l.actual,
        consumo: l.consumo,
        total: l.total
      });
    }

    renderizarLecturas();
    renderizarContabilidad();
    cerrarModalEditar();
  }
}

async function guardarGasto(e) {
  e.preventDefault();
  const nuevoEgreso = {
    id: Date.now(),
    fecha: document.getElementById('gastoFecha').value,
    categoria: document.getElementById('gastoCategoria').value,
    descripcion: document.getElementById('gastoDescripcion').value,
    monto: parseFloat(document.getElementById('gastoMonto').value)
  };

  const docRef = await addDoc(collection(db, "egresos"), nuevoEgreso);
  nuevoEgreso.firestoreId = docRef.id;

  egresos.push(nuevoEgreso);
  renderizarContabilidad();
  this.reset();
  document.getElementById('gastoFecha').valueAsDate = new Date();
  alert("Egreso registrado correctamente.");
}

function renderizarContabilidad() {
  const tbody = document.getElementById('tablaMovimientosBody');
  tbody.innerHTML = "";
  const mesSeleccionado = obtenerMesVisualizado();

  let totalIngresos = 0, totalGastos = 0;
  const capitalMes = capitalesMensuales[mesSeleccionado] !== undefined ? capitalesMensuales[mesSeleccionado] : 0;

  tbody.innerHTML += `
    <tr>
      <td>${mesSeleccionado}-01</td>
      <td><span class="badge-paid" style="background-color: #e0f2fe; color: #0369a1;">Capital</span></td>
      <td>Capital Inicial del Mes</td>
      <td>Aporte de inicio de período (${mesSeleccionado})</td>
      <td>$${capitalMes.toFixed(2)}</td>
      <td>-</td>
      <td>-</td>
    </tr>
  `;

  lecturas.filter(l => l.estado === 'Pagado' && l.fecha === mesSeleccionado).forEach(c => {
    totalIngresos += c.total;
    const socio = socios.find(s => s.id === c.socioId);
    
    tbody.innerHTML += `
      <tr>
        <td>${c.fechaPago || c.fecha}</td>
        <td><span class="badge-paid">Ingreso</span></td>
        <td>Cobro de Agua</td>
        <td>Planilla ${socio ? socio.nombre : 'Usuario'} (${c.consumo} m³)</td>
        <td>$${c.total.toFixed(2)}</td>
        <td>-</td>
        <td><button class="action-btn btn-delete" onclick="eliminarLectura(${c.id})" title="Eliminar ingreso de caja">🗑️</button></td>
      </tr>
    `;
  });

  egresos.filter(e => e.fecha.startsWith(mesSeleccionado)).forEach(e => {
    totalGastos += e.monto;
    tbody.innerHTML += `
      <tr>
        <td>${e.fecha}</td>
        <td><span class="badge-egreso">Egreso</span></td>
        <td>${e.categoria}</td>
        <td>${e.descripcion}</td>
        <td>-</td>
        <td>$${e.monto.toFixed(2)}</td>
        <td><button class="action-btn btn-delete" onclick="eliminarGasto(${e.id})">🗑️</button></td>
      </tr>
    `;
  });

  const balanceTotal = (capitalMes + totalIngresos) - totalGastos;

  document.getElementById('kpiCapitalDisplay').innerText = `$${capitalMes.toFixed(2)}`;
  document.getElementById('kpiIngresos').innerText = `$${totalIngresos.toFixed(2)}`;
  document.getElementById('kpiGastos').innerText = `$${totalGastos.toFixed(2)}`;
  document.getElementById('kpiBalance').innerText = `$${balanceTotal.toFixed(2)}`;
}

async function eliminarGasto(id) {
  if (confirm("¿Desea eliminar este egreso?")) {
    const egreso = egresos.find(e => e.id === id);
    if (egreso && egreso.firestoreId) {
      await deleteDoc(doc(db, "egresos", egreso.firestoreId));
    }
    egresos = egresos.filter(e => e.id !== id);
    renderizarContabilidad();
  }
}

function exportarPDFContabilidadMensual() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const mesSeleccionado = obtenerMesVisualizado();
  const [anio, mes] = mesSeleccionado.split('-');
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const tituloPeriodo = `Período Mensual: ${meses[parseInt(mes) - 1]} de ${anio}`;

  doc.setFontSize(16);
  doc.text("JUNTA ADMINISTRADORA DE AGUA POTABLE", 105, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text("Libro Diario de Caja - Contabilidad Mensualizada", 105, 22, { align: "center" });
  doc.setFontSize(10);
  doc.text(tituloPeriodo, 105, 28, { align: "center" });

  const filas = [];
  let totalIngresos = 0, totalEgresos = 0;
  const capitalMes = capitalesMensuales[mesSeleccionado] !== undefined ? capitalesMensuales[mesSeleccionado] : 0;

  filas.push([`${mesSeleccionado}-01`, "CAPITAL", "Capital Inicial", "Aporte del mes", `$${capitalMes.toFixed(2)}`, "-"]);

  lecturas.filter(l => l.estado === 'Pagado' && l.fecha === mesSeleccionado).forEach(l => {
    totalIngresos += l.total;
    const socio = socios.find(s => s.id === l.socioId);
    filas.push([l.fechaPago || l.fecha, "INGRESO", "Cobro Agua", `Planilla ${socio ? socio.nombre : 'Socio'}`, `$${l.total.toFixed(2)}`, "-"]);
  });

  egresos.filter(e => e.fecha.startsWith(mesSeleccionado)).forEach(e => {
    totalEgresos += e.monto;
    filas.push([e.fecha, "EGRESO", e.categoria, e.descripcion, "-", `$${e.monto.toFixed(2)}`]);
  });

  doc.autoTable({
    startY: 35,
    head: [["Fecha", "Tipo", "Categoría", "Detalle", "Ingreso", "Egreso"]],
    body: filas,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [2, 132, 199] }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  const balanceFinal = (capitalMes + totalIngresos) - totalEgresos;
  doc.setFontSize(10);
  doc.text(`Capital Inicial:  $${capitalMes.toFixed(2)}`, 14, finalY);
  doc.text(`Total Ingresos:   $${totalIngresos.toFixed(2)}`, 14, finalY + 6);
  doc.text(`Total Egresos:    $${totalEgresos.toFixed(2)}`, 14, finalY + 12);
  doc.text(`Balance en Caja:  $${balanceFinal.toFixed(2)}`, 14, finalY + 18);

  doc.save(`Contabilidad_${mesSeleccionado}.pdf`);
}

function generarPDFPlanilla(id) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const lectura = lecturas.find(l => l.id === id);
  const socio = socios.find(s => s.id === lectura.socioId);

  doc.setFontSize(16);
  doc.text("JUNTA ADMINISTRADORA DE AGUA POTABLE", 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text("Comprobante Oficial de Pago", 105, 22, { align: "center" });

  doc.autoTable({
    startY: 30,
    head: [["Campo", "Detalle"]],
    body: [
      ["Socio", socio ? socio.nombre : 'N/A'],
      ["Cédula", socio ? socio.cedula : 'N/A'],
      ["Medidor", socio ? socio.medidor : 'N/A'],
      ["Teléfono", socio ? socio.telefono : 'N/A'],
      ["Período de Pago", lectura.fecha],
      ["Estado", lectura.estado],
      ["Fecha de Pago", lectura.fechaPago || 'Pendiente']
    ]
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    head: [["Anterior", "Actual", "Consumo", "Tarifa Base", "Total"]],
    body: [[`${lectura.anterior} m³`, `${lectura.actual} m³`, `${lectura.consumo} m³`, `$${TARIFA_BASE.toFixed(2)}`, `$${lectura.total.toFixed(2)}`]]
  });

  doc.save(`Planilla_${socio?.nombre || 'Socio'}_${lectura.fecha}.pdf`);
}

// Exponer funciones al objeto global window para su uso en eventos onclick del HTML
window.cambiarPestana = cambiarPestana;
window.abrirModalSocio = abrirModalSocio;
window.cerrarModalSocio = cerrarModalSocio;
window.abrirModalGestionUsuarios = abrirModalGestionUsuarios;
window.cerrarModalGestionUsuarios = cerrarModalGestionUsuarios;
window.cerrarModalEditar = cerrarModalEditar;
window.abrirModalCredenciales = abrirModalCredenciales;
window.cerrarModalCredenciales = cerrarModalCredenciales;
window.eliminarAdmin = eliminarAdmin;
window.abrirModalEditarSocio = abrirModalEditarSocio;
window.cerrarModalEditarSocio = cerrarModalEditarSocio;
window.guardarCapitalInicial = guardarCapitalInicial;
window.eliminarSocio = eliminarSocio;
window.marcarComoPagado = marcarComoPagado;
window.enviarPorWhatsApp = enviarPorWhatsApp;
window.enviarPorCorreo = enviarPorCorreo;
window.abrirEdicion = abrirEdicion;
window.eliminarLectura = eliminarLectura;
window.eliminarGasto = eliminarGasto;
window.ejecutarExportacionLecturas = ejecutarExportacionLecturas;
window.ejecutarExportacionUsuarios = ejecutarExportacionUsuarios;
window.exportarPDFContabilidadMensual = exportarPDFContabilidadMensual;
window.generarPDFPlanilla = generarPDFPlanilla;
window.cerrarSesion = cerrarSesion;
window.toggleModoOscuro = toggleModoOscuro;
