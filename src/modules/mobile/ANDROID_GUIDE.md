# 📱 Guía de Integración con Android - SmartFlow

## 🎯 Flujos de Autenticación Soportados

1. **Login con Google (Firebase)** → Validación en backend
2. **Login tradicional** → Email y contraseña
3. **Registro de usuarios** → Pacientes y Especialistas

---

## 📋 Endpoints Disponibles

### 1. Login con Google
```
POST /api/mobile/auth/google
```

**Body:**
```json
{
  "idToken": "FIREBASE_ID_TOKEN_AQUI",
  "userType": "paciente" // o "especialista"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "token": "JWT_TOKEN_DEL_BACKEND",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "userType": "paciente",
    "role": "paciente",
    "platform": "mobile"
  }
}
```

**Nota:** Si es la primera vez que el usuario se loguea con Google, debe enviar `userType`. Si ya existe, no es necesario.

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

**Respuesta exitosa:**
```json
{
  "success": true,
  "token": "JWT_TOKEN_DEL_BACKEND",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "userType": "paciente",
    "role": "paciente",
    "platform": "mobile"
    // Si es especialista, incluye:
    // "especialidad": "Cardiología",
    // "cedula": "12345678"
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
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "userType": "paciente"
}
```

**Body para Especialista:**
```json
{
  "name": "Dr. María García",
  "email": "maria@example.com",
  "password": "123456",
  "userType": "especialista",
  "especialidad": "Cardiología",
  "cedula": "12345678"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "token": "JWT_TOKEN_DEL_BACKEND",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "userType": "especialista",
    "role": "especialista",
    "platform": "mobile",
    "especialidad": "Cardiología",
    "cedula": "12345678"
  }
}
```

---

## 🔧 Actualización del MainActivity.kt

### Paso 1: Actualizar `sendIdTokenToBackend`

```kotlin
private fun sendIdTokenToBackend(idToken: String, userType: String? = null) {
    // URL de tu backend
    val backendUrl = "http://10.0.2.2:3000/api/mobile/auth/google"  // Emulador
    // val backendUrl = "http://TU_IP:3000/api/mobile/auth/google"  // Dispositivo físico
    // val backendUrl = "https://vita-backend.onrender.com/api/mobile/auth/google"  // Producción

    Thread {
        try {
            val url = java.net.URL(backendUrl)
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 10000
            conn.readTimeout = 10000

            // Enviar idToken y userType
            conn.outputStream.use { os ->
                val body = buildString {
                    append("{")
                    append("\"idToken\":\"$idToken\"")
                    if (userType != null) {
                        append(",\"userType\":\"$userType\"")
                    }
                    append("}")
                }
                os.write(body.toByteArray())
            }

            val code = conn.responseCode
            
            runOnUiThread {
                if (code in 200..299) {
                    val response = conn.inputStream.bufferedReader().use { it.readText() }
                    handleBackendResponse(response)
                } else if (code == 400) {
                    // Requiere selección de tipo de usuario
                    val response = conn.errorStream.bufferedReader().use { it.readText() }
                    showUserTypeDialog(idToken)
                } else {
                    Toast.makeText(this, "Backend error: $code", Toast.LENGTH_LONG).show()
                }
            }

            conn.disconnect()
        } catch (e: Exception) {
            Log.e("MainActivity", "Error enviando token al backend", e)
            runOnUiThread {
                Toast.makeText(this, "No se pudo conectar al backend", Toast.LENGTH_LONG).show()
            }
        }
    }.start()
}
```

### Paso 2: Agregar función para manejar respuesta del backend

```kotlin
private fun handleBackendResponse(jsonResponse: String) {
    try {
        val json = org.json.JSONObject(jsonResponse)
        val success = json.getBoolean("success")
        
        if (success) {
            val token = json.getString("token")
            val userObj = json.getJSONObject("user")
            val userType = userObj.getString("userType")
            
            // Guardar token
            saveToken(token)
            
            // Navegar según el tipo de usuario
            when (userType) {
                "paciente" -> {
                    // Navegar a pantalla de paciente
                    startActivity(Intent(this, PacienteActivity::class.java))
                    finish()
                }
                "especialista" -> {
                    // Navegar a pantalla de especialista
                    startActivity(Intent(this, EspecialistaActivity::class.java))
                    finish()
                }
            }
            
            Toast.makeText(this, "Bienvenido", Toast.LENGTH_SHORT).show()
        }
    } catch (e: Exception) {
        Log.e("MainActivity", "Error parsing response", e)
        Toast.makeText(this, "Error al procesar respuesta", Toast.LENGTH_SHORT).show()
    }
}

private fun saveToken(token: String) {
    val sharedPref = getSharedPreferences("vita_prefs", MODE_PRIVATE)
    sharedPref.edit().putString("auth_token", token).apply()
}
```

