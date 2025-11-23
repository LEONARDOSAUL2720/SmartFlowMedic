package com.example.smartflow

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.smartflow.data.api.RetrofitClient
import com.example.smartflow.data.models.CrearCitaRequest
import com.example.smartflow.data.models.CrearCitaResponse
import com.google.android.material.button.MaterialButton
import com.google.android.material.appbar.MaterialToolbar

class GenerarCitaActivity : AppCompatActivity() {
    private lateinit var step1Circle: View
    private lateinit var step2Circle: View
    private lateinit var step3Circle: View
    private lateinit var step4Circle: View

    private lateinit var toolbar: MaterialToolbar
    private lateinit var btnAnterior: MaterialButton
    private lateinit var btnSiguiente: MaterialButton
    private lateinit var stepContainer: android.widget.FrameLayout

    // Step actual
    private var currentStep = 1
    private val totalSteps = 4

    // Datos seleccionados
    private var especialidadId: String? = null
    private var especialidadNombre: String? = null
    private var medicoSeleccionado: com.example.smartflow.data.models.MedicoData? = null
    private var fechaSeleccionada: String? = null
    private var horaSeleccionada: String? = null
    private var motivo: String? = null
    private var modoPago: String = "efectivo"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_generar_cita)

        // Inicializa los círculos de los pasos DESPUÉS de setContentView
        step1Circle = findViewById(R.id.step_1_circle)
        step2Circle = findViewById(R.id.step_2_circle)
        step3Circle = findViewById(R.id.step_3_circle)
        step4Circle = findViewById(R.id.step_4_circle)

        toolbar = findViewById(R.id.toolbar)
        btnAnterior = findViewById(R.id.btn_anterior)
        btnSiguiente = findViewById(R.id.btn_siguiente)
        stepContainer = findViewById(R.id.step_container)

        toolbar.setNavigationOnClickListener { finish() }

        btnAnterior.setOnClickListener {
            if (currentStep > 1) {
                currentStep--
                showStep(currentStep)
            }
        }

        btnSiguiente.setOnClickListener {
            if (currentStep < totalSteps) {
                if (validateStep(currentStep)) {
                    currentStep++
                    showStep(currentStep)
                }
            } else if (currentStep == totalSteps) {
                if (validateStep(currentStep)) {
                    crearCita()
                }
            }
        }

        showStep(currentStep)
        updateStepIndicator(currentStep)
    }

    private fun showStep(step: Int) {
        stepContainer.removeAllViews()
        when (step) {
            1 -> inflateStep1()  // Especialidad
            2 -> inflateStep2()  // Médico
            3 -> inflateStep3()  // Fecha y Hora (ya combinados)
            4 -> inflateStep4()  // Confirmar
        }
        btnAnterior.visibility = if (step == 1) View.GONE else View.VISIBLE
        btnSiguiente.text = if (step == totalSteps) "Confirmar" else "Siguiente"
        updateStepIndicator(step)
    }

    private fun updateStepIndicator(step: Int) {
        val active = R.drawable.circle_step_active
        val inactive = R.drawable.circle_step_inactive
        step1Circle.setBackgroundResource(if (step == 1) active else inactive)
        step2Circle.setBackgroundResource(if (step == 2) active else inactive)
        step3Circle.setBackgroundResource(if (step == 3) active else inactive)
        step4Circle.setBackgroundResource(if (step == 4) active else inactive)
    }

    // Step 1: Especialidad
    private fun inflateStep1() {
        val view = layoutInflater.inflate(R.layout.step_1_especialidad, stepContainer, false)
        val rvEspecialidades =
            view.findViewById<androidx.recyclerview.widget.RecyclerView>(R.id.rv_especialidades)
        val tvNoEspecialidades =
            view.findViewById<android.widget.TextView>(R.id.tv_no_especialidades)
        val progressBar =
            view.findViewById<android.widget.ProgressBar>(R.id.progress_especialidades)

        val adapter =
            com.example.smartflow.adapters.EspecialidadesAdapter(emptyList()) { especialidad ->
                especialidadId = especialidad._id
                especialidadNombre = especialidad.nombre
                Toast.makeText(
                    this,
                    "Especialidad seleccionada: ${especialidad.nombre}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        rvEspecialidades.adapter = adapter

        progressBar.visibility = View.VISIBLE
        rvEspecialidades.visibility = View.GONE
        tvNoEspecialidades.visibility = View.GONE

        val apiService = com.example.smartflow.data.api.RetrofitClient.especialidadesApiService
        apiService.getEspecialidades().enqueue(object :
            retrofit2.Callback<com.example.smartflow.data.models.EspecialidadResponse> {
            override fun onResponse(
                call: retrofit2.Call<com.example.smartflow.data.models.EspecialidadResponse>,
                response: retrofit2.Response<com.example.smartflow.data.models.EspecialidadResponse>
            ) {
                progressBar.visibility = View.GONE
                if (response.isSuccessful && response.body()?.success == true) {
                    val especialidades = response.body()?.data ?: emptyList()
                    if (especialidades.isNotEmpty()) {
                        adapter.updateEspecialidades(especialidades)
                        rvEspecialidades.visibility = View.VISIBLE
                        tvNoEspecialidades.visibility = View.GONE
                    } else {
                        rvEspecialidades.visibility = View.GONE
                        tvNoEspecialidades.visibility = View.VISIBLE
                    }
                } else {
                    rvEspecialidades.visibility = View.GONE
                    tvNoEspecialidades.visibility = View.VISIBLE
                    Toast.makeText(
                        this@GenerarCitaActivity,
                        "Error al cargar especialidades",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }

            override fun onFailure(
                call: retrofit2.Call<com.example.smartflow.data.models.EspecialidadResponse>,
                t: Throwable
            ) {
                progressBar.visibility = View.GONE
                rvEspecialidades.visibility = View.GONE
                tvNoEspecialidades.visibility = View.VISIBLE
                Toast.makeText(
                    this@GenerarCitaActivity,
                    "Error de red: ${t.message}",
                    Toast.LENGTH_SHORT
                ).show()
            }
        })

        stepContainer.addView(view)
    }

    // Step 2: Médico
    private fun inflateStep2() {
        val view = layoutInflater.inflate(R.layout.step_2_medico, stepContainer, false)
        val rvMedicos =
            view.findViewById<androidx.recyclerview.widget.RecyclerView>(R.id.rv_medicos)
        val tvNoMedicos = view.findViewById<android.widget.TextView>(R.id.tv_no_medicos)
        val tvEspecialidad =
            view.findViewById<android.widget.TextView>(R.id.tv_especialidad_seleccionada)
        val etBuscar = view.findViewById<android.widget.EditText>(R.id.et_buscar_medico)
        tvEspecialidad.text = "Especialidad: ${especialidadNombre ?: "-"}"

        medicoSeleccionado = null
        rvMedicos.visibility = View.GONE
        tvNoMedicos.visibility = View.GONE

        val apiService = com.example.smartflow.data.api.RetrofitClient.medicosApiService
        apiService.getMedicosPorEspecialidad(especialidadId ?: "").enqueue(object :
            retrofit2.Callback<com.example.smartflow.data.models.MedicosResponse> {
            override fun onResponse(
                call: retrofit2.Call<com.example.smartflow.data.models.MedicosResponse>,
                response: retrofit2.Response<com.example.smartflow.data.models.MedicosResponse>
            ) {
                if (response.isSuccessful && response.body()?.success == true) {
                    val medicos = response.body()?.data ?: emptyList()
                    if (medicos.isNotEmpty()) {
                        val listaOriginal = medicos
                        val adapter =
                            com.example.smartflow.adapters.MedicosGenerarCitaAdapter(listaOriginal) { medico ->
                                medicoSeleccionado = medico
                            }
                        rvMedicos.adapter = adapter
                        rvMedicos.visibility = View.VISIBLE
                        tvNoMedicos.visibility = View.GONE

                        etBuscar.addTextChangedListener(object : android.text.TextWatcher {
                            override fun beforeTextChanged(
                                s: CharSequence?,
                                start: Int,
                                count: Int,
                                after: Int
                            ) {
                            }

                            override fun onTextChanged(
                                s: CharSequence?,
                                start: Int,
                                before: Int,
                                count: Int
                            ) {
                            }

                            override fun afterTextChanged(s: android.text.Editable?) {
                                val filtro = s?.toString()?.trim()?.lowercase() ?: ""
                                if (filtro.isEmpty()) {
                                    adapter.updateMedicos(listaOriginal)
                                    rvMedicos.visibility = View.VISIBLE
                                    tvNoMedicos.visibility = View.GONE
                                } else {
                                    val filtrados = listaOriginal.filter {
                                        (it.nombre ?: "").lowercase().contains(filtro) ||
                                                (it.apellido ?: "").lowercase().contains(filtro)
                                    }
                                    adapter.updateMedicos(filtrados)
                                    if (filtrados.isEmpty()) {
                                        rvMedicos.visibility = View.GONE
                                        tvNoMedicos.text =
                                            "No se encontraron médicos con ese nombre."
                                        tvNoMedicos.visibility = View.VISIBLE
                                    } else {
                                        rvMedicos.visibility = View.VISIBLE
                                        tvNoMedicos.visibility = View.GONE
                                    }
                                }
                            }
                        })
                    } else {
                        rvMedicos.visibility = View.GONE
                        tvNoMedicos.text = "No hay médicos disponibles para esta especialidad :("
                        tvNoMedicos.visibility = View.VISIBLE
                    }
                } else {
                    rvMedicos.visibility = View.GONE
                    tvNoMedicos.text = "Error al cargar médicos :("
                    tvNoMedicos.visibility = View.VISIBLE
                }
            }

            override fun onFailure(
                call: retrofit2.Call<com.example.smartflow.data.models.MedicosResponse>,
                t: Throwable
            ) {
                rvMedicos.visibility = View.GONE
                tvNoMedicos.text = "Error de red: ${t.message} :("
                tvNoMedicos.visibility = View.VISIBLE
            }
        })

        stepContainer.addView(view)
    }

    // Step 3: Fecha y Hora combinadas
    private fun inflateStep3() {
        val view = layoutInflater.inflate(R.layout.step_3_fecha_hora, stepContainer, false)
        val calendarView = view.findViewById<android.widget.CalendarView>(R.id.calendar_view)
        val chipGroupHorarios =
            view.findViewById<com.google.android.material.chip.ChipGroup>(R.id.chip_group_horarios)
        val tvNoHorarios = view.findViewById<android.widget.TextView>(R.id.tv_no_horarios)
        val tvMedico = view.findViewById<android.widget.TextView>(R.id.tv_medico_seleccionado)

        tvMedico.text =
            medicoSeleccionado?.let { "Dr. ${it.nombre ?: "-"} ${it.apellido ?: ""} - ${especialidadNombre ?: "-"}" }
                ?: "-"

        fechaSeleccionada = null
        horaSeleccionada = null

        val medicoId = medicoSeleccionado?._id ?: return
        val apiService =
            com.example.smartflow.data.api.RetrofitClient.medicosDisponibilidadApiService
        val call = apiService.getDisponibilidad(medicoId)
        call.enqueue(object :
            retrofit2.Callback<com.example.smartflow.data.models.DisponibilidadResponse> {
            override fun onResponse(
                call: retrofit2.Call<com.example.smartflow.data.models.DisponibilidadResponse>,
                response: retrofit2.Response<com.example.smartflow.data.models.DisponibilidadResponse>
            ) {
                if (response.isSuccessful) {
                    val disponibilidad = response.body()?.data ?: emptyList()
                    if (disponibilidad.isEmpty()) {
                        calendarView.isEnabled = false
                        chipGroupHorarios.removeAllViews()
                        tvNoHorarios.text = "El médico no tiene días disponibles."
                        tvNoHorarios.visibility = View.VISIBLE
                        return
                    }

                    val fechasDisponibles = disponibilidad.map { it.fecha }.toSet()
                    val horariosPorFecha = disponibilidad.associateBy { it.fecha }

                    val minDate =
                        fechasDisponibles.minOrNull()?.let { java.sql.Date.valueOf(it).time }
                            ?: System.currentTimeMillis()
                    val maxDate =
                        fechasDisponibles.maxOrNull()?.let { java.sql.Date.valueOf(it).time }
                            ?: System.currentTimeMillis()
                    calendarView.minDate = minDate
                    calendarView.maxDate = maxDate

                    fun actualizarHorariosParaFecha(fecha: String) {
                        if (!fechasDisponibles.contains(fecha)) {
                            chipGroupHorarios.removeAllViews()
                            tvNoHorarios.text = "No hay horarios para este día."
                            tvNoHorarios.visibility = View.VISIBLE
                            fechaSeleccionada = null
                            horaSeleccionada = null
                            return
                        }
                        fechaSeleccionada = fecha
                        val horarios = horariosPorFecha[fecha]?.horarios ?: emptyList()
                        chipGroupHorarios.removeAllViews()
                        if (horarios.isEmpty()) {
                            tvNoHorarios.text = "No hay horarios para este día."
                            tvNoHorarios.visibility = View.VISIBLE
                            horaSeleccionada = null
                        } else {
                            tvNoHorarios.visibility = View.GONE
                            horarios.forEach { hora ->
                                val chip =
                                    com.google.android.material.chip.Chip(this@GenerarCitaActivity)
                                chip.text = hora
                                chip.isCheckable = true
                                chip.setOnClickListener {
                                    horaSeleccionada = hora
                                }
                                chipGroupHorarios.addView(chip)
                            }
                        }
                    }

                    calendarView.setOnDateChangeListener { _, year, month, dayOfMonth ->
                        val fecha = String.format("%04d-%02d-%02d", year, month + 1, dayOfMonth)
                        actualizarHorariosParaFecha(fecha)
                    }

                    val primerDia = fechasDisponibles.minOrNull()
                    primerDia?.let {
                        calendarView.date = java.sql.Date.valueOf(it).time
                        actualizarHorariosParaFecha(it)
                    }
                } else {
                    calendarView.isEnabled = false
                    chipGroupHorarios.removeAllViews()
                    tvNoHorarios.text = "Error al cargar disponibilidad."
                    tvNoHorarios.visibility = View.VISIBLE
                }
            }

            override fun onFailure(
                call: retrofit2.Call<com.example.smartflow.data.models.DisponibilidadResponse>,
                t: Throwable
            ) {
                calendarView.isEnabled = false
                chipGroupHorarios.removeAllViews()
                tvNoHorarios.text = "Error de red: ${t.message}"
                tvNoHorarios.visibility = View.VISIBLE
            }
        })

        stepContainer.addView(view)
    }

    // Step 4: Confirmar (con resumen de datos)
    private fun inflateStep4() {
        val view = layoutInflater.inflate(R.layout.step_4_confirmar, stepContainer, false)

        // Referencias a las vistas
        val tvResumenMedico = view.findViewById<android.widget.TextView>(R.id.tv_resumen_medico)
        val tvResumenEspecialidad =
            view.findViewById<android.widget.TextView>(R.id.tv_resumen_especialidad)
        val tvResumenFecha = view.findViewById<android.widget.TextView>(R.id.tv_resumen_fecha)
        val tvResumenHora = view.findViewById<android.widget.TextView>(R.id.tv_resumen_hora)
        val tvResumenMonto = view.findViewById<android.widget.TextView>(R.id.tv_resumen_monto)
        val etMotivo =
            view.findViewById<com.google.android.material.textfield.TextInputEditText>(R.id.et_motivo)
        val cardEfectivo =
            view.findViewById<com.google.android.material.card.MaterialCardView>(R.id.card_efectivo)
        val cardTarjeta =
            view.findViewById<com.google.android.material.card.MaterialCardView>(R.id.card_tarjeta)

        // ✅ LLENAR LOS DATOS DEL RESUMEN
        // Médico
        val nombreMedico =
            "${medicoSeleccionado?.nombre ?: ""} ${medicoSeleccionado?.apellido ?: ""}".trim()
        tvResumenMedico.text = if (nombreMedico.isNotEmpty()) "Dr. $nombreMedico" else "Sin médico"

        // Especialidad
        tvResumenEspecialidad.text = especialidadNombre ?: "Sin especialidad"

        // Fecha (formateada bonita)
        tvResumenFecha.text = formatearFecha(fechaSeleccionada)

        // Hora
        tvResumenHora.text = horaSeleccionada ?: "Sin hora"

        // Monto (puedes obtenerlo del médico si lo tienes en el modelo)
        val monto = medicoSeleccionado?.medicoInfo?.tarifaConsulta ?: 700
        tvResumenMonto.text = "$$monto"

        // Motivo
        etMotivo.setText(motivo ?: "")
        etMotivo.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: android.text.Editable?) {
                motivo = s?.toString()
            }
        })

        // Selección visual de método de pago
        fun updatePagoUI() {
            if (modoPago == "efectivo") {
                cardEfectivo.strokeWidth = 6
                cardEfectivo.strokeColor = getColor(R.color.colorPrimary)
                cardTarjeta.strokeWidth = 0
            } else {
                cardTarjeta.strokeWidth = 6
                cardTarjeta.strokeColor = getColor(R.color.colorPrimary)
                cardEfectivo.strokeWidth = 0
            }
        }

        // Inicializar selección
        updatePagoUI()

        cardEfectivo.setOnClickListener {
            modoPago = "efectivo"
            updatePagoUI()
        }

        cardTarjeta.setOnClickListener {
            modoPago = "online"
            updatePagoUI()
        }

        stepContainer.addView(view)
    }

    // ✅ FUNCIÓN AUXILIAR PARA FORMATEAR LA FECHA
    private fun formatearFecha(fecha: String?): String {
        if (fecha == null) return "Sin fecha"

        try {
            // Formato de entrada: "2025-11-20"
            val partes = fecha.split("-")
            val year = partes[0]
            val month = partes[1].toInt()
            val day = partes[2].toInt()

            val meses = arrayOf(
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            )

            // Formato de salida: "20 de Noviembre, 2025"
            return "$day de ${meses[month - 1]}, $year"
        } catch (e: Exception) {
            return fecha // Si falla, devuelve la fecha original
        }
    }

    private fun validateStep(step: Int): Boolean {
        return when (step) {
            1 -> {
                if (especialidadId == null) {
                    Toast.makeText(this, "Selecciona una especialidad", Toast.LENGTH_SHORT).show()
                    false
                } else true
            }

            2 -> {
                if (medicoSeleccionado == null) {
                    Toast.makeText(this, "Selecciona un médico", Toast.LENGTH_SHORT).show()
                    false
                } else true
            }

            3 -> {
                when {
                    fechaSeleccionada == null -> {
                        Toast.makeText(this, "Selecciona una fecha", Toast.LENGTH_SHORT).show()
                        false
                    }

                    horaSeleccionada == null -> {
                        Toast.makeText(this, "Selecciona una hora", Toast.LENGTH_SHORT).show()
                        false
                    }

                    else -> true
                }
            }

            4 -> {
                if (motivo.isNullOrBlank()) {
                    Toast.makeText(this, "Ingresa el motivo de la cita", Toast.LENGTH_SHORT).show()
                    false
                } else true
            }

            else -> false
        }
    }

    private fun crearCita() {
        // ✅ MOSTRAR DIÁLOGO DE CONFIRMACIÓN
        val builder = androidx.appcompat.app.AlertDialog.Builder(this)
        builder.setTitle("Confirmar cita")

        val nombreMedico = "Dr. ${medicoSeleccionado?.nombre ?: ""} ${medicoSeleccionado?.apellido ?: ""}".trim()
        val monto = medicoSeleccionado?.medicoInfo?.tarifaConsulta ?: 700

        builder.setMessage("""
        ¿Estás seguro de agendar esta cita?
        
        Médico: $nombreMedico
        Especialidad: $especialidadNombre
        Fecha: ${formatearFecha(fechaSeleccionada)}
        Hora: $horaSeleccionada
        Monto: $$monto
    """.trimIndent())

        builder.setPositiveButton("Sí, confirmar") { dialog, _ ->
            dialog.dismiss()
            enviarCitaAlBackend()
        }

        builder.setNegativeButton("Cancelar") { dialog, _ ->
            dialog.dismiss()
        }

        builder.show()
    }

    // ✅ NUEVA FUNCIÓN: Enviar cita al backend
    private fun enviarCitaAlBackend() {
        val pacienteId = obtenerPacienteId()
        val medicoId = medicoSeleccionado?._id ?: return

        // Mostrar loading
        val progressDialog = android.app.ProgressDialog(this)
        progressDialog.setMessage("Creando cita...")
        progressDialog.setCancelable(false)
        progressDialog.show()

        val request = CrearCitaRequest(
            pacienteId = pacienteId,
            medicoId = medicoId,
            fecha = fechaSeleccionada!!,
            hora = horaSeleccionada!!,
            motivo = motivo!!,
            modoPago = modoPago
        )

        val api = RetrofitClient.citasApiService
        api.crearCita(request).enqueue(object : retrofit2.Callback<CrearCitaResponse> {
            override fun onResponse(
                call: retrofit2.Call<CrearCitaResponse>,
                response: retrofit2.Response<CrearCitaResponse>
            ) {
                progressDialog.dismiss()

                if (response.isSuccessful && response.body()?.success == true) {
                    // ✅ ÉXITO: Mostrar Toast y redirigir
                    Toast.makeText(
                        this@GenerarCitaActivity,
                        "¡Cita creada exitosamente!",
                        Toast.LENGTH_LONG
                    ).show()

                    // ✅ REDIRIGIR A PACIENTE HOME Y REFRESCAR CITAS
                    val intent = android.content.Intent(this@GenerarCitaActivity, PacienteHomeActivity::class.java)
                    intent.flags = android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP or android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP
                    intent.putExtra("refrescar_citas", true) // ✅ Flag para refrescar
                    startActivity(intent)
                    finish()

                } else {
                    Toast.makeText(
                        this@GenerarCitaActivity,
                        response.body()?.message ?: "Error al crear cita",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }

            override fun onFailure(call: retrofit2.Call<CrearCitaResponse>, t: Throwable) {
                progressDialog.dismiss()
                Toast.makeText(
                    this@GenerarCitaActivity,
                    "Error de red: ${t.message}",
                    Toast.LENGTH_LONG
                ).show()
            }
        })
    }
    private fun obtenerPacienteId(): String {
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        return prefs.getString("user_id", "") ?: ""
    }
}