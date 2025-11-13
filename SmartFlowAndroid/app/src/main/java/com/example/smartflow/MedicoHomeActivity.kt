package com.example.smartflow

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MedicoHomeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_medico_home)

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
            // Limpiar token y volver al login
            prefs.edit().clear().apply()
            val intent = Intent(this, MainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        }
    }
}
