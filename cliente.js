// 1. PROTEGER LA RUTA: Solo entran clientes con sesión activa
const sesion = JSON.parse(localStorage.getItem("sesionActiva"));
if (!sesion || sesion.rol !== "cliente") {
  window.location.href = "index.html";
} else {
  const primerNombre = sesion.nombre.split(" ")[0];
  document.getElementById("saludo-cliente").textContent = `Hola, ${primerNombre} 🐶`;
}

function cerrarSesionCliente() {
  localStorage.removeItem("sesionActiva");
  window.location.href = "index.html";
}

// 2. CARGAR HORARIOS HABILITADOS POR EL DUEÑO
const horariosPorDefecto = ["09:00 AM", "10:30 AM", "12:00 PM", "03:00 PM", "04:30 PM", "06:00 PM"];
const horariosDisponibles = JSON.parse(localStorage.getItem("horariosPatitas")) || horariosPorDefecto;

const contenedorHorarios = document.getElementById("contenedor-horarios");
const selectHora = document.getElementById("cita-hora");

horariosDisponibles.forEach(hora => {
  const span = document.createElement("span");
  span.className = "badge-hora";
  span.textContent = hora;
  contenedorHorarios.appendChild(span);

  const opt = document.createElement("option");
  opt.value = hora;
  opt.textContent = hora;
  selectHora.appendChild(opt);
});

// 3. GUARDAR Y MOSTRAR CITAS DEL CLIENTE
const formCita = document.getElementById("form-cita");
formCita.addEventListener("submit", (e) => {
  e.preventDefault();
  const nuevaCita = {
    id: Date.now(),
    clienteNombre: sesion.nombre,
    clienteEmail: sesion.email,
    mascota: document.getElementById("cita-mascota").value.trim(),
    servicio: document.getElementById("cita-servicio").value,
    fecha: document.getElementById("cita-fecha").value,
    hora: document.getElementById("cita-hora").value,
    estado: "Pendiente ⏳"
  };

  const citas = JSON.parse(localStorage.getItem("citasPatitas")) || [];
  citas.unshift(nuevaCita);
  localStorage.setItem("citasPatitas", JSON.stringify(citas));

  alert("✅ ¡Cita agendada con éxito! El veterinario ya puede verla en su panel.");
  formCita.reset();
  renderizarMisCitas();
});

function renderizarMisCitas() {
  const citas = JSON.parse(localStorage.getItem("citasPatitas")) || [];
  const misCitas = citas.filter(c => c.clienteEmail === sesion.email);
  const contenedor = document.getElementById("lista-mis-citas");

  if (misCitas.length === 0) {
    contenedor.innerHTML = `<p style="color: #6b7280; font-size: 0.85rem;">Aún no tienes citas reservadas.</p>`;
    return;
  }

  contenedor.innerHTML = misCitas.map(c => `
    <div class="item-card">
      <strong>🐾 ${c.mascota}</strong> — ${c.servicio}<br>
      <span style="color: #9ca3af; font-size: 0.82rem;">📅 ${c.fecha} a las ${c.hora}</span><br>
      <span class="estado-tag">${c.estado}</span>
    </div>
  `).join("");
}

// 4. ENVIAR MENSAJE AL DUEÑO DESDE EL PORTAL DEL CLIENTE
const formMsg = document.getElementById("form-mensaje-cliente");
formMsg.addEventListener("submit", (e) => {
  e.preventDefault();
  const nuevoMensaje = {
    id: Date.now(),
    nombre: sesion.nombre,
    correo: sesion.email,
    asunto: document.getElementById("msg-asunto").value.trim(),
    texto: document.getElementById("msg-contenido").value.trim(),
    fecha: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
    leido: false
  };

  const mensajes = JSON.parse(localStorage.getItem("mensajesPatitas")) || [];
  mensajes.unshift(nuevoMensaje);
  localStorage.setItem("mensajesPatitas", JSON.stringify(mensajes));

  alert("📩 ¡Mensaje enviado al dueño! Lo verá en su bandeja de entrada.");
  formMsg.reset();
  renderizarMisMensajes();
});

function renderizarMisMensajes() {
  const mensajes = JSON.parse(localStorage.getItem("mensajesPatitas")) || [];
  const misMensajes = mensajes.filter(m => m.correo === sesion.email);
  const contenedor = document.getElementById("lista-mis-mensajes");

  if (misMensajes.length === 0) {
    contenedor.innerHTML = `<p style="color: #6b7280; font-size: 0.85rem;">No has enviado mensajes todavía.</p>`;
    return;
  }

  contenedor.innerHTML = misMensajes.map(m => `
    <div class="item-card">
      <strong>${m.asunto}</strong> <span style="color: #9ca3af; font-size: 0.78rem;">(${m.fecha})</span>
      <p style="margin: 0.4rem 0 0; color: #d1d5db; font-size: 0.85rem;">${m.texto}</p>
    </div>
  `).join("");
}

// Inicializar listas al cargar
renderizarMisCitas();
renderizarMisMensajes();