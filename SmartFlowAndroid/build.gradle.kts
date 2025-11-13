// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    // Declarar el plugin de Google Services con versión y sin aplicarlo aquí
    id("com.google.gms.google-services") version "4.4.4" apply false
}