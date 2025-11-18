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
import com.example.smartflow.adapters.FilaVirtualAdapter
import com.example.smartflow.adapters.HorariosDisponiblesAdapter
import com.example.smartflow.data.api.RetrofitClient
import com.example.smartflow.data.models.Cita
import com.example.smartflow.data.models.CitasResponse
import com.example.smartflow.data.models.ResumenTurno
import com.example.smartflow.data.models.ResumenTurnosResponse
import com.example.smartflow.data.models.CitasHoyResponse
import com.example.smartflow.data.models.CitasPorHora
import com.example.smartflow.data.models.CitaHoy
import com.example.smartflow.data.models.HorariosDisponiblesResponse
import com.example.smartflow.data.models.MedicoHorarios
import com.example.smartflow.data.models.EspecialidadResponse
import com.example.smartflow.data.models.EspecialidadData
import android.widget.LinearLayout
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
    private lateinit var filaVirtualAdapter: FilaVirtualAdapter
    private lateinit var horariosAdapter: HorariosDisponiblesAdapter
    private lateinit var rvCitas: RecyclerView
    private lateinit var rvTurnos: RecyclerView
    private lateinit var rvFilaVirtual: RecyclerView
    private lateinit var tvNoCitas: TextView
    private lateinit var tvNoTurnos: TextView
    private lateinit var tvNoFila: TextView
    private lateinit var bottomNavigation: BottomNavigationView
    
    // Contenedores de filtros
    private lateinit var llFiltrosCitas: LinearLayout
    private lateinit var llFiltrosTurnos: LinearLayout
    private lateinit var llFiltrosFila: LinearLayout
    
    // Lista de especialidades desde BD
    private var especialidades: List<EspecialidadData> = emptyList()

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
        bottomNavigation = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        rvCitas = findViewById(R.id.rv_citas)
        rvTurnos = findViewById(R.id.rv_turnos)
        rvFilaVirtual = findViewById(R.id.rv_fila_virtual)
        tvNoCitas = findViewById(R.id.tv_no_citas)
        tvNoTurnos = findViewById(R.id.tv_no_turnos)
        tvNoFila = findViewById(R.id.tv_no_fila)
        
        // Inicializar contenedores de filtros
        llFiltrosCitas = findViewById(R.id.ll_filtros_citas)
        llFiltrosTurnos = findViewById(R.id.ll_filtros_turnos)
        llFiltrosFila = findViewById(R.id.ll_filtros_fila)

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

        // Configurar RecyclerView de Horarios Disponibles (horizontal)
        horariosAdapter = HorariosDisponiblesAdapter(emptyList()) { medicoId, horario ->
            Toast.makeText(this, "Tomar turno: $horario", Toast.LENGTH_SHORT).show()
            // TODO: Abrir TomarTurnoActivity con medicoId y horario
        }
        rvTurnos.apply {
            layoutManager = LinearLayoutManager(this@PacienteHomeActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = horariosAdapter
        }

        // Configurar RecyclerView de Fila Virtual (horizontal)
        filaVirtualAdapter = FilaVirtualAdapter(emptyList())
        rvFilaVirtual.apply {
            layoutManager = LinearLayoutManager(this@PacienteHomeActivity, LinearLayoutManager.HORIZONTAL, false)
            adapter = filaVirtualAdapter
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

        // Cargar especialidades primero, luego configurar filtros
        cargarEspecialidades()

        // Cargar datos
        if (userId != null) {
            cargarCitasProximas(userId)
            cargarHorariosDisponibles()
            cargarFilaVirtualHoy()
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

    private fun cargarEspecialidades() {
        val especialidadesService = RetrofitClient.especialidadesApiService
        
        especialidadesService.getEspecialidades().enqueue(object : Callback<EspecialidadResponse> {
            override fun onResponse(call: Call<EspecialidadResponse>, response: Response<EspecialidadResponse>) {
                if (response.isSuccessful) {
                    val especialidadesResponse = response.body()
                    if (especialidadesResponse?.success == true) {
                        especialidades = especialidadesResponse.data
                        // Generar chips dinámicamente para las 3 secciones
                        generarChipsFiltros()
                    } else {
                        Log.e("PacienteHome", "Error al cargar especialidades")
                    }
                } else {
                    Log.e("PacienteHome", "Error en respuesta especialidades: ${response.code()}")
                }
            }

            override fun onFailure(call: Call<EspecialidadResponse>, t: Throwable) {
                Log.e("PacienteHome", "Error de red especialidades: ${t.message}", t)
            }
        })
    }

    private fun generarChipsFiltros() {
        // Generar chips para Mis Citas
        generarChipsParaSeccion(llFiltrosCitas, "citas")
        // Generar chips para Turnos
        generarChipsParaSeccion(llFiltrosTurnos, "turnos")
        // Generar chips para Fila Virtual
        generarChipsParaSeccion(llFiltrosFila, "fila")
    }

    private fun generarChipsParaSeccion(container: LinearLayout, seccion: String) {
        container.removeAllViews()
        
        // Chip "Todas"
        val chipTodas = TextView(this).apply {
            text = "Todas"
            textSize = 14f
            setTextColor(resources.getColorStateList(R.color.chip_text_color, null))
            background = resources.getDrawable(R.drawable.chip_selector, null)
            minHeight = resources.getDimensionPixelSize(R.dimen.chip_min_height)
            gravity = android.view.Gravity.CENTER_VERTICAL
            setPadding(32, 12, 32, 12)
            isClickable = true
            isFocusable = true
            isSelected = true // Seleccionado por defecto
            
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            params.marginEnd = 24
            layoutParams = params
            
            setOnClickListener {
                seleccionarChip(container, this, null, seccion)
            }
        }
        container.addView(chipTodas)
        
        // Chips de especialidades
        especialidades.forEach { especialidad ->
            val chip = TextView(this).apply {
                text = especialidad.nombre
                tag = especialidad._id // Guardar ID para filtrar
                textSize = 14f
                setTextColor(resources.getColorStateList(R.color.chip_text_color, null))
                background = resources.getDrawable(R.drawable.chip_selector, null)
                minHeight = resources.getDimensionPixelSize(R.dimen.chip_min_height)
                gravity = android.view.Gravity.CENTER_VERTICAL
                setPadding(32, 12, 32, 12)
                isClickable = true
                isFocusable = true
                
                val params = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                params.marginEnd = 24
                layoutParams = params
                
                setOnClickListener {
                    seleccionarChip(container, this, especialidad.nombre, seccion)
                }
            }
            container.addView(chip)
        }
    }

    private fun seleccionarChip(container: LinearLayout, chipSeleccionado: TextView, filtro: String?, seccion: String) {
        // Deseleccionar todos
        for (i in 0 until container.childCount) {
            val child = container.getChildAt(i)
            if (child is TextView) {
                child.isSelected = false
            }
        }
        
        // Seleccionar el clickeado
        chipSeleccionado.isSelected = true
        
        // Aplicar filtro según sección
        when (seccion) {
            "citas" -> filtrarCitas(filtro)
            "turnos" -> filtrarTurnos(filtro)
            "fila" -> filtrarFilaVirtual(filtro)
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
                        todasLasCitas = citas // Guardar para filtros
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

    private var todasLasCitas: List<Cita> = emptyList()
    private var todosLosTurnos: List<ResumenTurno> = emptyList()
    private var todasLasCitasHoy: List<CitaHoy> = emptyList()
    private var todosLosHorarios: List<MedicoHorarios> = emptyList()

    private fun filtrarCitas(especialidad: String?) {
        val citasFiltradas = if (especialidad == null) {
            todasLasCitas
        } else {
            todasLasCitas.filter { it.medico.especialidad == especialidad }
        }
        citasAdapter.updateCitas(citasFiltradas)
    }

    private fun filtrarTurnos(especialidad: String?) {
        val turnosFiltrados = if (especialidad == null) {
            todosLosTurnos
        } else {
            todosLosTurnos.filter { it.especialidad.nombre == especialidad }
        }
        turnosAdapter.updateTurnos(turnosFiltrados)
    }

    private fun cargarHorariosDisponibles(especialidadId: String? = null, medicoId: String? = null) {
        val turnosService = RetrofitClient.turnosApiService
        
        turnosService.getHorariosDisponibles(especialidadId, medicoId).enqueue(object : Callback<HorariosDisponiblesResponse> {
            override fun onResponse(call: Call<HorariosDisponiblesResponse>, response: Response<HorariosDisponiblesResponse>) {
                if (response.isSuccessful) {
                    val horariosResponse = response.body()
                    if (horariosResponse?.success == true) {
                        val horarios = horariosResponse.data
                        todosLosHorarios = horarios
                        
                        if (horarios.isNotEmpty()) {
                            horariosAdapter.updateHorarios(horarios)
                            rvTurnos.visibility = View.VISIBLE
                            tvNoTurnos.visibility = View.GONE
                        } else {
                            rvTurnos.visibility = View.GONE
                            tvNoTurnos.visibility = View.VISIBLE
                        }
                    }
                } else {
                    Log.e("PacienteHome", "Error al cargar horarios: ${response.code()}")
                    rvTurnos.visibility = View.GONE
                    tvNoTurnos.visibility = View.VISIBLE
                }
            }

            override fun onFailure(call: Call<HorariosDisponiblesResponse>, t: Throwable) {
                Log.e("PacienteHome", "Error de red horarios: ${t.message}", t)
                rvTurnos.visibility = View.GONE
                tvNoTurnos.visibility = View.VISIBLE
            }
        })
    }

    private fun cargarFilaVirtualHoy(especialidadId: String? = null, medicoId: String? = null) {
        val citasService = RetrofitClient.citasApiService
        
        citasService.getCitasHoy(especialidadId, medicoId).enqueue(object : Callback<CitasHoyResponse> {
            override fun onResponse(call: Call<CitasHoyResponse>, response: Response<CitasHoyResponse>) {
                if (response.isSuccessful) {
                    val citasResponse = response.body()
                    if (citasResponse?.success == true) {
                        // Aplanar las citas agrupadas por hora en una lista simple
                        val citasAplanadas = citasResponse.data.flatMap { it.citas }
                        todasLasCitasHoy = citasAplanadas
                        
                        if (citasAplanadas.isNotEmpty()) {
                            filaVirtualAdapter.updateCitas(citasAplanadas)
                            rvFilaVirtual.visibility = View.VISIBLE
                            tvNoFila.visibility = View.GONE
                        } else {
                            rvFilaVirtual.visibility = View.GONE
                            tvNoFila.visibility = View.VISIBLE
                        }
                    }
                } else {
                    Log.e("PacienteHome", "Error al cargar fila virtual: ${response.code()}")
                    rvFilaVirtual.visibility = View.GONE
                    tvNoFila.visibility = View.VISIBLE
                }
            }

            override fun onFailure(call: Call<CitasHoyResponse>, t: Throwable) {
                Log.e("PacienteHome", "Error de red fila virtual: ${t.message}", t)
                rvFilaVirtual.visibility = View.GONE
                tvNoFila.visibility = View.VISIBLE
            }
        })
    }

    private fun filtrarFilaVirtual(especialidad: String?) {
        val citasFiltradas = if (especialidad == null) {
            todasLasCitasHoy
        } else {
            todasLasCitasHoy.filter { cita ->
                cita.medico.especialidad == especialidad
            }
        }
        
        if (citasFiltradas.isNotEmpty()) {
            filaVirtualAdapter.updateCitas(citasFiltradas)
            rvFilaVirtual.visibility = View.VISIBLE
            tvNoFila.visibility = View.GONE
        } else {
            rvFilaVirtual.visibility = View.GONE
            tvNoFila.visibility = View.VISIBLE
        }
    }
}
