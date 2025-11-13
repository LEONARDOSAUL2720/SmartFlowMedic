# 📱 Instrucciones para Actualizar tu Proyecto Android

## ✅ Archivos Creados/Actualizados

### 📂 En tu proyecto Android Studio (`C:\Users\21223\AndroidStudioProjects\SmartFlow\`)

Copia estos archivos desde `D:\UNIVERSIDAD\DECIMO\VITA\SmartFlowAndroid\` a tu proyecto:

### 1️⃣ Activities (Kotlin)
```
app/src/main/java/com/example/smartflow/
├── MainActivity.kt (ACTUALIZADO)
├── PacienteHomeActivity.kt (NUEVO)
└── MedicoHomeActivity.kt (NUEVO)
```

### 2️⃣ Layouts (XML)
```
app/src/main/res/layout/
├── dialog_complete_registration.xml (NUEVO)
├── activity_paciente_home.xml (NUEVO)
└── activity_medico_home.xml (NUEVO)
```

### 3️⃣ AndroidManifest.xml (ACTUALIZADO)
```
app/src/main/AndroidManifest.xml
```

---

## 🔄 Pasos para Copiar

### Opción A: Copiar todo automáticamente (PowerShell)

Ejecuta en PowerShell:

```powershell
# Copiar Activities
Copy-Item "D:\UNIVERSIDAD\DECIMO\VITA\SmartFlowAndroid\app\src\main\java\com\example\smartflow\*Activity.kt" "C:\Users\21223\AndroidStudioProjects\SmartFlow\app\src\main\java\com\example\smartflow\" -Force

# Copiar Layouts
Copy-Item "D:\UNIVERSIDAD\DECIMO\VITA\SmartFlowAndroid\app\src\main\res\layout\*.xml" "C:\Users\21223\AndroidStudioProjects\SmartFlow\app\src\main\res\layout\" -Force

# Copiar Manifest
Copy-Item "D:\UNIVERSIDAD\DECIMO\VITA\SmartFlowAndroid\app\src\main\AndroidManifest.xml" "C:\Users\21223\AndroidStudioProjects\SmartFlow\app\src\main\" -Force
```

### Opción B: Copiar manualmente

1. Abre ambas carpetas en explorador de Windows
2. Copia los archivos uno por uno
3. Android Studio detectará los cambios automáticamente

---

## 🔧 Después de Copiar

1. **En Android Studio:**
   - Click en "Sync Now" (aparece arriba)
   - O ve a: `File > Sync Project with Gradle Files`

2. **Verifica que todo compiló:**
   - Build > Clean Project
   - Build > Rebuild Project

3. **Cambia la URL del backend según tu ambiente:**
   
   En `MainActivity.kt` línea 32-33:
   ```kotlin
   // Para emulador:
   private val BACKEND_URL = "http://10.0.2.2:3000/api/mobile"
   
   // Para dispositivo físico (cambia por tu IP local):
   // private val BACKEND_URL = "http://192.168.1.X:3000/api/mobile"
   
   // Para producción (cuando despliegues en Render):
   // private val BACKEND_URL = "https://tu-app.onrender.com/api/mobile"
   ```

---

## ✅ ¿Qué hace cada archivo?

### **MainActivity.kt**
- Login con Google (muestra dialog si es primera vez)
- Login con credenciales (email/password directo al backend)
- Navega a PacienteHome o MedicoHome según el rol

### **dialog_complete_registration.xml**
- Dialog que aparece en primer login con Google
- Permite seleccionar rol (paciente/medico)
- Pide teléfono (obligatorio)
- Pide cédula (solo si es médico)

### **PacienteHomeActivity.kt + layout**
- Pantalla principal para pacientes
- Botones: Buscar Médicos, Mis Citas, Mi Perfil, Cerrar Sesión

### **MedicoHomeActivity.kt + layout**
- Pantalla principal para médicos
- Botones: Configurar Horarios, Mis Consultas, Mi Perfil, Cerrar Sesión

---

## 🎯 Flujo Completo

1. Usuario abre app → MainActivity
2. Login con Google o credenciales
3. Backend valida y retorna `rol` (paciente/medico)
4. App navega automáticamente a:
   - `PacienteHomeActivity` si rol = "paciente"
   - `MedicoHomeActivity` si rol = "medico"

---

## 🐛 Si tienes errores

1. **Error: Cannot resolve symbol 'TextInputLayout'**
   - Verifica que tengas Material Components en `build.gradle.kts`:
   ```kotlin
   implementation("com.google.android.material:material:1.11.0")
   ```

2. **Error de compilación**
   - Build > Clean Project
   - File > Invalidate Caches > Invalidate and Restart

3. **No navega a las pantallas**
   - Verifica que las Activities estén en AndroidManifest.xml
   - Revisa los logs en Logcat para ver errores

---

## 📝 Próximos Pasos

- [ ] Implementar búsqueda de médicos (Paciente)
- [ ] Implementar lista de citas (Paciente/Médico)
- [ ] Implementar perfil completo
- [ ] Implementar agenda/horarios (Médico)
- [ ] Conectar con endpoints de Citas, Especialidades, etc.
