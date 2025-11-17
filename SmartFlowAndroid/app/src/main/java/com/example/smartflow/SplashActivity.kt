package com.example.smartflow

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.animation.AnimationUtils
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity() {

    private val SPLASH_DURATION = 3000L // 3 segundos

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        // Obtener vistas
        val ivLogo = findViewById<ImageView>(R.id.iv_logo)
        val tvAppName = findViewById<TextView>(R.id.tv_app_name)
        val tvTagline = findViewById<TextView>(R.id.tv_tagline)

        // Animación de fade in para el logo
        val fadeIn = AnimationUtils.loadAnimation(this, android.R.anim.fade_in)
        fadeIn.duration = 1500
        ivLogo.startAnimation(fadeIn)
        tvAppName.startAnimation(fadeIn)
        tvTagline.startAnimation(fadeIn)

        // Después de 3 segundos, ir a MainActivity
        Handler(Looper.getMainLooper()).postDelayed({
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
            finish() // Cerrar splash para que no vuelva al presionar back
        }, SPLASH_DURATION)
    }
}
