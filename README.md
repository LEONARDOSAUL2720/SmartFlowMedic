# VITA Backend

Backend con Node.js, Express y MongoDB para aplicaciones web y móvil (Android Studio).

## 🚀 Características

- **Separación de lógica**: APIs independientes para web y móvil
- **Base de datos**: MongoDB con Mongoose
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Express Validator
- **Seguridad**: CORS, bcrypt para contraseñas
- **Deployment**: Configurado para Render

## 📁 Estructura del Proyecto

```
VITA/
├── src/
│   ├── config/          # Configuración de BD y variables
│   ├── models/          # Modelos de MongoDB (compartidos)
│   ├── middlewares/     # Middlewares globales
│   ├── utils/           # Funciones auxiliares
│   ├── modules/         # Módulos de negocio
│   │   ├── web/         # Lógica específica para WEB
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   └── mobile/      # Lógica específica para MÓVIL
│   │       ├── controllers/
│   │       ├── routes/
│   │       └── services/
│   └── index.js         # Punto de entrada
├── .env                 # Variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```
Editar `.env` con tus configuraciones.

4. Ejecutar en desarrollo:
```bash
npm run dev
```

5. Ejecutar en producción:
```bash
npm start
```

## 🌐 Endpoints

### Web API
- Base URL: `/api/web`
- Ejemplos:
  - `POST /api/web/auth/login` - Login web
  - `GET /api/web/users` - Obtener usuarios (web)

### Mobile API
- Base URL: `/api/mobile`
- Ejemplos:
  - `POST /api/mobile/auth/login` - Login móvil
  - `GET /api/mobile/users` - Obtener usuarios (móvil)

## 🚀 Deploy en Render

1. Conectar repositorio en Render
2. Configurar variables de entorno en Render
3. El archivo `render.yaml` ya está configurado
4. Deploy automático al hacer push

## 📝 Variables de Entorno

Ver `.env.example` para todas las variables necesarias.

## 🔧 Tecnologías

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT
- Bcrypt
- Express Validator
- CORS
- Morgan (logging)
