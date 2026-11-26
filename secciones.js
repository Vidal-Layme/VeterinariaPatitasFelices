import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 1. DETECTAR SESIÓN ACTIVA Y ACTUALIZAR BARRA SUPERIOR
const sesion = JSON.parse(localStorage.getItem("sesionActiva"));
const saludoEl = document.getElementById("saludo-usuario-nav");
const btnSalirEl = document.getElementById("btn-salir-nav");
const linkInicioMenu = document.getElementById("link-inicio-menu");

if (sesion) {
  const primerNombre = sesion.nombre.split(" ")[0];
  if (saludoEl) saludoEl.textContent = `Hola, ${primerNombre} 🐾`;
  if (btnSalirEl) btnSalirEl.style.display = "inline-block";
  if (linkInicioMenu) {
    linkInicioMenu.href = sesion.rol === "admin" ? "admin.html" : "cliente.html";
  }
} else {
  if (saludoEl) saludoEl.textContent = "Visitante 🐾";
  if (btnSalirEl) btnSalirEl.style.display = "none";
  if (linkInicioMenu) linkInicioMenu.href = "index.html";
}

window.cerrarSesionGlobal = function() {
  localStorage.removeItem("sesionActiva");
  window.location.href = "index.html";
};

// 2. MENÚ DESPLEGABLE DE 3 RAYAS
const btnHamburguesa = document.getElementById("btn-menu-hamburguesa");
const dropdownMenu = document.getElementById("dropdown-cliente");
const menuWrapper = document.getElementById("menu-hamburguesa-wrapper");

if (btnHamburguesa && dropdownMenu && menuWrapper) {
  btnHamburguesa.addEventListener("click", (e) => {
    e.stopPropagation();
    const abierto = dropdownMenu.classList.toggle("abierto");
    btnHamburguesa.setAttribute("aria-expanded", abierto ? "true" : "false");
  });

  dropdownMenu.querySelectorAll("a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      dropdownMenu.classList.remove("abierto");
      btnHamburguesa.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", (e) => {
    if (!menuWrapper.contains(e.target)) {
      dropdownMenu.classList.remove("abierto");
      btnHamburguesa.setAttribute("aria-expanded", "false");
    }
  });
}

// 3. FORMULARIO DE CONTACTO DIRECTO A FIREBASE (PARA contactos.html)
const formContacto = document.getElementById("form-contacto-directo");
if (formContacto) {
  const inputNombre = document.getElementById("contacto-nombre");
  const inputCorreo = document.getElementById("contacto-correo");

  if (sesion && inputNombre && inputCorreo) {
    inputNombre.value = sesion.nombre;
    inputCorreo.value = sesion.email;
  }

  formContacto.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    const correo = inputCorreo.value.trim();
    const asunto = document.getElementById("contacto-asunto").value.trim();
    const texto = document.getElementById("contacto-mensaje").value.trim();

    await addDoc(collection(db, "mensajes"), {
      nombre,
      correo,
      asunto: asunto || "Contacto desde sección Contáctanos",
      texto,
      fecha: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
      timestamp: Date.now(),
      leido: false
    });

    alert(`✅ ¡Mensaje enviado, ${nombre}! Lo recibiremos en administración al instante.`);
    formContacto.reset();
    if (sesion && inputNombre && inputCorreo) {
      inputNombre.value = sesion.nombre;
      inputCorreo.value = sesion.email;
    }
  });
}