package com.example.smartflow

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.auth.FirebaseAuth

class MedicoHomeActivity : AppCompatActivity() {

    private lateinit var googleClient: GoogleSignInClient
    private lateinit var auth: FirebaseAuth

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_medico_home)

        // Inicializar Firebase y Google Sign-In
        auth = FirebaseAuth.getInstance()
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(getString(R.string.default_web_client_id))
            .requestEmail()
            .build()
        googleClient = GoogleSignIn.getClient(this, gso)

        val tvWelcome = findViewById<TextView>(R.id.tv_welcome)
        val btnMisHorarios = findViewById<Button>(R.id.btn_mis_horarios)
        val btnMisCitas = findViewById<Button>(R.id.btn_mis_citas)
        val btnPerfil = findViewById<Button>(R.id.btn_perfil)
        val btnCerrarSesion = findViewById<Button>(R.id.btn_cerrar_sesion)

        // Obtener datos del usuario
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        val token = prefs.getString("jwt_token", null)

        tvWelcome.text = "Bienvenido Dr(a)."

        btnMisHorarios.setOnClickListener {
            Toast.makeText(this, "Configurar horarios - Próximamente", Toast.LENGTH_SHORT).show()
            // TODO: Implementar configuración de horarios disponibles
        }

        btnMisCitas.setOnClickListener {
            Toast.makeText(this, "Mis consultas - Próximamente", Toast.LENGTH_SHORT).show()
            // TODO: Implementar vista de citas del médico
        }

        btnPerfil.setOnClickListener {
            Toast.makeText(this, "Mi perfil profesional - Próximamente", Toast.LENGTH_SHORT).show()
            // TODO: Implementar perfil del médico (especialidades, tarifa, etc.)
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
