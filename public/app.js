// ===============================
// CONFIG
// ===============================
const API_URL = "https://vpilates-backend-production.up.railway.app";

let token = null;
let cliente = null;

// ===============================
// TABS LOGIN / REGISTRO
// ===============================
const tabButtons = document.querySelectorAll(".vp-tab-button");
const tabContents = document.querySelectorAll(".vp-tab-content");

tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove("vp-tab-active"));
        btn.classList.add("vp-tab-active");
        tabContents.forEach(c => c.classList.remove("vp-tab-content-active"));
        document.getElementById(`tab-${tab}`).classList.add("vp-tab-content-active");
    });
});

// ===============================
// TOAST
// ===============================
const toastEl = document.getElementById("vp-toast");
function showToast(msg, tipo = "info") {
    toastEl.textContent = msg;
    toastEl.style.background = tipo === "error" ? "#c0392b" : "#333";
    toastEl.classList.add("vp-toast-visible");
    setTimeout(() => toastEl.classList.remove("vp-toast-visible"), 3500);
}

// ===============================
// LOGIN
// ===============================
const formLogin = document.getElementById("form-login");
const formRegistro = document.getElementById("form-registro");
const zonaUsuario = document.getElementById("zona-usuario");
const usuarioNombre = document.getElementById("usuario-nombre");

formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Error al iniciar sesión", "error");
            return;
        }

        token = data.token;
        cliente = data.cliente;
        usuarioNombre.textContent = `${cliente.nombre} ${cliente.apellidos}`;

        document.querySelector(".vp-auth").classList.add("vp-hidden");
        zonaUsuario.classList.remove("vp-hidden");

        showToast("Has iniciado sesión correctamente");
        btnCargarReservas.click();

    } catch (err) {
        console.error(err);
        showToast("Error de conexión con el servidor", "error");
    }
});

// ===============================
// REGISTRO
// ===============================
formRegistro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("reg-nombre").value.trim();
    const apellidos = document.getElementById("reg-apellidos").value.trim();
    const telefono = document.getElementById("reg-telefono").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value.trim();
    const passwordConfirm = document.getElementById("reg-password-confirm").value.trim();

    if (password !== passwordConfirm) {
        showToast("Las contraseñas no coinciden", "error");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/registro`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, apellidos, telefono, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Error al registrar usuario", "error");
            return;
        }

        showToast("Registro completado. Ahora puedes iniciar sesión.");

        tabButtons.forEach(b => b.classList.remove("vp-tab-active"));
        tabButtons[0].classList.add("vp-tab-active");
        tabContents.forEach(c => c.classList.remove("vp-tab-content-active"));
        document.getElementById("tab-login").classList.add("vp-tab-content-active");

    } catch (err) {
        console.error(err);
        showToast("Error de conexión con el servidor", "error");
    }
});

// ===============================
// LOGOUT
// ===============================
document.getElementById("btn-logout").addEventListener("click", () => {
    token = null;
    cliente = null;
    zonaUsuario.classList.add("vp-hidden");
    document.querySelector(".vp-auth").classList.remove("vp-hidden");
    showToast("Sesión cerrada");
});

// ===============================
// LÓGICA DE PROFESORES
// ===============================
function obtenerProfesor(tipoClaseId, fecha, hora, modalidad) {
    const dia = new Date(fecha).getDay();

    if (tipoClaseId == 2) return "Yolanda";
    if (tipoClaseId == 3) return null;

    if (tipoClaseId == 1) {
        if (dia === 5) return null;
        if (dia === 1 || dia === 3) {
            if (modalidad === "maquina") return "Lorena";
            if (modalidad === "suelo") return "Aurora";
        }
        if (dia === 2 || dia === 4) {
            if (modalidad === "maquina") return "Aurora";
            if (modalidad === "suelo") return "Lorena";
        }
    }

    return null;
}

// ===============================
// CARGAR HORARIOS
// ===============================
const btnCargarHorarios = document.getElementById("btn-cargar-horarios");
const listaHorarios = document.getElementById("lista-horarios");
const selectServicio = document.getElementById("select-servicio");
const selectFecha = document.getElementById("select-fecha");

btnCargarHorarios.addEventListener("click", async () => {
    const tipoClaseId = selectServicio.value;
    const fecha = selectFecha.value;

    if (!fecha) {
        showToast("Selecciona una fecha", "error");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/horarios?tipo_clase_id=${tipoClaseId}&fecha=${fecha}`);
        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Error al obtener horarios", "error");
            return;
        }

        listaHorarios.innerHTML = "";

        if (data.length === 0) {
            listaHorarios.innerHTML = `<p class="vp-list-item-sub">No hay horarios disponibles para esta fecha.</p>`;
            return;
        }

        // Filtrar clases pasadas o con menos de 1 hora si es hoy
        const hoy = new Date().toISOString().split('T')[0];
        const ahora = new Date();

        const horariosFiltrados = data.filter(h => {
            if (fecha === hoy) {
                const horaStr = h.hora.substring(0, 5);
                const [horas, minutos] = horaStr.split(':');
                const horaClase = new Date();
                horaClase.setHours(parseInt(horas), parseInt(minutos), 0, 0);
                const unaHoraAntes = new Date(ahora.getTime() + 60 * 60 * 1000);
                return horaClase > unaHoraAntes;
            }
            return true;
        });

        if (horariosFiltrados.length === 0) {
            listaHorarios.innerHTML = `<p class="vp-list-item-sub">No hay más clases disponibles para hoy.</p>`;
            return;
        }

        horariosFiltrados.forEach(h => {
            const profesor = obtenerProfesor(tipoClaseId, fecha, h.hora, h.modalidad);

            const item = document.createElement("div");
            item.className = "vp-list-item";

            item.innerHTML = `
                <div class="vp-list-item-header">
                    <div>
                        <div class="vp-list-item-title">${h.hora.substring(0, 5)}</div>
                        <div class="vp-list-item-sub">
                            ${profesor ? `Grupo de ${profesor}` : ""}
                            ${h.modalidad !== "ninguna" ? ` · ${h.modalidad}` : ""}
                        </div>
                    </div>
                    <div class="vp-list-item-sub">
                        ${h.disponibles > 0 ? `${h.disponibles} plazas` : "Lleno"}
                    </div>
                </div>
                <div class="vp-list-item-actions">
                    <button class="vp-btn-primary"
                        data-sesion-id="${h.id}"
                        ${h.disponibles <= 0 ? "disabled" : ""}>
                        Reservar
                    </button>
                </div>
            `;

            item.querySelector("button").addEventListener("click", () => reservar(h.id));
            listaHorarios.appendChild(item);
        });

    } catch (err) {
        console.error(err);
        showToast("Error de conexión con el servidor", "error");
    }
});

