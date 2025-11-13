package com.example.smartflow

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class PacienteHomeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_paciente_home)

        val tvWelcome = findViewById<TextView>(R.id.tv_welcome)
        val btnBuscarMedicos = findViewById<Button>(R.id.btn_buscar_medicos)
        val btnMisCitas = findViewById<Button>(R.id.btn_mis_citas)
        val btnPerfil = findViewById<Button>(R.id.btn_perfil)
        val btnCerrarSesion = findViewById<Button>(R.id.btn_cerrar_sesion)

        // Obtener nombre del usuario desde SharedPreferences (opcional)
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        val token = prefs.getString("jwt_token", null)
        
        tvWelcome.text = "Bienvenido Paciente"

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
            // Limpiar token y volver al login
            prefs.edit().clear().apply()
            val intent = Intent(this, MainActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        }
    }
}
