package com.example.smartflow

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import coil.load
import coil.transform.CircleCropTransformation
import com.example.smartflow.adapters.CitasCardAdapter
import com.example.smartflow.adapters.TurnosCardAdapter
import com.example.smartflow.data.api.RetrofitClient
import com.example.smartflow.data.models.CitasResponse
import com.example.smartflow.data.models.ResumenTurnosResponse
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.firebase.auth.FirebaseAuth
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class PacienteHomeActivity : AppCompatActivity() {

    private lateinit var googleClient: GoogleSignInClient
    private lateinit var auth: FirebaseAuth
    private lateinit var citasAdapter: CitasCardAdapter
    private lateinit var turnosAdapter: TurnosCardAdapter
    private lateinit var rvCitas: RecyclerView
    private lateinit var rvTurnos: RecyclerView
    private lateinit var tvNoCitas: TextView
    private lateinit var tvNoTurnos: TextView

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
        val ivUserPhoto = findViewById<ImageView>(R.id.iv_user_photo)
        val btnNotifications = findViewById<ImageButton>(R.id.btn_notifications)
        val btnLogoutHeader = findViewById<ImageButton>(R.id.btn_logout_header)
        val bottomNavigation = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        rvCitas = findViewById(R.id.rv_citas)
        rvTurnos = findViewById(R.id.rv_turnos)
        tvNoCitas = findViewById(R.id.tv_no_citas)
        tvNoTurnos = findViewById(R.id.tv_no_turnos)

        // Configurar RecyclerView de Citas (horizontal)
        citasAdapter = CitasCardAdapter(emptyList()) { cita ->
            Toast.makeText(this, "Cita con ${cita.medico.nombre}", Toast.LENGTH_SHORT).show()
        }
        rvCitas.apply {
            layoutManager = LinearLayoutManager(this@PacienteHomeActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = citasAdapter
        }

        // Configurar RecyclerView de Turnos (horizontal)
        turnosAdapter = TurnosCardAdapter(emptyList()) { turno ->
            Toast.makeText(this, "Turno en ${turno.especialidad.nombre}", Toast.LENGTH_SHORT).show()
            // TODO: Abrir pantalla para tomar turno
        }
        rvTurnos.apply {
            layoutManager = LinearLayoutManager(this@PacienteHomeActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = turnosAdapter
        }

        // Deshabilitar tint en los iconos para que se vean con sus colores originales
        bottomNavigation.itemIconTintList = null

        // Obtener datos del usuario desde SharedPreferences
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        val token = prefs.getString("jwt_token", null)
        val userNombre = prefs.getString("user_nombre", "Paciente")
        val userId = prefs.getString("user_id", null)
        val userFoto = prefs.getString("user_foto", null)
        
        tvWelcome.text = userNombre ?: "Paciente"

        // Cargar foto de perfil del usuario
        if (!userFoto.isNullOrEmpty()) {
            ivUserPhoto.load(userFoto) {
                crossfade(true)
                placeholder(R.drawable.ic_launcher_foreground)
                error(R.drawable.ic_launcher_foreground)
                transformations(CircleCropTransformation())
            }
        }

        // Click en notificaciones
        btnNotifications.setOnClickListener {
            Toast.makeText(this, "Notificaciones próximamente", Toast.LENGTH_SHORT).show()
        }

        // Cargar datos
        if (userId != null) {
            cargarCitasProximas(userId)
            cargarTurnosDisponibles()
        } else {
            Toast.makeText(this, "Error: No se encontró el ID del usuario", Toast.LENGTH_SHORT).show()
        }

        // Bottom Navigation Listener
        bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_home -> {
                    Toast.makeText(this, "Inicio", Toast.LENGTH_SHORT).show()
                    true
                }
                R.id.nav_search -> {
                    Toast.makeText(this, "Buscar médicos", Toast.LENGTH_SHORT).show()
                    // TODO: Navegar a búsqueda de médicos
                    true
                }
                R.id.nav_citas -> {
                    Toast.makeText(this, "Mis citas", Toast.LENGTH_SHORT).show()
                    // TODO: Navegar a mis citas
                    true
                }
                R.id.nav_perfil -> {
                    Toast.makeText(this, "Perfil", Toast.LENGTH_SHORT).show()
                    // TODO: Navegar a perfil
                    true
                }
                else -> false
            }
        }

        // Seleccionar Home por defecto
        bottomNavigation.selectedItemId = R.id.nav_home

        // Botón de logout en el header
        btnLogoutHeader.setOnClickListener {
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

    private fun cargarCitasProximas(userId: String) {
        val citasService = RetrofitClient.citasApiService
        
        citasService.getCitasProximas(userId).enqueue(object : Callback<CitasResponse> {
            override fun onResponse(call: Call<CitasResponse>, response: Response<CitasResponse>) {
                if (response.isSuccessful) {
                    val citasResponse = response.body()
                    if (citasResponse?.success == true) {
                        val citas = citasResponse.data
                        if (citas.isNotEmpty()) {
                            citasAdapter.updateCitas(citas)
                            rvCitas.visibility = View.VISIBLE
                            tvNoCitas.visibility = View.GONE
                        } else {
                            rvCitas.visibility = View.GONE
                            tvNoCitas.visibility = View.VISIBLE
                        }
                    } else {
                        Toast.makeText(
                            this@PacienteHomeActivity,
                            "Error: ${citasResponse?.message}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                } else {
                    Log.e("PacienteHome", "Error en respuesta: ${response.code()}")
                    Toast.makeText(
                        this@PacienteHomeActivity,
                        "Error al cargar citas",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }

            override fun onFailure(call: Call<CitasResponse>, t: Throwable) {
                Log.e("PacienteHome", "Error de red: ${t.message}", t)
                Toast.makeText(
                    this@PacienteHomeActivity,
                    "Error de conexión: ${t.message}",
                    Toast.LENGTH_SHORT
                ).show()
                rvCitas.visibility = View.GONE
                tvNoCitas.visibility = View.VISIBLE
            }
        })
    }

    private fun cargarTurnosDisponibles() {
        val turnosService = RetrofitClient.turnosApiService
        
        turnosService.getResumenTurnosHoy().enqueue(object : Callback<ResumenTurnosResponse> {
            override fun onResponse(call: Call<ResumenTurnosResponse>, response: Response<ResumenTurnosResponse>) {
                if (response.isSuccessful) {
                    val turnosResponse = response.body()
                    if (turnosResponse?.success == true) {
                        val turnos = turnosResponse.data
                        if (turnos.isNotEmpty()) {
                            turnosAdapter.updateTurnos(turnos)
                            rvTurnos.visibility = View.VISIBLE
                            tvNoTurnos.visibility = View.GONE
                        } else {
                            rvTurnos.visibility = View.GONE
                            tvNoTurnos.visibility = View.VISIBLE
                        }
                    }
                } else {
                    Log.e("PacienteHome", "Error al cargar turnos: ${response.code()}")
                    rvTurnos.visibility = View.GONE
                    tvNoTurnos.visibility = View.VISIBLE
                }
            }

            override fun onFailure(call: Call<ResumenTurnosResponse>, t: Throwable) {
                Log.e("PacienteHome", "Error de red turnos: ${t.message}", t)
                rvTurnos.visibility = View.GONE
                tvNoTurnos.visibility = View.VISIBLE
            }
        })
    }
}
