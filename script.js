// ==========================================
// 0. CONFIGURACIÓN EMAILJS Y CREDENCIALES DEL DUEÑO
// ==========================================
emailjs.init("uU9kSHWRtQL8zIkaQ");

const SERVICE_ID = "service_0gugqmk";
const TEMPLATE_ID = "template_rjb3epc";

// Cuenta fija del Dueño / Administrador
const ADMIN_CONFIG = {
  nombre: "Vidal (Dueño)",
  email: "vidal26m@gmail.com",
  pass: "admin123", // 👈 Cambia esta contraseña maestra por la que tú quieras
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

function abrirModal() {
  limpiarFormularios();
  if (modalTabs) modalTabs.style.display = "flex";
  if (formVerificar) formVerificar.style.display = "none";
  cambiarTab("login");
  if (modal) modal.style.display = "flex";
}

function cerrarModal() {
  if (modal) modal.style.display = "none";
  limpiarFormularios();
}

function cambiarTab(tipo) {
  const tabLogin = document.getElementById("tab-login");
  const tabReg = document.getElementById("tab-registro");

  limpiarFormularios();
  if (formVerificar) formVerificar.style.display = "none";

  if (tipo === "login") {
    formLogin.style.display = "block";
    formReg.style.display = "none";
    tabLogin.classList.add("activo");
    tabReg.classList.remove("activo");
  } else {
    formLogin.style.display = "none";
    formReg.style.display = "block";
    tabReg.classList.add("activo");
    tabLogin.classList.remove("activo");
  }
}

// REGISTRO DE CLIENTES CON VERIFICACIÓN POR CORREO
if (formReg) {
  formReg.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = document.getElementById("reg-nombre").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const pass = document.getElementById("reg-pass").value;
    const btnRegistrar = document.getElementById("btn-registrar");

    // Evitar que alguien registre el correo del dueño como cliente
    if (email === ADMIN_CONFIG.email.toLowerCase()) {
      alert("⚠️ Este correo pertenece a la administración. Inicia sesión directamente.");
      cambiarTab("login");
      return;
    }

    codigoGenerado = Math.floor(1000 + Math.random() * 9000).toString();

    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() + 15);
    const horaLimite = ahora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    usuarioPendiente = { nombre, email, pass, rol: "cliente" };

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

// VERIFICAR CÓDIGO Y REDIRIGIR AL PORTAL DEL CLIENTE
if (formVerificar) {
  formVerificar.addEventListener("submit", (e) => {
    e.preventDefault();
    const codigoIngresado = document.getElementById("input-codigo").value.trim();

    if (codigoIngresado === codigoGenerado && usuarioPendiente) {
      let usuarios = JSON.parse(localStorage.getItem("usuariosPatitas")) || [];
      usuarios = usuarios.filter(u => u.email !== usuarioPendiente.email);
      usuarios.push(usuarioPendiente);

      localStorage.setItem("usuariosPatitas", JSON.stringify(usuarios));
      localStorage.setItem("sesionActiva", JSON.stringify(usuarioPendiente));

      alert(`¡Cuenta verificada! Bienvenido a tu portal, ${usuarioPendiente.nombre} 🐾`);
      window.location.href = "cliente.html"; // Redirige directo a la vista del cliente
    } else {
      alert("❌ El código ingresado no es correcto. Revisa tu correo e inténtalo de nuevo.");
    }
  });
}

// INICIO DE SESIÓN CON DETECCIÓN DE ROL (DUEÑO VS CLIENTE)
if (formLogin) {
  formLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pass = document.getElementById("login-pass").value;

    // 1. Si es el correo del Dueño, SOLO valida contra ADMIN_CONFIG
    if (email === ADMIN_CONFIG.email.toLowerCase()) {
      if (pass === ADMIN_CONFIG.pass) {
        localStorage.setItem("sesionActiva", JSON.stringify(ADMIN_CONFIG));
        window.location.href = "admin.html"; // Redirige al panel del Dueño
      } else {
        alert("❌ Contraseña de administrador incorrecta.");
      }
      return; // Corta aquí para que jamás lo busque como cliente
    }

    // 2. Si no es el dueño, buscar en los clientes registrados
    const usuarios = JSON.parse(localStorage.getItem("usuariosPatitas")) || [];
    const cliente = usuarios.find(u => u.email.toLowerCase() === email && u.pass === pass);

    if (cliente) {
      localStorage.setItem("sesionActiva", JSON.stringify(cliente));
      window.location.href = "cliente.html"; // Redirige al panel del Cliente
    } else {
      alert("⚠️ Correo o contraseña incorrectos, o aún no has verificado tu cuenta.");
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

  // Autocompletar el formulario de mensaje al dueño
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

function cerrarSesion() {
  localStorage.removeItem("sesionActiva");
  location.reload();
}

window.addEventListener("DOMContentLoaded", () => {
  // Limpia cualquier cuenta de cliente vieja que tuviera el correo del dueño
  let usuarios = JSON.parse(localStorage.getItem("usuariosPatitas")) || [];
  usuarios = usuarios.filter(u => u.email.toLowerCase() !== ADMIN_CONFIG.email.toLowerCase());
  localStorage.setItem("usuariosPatitas", JSON.stringify(usuarios));

  const sesion = JSON.parse(localStorage.getItem("sesionActiva"));
  if (sesion) {
    actualizarBarraUsuario(sesion);
  }
});

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    cerrarModal();
  }
});
// ==========================================
// 2. ENVIAR MENSAJE / CONSULTA AL DUEÑO (PROTEGIDO POR SESIÓN)
// ==========================================
const formMensajeDueno = document.getElementById("form-mensaje-dueno");

if (formMensajeDueno) {
  formMensajeDueno.addEventListener("submit", (e) => {
    e.preventDefault();

    // 1. Verificar si el usuario ya inició sesión
    const sesion = JSON.parse(localStorage.getItem("sesionActiva"));

    if (!sesion) {
      alert("🔒 Para enviar un mensaje al veterinario, primero debes iniciar sesión o crear tu cuenta.");
      abrirModal(); // Le abre la ventana de login/registro al instante
      return;
    }

    // 2. Si sí tiene sesión iniciada, guardamos el mensaje con sus datos verificados
    const texto = document.getElementById("msg-texto").value.trim();

    const nuevoMensaje = {
      id: Date.now(),
      nombre: sesion.nombre, // Toma el nombre real de su cuenta
      correo: sesion.email,  // Toma el correo verificado de su cuenta
      asunto: "Consulta desde la portada",
      texto: texto,
      fecha: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
      leido: false
    };

    const mensajes = JSON.parse(localStorage.getItem("mensajesPatitas")) || [];
    mensajes.unshift(nuevoMensaje);
    localStorage.setItem("mensajesPatitas", JSON.stringify(mensajes));

    alert(`✅ ¡Mensaje enviado, ${sesion.nombre}! El veterinario te responderá pronto.`);
    formMensajeDueno.reset();
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