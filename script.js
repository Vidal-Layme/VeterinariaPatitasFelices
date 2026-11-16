import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================
// 0. CONFIGURACIÓN EMAILJS Y CREDENCIALES DEL DUEÑO
// ==========================================
if (typeof emailjs !== "undefined") {
  emailjs.init("uU9kSHWRtQL8zIkaQ");
}

const SERVICE_ID = "service_0gugqmk";
const TEMPLATE_ID = "template_rjb3epc";

const ADMIN_CONFIG = {
  nombre: "Vidal (Dueño)",
  email: "vidal26m@gmail.com",
  pass: "admin123",
  rol: "admin"
};

let codigoGenerado = null;
let usuarioPendiente = null;

// ==========================================
// 1. CONTROL DEL MODAL Y AUTENTICACIÓN POR ROLES
// ==========================================
const modal = document.getElementById("modal-auth");
const modalTabs = document.getElementById("modal-tabs");
const formLogin = document.getElementById("form-login");
const formReg = document.getElementById("form-registro");
const formVerificar = document.getElementById("form-verificar");

function limpiarFormularios() {
  if (formLogin) formLogin.reset();
  if (formReg) formReg.reset();
  if (formVerificar) formVerificar.reset();
}

// Exponemos en window para que funcionen los onclick del HTML con type="module"
window.abrirModal = function() {
  limpiarFormularios();
  if (modalTabs) modalTabs.style.display = "flex";
  if (formVerificar) formVerificar.style.display = "none";
  window.cambiarTab("login");
  if (modal) modal.style.display = "flex";
};

window.cerrarModal = function() {
  if (modal) modal.style.display = "none";
  limpiarFormularios();
};

window.cambiarTab = function(tipo) {
  const tabLogin = document.getElementById("tab-login");
  const tabReg = document.getElementById("tab-registro");

  limpiarFormularios();
  if (formVerificar) formVerificar.style.display = "none";

  if (tipo === "login") {
    if (formLogin) formLogin.style.display = "block";
    if (formReg) formReg.style.display = "none";
    if (tabLogin) tabLogin.classList.add("activo");
    if (tabReg) tabReg.classList.remove("activo");
  } else {
    if (formLogin) formLogin.style.display = "none";
    if (formReg) formReg.style.display = "block";
    if (tabReg) tabReg.classList.add("activo");
    if (tabLogin) tabLogin.classList.remove("activo");
  }
};

window.cerrarSesion = function() {
  localStorage.removeItem("sesionActiva");
  location.reload();
};

// REGISTRO DE CLIENTES CON VERIFICACIÓN POR CORREO
if (formReg) {
  formReg.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("reg-nombre").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const pass = document.getElementById("reg-pass").value;
    const btnRegistrar = document.getElementById("btn-registrar");

    if (email === ADMIN_CONFIG.email.toLowerCase()) {
      alert("⚠️ Este correo pertenece a la administración. Inicia sesión directamente.");
      window.cambiarTab("login");
      return;
    }

    codigoGenerado = Math.floor(1000 + Math.random() * 9000).toString();

    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 15);
    const horaLimite = ahora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    usuarioPendiente = { nombre, email, pass, rol: "cliente", telefono: "", direccion: "" };

    btnRegistrar.textContent = "Enviando código... ⏳";
    btnRegistrar.disabled = true;

    emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      email: email,
      passcode: codigoGenerado,
      time: horaLimite
    })
    .then(() => {
      btnRegistrar.textContent = "Registrarme";
      btnRegistrar.disabled = false;
      limpiarFormularios();

      formReg.style.display = "none";
      modalTabs.style.display = "none";
      document.getElementById("correo-destino").textContent = email;
      formVerificar.style.display = "block";
    })
    .catch((error) => {
      console.error("Error de EmailJS:", error);
      alert("Hubo un problema al enviar el correo. Revisa tu conexión.");
      btnRegistrar.textContent = "Registrarme";
      btnRegistrar.disabled = false;
    });
  });
}

// VERIFICAR CÓDIGO Y GUARDAR CLIENTE EN FIREBASE
if (formVerificar) {
  formVerificar.addEventListener("submit", async (e) => {
    e.preventDefault();
    const codigoIngresado = document.getElementById("input-codigo").value.trim();

    if (codigoIngresado === codigoGenerado && usuarioPendiente) {
      try {
        const docRef = await addDoc(collection(db, "usuarios"), usuarioPendiente);
        const sesionConId = { id: docRef.id, ...usuarioPendiente };

        localStorage.setItem("sesionActiva", JSON.stringify(sesionConId));
        alert(`¡Cuenta verificada en la nube! Bienvenido a tu portal, ${usuarioPendiente.nombre} 🐾`);
        window.location.href = "cliente.html";
      } catch (err) {
        console.error("Error guardando en Firebase:", err);
        alert("Error al registrar usuario en la nube.");
      }
    } else {
      alert("❌ El código ingresado no es correcto. Revisa tu correo e inténtalo de nuevo.");
    }
  });
}

