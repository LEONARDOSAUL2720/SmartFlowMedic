# 📋 Documentación Actualizada - API Mobile

## 🎯 Modelo de Usuario Actualizado

El backend ahora usa el mismo esquema de MongoDB que el equipo web:

### Estructura de Usuario:
```javascript
{
  nombre: String,
  apellido: String,
  email: String (único),
  telefono: String,
  password: String (opcional si usa Google),
  rol: "paciente" | "medico" | "admin",
  foto: String (URL),
  fechaRegistro: Date,
  activo: Boolean,
  firebaseUid: String (si se registró con Google),
  platform: "web" | "mobile",
  
  // Solo para médicos
  medicoInfo: {
    cedula: String,
    especialidades: [ObjectId], // Referencia a colección Especialidades
    tarifaConsulta: Number,
    descripcion: String,
    experiencia: String,
    ubicacion: {
      direccion: String,
      ciudad: String,
      lat: Number,
      lng: Number
    },
    horariosDisponibles: [{
      dia: String,
      horaInicio: String,
      horaFin: String
    }],
    calificacionPromedio: Number,
    totalCitasAtendidas: Number
  }
}
```

---

## 📱 Endpoints Actualizados

### 1. Login con Google (Firebase)
```
POST /api/mobile/auth/google
```

**Body (primera vez):**
```json
{
  "idToken": "FIREBASE_ID_TOKEN",
  "rol": "paciente",  // o "medico"
  "telefono": "1234567890"
}
```

**Body (usuarios existentes):**
```json
{
  "idToken": "FIREBASE_ID_TOKEN"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "id": "...",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@gmail.com",
    "telefono": "1234567890",
    "rol": "paciente",
    "foto": "https://...",
    "platform": "mobile"
  }
}
```

**Para médicos incluye:**
```json
{
  "user": {
    ...
    "medicoInfo": {
      "calificacionPromedio": 0,
      "totalCitasAtendidas": 0
    }
  }
}
```

---

### 2. Login con Credenciales
```
POST /api/mobile/auth/login
```

**Body:**
```json
{
  "email": "usuario@example.com",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "user": {
    "id": "...",
    "nombre": "María",
    "apellido": "García",
    "email": "maria@example.com",
    "telefono": "9876543210",
    "rol": "medico",
    "foto": null,
    "platform": "mobile",
    "medicoInfo": {
      "cedula": "12345678",
      "especialidades": [...],
      "tarifaConsulta": 500,
      "descripcion": "Médico general...",
      "experiencia": "5 años",
      "ubicacion": {...},
      "horariosDisponibles": [...],
      "calificacionPromedio": 4.5,
      "totalCitasAtendidas": 150
    }
  }
}
```

---

### 3. Registro de Usuario
```
POST /api/mobile/auth/register
```

**Body para Paciente:**
```json
{
  "nombre": "Carlos",
  "apellido": "López",
  "email": "carlos@example.com",
  "telefono": "5551234567",
  "password": "123456",
  "rol": "paciente"
}
```

**Body para Médico:**
```json
{
  "nombre": "Dr. Ana",
  "apellido": "Martínez",
  "email": "ana@example.com",
  "telefono": "5559876543",
  "password": "123456",
  "rol": "medico",
  "medicoInfo": {
    "cedula": "87654321",
    "especialidades": ["674a1b2c3d4e5f6789abc123"],  // IDs de especialidades
    "tarifaConsulta": 600,
    "descripcion": "Especialista en cardiología",
    "experiencia": "10 años de experiencia",
    "ubicacion": {
      "direccion": "Calle Principal 123",
      "ciudad": "CDMX",
      "lat": 19.432608,
      "lng": -99.133209
    },
    "horariosDisponibles": [
      {
        "dia": "Lunes",
        "horaInicio": "09:00",
        "horaFin": "17:00"
      },
      {
        "dia": "Martes",
        "horaInicio": "09:00",
        "horaFin": "14:00"
      }
    ]
  }
}
```

**Nota:** Los campos de `medicoInfo` son opcionales al registro. Pueden completarse después con `PUT /api/mobile/auth/profile`.

---

### 4. Obtener Perfil
```
GET /api/mobile/auth/profile
Headers: Authorization: Bearer TOKEN
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan@example.com",
    "telefono": "1234567890",
    "rol": "paciente",
    "foto": "https://...",
    "activo": true,
    "fechaRegistro": "2025-11-12T...",
    // medicoInfo si es médico
  }
}
```

