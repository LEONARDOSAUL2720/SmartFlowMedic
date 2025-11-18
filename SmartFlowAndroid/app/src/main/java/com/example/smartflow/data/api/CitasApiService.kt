package com.example.smartflow.data.api

import com.example.smartflow.data.models.CitasResponse
import com.example.smartflow.data.models.CitasHoyResponse
import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface CitasApiService {
    
    @GET("citas/paciente/{pacienteId}/proximas")
    fun getCitasProximas(
        @Path("pacienteId") pacienteId: String
    ): Call<CitasResponse>
    
    @GET("citas/paciente/{pacienteId}/historial")
    fun getHistorialCitas(
        @Path("pacienteId") pacienteId: String
    ): Call<CitasResponse>
    
    @GET("citas/hoy")
    fun getCitasHoy(
        @Query("especialidadId") especialidadId: String? = null,
        @Query("medicoId") medicoId: String? = null
    ): Call<CitasHoyResponse>
}
