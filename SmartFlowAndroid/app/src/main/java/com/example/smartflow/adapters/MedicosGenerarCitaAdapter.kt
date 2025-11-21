package com.example.smartflow.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.cardview.widget.CardView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.CircleCrop
import com.example.smartflow.R
import com.example.smartflow.data.models.MedicoHorarios

class MedicosGenerarCitaAdapter(
    private var medicos: List<MedicoHorarios>,
    private val onMedicoClick: (MedicoHorarios) -> Unit
) : RecyclerView.Adapter<MedicosGenerarCitaAdapter.MedicoViewHolder>() {

    private var selectedPosition = -1

    inner class MedicoViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val cardMedico: CardView = view.findViewById(R.id.card_medico)
        val ivFoto: ImageView = view.findViewById(R.id.iv_medico_foto)
        val tvNombre: TextView = view.findViewById(R.id.tv_medico_nombre)
        val tvEspecialidad: TextView = view.findViewById(R.id.tv_medico_especialidad)
        val tvCalificacion: TextView = view.findViewById(R.id.tv_medico_calificacion)
        val tvTarifa: TextView = view.findViewById(R.id.tv_medico_tarifa)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MedicoViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_medico_generar_cita, parent, false)
        return MedicoViewHolder(view)
    }

    override fun onBindViewHolder(holder: MedicoViewHolder, position: Int) {
        val medico = medicos[position]

        // Nombre completo
        holder.tvNombre.text = "Dr. ${medico.nombre} ${medico.apellido}"

        // Especialidad (primera de la lista si hay varias)
        holder.tvEspecialidad.text = medico.especialidades.firstOrNull() ?: "Medicina General"

        // Calificación
        val calificacion = medico.calificacionPromedio ?: 0.0
        holder.tvCalificacion.text = String.format("★ %.1f", calificacion)

        // Tarifa
        val tarifa = medico.tarifaConsulta ?: 0
        holder.tvTarifa.text = "$$tarifa MXN"

        // Foto del médico
        if (!medico.foto.isNullOrEmpty()) {
            Glide.with(holder.itemView.context)
                .load(medico.foto)
                .transform(CircleCrop())
                .placeholder(R.drawable.ic_launcher_foreground)
                .into(holder.ivFoto)
        } else {
            holder.ivFoto.setImageResource(R.drawable.ic_launcher_foreground)
        }

        // Marcar como seleccionado
        if (position == selectedPosition) {
            holder.cardMedico.setCardBackgroundColor(
                holder.itemView.context.getColor(R.color.purple_200)
            )
        } else {
            holder.cardMedico.setCardBackgroundColor(
                holder.itemView.context.getColor(android.R.color.white)
            )
        }

        // Click en la tarjeta
        holder.cardMedico.setOnClickListener {
            val previousPosition = selectedPosition
            selectedPosition = holder.adapterPosition
            notifyItemChanged(previousPosition)
            notifyItemChanged(selectedPosition)
            onMedicoClick(medico)
        }
    }

    override fun getItemCount() = medicos.size

    fun updateMedicos(newMedicos: List<MedicoHorarios>) {
        medicos = newMedicos
        selectedPosition = -1
        notifyDataSetChanged()
    }
}
