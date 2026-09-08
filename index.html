import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "juntaaguapotable-56728.firebaseapp.com",
  projectId: "juntaaguapotable-56728",
  storageBucket: "juntaaguapotable-56728.firebasestorage.app",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let administradores = [];
let socios = [];
let lecturas = [];
let egresos = [];
let capitalesMensuales = {};

const administradoresDefault = [{ usuario: "admin", password: "1234" }];

async function cargarDatosDesdeFirebase() {
  try {
    const snapAdmins = await getDocs(collection(db, "administradores"));
    if (snapAdmins.empty) {
      for (let admin of administradoresDefault) {
        await addDoc(collection(db, "administradores"), admin);
      }
      administradores = [...administradoresDefault];
    } else {
      administradores = snapAdmins.docs.map(d => ({ firestoreId: d.id, ...d.data() }));
    }
  } catch (error) {
    console.error("Error al conectar con Firestore:", error);
  }
  inicializarInterfazSistema();
}

document.addEventListener("DOMContentLoaded", () => {
  cargarDatosDesdeFirebase();
});

function inicializarInterfazSistema() {
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
        alert("✅ ¡Bienvenido " + adminEncontrado.usuario + "!");
      } else {
        alert("❌ Usuario o contraseña incorrectos.");
      }
    });
  }

  const formNuevoAdmin = document.getElementById('formNuevoAdmin');
  if (formNuevoAdmin) formNuevoAdmin.addEventListener('submit', registrarNuevoAdmin);

  const formEditarAdmin = document.getElementById('formEditarAdmin');
  if (formEditarAdmin) formEditarAdmin.addEventListener('submit', guardarEdicionAdmin);
}

function abrirModalCredenciales() {
  renderizarTablaAdmins();
  document.getElementById('modalCredenciales').style.display = "flex";
}

function cerrarModalCredenciales() {
  document.getElementById('modalCredenciales').style.display = "none";
}

async function registrarNuevoAdmin(e) {
  e.preventDefault();
  const usuario = document.getElementById('nuevoAdminUser').value.trim();
  const password = document.getElementById('nuevoAdminPass').value.trim();

  if (administradores.some(a => a.usuario.toLowerCase() === usuario.toLowerCase())) {
    alert("⚠️ El nombre de usuario ya existe.");
    return;
  }

  const nuevoAdmin = { usuario, password };
  const docRef = await addDoc(collection(db, "administradores"), nuevoAdmin);
  nuevoAdmin.firestoreId = docRef.id;

  administradores.push(nuevoAdmin);
  renderizarTablaAdmins();
  document.getElementById('formNuevoAdmin').reset();
  alert("✅ Administrador creado con éxito.");
}

function abrirModalEditarAdmin(firestoreId) {
  const admin = administradores.find(a => a.firestoreId === firestoreId);
  if (admin) {
    document.getElementById('editAdminFirestoreId').value = admin.firestoreId;
    document.getElementById('editAdminUser').value = admin.usuario;
    document.getElementById('editAdminNewPass').value = "";
    document.getElementById('modalEditarAdmin').style.display = "flex";
  }
}

function cerrarModalEditarAdmin() {
  document.getElementById('modalEditarAdmin').style.display = "none";
  document.getElementById('formEditarAdmin').reset();
}

async function guardarEdicionAdmin(e) {
  e.preventDefault();
  const firestoreId = document.getElementById('editAdminFirestoreId').value;
  const nuevoUsuario = document.getElementById('editAdminUser').value.trim();
  const nuevaPassword = document.getElementById('editAdminNewPass').value.trim();

  if (!nuevoUsuario) {
    alert("⚠️ El nombre de usuario no puede estar vacío.");
    return;
  }

  const admin = administradores.find(a => a.firestoreId === firestoreId);
  if (admin) {
    admin.usuario = nuevoUsuario;
    const datosActualizacion = { usuario: nuevoUsuario };

    if (nuevaPassword) {
      admin.password = nuevaPassword;
      datosActualizacion.password = nuevaPassword;
    }

    await updateDoc(doc(db, "administradores", firestoreId), datosActualizacion);
    cerrarModalEditarAdmin();
    renderizarTablaAdmins();
    alert(`✅ Información de administrador actualizada con éxito.`);
  }
}

function renderizarTablaAdmins() {
  const tbody = document.getElementById('tablaAdminsBody');
  if (!tbody) return;
  tbody.innerHTML = "";

  administradores.forEach((admin) => {
    let botonEliminar = administradores.length > 1 
      ? `<button class="action-btn btn-delete" onclick="eliminarAdmin('${admin.firestoreId}')">🗑️ Eliminar</button>` 
      : `<small style="color: var(--text-light);">Principal</small>`;

    const botonEditar = `<button class="action-btn btn-edit" onclick="abrirModalEditarAdmin('${admin.firestoreId}')">✏️ Editar Info</button>`;

    tbody.innerHTML += `
      <tr>
        <td><strong>${admin.usuario}</strong></td>
        <td>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${botonEditar}
            ${botonEliminar}
          </div>
        </td>
      </tr>
    `;
  });
}

async function eliminarAdmin(firestoreId) {
  if (administradores.length <= 1) {
    alert("⚠️ No puede eliminar el último administrador.");
    return;
  }
  if (confirm("¿Está seguro de eliminar esta cuenta?")) {
    await deleteDoc(doc(db, "administradores", firestoreId));
    administradores = administradores.filter(a => a.firestoreId !== firestoreId);
    renderizarTablaAdmins();
  }
}

function toggleModoOscuro() {
  const esOscuro = document.documentElement.getAttribute('data-theme') === 'dark';
  if (esOscuro) {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function cerrarSesion() {
  if (confirm("¿Desea cerrar sesión?")) {
    document.body.classList.add('bloqueado');
    document.getElementById('modalLogin').style.display = 'flex';
  }
}

window.abrirModalCredenciales = abrirModalCredenciales;
window.cerrarModalCredenciales = cerrarModalCredenciales;
window.abrirModalEditarAdmin = abrirModalEditarAdmin;
window.cerrarModalEditarAdmin = cerrarModalEditarAdmin;
window.eliminarAdmin = eliminarAdmin;
window.toggleModoOscuro = toggleModoOscuro;
window.cerrarSesion = cerrarSesion;[cite: 17]
