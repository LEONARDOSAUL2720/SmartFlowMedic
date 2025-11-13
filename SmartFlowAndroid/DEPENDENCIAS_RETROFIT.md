# 📦 Dependencias necesarias para Retrofit

## Archivo: `build.gradle.kts` (Module: app)

Agrega estas dependencias en el bloque `dependencies`:

```kotlin
dependencies {
    // ... tus dependencias existentes ...
    
    // ============= RETROFIT =============
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    
    // OkHttp (cliente HTTP)
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Gson (serialización JSON)
    implementation("com.google.code.gson:gson:2.10.1")
    
    // Coroutines (ya deberías tenerlas)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    
    // Material Components (para TextInputLayout)
    implementation("com.google.android.material:material:1.11.0")
}
```

## Después de agregar las dependencias:

1. Click en **"Sync Now"** que aparece arriba
2. Espera a que Gradle sincronice y descargue las dependencias
3. Si hay error, ve a: `File > Invalidate Caches > Invalidate and Restart`

---

## 📁 Archivos a copiar a tu proyecto original:

### **Con Retrofit (RECOMENDADO - Más limpio):**

```
📂 data/
  📂 api/
    - ApiService.kt (interfaz con todos los endpoints)
    - RetrofitClient.kt (configuración de Retrofit)
  📂 models/
    - ApiModels.kt (modelos de respuesta)
    - RequestModels.kt (modelos de request)

📂 (raíz)
  - MainActivity_RETROFIT.kt (renombrar a MainActivity.kt)
  - PacienteHomeActivity.kt
  - MedicoHomeActivity.kt
```

### **Sin Retrofit (versión actual con HttpURLConnection):**

```
📂 (raíz)
  - MainActivity.kt (la versión que ya tienes con HttpURLConnection)
  - PacienteHomeActivity.kt
  - MedicoHomeActivity.kt
```

---

## 🎯 Ventajas de usar Retrofit:

✅ **Código más limpio** - Menos boilerplate  
✅ **Manejo automático de JSON** - No más JSONObject manual  
✅ **Type-safe** - Errores en compilación, no en runtime  
✅ **Fácil de mantener** - Cambios centralizados en ApiService  
✅ **Logging integrado** - Ve todas las requests/responses en Logcat  
✅ **Mejor manejo de errores** - Response codes claros  

---

## 🚀 Qué hacer:

### Opción A: Usar Retrofit (RECOMENDADO)

1. Agrega las dependencias al `build.gradle.kts`
2. Sync Gradle
3. Copia la carpeta `data/` completa
4. Reemplaza `MainActivity.kt` con `MainActivity_RETROFIT.kt`
5. Copia las demás Activities

### Opción B: Seguir con HttpURLConnection (actual)

1. Solo copia las Activities (Paciente/Medico)
2. Usa el `MainActivity.kt` que ya tienes
3. (No necesitas las dependencias de Retrofit)

---

## 📝 Cambiar URL del backend:

En `RetrofitClient.kt` líneas 10-15:

```kotlin
private const val BASE_URL_EMULATOR = "http://10.0.2.2:3000/api/mobile/"
private const val BASE_URL_DEVICE = "http://192.168.1.X:3000/api/mobile/" 
private const val BASE_URL_PRODUCTION = "https://tu-app.onrender.com/api/mobile/"

// Cambiar aquí según necesites:
private const val BASE_URL = BASE_URL_EMULATOR
```

---

## ✅ Estructura final del proyecto:

```
app/src/main/java/com/example/smartflow/
├── MainActivity.kt
├── PacienteHomeActivity.kt
├── MedicoHomeActivity.kt
└── data/
    ├── api/
    │   ├── ApiService.kt
    │   └── RetrofitClient.kt
    └── models/
        ├── ApiModels.kt
        └── RequestModels.kt
```

¿Quieres que te ayude con algo más?