// INICIO DE SESIÓN CON DETECCIÓN DE ROL (DUEÑO VS CLIENTE EN FIREBASE)
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pass = document.getElementById("login-pass").value;

    if (email === ADMIN_CONFIG.email.toLowerCase()) {
      if (pass === ADMIN_CONFIG.pass) {
        localStorage.setItem("sesionActiva", JSON.stringify(ADMIN_CONFIG));
        window.location.href = "admin.html";
      } else {
        alert("❌ Contraseña de administrador incorrecta.");
      }
      return;
    }

    try {
      const q = query(collection(db, "usuarios"), where("email", "==", email), where("pass", "==", pass));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docUser = snapshot.docs[0];
        const cliente = { id: docUser.id, ...docUser.data() };
        localStorage.setItem("sesionActiva", JSON.stringify(cliente));
        window.location.href = "cliente.html";
      } else {
        alert("⚠️ Correo o contraseña incorrectos, o aún no has verificado tu cuenta.");
      }
    } catch (err) {
      console.error("Error al consultar Firebase:", err);
      alert("⚠️ No se pudo conectar con la base de datos. Asegúrate de abrir la página con Live Server o GitHub Pages.");
    }
  });
}

// Actualizar barra superior y autocompletar datos si ya hay una sesión activa
function actualizarBarraUsuario(sesion) {
  const topbarAction = document.querySelector(".topbar-action");
  if (topbarAction) {
    const primerNombre = sesion.nombre.split(" ")[0];
    const destino = sesion.rol === "admin" ? "admin.html" : "cliente.html";
    const textoPanel = sesion.rol === "admin" ? "Panel Dueño 🛠️" : "Mi Portal 🐾";

    topbarAction.innerHTML = `
      <span style="color: #6ee7b7; font-weight: 600; margin-right: 10px;">Hola, ${primerNombre}</span>
      <button class="btn-glow" style="padding: 0.45rem 1rem; font-size: 0.85rem; margin-right: 8px;" onclick="window.location.href='${destino}'">${textoPanel}</button>
      <button class="btn-outline" onclick="cerrarSesion()">Salir</button>
    `;
  }

  const inputNombre = document.getElementById("msg-nombre");
  const inputCorreo = document.getElementById("msg-correo");

  if (inputNombre && inputCorreo) {
    inputNombre.value = sesion.nombre;
    inputCorreo.value = sesion.email;
    inputNombre.readOnly = true;
    inputCorreo.readOnly = true;
    inputNombre.style.opacity = "0.75";
    inputCorreo.style.opacity = "0.75";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const sesion = JSON.parse(localStorage.getItem("sesionActiva"));
  if (sesion) {
    actualizarBarraUsuario(sesion);
  }
});

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    window.cerrarModal();
  }
});

// ==========================================
// 2. ENVIAR MENSAJE / CONSULTA AL DUEÑO (FIREBASE)
// ==========================================
const formMensajeDueno = document.getElementById("form-mensaje-dueno");

if (formMensajeDueno) {
  formMensajeDueno.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sesion = JSON.parse(localStorage.getItem("sesionActiva"));

    if (!sesion) {
      alert("🔒 Para enviar un mensaje al veterinario, primero debes iniciar sesión o crear tu cuenta.");
      window.abrirModal();
      return;
    }

    const texto = document.getElementById("msg-texto").value.trim();

    await addDoc(collection(db, "mensajes"), {
      nombre: sesion.nombre,
      correo: sesion.email,
      asunto: "Consulta desde la portada",
      texto: texto,
      fecha: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
      timestamp: Date.now(),
      leido: false
    });

    alert(`✅ ¡Mensaje enviado, ${sesion.nombre}! El veterinario lo verá al instante en su dispositivo.`);
    document.getElementById("msg-texto").value = "";
  });
}

// ==========================================
// 3. EFECTO DESPLAZAR Y DESAPARECER IMAGEN CON SCROLL
// ==========================================
const capsula = document.getElementById("capsula-mascota");

window.addEventListener("scroll", () => {
  if (!capsula) return;

  const scrollY = window.scrollY;
  const moverX = -scrollY * 1.3;
  const moverY = -scrollY * 0.9;
  const rotacion = -scrollY * 0.15;

  const opacidad = Math.max(0, 1 - scrollY / 260);
  const escala = Math.max(0.3, 1 - scrollY * 0.0025);

  capsula.style.transform = `translate3d(${moverX}px, ${moverY}px, 0) rotate(${rotacion}deg) scale(${escala})`;
  capsula.style.opacity = opacidad;
});