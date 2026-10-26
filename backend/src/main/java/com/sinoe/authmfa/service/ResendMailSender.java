package com.sinoe.authmfa.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import jakarta.mail.Message;
import jakarta.mail.Part;
import jakarta.mail.Multipart;
import jakarta.mail.internet.MimeMessage;
import java.util.Arrays;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/** Keeps existing templates and OTP behavior; no SMTP connections or automatic retries. */
public final class ResendMailSender extends JavaMailSenderImpl {
    @FunctionalInterface
    public interface EmailSender { CreateEmailResponse send(CreateEmailOptions options) throws ResendException; }
    private final EmailSender sender;
    private final String from;

    public ResendMailSender(Resend client, String from) {
        this(options -> client.emails().send(options), from);
    }

    public ResendMailSender(EmailSender sender, String from) {
        this.sender = sender;
        this.from = from;
    }

    @Override
    protected void doSend(MimeMessage[] messages, Object[] originals) {
        for (var message : messages) {
            try {
                // JavaMail materializes MIME headers here (as the SMTP sender does).
                // Without this, newly built HTML messages report text/plain.
                message.saveChanges();
                var to = message.getRecipients(Message.RecipientType.TO);
                if (to == null || to.length == 0) throw new IllegalArgumentException();
                var options = CreateEmailOptions.builder().from(from)
                        .to(Arrays.stream(to).map(Object::toString).toArray(String[]::new))
                        .subject(message.getSubject());
                if (message.getRecipients(Message.RecipientType.CC) != null
                        || message.getRecipients(Message.RecipientType.BCC) != null)
                    throw new IllegalArgumentException();
                var replyTo = message.getReplyTo();
                if (replyTo != null) options.replyTo(Arrays.stream(replyTo).map(Object::toString).toArray(String[]::new));
                String[] body = new String[2];
                extractBody(message, body);
                if (body[0] != null) options.text(body[0]);
                if (body[1] != null) options.html(body[1]);
                if (body[0] == null && body[1] == null) throw new IllegalArgumentException();
                var response = sender.send(options.build());
                if (response == null || response.getId() == null || response.getId().isBlank())
                    throw new IllegalStateException();
            } catch (Exception failure) {
                // Provider errors may contain recipients, body, OTP or credentials.
                // Do not attach the original exception to an HTTP/loggable failure.
                throw new MailSendException("No se pudo enviar el correo mediante Resend");
            }
        }
    }

    private static void extractBody(Part part, String[] body) throws Exception {
        if (Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition()) || part.getFileName() != null)
            throw new IllegalArgumentException();
        if (part.isMimeType("text/plain")) body[0] = (String) part.getContent();
        else if (part.isMimeType("text/html")) body[1] = (String) part.getContent();
        else if (part.isMimeType("multipart/*")) {
            var multipart = (Multipart) part.getContent();
            for (int index = 0; index < multipart.getCount(); index++) extractBody(multipart.getBodyPart(index), body);
        } else throw new IllegalArgumentException();
    }
}