### Paso 3: Agregar diálogo para seleccionar tipo de usuario (primer login con Google)

```kotlin
private fun showUserTypeDialog(idToken: String) {
    val options = arrayOf("Soy Paciente", "Soy Especialista Médico")
    
    androidx.appcompat.app.AlertDialog.Builder(this)
        .setTitle("Selecciona tu tipo de cuenta")
        .setItems(options) { dialog, which ->
            val userType = if (which == 0) "paciente" else "especialista"
            
            if (userType == "especialista") {
                // Si es especialista, pedir datos adicionales
                showEspecialistaDataDialog(idToken)
            } else {
                // Si es paciente, continuar directamente
                sendIdTokenToBackend(idToken, userType)
            }
        }
        .setCancelable(false)
        .show()
}

private fun showEspecialistaDataDialog(idToken: String) {
    // Crear un layout con campos para especialidad y cédula
    val layout = android.widget.LinearLayout(this).apply {
        orientation = android.widget.LinearLayout.VERTICAL
        setPadding(50, 40, 50, 10)
    }
    
    val etEspecialidad = android.widget.EditText(this).apply {
        hint = "Especialidad (ej: Cardiología)"
    }
    val etCedula = android.widget.EditText(this).apply {
        hint = "Cédula Profesional"
        inputType = android.text.InputType.TYPE_CLASS_NUMBER
    }
    
    layout.addView(etEspecialidad)
    layout.addView(etCedula)
    
    androidx.appcompat.app.AlertDialog.Builder(this)
        .setTitle("Datos del Especialista")
        .setView(layout)
        .setPositiveButton("Continuar") { _, _ ->
            val especialidad = etEspecialidad.text.toString().trim()
            val cedula = etCedula.text.toString().trim()
            
            if (especialidad.isEmpty() || cedula.isEmpty()) {
                Toast.makeText(this, "Completa todos los campos", Toast.LENGTH_SHORT).show()
                return@setPositiveButton
            }
            
            // Aquí deberías hacer otra petición al backend para completar el registro
            // O modificar sendIdTokenToBackend para aceptar estos datos
            sendIdTokenToBackend(idToken, "especialista")
        }
        .setCancelable(false)
        .show()
}
```

---

## 🔐 Uso del Token JWT en peticiones posteriores

Una vez autenticado, usa el token en todas las peticiones:

```kotlin
private fun makeAuthenticatedRequest(endpoint: String) {
    val sharedPref = getSharedPreferences("vita_prefs", MODE_PRIVATE)
    val token = sharedPref.getString("auth_token", null)
    
    if (token == null) {
        // Redirigir al login
        startActivity(Intent(this, MainActivity::class.java))
        finish()
        return
    }
    
    Thread {
        val url = java.net.URL("http://10.0.2.2:3000$endpoint")
        val conn = url.openConnection() as java.net.HttpURLConnection
        conn.requestMethod = "GET"
        conn.setRequestProperty("Authorization", "Bearer $token")
        
        // ... resto de la petición
    }.start()
}
```

---

## 🎨 Direccionamiento según Rol

Después del login, direcciona según el `userType`:

```kotlin
when (userType) {
    "paciente" -> {
        // Pantalla principal para pacientes
        startActivity(Intent(this, PacienteMainActivity::class.java))
    }
    "especialista" -> {
        // Pantalla principal para especialistas
        startActivity(Intent(this, EspecialistaMainActivity::class.java))
    }
}
finish()
```

---

## 📝 Notas Importantes

1. **URLs según entorno:**
   - Emulador: `http://10.0.2.2:3000`
   - Dispositivo físico: `http://TU_IP_LOCAL:3000`
   - Producción: `https://vita-backend.onrender.com`

2. **Tipos de usuario:**
   - `paciente`: Usuario regular de la app
   - `especialista`: Médico/profesional de salud

3. **Campos requeridos para especialistas:**
   - `especialidad`: String
   - `cedula`: String (cédula profesional)

4. **Firebase:**
   - El backend valida el Firebase ID Token
   - Genera su propio JWT para sesiones
   - Ver `FIREBASE_SETUP.md` para configuración

---

## 🐛 Solución de Problemas

### "Backend error: 400"
- Falta especificar `userType` en el primer login con Google
- Mostrar diálogo de selección de tipo de usuario

### "Esta cuenta fue creada con Google"
- El usuario intentó login con password pero se registró con Google
- Mostrar mensaje para usar "Continuar con Google"

### "Debe especificar el tipo de usuario"
- En el registro, falta el campo `userType`
- Agregar selector en la UI de registro

### "Los especialistas deben proporcionar especialidad y cédula"
- Faltan campos obligatorios para especialistas
- Agregar formulario adicional para especialistas
