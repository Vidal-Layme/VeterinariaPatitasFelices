import { db } from "./firebase-config.js";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 1. PROTEGER RUTA SOLO PARA EL DUEÑO
const sesion = JSON.parse(localStorage.getItem("sesionActiva"));
if (!sesion || sesion.rol !== "admin") {
  window.location.href = "index.html";
}

window.cerrarSesionAdmin = function() {
  localStorage.removeItem("sesionActiva");
  window.location.href = "index.html";
};

// 2. GESTIÓN DE HORARIOS EN FIREBASE
const horariosPorDefecto = ["09:00 AM", "10:30 AM", "12:00 PM", "03:00 PM", "04:30 PM", "06:00 PM"];
let horarios = [...horariosPorDefecto];

async function cargarHorariosAdmin() {
  const snap = await getDoc(doc(db, "config", "horarios"));
  if (snap.exists() && snap.data().lista) {
    horarios = snap.data().lista;
  } else {
    await setDoc(doc(db, "config", "horarios"), { lista: horarios });
  }
  renderizarHorariosAdmin();
}

function renderizarHorariosAdmin() {
  const contenedor = document.getElementById("lista-horarios-admin");
  if (!contenedor) return;

  contenedor.innerHTML = horarios.map((hora, index) => `
    <div class="chip-horario">
      <span>🕒 ${hora}</span>
      <button title="Eliminar horario" onclick="eliminarHorario(${index})">&times;</button>
    </div>
  `).join("");
}

const formHorario = document.getElementById("form-horario");
if (formHorario) {
  formHorario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nuevaHora = document.getElementById("nuevo-horario").value.trim().toUpperCase();
    if (nuevaHora && !horarios.includes(nuevaHora)) {
      horarios.push(nuevaHora);
      await setDoc(doc(db, "config", "horarios"), { lista: horarios });
      renderizarHorariosAdmin();
    }
    formHorario.reset();
  });
}

window.eliminarHorario = async function(index) {
  horarios.splice(index, 1);
  await setDoc(doc(db, "config", "horarios"), { lista: horarios });
  renderizarHorariosAdmin();
};

// 3. CITAS EN TIEMPO REAL (ACEPTAR BLOQUEA EL HORARIO AL RESTO)
onSnapshot(collection(db, "citas"), (snapshot) => {
  const contenedor = document.getElementById("lista-citas-admin");
  const citas = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const badgeCitas = document.getElementById("contador-citas");
  if (badgeCitas) badgeCitas.textContent = citas.length;

  if (!contenedor) return;
  if (citas.length === 0) {
    contenedor.innerHTML = `<p style="color: #6b7280; font-size: 0.9rem;">No hay citas solicitadas todavía.</p>`;
    return;
  }

  contenedor.innerHTML = citas.map(c => `
    <div class="tarjeta-admin">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>🐾 ${c.mascota}</strong>
        <span style="font-size:0.8rem; color:#6ee7b7; font-weight:600;">${c.estado}</span>
      </div>
      <div class="meta-admin">
        👤 Dueño: ${c.clienteNombre} (${c.clienteEmail}) • 📞 ${c.clienteTelefono || "Sin tel."}<br>
        🩺 Servicio: <strong>${c.servicio}</strong><br>
        📅 Fecha: <strong>${c.fecha}</strong> — 🕒 Hora: <strong>${c.hora}</strong>
      </div>
      <div class="acciones-admin">
        <button class="btn-accion btn-confirmar" onclick="cambiarEstadoCita('${c.id}', 'Confirmada ✅')">Aceptar / Cubrir Horario ✅</button>
        <button class="btn-accion btn-cancelar" onclick="cambiarEstadoCita('${c.id}', 'Rechazada ❌')">Rechazar ❌</button>
        <button class="btn-accion btn-borrar" onclick="eliminarCita('${c.id}')">Eliminar 🗑️</button>
      </div>
    </div>
  `).join("");
});

window.cambiarEstadoCita = async function(id, nuevoEstado) {
  await updateDoc(doc(db, "citas", id), { estado: nuevoEstado });
};

window.eliminarCita = async function(id) {
  await deleteDoc(doc(db, "citas", id));
};

// 4. MENSAJES RECIBIDOS EN TIEMPO REAL DESDE CUALQUIER DISPOSITIVO
onSnapshot(collection(db, "mensajes"), (snapshot) => {
  const contenedor = document.getElementById("lista-mensajes-admin");
  const mensajes = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const badgeMensajes = document.getElementById("contador-mensajes");
  if (badgeMensajes) badgeMensajes.textContent = mensajes.length;

  if (!contenedor) return;
  if (mensajes.length === 0) {
    contenedor.innerHTML = `<p style="color: #6b7280; font-size: 0.9rem;">Bandeja vacía. Aún no hay mensajes.</p>`;
    return;
  }

  contenedor.innerHTML = mensajes.map(m => `
    <div class="tarjeta-admin">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>✉️ ${m.asunto || "Consulta"}</strong>
        <span style="font-size:0.78rem; color:#9ca3af;">${m.fecha}</span>
      </div>
      <div class="meta-admin">
        De: <strong>${m.nombre}</strong> (<a href="mailto:${m.correo}" style="color:#6ee7b7;">${m.correo}</a>)
      </div>
      <p style="margin: 0.6rem 0; color: #e5e7eb; font-size: 0.9rem;">${m.texto}</p>
      <div class="acciones-admin">
        <button class="btn-accion btn-borrar" onclick="eliminarMensaje('${m.id}')">Eliminar Mensaje 🗑️</button>
      </div>
    </div>
  `).join("");
});

window.eliminarMensaje = async function(id) {
  await deleteDoc(doc(db, "mensajes", id));
};

cargarHorariosAdmin();