# Backend de Autenticación para Centro Educativo

Este módulo contiene el servidor Node.js + Express y la base de datos SQLite para gestionar el inicio de sesión del personal (administradores, coordinadores, profesores y recepcionistas).

## Estructura de archivos:
- `server.js`: Endpoints API para alta de usuarios, login local y login/vinculación de Google.
- `database.js`: Configuración de SQLite, tablas de `roles` y `usuarios`.
- `package.json`: Dependencias necesarias (express, sqlite3, bcrypt, cors).

## Instrucciones para ejecutar:

1. Abrir la terminal en esta carpeta (`backend-autenticacion`).
2. Instalar las dependencias ejecutando:
   ```bash
   npm install
   ```
3. Iniciar el servidor:
   ```bash
   npm start
   ```
4. El servidor estará escuchando en `http://localhost:3000`.
