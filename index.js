require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SECRET = process.env.JWT_SECRET;

// ===============================
// CONEXIÓN BD
// ===============================
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// ===============================
// LOGIN
// ===============================
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await db.query(
            "SELECT * FROM clientes WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const cliente = rows[0];
        const passwordCorrecta = await bcrypt.compare(password, cliente.password);

        if (!passwordCorrecta) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const token = jwt.sign({ id: cliente.id }, SECRET, { expiresIn: "7d" });

        res.json({
            token,
            cliente: {
                id: cliente.id,
                nombre: cliente.nombre,
                apellidos: cliente.apellidos,
                email: cliente.email
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// ===============================
// REGISTRO
// ===============================
app.post("/registro", async (req, res) => {
    const { nombre, apellidos, telefono, email, password } = req.body;

    try {
        // Validar que el email sea de un dominio permitido
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "El formato del email no es válido" });
        }

        const dominiosPermitidos = [
            'gmail.com', 'googlemail.com',
            'outlook.com', 'hotmail.com', 'hotmail.es', 'live.com', 'msn.com',
            'yahoo.com', 'yahoo.es',
            'protonmail.com', 'proton.me',
            'tuta.com', 'tutanota.com',
            'zoho.com',
            'icloud.com', 'me.com',
            'gmx.com', 'gmx.es'
        ];

        const dominio = email.split('@')[1].toLowerCase();
        if (!dominiosPermitidos.includes(dominio)) {
            return res.status(400).json({
                error: "Solo se permiten correos de Gmail, Outlook, Hotmail, Yahoo, ProtonMail, Tuta, Zoho o iCloud. Si tienes otro correo llámanos para reservar."
            });
        }

        // Validar teléfono de 9 dígitos
        const telefonoRegex = /^\d{9}$/;
        if (!telefonoRegex.test(telefono)) {
            return res.status(400).json({ error: "El teléfono debe tener exactamente 9 dígitos." });
        }

        // Comprobar email duplicado
        const [existeEmail] = await db.query(
            "SELECT id FROM clientes WHERE email = ?",
            [email]
        );
        if (existeEmail.length > 0) {
            return res.status(400).json({ error: "Este email ya está registrado" });
        }

        // Comprobar teléfono duplicado
        const [existeTelefono] = await db.query(
            "SELECT id FROM clientes WHERE telefono = ?",
            [telefono]
        );
        if (existeTelefono.length > 0) {
            return res.status(400).json({ error: "Este número de teléfono ya está registrado" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO clientes (nombre, apellidos, telefono, email, password) VALUES (?, ?, ?, ?, ?)",
            [nombre, apellidos, telefono, email, passwordHash]
        );

        res.json({ mensaje: "Usuario registrado correctamente" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// ===============================
// HORARIOS
// ===============================
app.get("/horarios", async (req, res) => {
    const { tipo_clase_id, fecha } = req.query;

    if (!fecha || !tipo_clase_id) {
        return res.status(400).json({ error: "Faltan parámetros" });
    }

    try {
        const diaSemana = new Date(fecha).getDay();
        const dia = diaSemana === 0 ? 7 : diaSemana;

        const [sesiones] = await db.query(
            `SELECT * FROM sesiones 
             WHERE tipo_clase_id = ? AND dia_semana = ?`,
            [tipo_clase_id, dia]
        );

        if (sesiones.length === 0) {
            return res.json([]);
        }

        const resultados = [];

        for (const s of sesiones) {
            const [reservas] = await db.query(
                `SELECT COUNT(*) AS total 
                 FROM reservas 
                 WHERE sesion_id = ? AND fecha_clase = ? AND estado = 'confirmada'`,
                [s.id, fecha]
            );

            const ocupadas = reservas[0].total;
            const disponibles = s.capacidad_max - ocupadas;

            resultados.push({
                id: s.id,
                hora: s.hora,
                modalidad: s.modalidad,
                disponibles
            });
        }

        res.json(resultados);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener horarios" });
    }
});

// ===============================
// RESERVAR
// ===============================
app.post("/reservar", async (req, res) => {
    const { sesion_id, fecha_clase } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No autorizado" });
    if (!sesion_id || !fecha_clase) {
        return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    try {
        const decoded = jwt.verify(token, SECRET);
        const cliente_id = decoded.id;

        // ¿Está bloqueado por demasiadas cancelaciones esta semana?
        const [cancelaciones] = await db.query(
            `SELECT COUNT(*) AS total FROM reservas 
             WHERE cliente_id = ? 
               AND estado = 'cancelada'
               AND fecha_reserva >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [cliente_id]
        );

        if (cancelaciones[0].total >= 3) {
            return res.status(403).json({
                error: "Tu cuenta está bloqueada temporalmente por demasiadas cancelaciones esta semana. Contacta con el estudio."
            });
        }

        // Verificar que la clase no empieza en menos de 1 hora
        const [sesionHora] = await db.query(
            "SELECT hora FROM sesiones WHERE id = ?", [sesion_id]
        );
        const horaStr = sesionHora[0].hora.toString().substring(0, 5);
        const fechaHoraClase = new Date(`${fecha_clase}T${horaStr}:00`);
        const unaHoraAntes = new Date(Date.now() + 60 * 60 * 1000);
        if (fechaHoraClase < unaHoraAntes) {
            return res.status(400).json({
                error: "No puedes reservar una clase que empieza en menos de 1 hora."
            });
        }

        // Verificar que la clase no empieza en menos de 1 hora
        const [sesionHora] = await db.query(
            "SELECT hora FROM sesiones WHERE id = ?", [sesion_id]
        );
        const horaStr = sesionHora[0].hora.toString().substring(0, 5);
        const fechaHoraClase = new Date(`${fecha_clase}T${horaStr}:00`);
        const unaHoraAntes = new Date(Date.now() + 60 * 60 * 1000);
        if (fechaHoraClase < unaHoraAntes) {
            return res.status(400).json({
                error: "No puedes reservar una clase que empieza en menos de 1 hora."
            });
        }

        // ¿Ya tiene reserva ese día?
        const [duplicada] = await db.query(
            `SELECT id FROM reservas 
             WHERE cliente_id = ? AND fecha_clase = ? AND estado = 'confirmada'`,
            [cliente_id, fecha_clase]
        );

        if (duplicada.length > 0) {
            return res.status(409).json({
                error: "Ya tienes una clase reservada para ese día. Solo se permite una reserva por día."
            });
        }

        // Verificar aforo
        const [sesion] = await db.query(
            "SELECT capacidad_max FROM sesiones WHERE id = ?",
            [sesion_id]
        );
        const [ocupacion] = await db.query(
            `SELECT COUNT(*) AS total FROM reservas 
             WHERE sesion_id = ? AND fecha_clase = ? AND estado = 'confirmada'`,
            [sesion_id, fecha_clase]
        );
        if (ocupacion[0].total >= sesion[0].capacidad_max) {
            return res.status(409).json({ error: "Esta clase está completa" });
        }

        await db.query(
            `INSERT INTO reservas (cliente_id, sesion_id, fecha_clase, fecha_reserva, estado)
             VALUES (?, ?, ?, NOW(), 'confirmada')`,
            [cliente_id, sesion_id, fecha_clase]
        );

        res.json({ mensaje: "Reserva realizada" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al reservar" });
    }
});

// ===============================
// OBTENER RESERVAS
// ===============================
app.get("/reservas", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No autorizado" });

    try {
        const decoded = jwt.verify(token, SECRET);
        const cliente_id = decoded.id;

        const [rows] = await db.query(
            `SELECT r.id AS reserva_id,
                    r.fecha_clase,
                    s.hora,
                    s.modalidad,
                    tc.nombre AS tipo_clase
             FROM reservas r
             JOIN sesiones s ON s.id = r.sesion_id
             JOIN tipos_clase tc ON tc.id = s.tipo_clase_id
             WHERE r.cliente_id = ? AND r.estado = 'confirmada'
             ORDER BY r.fecha_clase ASC`,
            [cliente_id]
        );

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener reservas" });
    }
});

// ===============================
// CANCELAR RESERVA
// ===============================
app.delete("/cancelar-reserva", async (req, res) => {
    const { reserva_id } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No autorizado" });

    try {
        const decoded = jwt.verify(token, SECRET);
        const cliente_id = decoded.id;

        // Verificar que la reserva existe y es suya
        const [reserva] = await db.query(
            `SELECT r.id FROM reservas r
             WHERE r.id = ? AND r.cliente_id = ?`,
            [reserva_id, cliente_id]
        );

        if (reserva.length === 0) {
            return res.status(404).json({ error: "Reserva no encontrada" });
        }

        // Cancelar siempre — la plaza se libera sí o sí
        await db.query(
            "UPDATE reservas SET estado = 'cancelada' WHERE id = ?",
            [reserva_id]
        );

        // Contar cancelaciones de los últimos 7 días
        const [cancelaciones] = await db.query(
            `SELECT COUNT(*) AS total FROM reservas 
             WHERE cliente_id = ? 
               AND estado = 'cancelada'
               AND fecha_reserva >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [cliente_id]
        );

        if (cancelaciones[0].total >= 3) {
            return res.json({
                mensaje: "Reserva cancelada. Tu cuenta ha sido bloqueada temporalmente por demasiadas cancelaciones esta semana. Contacta con el estudio."
            });
        }

        res.json({ mensaje: "Reserva cancelada correctamente." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al cancelar reserva" });
    }
});

// ===============================
// INICIAR SERVIDOR
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
    console.log(`Servidor funcionando en http://localhost:${PORT}`)
);