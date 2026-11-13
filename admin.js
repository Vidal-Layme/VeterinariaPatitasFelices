// 1. PROTEGER PANEL: Solo el Dueño (rol === "admin") puede entrar aquí
const sesion = JSON.parse(localStorage.getItem("sesionActiva"));
if (!sesion || sesion.rol !== "admin") {
  window.location.href = "index.html";
}

function cerrarSesionAdmin() {
  localStorage.removeItem("sesionActiva");
  window.location.href = "index.html";
}

// 2. GESTIÓN DE HORARIOS DISPONIBLES
const horariosBase = ["09:00 AM", "10:30 AM", "12:00 PM", "03:00 PM", "04:30 PM", "06:00 PM"];

function obtenerHorarios() {
  return JSON.parse(localStorage.getItem("horariosPatitas")) || horariosBase;
}

function renderizarHorarios() {
  const horarios = obtenerHorarios();
  const contenedor = document.getElementById("admin-horarios");
  contenedor.innerHTML = horarios.map((h, index) => `
    <div class="hora-chip">
      <span>${h}</span>
      <button title="Eliminar horario" onclick="eliminarHorario(${index})">&times;</button>
    </div>
  `).join("");
}

document.getElementById("form-agregar-hora").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("nueva-hora");
  const valor = input.value.trim().toUpperCase();
  if (!valor) return;

  const horarios = obtenerHorarios();
  if (!horarios.includes(valor)) {
    horarios.push(valor);
    localStorage.setItem("horariosPatitas", JSON.stringify(horarios));
    renderizarHorarios();
  }
  input.value = "";
});

function eliminarHorario(index) {
  const horarios = obtenerHorarios();
  horarios.splice(index, 1);
  localStorage.setItem("horariosPatitas", JSON.stringify(horarios));
  renderizarHorarios();
}

// 3. GESTIÓN DE CITAS AGENDADAS
function renderizarCitas() {
  const citas = JSON.parse(localStorage.getItem("citasPatitas")) || [];
  document.getElementById("count-citas").textContent = citas.length;
  const contenedor = document.getElementById("admin-lista-citas");

  if (citas.length === 0) {
    contenedor.innerHTML = `<p style="color: #6b7280;">No hay citas registradas todavía.</p>`;
    return;
  }

  contenedor.innerHTML = citas.map(c => `
    <div class="registro-item">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="color: #ffffff; font-size: 1rem;">🐾 ${c.mascota}</strong>
        <span style="color: #6ee7b7; font-weight: bold; font-size: 0.82rem;">${c.estado}</span>
      </div>
      <div style="margin: 0.3rem 0; color: #cbd5e1;">
        <strong>Servicio:</strong> ${c.servicio}<br>
        <strong>Fecha:</strong> ${c.fecha} — <strong>Hora:</strong> ${c.hora}<br>
        <strong>Dueño:</strong> ${c.clienteNombre} (${c.clienteEmail})
      </div>
      <div class="acciones-fila">
        <button class="btn-mini" onclick="cambiarEstadoCita(${c.id}, 'Confirmada ✅')">Confirmar</button>
        <button class="btn-mini" onclick="cambiarEstadoCita(${c.id}, 'Atendida 🩺')">Marcar Atendida</button>
        <button class="btn-mini danger" onclick="eliminarCita(${c.id})">Eliminar</button>
      </div>
    </div>
  `).join("");
}

function cambiarEstadoCita(id, nuevoEstado) {
  const citas = JSON.parse(localStorage.getItem("citasPatitas")) || [];
  const index = citas.findIndex(c => c.id === id);
  if (index !== -1) {
    citas[index].estado = nuevoEstado;
    localStorage.setItem("citasPatitas", JSON.stringify(citas));
    renderizarCitas();
  }
}

function eliminarCita(id) {
  let citas = JSON.parse(localStorage.getItem("citasPatitas")) || [];
  citas = citas.filter(c => c.id !== id);
  localStorage.setItem("citasPatitas", JSON.stringify(citas));
  renderizarCitas();
}

// 4. BANDEJA DE MENSAJES DE CLIENTES
function renderizarMensajes() {
  const mensajes = JSON.parse(localStorage.getItem("mensajesPatitas")) || [];
  document.getElementById("count-mensajes").textContent = mensajes.length;
  const contenedor = document.getElementById("admin-lista-mensajes");

  if (mensajes.length === 0) {
    contenedor.innerHTML = `<p style="color: #6b7280;">Bandeja vacía. Aún no hay mensajes de clientes.</p>`;
    return;
  }

  contenedor.innerHTML = mensajes.map(m => `
    <div class="registro-item" style="border-left-color: ${m.leido ? '#4b5563' : '#10b981'};">
      <div style="display: flex; justify-content: space-between;">
        <strong style="color: #ffffff;">${m.nombre}</strong>
        <span style="color: #9ca3af; font-size: 0.78rem;">${m.fecha}</span>
      </div>
      <div style="color: #6ee7b7; font-size: 0.8rem; margin-bottom: 0.4rem;">${m.correo}</div>
      <p style="margin: 0.4rem 0; color: #e5e7eb; line-height: 1.4;">"${m.texto}"</p>
      <div class="acciones-fila">
        ${!m.leido ? `<button class="btn-mini" onclick="marcarLeido(${m.id})">Marcar Leído ✓</button>` : `<span style="font-size: 0.75rem; color: #9ca3af;">Leído ✓</span>`}
        <button class="btn-mini danger" onclick="eliminarMensaje(${m.id})">Borrar</button>
      </div>
    </div>
  `).join("");
}

function marcarLeido(id) {
  const mensajes = JSON.parse(localStorage.getItem("mensajesPatitas")) || [];
  const index = mensajes.findIndex(m => m.id === id);
  if (index !== -1) {
    mensajes[index].leido = true;
    localStorage.setItem("mensajesPatitas", JSON.stringify(mensajes));
    renderizarMensajes();
  }
}

function eliminarMensaje(id) {
  let mensajes = JSON.parse(localStorage.getItem("mensajesPatitas")) || [];
  mensajes = mensajes.filter(m => m.id !== id);
  localStorage.setItem("mensajesPatitas", JSON.stringify(mensajes));
  renderizarMensajes();
}

// Inicializar vista del administrador
renderizarHorarios();
renderizarCitas();
renderizarMensajes();