package com.example.smartflow

import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.widget.*
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.smartflow.data.api.RetrofitClient
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var googleClient: GoogleSignInClient

    // Usar la URL centralizada desde RetrofitClient
    private val BACKEND_URL = "${RetrofitClient.BACKEND_BASE_URL}/api/mobile"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        // Pre-cargar conexión al servidor en segundo plano
        preloadServerConnection()

        // Inicializar Firebase Auth
        auth = FirebaseAuth.getInstance()

        // Configurar Google Sign-In
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleClient = GoogleSignIn.getClient(this, gso)

        // Vistas
        val etEmail = findViewById<EditText>(R.id.et_email)
        val etPassword = findViewById<EditText>(R.id.et_password)
        val btnLogin = findViewById<Button>(R.id.btn_login)
        val btnRegister = findViewById<Button>(R.id.btn_register)
        val btnGoogle = findViewById<Button>(R.id.btn_google)

        // Login con credenciales
        btnLogin.setOnClickListener {
            val email = etEmail.text.toString().trim()
            val pass = etPassword.text.toString().trim()
            if (email.isEmpty() || pass.isEmpty()) {
                Toast.makeText(this, "Completa email y contraseña", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            loginWithCredentials(email, pass)
        }

        // Registro (ir a pantalla de registro)
        btnRegister.setOnClickListener {
            // TODO: Abrir Activity de registro completo
            Toast.makeText(this, "Abrir pantalla de registro", Toast.LENGTH_SHORT).show()
        }

        // Login con Google
        btnGoogle.setOnClickListener {
            val signInIntent = googleClient.signInIntent
            googleSignInLauncher.launch(signInIntent)
        }
    }

    // Launcher para Google Sign-In
    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(Exception::class.java)
            val idToken = account?.idToken
            if (idToken != null) {
                firebaseAuthWithGoogle(idToken)
            } else {
                Toast.makeText(this, "Error al obtener idToken de Google", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Google sign in failed", e)
            Toast.makeText(this, "Error con Google Sign-In", Toast.LENGTH_SHORT).show()
        }
    }

    // Autenticar con Firebase (solo para obtener el idToken fresco)
    private fun firebaseAuthWithGoogle(idToken: String) {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        auth.signInWithCredential(credential).addOnCompleteListener(this) { task ->
            if (task.isSuccessful) {
                // Obtener idToken fresco y enviarlo al backend
                auth.currentUser?.getIdToken(true)?.addOnCompleteListener { t ->
                    if (t.isSuccessful) {
                        val freshToken = t.result?.token
                        if (freshToken != null) {
                            // Primera llamada al backend (sin rol ni teléfono)
                            sendGoogleTokenToBackend(freshToken)
                        }
                    } else {
                        Toast.makeText(this, "Error al obtener token", Toast.LENGTH_SHORT).show()
                    }
                }
            } else {
                Toast.makeText(this, "Firebase auth failed: ${task.exception?.message}", Toast.LENGTH_LONG).show()
            }
        }
    }

    // Enviar Google idToken al backend (primera vez - sin datos extra)
    private fun sendGoogleTokenToBackend(idToken: String, rol: String? = null, telefono: String? = null, especialidad: String? = null, cedula: String? = null, password: String? = null) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("$BACKEND_URL/auth/google")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 10000
                conn.readTimeout = 10000

                // Construir JSON body
                val jsonBody = JSONObject().apply {
                    put("idToken", idToken)
                    if (rol != null) put("rol", rol)
                    if (telefono != null) put("telefono", telefono)
                    if (password != null) put("password", password)
                    if (rol == "medico" && especialidad != null && cedula != null) {
                        put("especialidad", especialidad)
                        put("cedulaProfesional", cedula)
                    }
                }

                conn.outputStream.use { os ->
                    os.write(jsonBody.toString().toByteArray())
                }

                val responseCode = conn.responseCode
                val responseBody = if (responseCode in 200..299) {
                    conn.inputStream.bufferedReader().use { it.readText() }
                } else {
                    conn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                }

                Log.d("MainActivity", "Backend response: $responseCode / $responseBody")

                withContext(Dispatchers.Main) {
                    handleGoogleLoginResponse(responseCode, responseBody, idToken)
                }

                conn.disconnect()
            } catch (e: Exception) {
                Log.e("MainActivity", "Error enviando token al backend", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "No se pudo conectar al backend", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    // Manejar respuesta del backend para Google login
    private fun handleGoogleLoginResponse(code: Int, response: String, idToken: String) {
        try {
            val json = JSONObject(response)

            when (code) {
                200 -> {
                    // Usuario ya existe - login exitoso
                    val success = json.getBoolean("success")
                    if (success) {
                        val token = json.getString("token")
                        val user = json.getJSONObject("user")
                        val rol = user.getString("rol")
                        val nombre = user.optString("nombre", "Usuario")
                        val foto = user.optString("foto", null)

                        // Guardar token, nombre y foto
                        saveToken(token)
                        saveUserData(nombre, foto)
                        navigateByRole(rol)
                    }
                }
                400 -> {
                    // Usuario no existe - requiere datos adicionales
                    val requiresUserType = json.optBoolean("requiresUserType", false)
                    val requiresPhone = json.optBoolean("requiresPhone", false)

                    if (requiresUserType || requiresPhone) {
                        // Mostrar diálogo para completar registro
                        showCompleteRegistrationDialog(idToken)
                    } else {
                        Toast.makeText(this, json.getString("message"), Toast.LENGTH_LONG).show()
                    }
                }
                else -> {
                    Toast.makeText(this, "Error: ${json.optString("message", "Error desconocido")}", Toast.LENGTH_LONG).show()
                }
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error parsing response", e)
            Toast.makeText(this, "Error procesando respuesta", Toast.LENGTH_SHORT).show()
        }
    }

    // Mostrar diálogo para completar registro (primera vez con Google)
    private fun showCompleteRegistrationDialog(idToken: String) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_complete_registration, null)
        val rgRole = dialogView.findViewById<RadioGroup>(R.id.rg_role)
        val rbPaciente = dialogView.findViewById<RadioButton>(R.id.rb_paciente)
        val rbMedico = dialogView.findViewById<RadioButton>(R.id.rb_medico)
        val etTelefono = dialogView.findViewById<EditText>(R.id.et_telefono)
        val etPasswordDialog = dialogView.findViewById<EditText>(R.id.et_password_dialog)
        val etPasswordConfirmDialog = dialogView.findViewById<EditText>(R.id.et_password_confirm_dialog)
        val tilEspecialidad = dialogView.findViewById<com.google.android.material.textfield.TextInputLayout>(R.id.til_especialidad)
        val etEspecialidad = dialogView.findViewById<AutoCompleteTextView>(R.id.et_especialidad)
        val tilCedula = dialogView.findViewById<com.google.android.material.textfield.TextInputLayout>(R.id.til_cedula)
        val etCedula = dialogView.findViewById<EditText>(R.id.et_cedula)
        val btnConfirm = dialogView.findViewById<Button>(R.id.btn_confirm)

        // Lista de especialidades médicas
        val especialidades = arrayOf(
            "Medicina General",
            "Cardiología",
            "Dermatología",
            "Pediatría",
            "Ginecología",
            "Oftalmología",
            "Traumatología",
            "Psiquiatría",
            "Neurología",
            "Endocrinología",
            "Gastroenterología",
            "Urología"
        )
        
        val adapter = android.widget.ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, especialidades)
        etEspecialidad.setAdapter(adapter)

        // Mostrar/ocultar campos de médico según rol
        rgRole.setOnCheckedChangeListener { _, checkedId ->
            when (checkedId) {
                R.id.rb_medico -> {
                    tilEspecialidad.visibility = android.view.View.VISIBLE
                    tilCedula.visibility = android.view.View.VISIBLE
                }
                R.id.rb_paciente -> {
                    tilEspecialidad.visibility = android.view.View.GONE
                    tilCedula.visibility = android.view.View.GONE
                }
            }
        }

        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .setCancelable(false)
            .create()

        btnConfirm.setOnClickListener {
            val telefono = etTelefono.text.toString().trim()
            val password = etPasswordDialog.text.toString().trim()
            val passwordConfirm = etPasswordConfirmDialog.text.toString().trim()
            val selectedRoleId = rgRole.checkedRadioButtonId

            if (selectedRoleId == -1) {
                Toast.makeText(this, "Selecciona un tipo de cuenta", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (telefono.isEmpty()) {
                Toast.makeText(this, "Ingresa tu teléfono", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Validar formato de teléfono (10 dígitos)
            if (!telefono.matches(Regex("^\\d{10}$"))) {
                Toast.makeText(this, "El teléfono debe tener exactamente 10 dígitos", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (password.isEmpty()) {
                Toast.makeText(this, "Ingresa una contraseña", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (password.length < 6) {
                Toast.makeText(this, "La contraseña debe tener al menos 6 caracteres", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (passwordConfirm.isEmpty()) {
                Toast.makeText(this, "Confirma tu contraseña", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Validar que las contraseñas coincidan
            if (password != passwordConfirm) {
                Toast.makeText(this, "Las contraseñas no coinciden", Toast.LENGTH_LONG).show()
                return@setOnClickListener
            }

            val rol = when (selectedRoleId) {
                R.id.rb_paciente -> "paciente"
                R.id.rb_medico -> "medico"
                else -> null
            }

            var especialidad: String? = null
            var cedula: String? = null
            if (rol == "medico") {
                especialidad = etEspecialidad.text.toString().trim()
                cedula = etCedula.text.toString().trim()

                if (especialidad.isEmpty()) {
                    Toast.makeText(this, "Selecciona tu especialidad médica", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }

                if (cedula.isEmpty()) {
                    Toast.makeText(this, "Ingresa tu cédula profesional", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }

                // Validar formato de cédula (7-8 dígitos)
                if (!cedula.matches(Regex("^\\d{7,8}$"))) {
                    Toast.makeText(this, "La cédula debe tener entre 7 y 8 dígitos", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }
            }

            dialog.dismiss()

            // Reenviar al backend con datos completos (incluyendo password)
            sendGoogleTokenToBackend(idToken, rol, telefono, especialidad, cedula, password)
        }

        dialog.show()
    }

    // Login con credenciales (email/password) - DIRECTO AL BACKEND
    private fun loginWithCredentials(email: String, password: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("$BACKEND_URL/auth/login")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 10000
                conn.readTimeout = 10000

                val jsonBody = JSONObject().apply {
                    put("email", email)
                    put("password", password)
                }

                conn.outputStream.use { os ->
                    os.write(jsonBody.toString().toByteArray())
                }

                val responseCode = conn.responseCode
                val responseBody = if (responseCode in 200..299) {
                    conn.inputStream.bufferedReader().use { it.readText() }
                } else {
                    conn.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                }

                Log.d("MainActivity", "Login response: $responseCode / $responseBody")

                withContext(Dispatchers.Main) {
                    handleLoginResponse(responseCode, responseBody)
                }

                conn.disconnect()
            } catch (e: Exception) {
                Log.e("MainActivity", "Error en login", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Error de conexión", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    // Manejar respuesta del login con credenciales
    private fun handleLoginResponse(code: Int, response: String) {
        try {
            val json = JSONObject(response)

            when (code) {
                200 -> {
                    val success = json.getBoolean("success")
                    if (success) {
                        val token = json.getString("token")
                        val user = json.getJSONObject("user")
                        val rol = user.getString("rol")
                        val nombre = user.optString("nombre", "Usuario")
                        val foto = user.optString("foto", null)

                        saveToken(token)
                        saveUserData(nombre, foto)
                        navigateByRole(rol)
                    }
                }
                401 -> {
                    Toast.makeText(this, json.getString("message"), Toast.LENGTH_LONG).show()
                }
                else -> {
                    Toast.makeText(this, "Error: ${json.optString("message", "Error desconocido")}", Toast.LENGTH_LONG).show()
                }
            }
        } catch (e: Exception) {
            Log.e("MainActivity", "Error parsing login response", e)
            Toast.makeText(this, "Error procesando respuesta", Toast.LENGTH_SHORT).show()
        }
    }

    // Guardar token en SharedPreferences
    private fun saveToken(token: String) {
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        prefs.edit().putString("jwt_token", token).apply()
        Log.d("MainActivity", "Token guardado")
    }

    // Guardar datos del usuario (nombre y foto)
    private fun saveUserData(nombre: String, foto: String?) {
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        prefs.edit().apply {
            putString("user_nombre", nombre)
            if (foto != null) {
                putString("user_foto", foto)
            }
            apply()
        }
        Log.d("MainActivity", "Datos de usuario guardados: $nombre")
    }

    // Navegar según rol del usuario
    private fun navigateByRole(rol: String) {
        val intent = when (rol) {
            "paciente" -> Intent(this, PacienteHomeActivity::class.java)
            "medico" -> Intent(this, MedicoHomeActivity::class.java)
            else -> {
                Toast.makeText(this, "Rol desconocido: $rol", Toast.LENGTH_SHORT).show()
                return
            }
        }
        
        startActivity(intent)
        finish()
    }

    // Pre-cargar conexión al servidor para reducir latencia
    private fun preloadServerConnection() {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val url = URL("$BACKEND_URL/auth/health")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "GET"
                conn.connectTimeout = 3000
                conn.readTimeout = 3000
                
                val responseCode = conn.responseCode
                Log.d("MainActivity", "Servidor conectado: $responseCode")
                
                conn.disconnect()
            } catch (e: Exception) {
                Log.w("MainActivity", "Pre-carga de conexión falló: ${e.message}")
            }
        }
    }
}
