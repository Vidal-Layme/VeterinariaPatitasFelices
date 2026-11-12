// ==========================================
// CONTROL DEL MODAL DE AUTENTICACIÓN
// ==========================================
const modal = document.getElementById("modal-auth");

function abrirModal() {
  if (modal) modal.style.display = "flex";
}

function cerrarModal() {
  if (modal) modal.style.display = "none";
}

function cambiarTab(tipo) {
  const formLogin = document.getElementById("form-login");
  const formReg = document.getElementById("form-registro");
  const tabLogin = document.getElementById("tab-login");
  const tabReg = document.getElementById("tab-registro");

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

window.addEventListener("click", (event) => {
  if (event.target === modal) {
    cerrarModal();
  }
});

// ==========================================
// EFECTO DESPLAZAR Y DESAPARECER IMAGEN CON SCROLL
// ==========================================
const capsula = document.getElementById("capsula-mascota");

window.addEventListener("scroll", () => {
  if (!capsula) return;

  const scrollY = window.scrollY;

  // Movimiento: sale disparada hacia arriba y a la izquierda
  const moverX = -scrollY * 1.3;
  const moverY = -scrollY * 0.9;
  const rotacion = -scrollY * 0.15;

  // Desvanecimiento: se vuelve transparente a los 260px de bajada
  const opacidad = Math.max(0, 1 - scrollY / 260);
  const escala = Math.max(0.3, 1 - scrollY * 0.0025);

  capsula.style.transform = `translate3d(${moverX}px, ${moverY}px, 0) rotate(${rotacion}deg) scale(${escala})`;
  capsula.style.opacity = opacidad;
});