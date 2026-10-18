package com.sinoe.authmfa.demo;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/** Never contacts SMTP and deliberately never logs message contents. */
final class InMemoryDemoMailSender extends JavaMailSenderImpl {
    private final DemoMailbox mailbox;
    InMemoryDemoMailSender(DemoMailbox mailbox) { this.mailbox = mailbox; }
    @Override protected void doSend(MimeMessage[] messages, Object[] originals) {
        for (MimeMessage message : messages) try {
            var recipients = message.getAllRecipients();
            if (recipients != null) for (var recipient : recipients) mailbox.add(recipient.toString(), message.getSubject(), String.valueOf(message.getContent()));
        } catch (Exception ex) { throw new MailSendException("No se pudo capturar el correo demo", ex); }
    }
}
