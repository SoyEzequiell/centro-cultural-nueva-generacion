const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path'); // Requerido para manejar rutas de carpetas
const db = require('./database');

const app = express();
app.use(express.json());
app.use(cors());

// Configurar la carpeta superior para que sirva los archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../')));

// Paso A: Alta de usuario por el Administrador
app.post('/api/usuarios', async (req, res) => {
    const { nombre, email, password_temporal, rol_id } = req.body;

    if (!nombre || !email || !password_temporal || !rol_id) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password_temporal, saltRounds);

        const query = `INSERT INTO usuarios (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)`;
        db.run(query, [nombre, email, password_hash, rol_id], function(err) {
            if (err) {
                return res.status(400).json({ error: 'El correo ya esta registrado o hay un error en los datos' });
            }
            res.status(201).json({ mensaje: 'Usuario creado exitosamente', id: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Paso B: Primer Login con Contrasena Local
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contrasena requeridos' });
    }

    const query = `
        SELECT u.*, r.nombre as rol_nombre 
        FROM usuarios u 
        JOIN roles r ON u.rol_id = r.id 
        WHERE u.email = ? AND u.activo = 1
    `;

    db.get(query, [email], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Credenciales invalidas o usuario inactivo' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Credenciales invalidas' });
        }

        res.json({
            mensaje: 'Login exitoso',
            usuario: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol_nombre,
                google_vinculado: !!user.google_id
            }
        });
    });
});

// Paso C: Vinculacion de Cuenta de Google
app.post('/api/vincular-google', (req, res) => {
    const { email, google_id } = req.body;

    if (!email || !google_id) {
        return res.status(400).json({ error: 'Email y google_id son obligatorios' });
    }

    const query = `UPDATE usuarios SET google_id = ? WHERE email = ? AND activo = 1`;
    db.run(query, [google_id, email], function(err) {
        if (err || this.changes === 0) {
            return res.status(400).json({ error: 'No se pudo vincular la cuenta. Verifique el correo.' });
        }
        res.json({ mensaje: 'Cuenta de Google vinculada exitosamente' });
    });
});

// Paso D: Login Directo con Google
app.post('/api/login-google', (req, res) => {
    const { google_id, email } = req.body;

    if (!google_id && !email) {
        return res.status(400).json({ error: 'Datos de Google insuficientes' });
    }

    const query = `
        SELECT u.*, r.nombre as rol_nombre 
        FROM usuarios u 
        JOIN roles r ON u.rol_id = r.id 
        WHERE (u.google_id = ? OR u.email = ?) AND u.activo = 1
    `;

    db.get(query, [google_id, email], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Acceso denegado: Este correo no esta autorizado en el sistema' });
        }

        if (!user.google_id && google_id) {
            db.run(`UPDATE usuarios SET google_id = ? WHERE id = ?`, [google_id, user.id]);
        }

        res.json({
            mensaje: 'Login con Google exitoso',
            usuario: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol_nombre
            }
        });
    });
});

// Ruta raíz para servir el index.html principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});