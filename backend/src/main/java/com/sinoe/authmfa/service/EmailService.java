package com.sinoe.authmfa.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.Year;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${tutorlink.mail.from}")
    private String fromEmail;

    @Value("${tutorlink.frontend-base-url}")
    private String frontendBaseUrl;

    // =========================
    // 1) Correo de primer login
    // =========================

    public void sendFirstLoginEmail(String toEmail, String activationToken) {
        String url = frontendBaseUrl + "/first-login?token=" + activationToken;
        String subject = "TutorLink - Activa tu cuenta y crea tu contraseña";

        String html = buildActionEmail(
                "Activa tu cuenta y crea tu contraseña.",
                "Activa tu cuenta en TutorLink",
                "Tu cuenta fue creada por el administrador. Para empezar a usar el sistema, debes activar tu cuenta y establecer tu primera contraseña.",
                "", // contenido extra opcional
                "Activar cuenta",
                url
        );

        sendEmail(toEmail, subject, html);
    }

    // ==============================
    // 2) Correo para cambio de pass
    // ==============================

    public void sendPasswordChangeOtpEmail(String toEmail, String code) {
        String subject = "TutorLink - Código para cambio de contraseña";

        String extraHtml = """
                <p style="margin:0 0 12px; font-size:14px; color:#4b5563;">
                  Estás realizando un cambio de contraseña en tu cuenta.
                </p>
                <p style="margin:0 0 16px; font-size:13px; color:#6b7280;">
                  Ingresa el siguiente código en la pantalla de verificación:
                </p>
                <div style="display:inline-block; padding:12px 20px; border-radius:999px;
                            background-color:#0f172a10; border:1px dashed #cbd5f5; margin-bottom:12px;">
                  <span style="font-size:24px; font-weight:700; letter-spacing:6px; color:#111827;">
                    %s
                  </span>
                </div>
                <p style="margin:0; font-size:12px; color:#6b7280;">
                  Este código es temporal, personal y solo puede usarse una vez.
                </p>
                """.formatted(code);

        String html = buildInfoEmail(
                "Código de verificación para cambio de contraseña.",
                "Código de verificación",
                "Recibiste este mensaje porque se solicitó un cambio de contraseña para tu cuenta en TutorLink.",
                extraHtml
        );

        sendEmail(toEmail, subject, html);
    }

    // ========================
    // 3) Envío genérico HTML
    // ========================

    public void sendEmail(String toEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(message);
            log.info("Correo enviado a {}", toEmail);
        } catch (Exception e) {
            log.error("Error enviando correo a {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("No se pudo enviar el correo", e);
        }
    }

    // ======================================================
    // 4) Helpers para construir templates bonitos reutilizables
    // ======================================================

    /**
     * Template para correos con botón de acción (ej. activar cuenta).
     */
    private String buildActionEmail(
            String preheader,
            String title,
            String intro,
            String extraHtml,
            String buttonLabel,
            String buttonUrl
    ) {
        String year = String.valueOf(Year.now().getValue());
        String safeUrl = (buttonUrl != null && !buttonUrl.isBlank()) ? buttonUrl : "#";

        String buttonHtml = "";
        if (buttonUrl != null && !buttonUrl.isBlank()) {
            buttonHtml = """
                    <div style="margin:24px 0;">
                      <a href="%s"
                         style="display:inline-block; padding:12px 24px; border-radius:999px;
                                background:linear-gradient(135deg,#18529D,#28AD56);
                                color:#ffffff; font-size:14px; font-weight:600;
                                text-decoration:none; letter-spacing:0.04em;">
                        %s
                      </a>
                    </div>
                    """.formatted(buttonUrl, buttonLabel);
        }

        String template = """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8" />
                  <title>%s</title>
                </head>
                <body style="margin:0; padding:0; background-color:#f3f4f6;
                             font-family: system-ui, -apple-system, BlinkMacSystemFont,
                                          'Segoe UI', sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="padding:32px 16px;">
                        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
                               style="background-color:#ffffff; border-radius:16px;
                                      overflow:hidden; box-shadow:0 10px 25px rgba(15,23,42,0.12);">
                          <tr>
                            <td style="padding:24px 32px;
                                       background:linear-gradient(135deg,#18529D,#28AD56);
                                       color:#ffffff;">
                              <table width="100%%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                  <td align="left">
                                    <div style="font-size:20px; font-weight:700; letter-spacing:0.02em;">
                                      TutorLink
                                    </div>
                                    <div style="font-size:13px; opacity:0.9;">
                                      Sistema de tutorías académicas
                                    </div>
                                  </td>
                                  <td align="right" style="font-size:12px; opacity:0.9;">
                                    %s
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:32px;">
                              <h1 style="margin:0 0 12px; font-size:20px; color:#0f172a;">%s</h1>
                              <p style="margin:0 0 16px; font-size:14px; color:#4b5563;">
                                %s
                              </p>

                              %s

                              %s

                              <p style="margin-top:24px; font-size:12px; color:#6b7280;">
                                Si el botón no funciona, copia y pega este enlace en tu navegador:
                                <br />
                                <a href="%s" style="color:#18529D; word-break:break-all;">%s</a>
                              </p>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:16px 32px 24px; background-color:#f9fafb;
                                       border-top:1px solid #e5e7eb; font-size:11px; color:#9ca3af;">
                              © %s TutorLink · Universidad Veracruzana
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """;

        return template.formatted(
                title,      // <title>
                preheader,  // cabecera derecha
                title,      // h1
                intro,      // párrafo principal
                extraHtml,  // contenido extra
                buttonHtml, // botón (si aplica)
                safeUrl,    // link fallback
                safeUrl,    // texto del link
                year        // footer
        );
    }

    /**
     * Template para correos informativos sin botón (ej. OTP).
     */
    private String buildInfoEmail(
            String preheader,
            String title,
            String intro,
            String extraHtml
    ) {
        String year = String.valueOf(Year.now().getValue());

        String template = """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8" />
                  <title>%s</title>
                </head>
                <body style="margin:0; padding:0; background-color:#f3f4f6;
                             font-family: system-ui, -apple-system, BlinkMacSystemFont,
                                          'Segoe UI', sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="padding:32px 16px;">
                        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
                               style="background-color:#ffffff; border-radius:16px;
                                      overflow:hidden; box-shadow:0 10px 25px rgba(15,23,42,0.12);">
                          <tr>
                            <td style="padding:24px 32px;
                                       background:linear-gradient(135deg,#18529D,#28AD56);
                                       color:#ffffff;">
                              <table width="100%%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                  <td align="left">
                                    <div style="font-size:20px; font-weight:700; letter-spacing:0.02em;">
                                      TutorLink
                                    </div>
                                    <div style="font-size:13px; opacity:0.9;">
                                      Sistema de tutorías académicas
                                    </div>
                                  </td>
                                  <td align="right" style="font-size:12px; opacity:0.9;">
                                    %s
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:32px;">
                              <h1 style="margin:0 0 12px; font-size:20px; color:#0f172a;">%s</h1>
                              <p style="margin:0 0 16px; font-size:14px; color:#4b5563;">
                                %s
                              </p>

                              %s

                              <p style="margin-top:24px; font-size:12px; color:#6b7280;">
                                Si tú no solicitaste esta operación, puedes ignorar este mensaje.
                              </p>
                            </td>
                          </tr>

                          <tr>
                            <td style="padding:16px 32px 24px; background-color:#f9fafb;
                                       border-top:1px solid #e5e7eb; font-size:11px; color:#9ca3af;">
                              © %s TutorLink · Universidad Veracruzana
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """;

        return template.formatted(
                title,      // <title>
                preheader,  // cabecera derecha
                title,      // h1
                intro,      // párrafo principal
                extraHtml,  // contenido extra (caja de código)
                year        // footer
        );
    }

    // ======================================================
    // 5) Helpers para PREVIEW (usados por el controller dev)
    // ======================================================

    public String buildFirstLoginEmailHtmlExample() {
        String demoUrl = frontendBaseUrl + "/first-login?token=token-de-ejemplo";
        return buildActionEmail(
                "Activa tu cuenta y crea tu contraseña.",
                "Activa tu cuenta en TutorLink",
                "Tu cuenta fue creada por el administrador. Para empezar a usar el sistema, debes activar tu cuenta y establecer tu primera contraseña.",
                "",
                "Activar cuenta",
                demoUrl
        );
    }

    public String buildPasswordChangeOtpEmailHtmlExample() {
        String demoCode = "123 456";
        String extraHtml = """
                <p style="margin:0 0 12px; font-size:14px; color:#4b5563;">
                  Estás realizando un cambio de contraseña en tu cuenta.
                </p>
                <p style="margin:0 0 16px; font-size:13px; color:#6b7280;">
                  Ingresa el siguiente código en la pantalla de verificación:
                </p>
                <div style="display:inline-block; padding:12px 20px; border-radius:999px;
                            background-color:#0f172a10; border:1px dashed #cbd5f5; margin-bottom:12px;">
                  <span style="font-size:24px; font-weight:700; letter-spacing:6px; color:#111827;">
                    %s
                  </span>
                </div>
                <p style="margin:0; font-size:12px; color:#6b7280;">
                  Este código es temporal, personal y solo puede usarse una vez.
                </p>
                """.formatted(demoCode);

        return buildInfoEmail(
                "Código de verificación para cambio de contraseña.",
                "Código de verificación",
                "Recibiste este mensaje porque se solicitó un cambio de contraseña para tu cuenta en TutorLink.",
                extraHtml
        );
    }

    public void sendLoginOtpEmail(String toEmail, String otpCode) {
    String subject = "TutorLink - Código de acceso";

    String extraHtml = """
            <p style="margin:0 0 12px; font-size:14px; color:#4b5563;">
              Estás intentando acceder a tu cuenta de TutorLink.
            </p>
            <p style="margin:0 0 16px; font-size:13px; color:#6b7280;">
              Ingresa este código en la pantalla de verificación para continuar con el inicio de sesión:
            </p>
            <div style="display:inline-block; padding:12px 20px; border-radius:999px;
                        background-color:#0f172a10; border:1px dashed #cbd5f5; margin-bottom:12px;">
              <span style="font-size:26px; font-weight:700; letter-spacing:6px; color:#111827;">
                %s
              </span>
            </div>
            <p style="margin:0; font-size:12px; color:#6b7280;">
              Este código expira en pocos minutos. Si no fuiste tú, puedes ignorar este mensaje.
            </p>
            """.formatted(otpCode);

    String html = buildInfoEmail(
            "Código de acceso a TutorLink",
            "Código de acceso",
            "Tu código de verificación está listo para continuar con el inicio de sesión.",
            extraHtml
    );

    sendEmail(toEmail, subject, html);
}

}
