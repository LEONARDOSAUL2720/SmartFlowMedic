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
    private lateinit var step4Circle: View  // ✅ Solo 4 círculos

    private lateinit var toolbar: MaterialToolbar
    private lateinit var btnAnterior: MaterialButton
    private lateinit var btnSiguiente: MaterialButton
    private lateinit var stepContainer: android.widget.FrameLayout

    // Step actual
    private var currentStep = 1
    private val totalSteps = 4  // ✅ 4 pasos en total

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
        step4Circle = findViewById(R.id.step_4_circle)  // ✅ Solo 4

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
            4 -> inflateStep4()  // Confirmar (antes era step 5)
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
        step4Circle.setBackgroundResource(if (step == 4) active else inactive)  // ✅ Solo 4
    }

    // Step 1: Especialidad
    private fun inflateStep1() {
        val view = layoutInflater.inflate(R.layout.step_1_especialidad, stepContainer, false)
        val rvEspecialidades = view.findViewById<androidx.recyclerview.widget.RecyclerView>(R.id.rv_especialidades)
        val tvNoEspecialidades = view.findViewById<android.widget.TextView>(R.id.tv_no_especialidades)
        val progressBar = view.findViewById<android.widget.ProgressBar>(R.id.progress_especialidades)

        val adapter = com.example.smartflow.adapters.EspecialidadesAdapter(emptyList()) { especialidad ->
            especialidadId = especialidad._id
            especialidadNombre = especialidad.nombre
            Toast.makeText(this, "Especialidad seleccionada: ${especialidad.nombre}", Toast.LENGTH_SHORT).show()
        }
        rvEspecialidades.adapter = adapter

        progressBar.visibility = View.VISIBLE
        rvEspecialidades.visibility = View.GONE
        tvNoEspecialidades.visibility = View.GONE

        val apiService = com.example.smartflow.data.api.RetrofitClient.especialidadesApiService
        apiService.getEspecialidades().enqueue(object : retrofit2.Callback<com.example.smartflow.data.models.EspecialidadResponse> {
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
                    Toast.makeText(this@GenerarCitaActivity, "Error al cargar especialidades", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(
                call: retrofit2.Call<com.example.smartflow.data.models.EspecialidadResponse>,
                t: Throwable
            ) {
                progressBar.visibility = View.GONE
                rvEspecialidades.visibility = View.GONE
                tvNoEspecialidades.visibility = View.VISIBLE
                Toast.makeText(this@GenerarCitaActivity, "Error de red: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })

        stepContainer.addView(view)
    }

    // Step 2: Médico
    private fun inflateStep2() {
        val view = layoutInflater.inflate(R.layout.step_2_medico, stepContainer, false)
        val rvMedicos = view.findViewById<androidx.recyclerview.widget.RecyclerView>(R.id.rv_medicos)
        val tvNoMedicos = view.findViewById<android.widget.TextView>(R.id.tv_no_medicos)
        val tvEspecialidad = view.findViewById<android.widget.TextView>(R.id.tv_especialidad_seleccionada)
        val etBuscar = view.findViewById<android.widget.EditText>(R.id.et_buscar_medico)
        tvEspecialidad.text = "Especialidad: ${especialidadNombre ?: "-"}"

        medicoSeleccionado = null
        rvMedicos.visibility = View.GONE
        tvNoMedicos.visibility = View.GONE

        val apiService = com.example.smartflow.data.api.RetrofitClient.medicosApiService
        apiService.getMedicosPorEspecialidad(especialidadId ?: "").enqueue(object : retrofit2.Callback<com.example.smartflow.data.models.MedicosResponse> {
            override fun onResponse(
                call: retrofit2.Call<com.example.smartflow.data.models.MedicosResponse>,
                response: retrofit2.Response<com.example.smartflow.data.models.MedicosResponse>
            ) {
                if (response.isSuccessful && response.body()?.success == true) {
                    val medicos = response.body()?.data ?: emptyList()
                    if (medicos.isNotEmpty()) {
                        val listaOriginal = medicos
                        val adapter = com.example.smartflow.adapters.MedicosGenerarCitaAdapter(listaOriginal) { medico ->
                            medicoSeleccionado = medico
                        }
                        rvMedicos.adapter = adapter
                        rvMedicos.visibility = View.VISIBLE
                        tvNoMedicos.visibility = View.GONE

                        etBuscar.addTextChangedListener(object : android.text.TextWatcher {
                            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
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
                                        tvNoMedicos.text = "No se encontraron médicos con ese nombre."
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

    // Step 3: Fecha y Hora combinadas (✅ NO TOCAR - YA FUNCIONA)
    private fun inflateStep3() {
        val view = layoutInflater.inflate(R.layout.step_3_fecha_hora, stepContainer, false)
        val calendarView = view.findViewById<android.widget.CalendarView>(R.id.calendar_view)
        val chipGroupHorarios = view.findViewById<com.google.android.material.chip.ChipGroup>(R.id.chip_group_horarios)
        val tvNoHorarios = view.findViewById<android.widget.TextView>(R.id.tv_no_horarios)
        val tvMedico = view.findViewById<android.widget.TextView>(R.id.tv_medico_seleccionado)

        tvMedico.text = medicoSeleccionado?.let { "Dr. ${it.nombre ?: "-"} ${it.apellido ?: ""} - ${especialidadNombre ?: "-"}" } ?: "-"

        fechaSeleccionada = null
        horaSeleccionada = null

        val medicoId = medicoSeleccionado?._id ?: return
        val apiService = com.example.smartflow.data.api.RetrofitClient.medicosDisponibilidadApiService
        val call = apiService.getDisponibilidad(medicoId)
        call.enqueue(object : retrofit2.Callback<com.example.smartflow.data.models.DisponibilidadResponse> {
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

                    val minDate = fechasDisponibles.minOrNull()?.let { java.sql.Date.valueOf(it).time } ?: System.currentTimeMillis()
                    val maxDate = fechasDisponibles.maxOrNull()?.let { java.sql.Date.valueOf(it).time } ?: System.currentTimeMillis()
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
                                val chip = com.google.android.material.chip.Chip(this@GenerarCitaActivity)
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

    private fun inflateStep4() {
        val view = layoutInflater.inflate(R.layout.step_4_confirmar, stepContainer, false)
        val etMotivo = view.findViewById<com.google.android.material.textfield.TextInputEditText>(R.id.et_motivo)
        etMotivo.setText(motivo ?: "")
        etMotivo.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: android.text.Editable?) {
                motivo = s?.toString()
            }
        })

        stepContainer.addView(view)
        val cardEfectivo = view.findViewById<com.google.android.material.card.MaterialCardView>(R.id.card_efectivo)
        val cardTarjeta = view.findViewById<com.google.android.material.card.MaterialCardView>(R.id.card_tarjeta)

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
            4 -> {  // ✅ Step 4 ahora es confirmar
                if (motivo.isNullOrBlank()) {
                    Toast.makeText(this, "Ingresa el motivo de la cita", Toast.LENGTH_SHORT).show()
                    false
                } else true
            }
            else -> false
        }
    }

    private fun crearCita() {
        val pacienteId = obtenerPacienteId()
        val medicoId = medicoSeleccionado?._id ?: return

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
                if (response.isSuccessful && response.body()?.success == true) {
                    Toast.makeText(this@GenerarCitaActivity, "Cita creada exitosamente", Toast.LENGTH_LONG).show()
                    finish()
                } else {
                    Toast.makeText(this@GenerarCitaActivity, response.body()?.message ?: "Error al crear cita", Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: retrofit2.Call<CrearCitaResponse>, t: Throwable) {
                Toast.makeText(this@GenerarCitaActivity, "Error de red: ${t.message}", Toast.LENGTH_LONG).show()
            }
        })
    }

    private fun obtenerPacienteId(): String {
        val prefs = getSharedPreferences("app_prefs", MODE_PRIVATE)
        return prefs.getString("user_id", "") ?: ""
    }
}