package com.example.smartflow

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.smartflow.data.api.RetrofitClient
import com.example.smartflow.data.api.CitasApiService
import com.example.smartflow.data.models.CrearCitaRequest
import com.example.smartflow.data.models.CrearCitaResponse
import com.example.smartflow.data.models.MedicoHorarios
import com.google.android.material.button.MaterialButton
import com.google.android.material.appbar.MaterialToolbar

class GenerarCitaActivity : AppCompatActivity() {

    private lateinit var toolbar: MaterialToolbar
    private lateinit var btnAnterior: MaterialButton
    private lateinit var btnSiguiente: MaterialButton
    private lateinit var stepContainer: android.widget.FrameLayout

    // Step actual
    private var currentStep = 1
    private val totalSteps = 5

    // Datos seleccionados
    private var especialidadId: String? = null
    private var especialidadNombre: String? = null
    private var medicoSeleccionado: MedicoHorarios? = null
    private var fechaSeleccionada: String? = null
    private var horaSeleccionada: String? = null
    private var motivo: String? = null
    private var modoPago: String = "efectivo"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_generar_cita)

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
    }

    private fun showStep(step: Int) {
        stepContainer.removeAllViews()
        when (step) {
            1 -> inflateStep1()
            2 -> inflateStep2()
            3 -> inflateStep3()
            4 -> inflateStep4()
            5 -> inflateStep5()
        }
        btnAnterior.visibility = if (step == 1) View.GONE else View.VISIBLE
        btnSiguiente.text = if (step == totalSteps) "Confirmar" else "Siguiente"
    }

    // Step 1: Especialidad
    private fun inflateStep1() {
        val view = layoutInflater.inflate(R.layout.step_1_especialidad, stepContainer, false)
        val rvEspecialidades = view.findViewById<androidx.recyclerview.widget.RecyclerView>(R.id.rv_especialidades)
        val tvNoEspecialidades = view.findViewById<android.widget.TextView>(R.id.tv_no_especialidades)

        // TODO: Llama a tu API para obtener especialidades y llena el RecyclerView
        // Cuando el usuario seleccione una especialidad, guarda especialidadId y especialidadNombre
        // ejemplo:
        // especialidadId = especialidad._id
        // especialidadNombre = especialidad.nombre

        stepContainer.addView(view)
    }

    // Step 2: Médico
    private fun inflateStep2() {
        val view = layoutInflater.inflate(R.layout.step_2_medico, stepContainer, false)
        val rvMedicos = view.findViewById<androidx.recyclerview.widget.RecyclerView>(R.id.rv_medicos)
        val tvNoMedicos = view.findViewById<android.widget.TextView>(R.id.tv_no_medicos)
        val tvEspecialidad = view.findViewById<android.widget.TextView>(R.id.tv_especialidad_seleccionada)
        tvEspecialidad.text = "Especialidad: ${especialidadNombre ?: "-"}"

        // TODO: Llama a tu API para obtener médicos por especialidad y llena el RecyclerView
        // Usa MedicosGenerarCitaAdapter y en el callback guarda medicoSeleccionado

        stepContainer.addView(view)
    }

    // Step 3: Fecha
    private fun inflateStep3() {
        val view = layoutInflater.inflate(R.layout.step_3_fecha, stepContainer, false)
        val calendarView = view.findViewById<android.widget.CalendarView>(R.id.calendar_view)
        val tvFechaSeleccionada = view.findViewById<android.widget.TextView>(R.id.tv_fecha_seleccionada)

        calendarView.setOnDateChangeListener { _, year, month, dayOfMonth ->
            val fecha = String.format("%04d-%02d-%02d", year, month + 1, dayOfMonth)
            fechaSeleccionada = fecha
            tvFechaSeleccionada.text = "Fecha seleccionada: $fecha"
            tvFechaSeleccionada.visibility = View.VISIBLE
        }

        stepContainer.addView(view)
    }

    // Step 4: Hora
    private fun inflateStep4() {
        val view = layoutInflater.inflate(R.layout.step_4_hora, stepContainer, false)
        val chipGroupHorarios = view.findViewById<com.google.android.material.chip.ChipGroup>(R.id.chip_group_horarios)
        val tvNoHorarios = view.findViewById<android.widget.TextView>(R.id.tv_no_horarios)

        // TODO: Llama a tu API para obtener horarios disponibles del médico en la fecha seleccionada
        // Por cada horario, crea un Chip y agrégalo al ChipGroup
        // Cuando el usuario seleccione un horario, guarda horaSeleccionada

        stepContainer.addView(view)
    }

    // Step 5: Confirmar
    private fun inflateStep5() {
        val view = layoutInflater.inflate(R.layout.step_5_confirmar, stepContainer, false)
        val etMotivo = view.findViewById<com.google.android.material.textfield.TextInputEditText>(R.id.et_motivo)
        val rgModoPago = view.findViewById<android.widget.RadioGroup>(R.id.rg_modo_pago)

        etMotivo.setText(motivo ?: "")
        etMotivo.setOnFocusChangeListener { _, _ ->
            motivo = etMotivo.text?.toString()
        }
        rgModoPago.setOnCheckedChangeListener { _, checkedId ->
            modoPago = if (checkedId == R.id.rb_online) "online" else "efectivo"
        }

        // TODO: Muestra resumen de datos seleccionados en los TextView

        stepContainer.addView(view)
    }

    private fun validateStep(step: Int): Boolean {
        // Validaciones básicas por step
        return when (step) {
            1 -> especialidadId != null
            2 -> medicoSeleccionado != null
            3 -> fechaSeleccionada != null
            4 -> horaSeleccionada != null
            5 -> motivo != null && motivo!!.isNotBlank()
            else -> false
        }
    }

    private fun crearCita() {
        // Llama al endpoint para crear la cita
        val pacienteId = obtenerPacienteId() // Implementa según tu lógica de sesión
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
        // Implementa según tu lógica de sesión/SharedPreferences
        return "ID_DEL_PACIENTE"
    }
}
