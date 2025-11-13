// Archivo de ejemplo para servicios compartidos entre web y mobile

class EmailService {
  // Enviar email de bienvenida
  static async sendWelcomeEmail(email, name) {
    // Implementar lógica de envío de email
    console.log(`Enviando email de bienvenida a ${email}`);
    return true;
  }

  // Enviar email de recuperación de contraseña
  static async sendPasswordResetEmail(email, resetToken) {
    console.log(`Enviando email de recuperación a ${email}`);
    return true;
  }
}

module.exports = EmailService;
