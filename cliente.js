import { db } from "./firebase-config.js";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 1. PROTEGER RUTA
let sesion = JSON.parse(localStorage.getItem("sesionActiva"));
if (!sesion || sesion.rol !== "cliente") {
  window.location.href = "index.html";
}

const primerNombre = sesion.nombre.split(" ")[0];
const saludoEl = document.getElementById("saludo-cliente");
if (saludoEl) saludoEl.textContent = `Hola, ${primerNombre} 🐶`;

window.cerrarSesionCliente = function() {
  localStorage.removeItem("sesionActiva");
  window.location.href = "index.html";
};

// 2. CARGAR Y ACTUALIZAR PERFIL DEL USUARIO
const inputPerfilNombre = document.getElementById("perfil-nombre");
const inputPerfilEmail = document.getElementById("perfil-email");
const inputPerfilTel = document.getElementById("perfil-telefono");
const inputPerfilDir = document.getElementById("perfil-direccion");

if (inputPerfilNombre) inputPerfilNombre.value = sesion.nombre || "";
if (inputPerfilEmail) inputPerfilEmail.value = sesion.email || "";
if (inputPerfilTel) inputPerfilTel.value = sesion.telefono || "";
if (inputPerfilDir) inputPerfilDir.value = sesion.direccion || "";

const formPerfil = document.getElementById("form-perfil");
if (formPerfil) {
  formPerfil.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nuevosDatos = {
      nombre: inputPerfilNombre.value.trim(),
      telefono: inputPerfilTel.value.trim(),
      direccion: inputPerfilDir.value.trim()
    };

    if (sesion.id) {
      await updateDoc(doc(db, "usuarios", sesion.id), nuevosDatos);
    }
    sesion = { ...sesion, ...nuevosDatos };
    localStorage.setItem("sesionActiva", JSON.stringify(sesion));
    alert("✅ ¡Datos de perfil actualizados en la nube!");
  });
}

// 3. MASCOTAS EN FIREBASE
const formMascota = document.getElementById("form-mascota");
if (formMascota) {
  formMascota.addEventListener("submit", async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "mascotas"), {
      duenoEmail: sesion.email,
      nombre: document.getElementById("mascota-nombre").value.trim(),
      especie: document.getElementById("mascota-especie").value,
      raza: document.getElementById("mascota-raza").value.trim(),
      edad: document.getElementById("mascota-edad").value.trim(),
      notas: document.getElementById("mascota-notas")?.value.trim() || "Sin observaciones"
    });
    formMascota.reset();
    alert("🐾 ¡Mascota inscrita correctamente!");
  });
}

window.eliminarMascota = async function(id) {
  await deleteDoc(doc(db, "mascotas", id));
};

const qMascotas = query(collection(db, "mascotas"), where("duenoEmail", "==", sesion.email));
onSnapshot(qMascotas, (snapshot) => {
  const grid = document.getElementById("lista-mis-mascotas");
  const selectMascota = document.getElementById("cita-mascota");
  if (!grid || !selectMascota) return;

  if (snapshot.empty) {
    grid.innerHTML = `<p style="color: #6b7280; font-size: 0.85rem; grid-column: 1/-1;">Aún no tienes mascotas inscritas.</p>`;
    selectMascota.innerHTML = `<option value="">-- Inscribe una mascota primero --</option>`;
    return;
  }

  grid.innerHTML = snapshot.docs.map(d => {
    const m = d.data();
    return `
      <div class="mascota-chip">
        <button class="btn-borrar-mascota" title="Eliminar" onclick="eliminarMascota('${d.id}')">&times;</button>
        <strong>${m.nombre}</strong>
        <span style="color: #6ee7b7; font-size: 0.78rem;">${m.especie} • ${m.raza}</span><br>
        <span style="color: #9ca3af; font-size: 0.78rem;">${m.edad}</span><br>
        <span style="color: #cbd5e1; font-size: 0.75rem;">Notas: ${m.notas || "Sin observaciones"}</span>
      </div>
    `;
  }).join("");

  selectMascota.innerHTML = snapshot.docs.map(d => {
    const m = d.data();
    return `<option value="${m.nombre} (${m.especie} - ${m.raza})">${m.nombre} (${m.especie})</option>`;
  }).join("");
});

// 4. HORARIOS Y CITAS (SOLO SE BLOQUEAN SI EL DUEÑO YA LAS ACEPTÓ)
const horariosPorDefecto = ["09:00 AM", "10:30 AM", "12:00 PM", "03:00 PM", "04:30 PM", "06:00 PM"];
let horariosBase = horariosPorDefecto;
let todasLasCitas = [];

