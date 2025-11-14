package com.example.smartflow

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import coil.load
import coil.transform.CircleCropTransformation
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.auth.FirebaseAuth

class PacienteHomeActivity : AppCompatActivity() {

    private lateinit var googleClient: GoogleSignInClient
    private lateinit var auth: FirebaseAuth

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_paciente_home)

        // Inicializar Firebase y Google Sign-In
        auth = FirebaseAuth.getInstance()
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleClient = GoogleSignIn.getClient(this, gso)

        val tvWelcome = findViewById<TextView>(R.id.tv_welcome)
        val btnBuscarMedicos = findViewById<Button>(R.id.btn_buscar_medicos)
        val btnMisCitas = findViewById<Button>(R.id.btn_mis_citas)
        val btnPerfil = findViewById<Button>(R.id.btn_perfil)
        val btnCerrarSesion = findViewById<Button>(R.id.btn_cerrar_sesion)

        // Obtener datos del usuario desde SharedPreferences
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        val token = prefs.getString("jwt_token", null)
        val userNombre = prefs.getString("user_nombre", "Paciente")
        val userFoto = prefs.getString("user_foto", null)
        
        tvWelcome.text = "Bienvenido $userNombre"

        // EJEMPLO: Cargar foto del usuario si existe
        // Agrega un ImageView con id="iv_user_photo" en el layout
        // y descomenta este código:
        /*
        val ivUserPhoto = findViewById<ImageView>(R.id.iv_user_photo)
        if (!userFoto.isNullOrEmpty()) {
            ivUserPhoto.load(userFoto) {
                crossfade(true)
                placeholder(R.drawable.ic_launcher_foreground) // imagen mientras carga
                error(R.drawable.ic_launcher_foreground) // imagen si falla
                transformations(CircleCropTransformation()) // recortar en círculo
            }
        }
        */

        btnBuscarMedicos.setOnClickListener {
            Toast.makeText(this, "Buscar médicos - Próximamente", Toast.LENGTH_SHORT).show()
            // TODO: Implementar búsqueda de médicos
        }

        btnMisCitas.setOnClickListener {
            Toast.makeText(this, "Mis citas - Próximamente", Toast.LENGTH_SHORT).show()
            // TODO: Implementar vista de citas del paciente
        }

        btnPerfil.setOnClickListener {
            Toast.makeText(this, "Mi perfil - Próximamente", Toast.LENGTH_SHORT).show()
            // TODO: Implementar perfil del usuario
        }

        btnCerrarSesion.setOnClickListener {
            // Cerrar sesión de Firebase
            auth.signOut()
            
            // Cerrar sesión de Google y limpiar caché
            googleClient.signOut().addOnCompleteListener(this) {
                // Limpiar SharedPreferences
                prefs.edit().clear().apply()
                
                // Limpiar caché de la app
                try {
                    val cache = cacheDir
                    cache.deleteRecursively()
                } catch (e: Exception) {
                    e.printStackTrace()
                }
                
                // Volver al login
                val intent = Intent(this, MainActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish()
            }
        }
    }
}