// ===============================
// RESERVAR
// ===============================
async function reservar(sesionId) {
    if (!token) {
        showToast("Debes iniciar sesión", "error");
        return;
    }

    const fecha_clase = selectFecha.value;

    if (!fecha_clase) {
        showToast("Selecciona una fecha antes de reservar", "error");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/reservar`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ sesion_id: sesionId, fecha_clase: fecha_clase })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Error al reservar", "error");
            return;
        }

        showToast("Reserva realizada con éxito");
        btnCargarHorarios.click();
        btnCargarReservas.click();

    } catch (err) {
        console.error(err);
        showToast("Error de conexión con el servidor", "error");
    }
}

// ===============================
// CARGAR RESERVAS
// ===============================
const btnCargarReservas = document.getElementById("btn-cargar-reservas");
const listaReservas = document.getElementById("lista-reservas");

btnCargarReservas.addEventListener("click", async () => {
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/reservas`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Error al obtener reservas", "error");
            return;
        }

        listaReservas.innerHTML = "";

        if (data.length === 0) {
            listaReservas.innerHTML = `<p class="vp-list-item-sub">No tienes reservas activas.</p>`;
            return;
        }

        data.forEach(r => {
            const item = document.createElement("div");
            item.className = "vp-list-item";

            const fechaMostrar = r.fecha_clase
                ? new Date(r.fecha_clase).toLocaleDateString("es-ES", {
                    weekday: "long", day: "numeric", month: "long"
                  })
                : "";

            item.innerHTML = `
                <div class="vp-list-item-header">
                    <div>
                        <div class="vp-list-item-title">${r.tipo_clase}</div>
                        <div class="vp-list-item-sub">${fechaMostrar} · ${r.hora.substring(0, 5)}</div>
                    </div>
                </div>
                <div class="vp-list-item-actions">
                    <button class="vp-btn-outline" data-id="${r.reserva_id}">
                        Cancelar
                    </button>
                </div>
            `;

            item.querySelector("button").addEventListener("click", () => cancelar(r.reserva_id));
            listaReservas.appendChild(item);
        });

    } catch (err) {
        console.error(err);
        showToast("Error de conexión con el servidor", "error");
    }
});

// ===============================
// CANCELAR RESERVA
// ===============================
async function cancelar(reservaId) {
    try {
        const res = await fetch(`${API_URL}/cancelar-reserva`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ reserva_id: reservaId })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || "Error al cancelar", "error");
            return;
        }

        showToast(data.mensaje || "Reserva cancelada");
        btnCargarReservas.click();
        btnCargarHorarios.click();

    } catch (err) {
        console.error(err);
        showToast("Error de conexión con el servidor", "error");
    }
}