---

### 5. Actualizar Perfil
```
PUT /api/mobile/auth/profile
Headers: Authorization: Bearer TOKEN
```

**Body (campos opcionales):**
```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez García",
  "telefono": "1112223333",
  "foto": "https://nueva-foto.jpg"
}
```

**Para médicos, también pueden actualizar medicoInfo:**
```json
{
  "nombre": "Dr. Pedro",
  "medicoInfo": {
    "tarifaConsulta": 700,
    "descripcion": "Nueva descripción",
    "ubicacion": {
      "direccion": "Nueva dirección",
      "ciudad": "Guadalajara"
    }
  }
}
```

---

## 🔄 Diferencias Clave con la Versión Anterior

| Antes | Ahora |
|-------|-------|
| `name` | `nombre` + `apellido` |
| `userType` | `rol` |
| `especialista` | `medico` |
| `especialidad` (String) | `medicoInfo.especialidades` (Array de IDs) |
| `cedula` directa | `medicoInfo.cedula` |
| No había | `telefono` (requerido) |
| No había | `foto` |
| No había | `activo` |
| No había | `fechaRegistro` |
| No había | Toda la info extendida de médico |

---

## 🔐 Login con Google - Flujo Actualizado

### Primer Login:
1. Usuario presiona "Continuar con Google"
2. Firebase autentica → devuelve `idToken` + datos (email, nombre, foto)
3. Android muestra diálogo: "¿Eres Paciente o Médico?"
4. Android pide teléfono
5. Envía al backend:
   ```json
   {
     "idToken": "...",
     "rol": "paciente",
     "telefono": "1234567890"
   }
   ```
6. Backend:
   - Valida token con Firebase
   - Extrae nombre/apellido del displayName de Google
   - Crea usuario en MongoDB
   - Retorna JWT propio + datos del usuario
7. Android guarda token y navega según `rol`

### Logins Posteriores:
1. Usuario presiona "Continuar con Google"
2. Firebase autentica → devuelve `idToken`
3. Android envía solo:
   ```json
   {
     "idToken": "..."
   }
   ```
4. Backend encuentra usuario por `firebaseUid`
5. Retorna JWT + datos completos
6. Android navega según `rol`

---

## 📊 Navegación según Rol

```kotlin
when (user.rol) {
    "paciente" -> {
        // Navegar a pantalla de paciente
        startActivity(Intent(this, PacienteMainActivity::class.java))
    }
    "medico" -> {
        // Navegar a pantalla de médico
        startActivity(Intent(this, MedicoMainActivity::class.java))
    }
    "admin" -> {
        // Navegar a panel de administración
        startActivity(Intent(this, AdminActivity::class.java))
    }
}
```

---

## ⚠️ Consideraciones Importantes

### 1. Usuarios de Google sin teléfono
Si el usuario ya existe en la BD (creado por web) pero no tiene teléfono, el backend podría pedirlo. Considera manejar este caso.

### 2. Especialidades
Las especialidades se guardan como referencias (ObjectId). Necesitarás otro endpoint para obtener el catálogo de especialidades disponibles.

### 3. Fotos
- Google login: foto se obtiene automáticamente de Google
- Registro manual: foto es opcional
- Actualización: usa el endpoint de actualizar perfil

### 4. Médicos sin medicoInfo completo
Un médico puede registrarse solo con cédula. Luego puede completar su perfil (especialidades, horarios, etc.) desde la app.

### 5. Sincronización con Web
Los usuarios creados en web pueden loguearse en móvil y viceversa. El campo `platform` solo indica la última plataforma usada.

---

## 🐛 Errores Comunes

### "El teléfono es requerido para el registro"
```json
{
  "success": false,
  "message": "El teléfono es requerido para el registro",
  "requiresPhone": true
}
```
**Solución:** Mostrar campo de teléfono antes de enviar al backend.

### "Debe especificar el rol: paciente o medico"
```json
{
  "success": false,
  "message": "Debe especificar el rol: paciente o medico",
  "requiresUserType": true
}
```
**Solución:** Mostrar diálogo de selección de rol.

### "Los médicos deben proporcionar su cédula profesional"
```json
{
  "success": false,
  "message": "Los médicos deben proporcionar su cédula profesional"
}
```
**Solución:** Si rol=medico, pedir cédula en el formulario de registro.