const inputFecha = document.getElementById("cita-fecha");
const selectHora = document.getElementById("cita-hora");
if (inputFecha) {
  const hoyISO = new Date().toISOString().split("T")[0];
  inputFecha.min = hoyISO;
  inputFecha.value = hoyISO;
}

async function cargarHorariosConfig() {
  const snap = await getDoc(doc(db, "config", "horarios"));
  if (snap.exists() && snap.data().lista) {
    horariosBase = snap.data().lista;
  }
  actualizarSelectorHoras();
}

function actualizarSelectorHoras() {
  if (!inputFecha || !selectHora) return;
  const fechaElegida = inputFecha.value;

  // SOLO bloqueamos horarios si el dueño ya aceptó ("Confirmada ✅") esa cita
  const horasCubiertas = todasLasCitas
    .filter(c => c.fecha === fechaElegida && c.estado === "Confirmada ✅")
    .map(c => c.hora);

  selectHora.innerHTML = "";
  horariosBase.forEach(hora => {
    const opt = document.createElement("option");
    opt.value = hora;
    if (horasCubiertas.includes(hora)) {
      opt.textContent = `${hora} (Cubierto 🔒)`;
      opt.disabled = true;
    } else {
      opt.textContent = `${hora} (Disponible ✅)`;
    }
    selectHora.appendChild(opt);
  });
}

if (inputFecha) inputFecha.addEventListener("change", actualizarSelectorHoras);

onSnapshot(collection(db, "citas"), (snapshot) => {
  todasLasCitas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  actualizarSelectorHoras();

  const misCitas = todasLasCitas
    .filter(c => c.clienteEmail === sesion.email)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const contenedor = document.getElementById("lista-mis-citas");
  if (!contenedor) return;

  if (misCitas.length === 0) {
    contenedor.innerHTML = `<p style="color: #6b7280; font-size: 0.85rem;">Aún no tienes citas solicitadas.</p>`;
    return;
  }

  contenedor.innerHTML = misCitas.map(c => `
    <div class="item-card">
      <strong>🐾 ${c.mascota}</strong> — ${c.servicio}<br>
      <span style="color: #9ca3af; font-size: 0.82rem;">📅 ${c.fecha} a las ${c.hora}</span><br>
      <span class="estado-tag">${c.estado}</span>
    </div>
  `).join("");
});

const formCita = document.getElementById("form-cita");
if (formCita) {
  formCita.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mascota = document.getElementById("cita-mascota").value;
    if (!mascota) {
      alert("⚠️ Primero inscribe a tu mascota.");
      return;
    }

    await addDoc(collection(db, "citas"), {
      clienteNombre: sesion.nombre,
      clienteEmail: sesion.email,
      clienteTelefono: sesion.telefono || "No registrado",
      mascota: mascota,
      servicio: document.getElementById("cita-servicio").value,
      fecha: inputFecha.value,
      hora: selectHora.value,
      estado: "Pendiente de aprobación ⏳",
      timestamp: Date.now()
    });

    alert("📩 ¡Solicitud enviada! Cuando el veterinario acepte tu cita, el horario quedará cubierto para ti.");
  });
}

// 5. MENSAJES AL DUEÑO EN TIEMPO REAL
const formMensajeCliente = document.getElementById("form-mensaje-cliente");
if (formMensajeCliente) {
  formMensajeCliente.addEventListener("submit", async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "mensajes"), {
      nombre: sesion.nombre,
      correo: sesion.email,
      asunto: document.getElementById("msg-asunto").value.trim(),
      texto: document.getElementById("msg-contenido").value.trim(),
      fecha: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
      timestamp: Date.now(),
      leido: false
    });

    alert("✅ ¡Mensaje enviado al dueño! Le llegará al instante a su dispositivo.");
    formMensajeCliente.reset();
  });
}

const qMisMensajes = query(collection(db, "mensajes"), where("correo", "==", sesion.email));
onSnapshot(qMisMensajes, (snapshot) => {
  const contenedor = document.getElementById("lista-mis-mensajes");
  if (!contenedor) return;

  if (snapshot.empty) {
    contenedor.innerHTML = `<p style="color: #6b7280; font-size: 0.85rem;">No has enviado mensajes todavía.</p>`;
    return;
  }

  const msgs = snapshot.docs.map(d => d.data()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  contenedor.innerHTML = msgs.map(m => `
    <div class="item-card">
      <strong>${m.asunto}</strong> <span style="color: #9ca3af; font-size: 0.78rem;">(${m.fecha})</span>
      <p style="margin: 0.4rem 0 0; color: #d1d5db; font-size: 0.85rem;">${m.texto}</p>
    </div>
  `).join("");
});

cargarHorariosConfig();