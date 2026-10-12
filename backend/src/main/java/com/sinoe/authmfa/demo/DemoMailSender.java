package com.sinoe.authmfa.demo;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/** No SMTP connection in demo. OTPs and activation links are visible only in the console. */
public class DemoMailSender extends JavaMailSenderImpl {
    @Override
    protected void doSend(MimeMessage[] messages, Object[] originals) {
        for (MimeMessage message : messages) {
            try {
                System.out.println("[DEMO · correo simulado] " + message.getSubject());
                System.out.println(message.getContent());
            } catch (Exception ex) {
                throw new MailSendException("No se pudo mostrar el correo demo", ex);
            }
        }
    }
}
