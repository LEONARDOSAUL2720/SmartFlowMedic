package com.example.smartflow.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.example.smartflow.R
import com.example.smartflow.data.models.Cita
import java.text.SimpleDateFormat
import java.util.*

class CitasAdapter(
    private var citas: List<Cita>,
    private val onCitaClick: (Cita) -> Unit
) : RecyclerView.Adapter<CitasAdapter.CitaViewHolder>() {

    class CitaViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivMedicoFoto: ImageView = view.findViewById(R.id.iv_medico_foto)
        val tvMedicoNombre: TextView = view.findViewById(R.id.tv_medico_nombre)
        val tvEspecialidad: TextView = view.findViewById(R.id.tv_especialidad)
        val tvMotivo: TextView = view.findViewById(R.id.tv_motivo)
        val tvFecha: TextView = view.findViewById(R.id.tv_fecha)
        val tvHora: TextView = view.findViewById(R.id.tv_hora)
        val tvEstado: TextView = view.findViewById(R.id.tv_estado)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CitaViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_cita, parent, false)
        return CitaViewHolder(view)
    }

    override fun onBindViewHolder(holder: CitaViewHolder, position: Int) {
        val cita = citas[position]
        
        // Cargar foto del médico
        if (!cita.medico.foto.isNullOrEmpty()) {
            Glide.with(holder.itemView.context)
                .load(cita.medico.foto)
                .circleCrop()
                .placeholder(R.drawable.ic_launcher_foreground)
                .into(holder.ivMedicoFoto)
        } else {
            holder.ivMedicoFoto.setImageResource(R.drawable.ic_launcher_foreground)
        }

        // Datos del médico
        holder.tvMedicoNombre.text = "Dr. ${cita.medico.nombre}"
        holder.tvEspecialidad.text = cita.medico.especialidad
        holder.tvMotivo.text = cita.motivo

        // Formatear fecha
        try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            inputFormat.timeZone = TimeZone.getTimeZone("UTC")
            val date = inputFormat.parse(cita.fecha)
            val outputFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
            holder.tvFecha.text = outputFormat.format(date!!)
        } catch (e: Exception) {
            holder.tvFecha.text = cita.fecha
        }

        holder.tvHora.text = cita.hora

        // Estado con color
        when (cita.estado.lowercase()) {
            "confirmada" -> {
                holder.tvEstado.text = "Confirmada"
                holder.tvEstado.setBackgroundColor(Color.parseColor("#57B894")) // verde
            }
            "pendiente" -> {
                holder.tvEstado.text = "Pendiente"
                holder.tvEstado.setBackgroundColor(Color.parseColor("#FFA726")) // naranja
            }
            "completada" -> {
                holder.tvEstado.text = "Completada"
                holder.tvEstado.setBackgroundColor(Color.parseColor("#2A6FB0")) // azul
            }
            else -> {
                holder.tvEstado.text = cita.estado
                holder.tvEstado.setBackgroundColor(Color.parseColor("#999999")) // gris
            }
        }

        // Click listener
        holder.itemView.setOnClickListener {
            onCitaClick(cita)
        }
    }

    override fun getItemCount() = citas.size

    fun updateCitas(newCitas: List<Cita>) {
        citas = newCitas
        notifyDataSetChanged()
    }
}
