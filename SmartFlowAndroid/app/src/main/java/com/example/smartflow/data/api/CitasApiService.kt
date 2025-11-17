package com.example.smartflow.data.api

import com.example.smartflow.data.models.CitasResponse
import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Path

interface CitasApiService {
    
    @GET("citas/paciente/{pacienteId}/proximas")
    fun getCitasProximas(
        @Path("pacienteId") pacienteId: String
    ): Call<CitasResponse>
    
    @GET("citas/paciente/{pacienteId}/historial")
    fun getHistorialCitas(
        @Path("pacienteId") pacienteId: String
    ): Call<CitasResponse>
}
