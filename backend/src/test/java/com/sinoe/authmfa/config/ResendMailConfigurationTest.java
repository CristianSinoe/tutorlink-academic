package com.sinoe.authmfa.config;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import com.sinoe.authmfa.service.ResendMailSender;
import com.sinoe.authmfa.service.EmailService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ResendMailConfigurationTest {
    private final ApplicationContextRunner context = new ApplicationContextRunner().withUserConfiguration(ResendMailConfiguration.class);

    @Test void requiresKeyOnlyWhenResendIsSelectedAndKeepsDemoIsolated() {
        context.run(c -> assertThat(c).doesNotHaveBean(Resend.class));
        context.withPropertyValues("tutorlink.mail.provider=resend").run(c -> {
            assertThat(c).hasFailed();
            assertThat(c.getStartupFailure()).hasStackTraceContaining("RESEND_API_KEY");
        });
        context.withPropertyValues("spring.profiles.active=demo", "tutorlink.mail.provider=resend")
                .run(c -> assertThat(c).hasNotFailed().doesNotHaveBean(Resend.class));
        context.withPropertyValues("tutorlink.mail.provider=resend", "resend.api-key=synthetic-key")
                .run(c -> assertThat(c).hasNotFailed().hasSingleBean(JavaMailSender.class).getBean(JavaMailSender.class).isInstanceOf(ResendMailSender.class));
    }

    @Test void sendsOtpAndExistingActivityTemplatesWithoutChangingTheirContents() throws Exception {
        var emails = mock(ResendMailSender.EmailSender.class);
        var response = mock(CreateEmailResponse.class); when(response.getId()).thenReturn("synthetic-message-id");
        when(emails.send(any(CreateEmailOptions.class))).thenReturn(response);
        var sender = new ResendMailSender(emails, "TutorLink <noreply@tutorlink.lat>");
        var service = new EmailService(sender);
        ReflectionTestUtils.setField(service, "fromEmail", "TutorLink <noreply@tutorlink.lat>");
        ReflectionTestUtils.setField(service, "frontendBaseUrl", "https://app.example.org");
        service.sendLoginOtpEmail("person@example.invalid", "123456");
        service.sendEmail("person@example.invalid", "Actividad actualizada", "<p>Consulta tu actividad.</p>");
        var options = ArgumentCaptor.forClass(CreateEmailOptions.class);
        verify(emails, times(2)).send(options.capture());
        assertThat(options.getAllValues().get(0).getHtml()).contains("123456");
        assertThat(options.getAllValues().get(1).getHtml()).isEqualTo("<p>Consulta tu actividad.</p>");
        assertThat(options.getValue().getFrom()).isEqualTo("TutorLink <noreply@tutorlink.lat>");
        assertThat(options.getValue().getTo()).containsExactly("person@example.invalid");
    }

    @Test void mapsPlainTextAndMultipartAndDoesNotRetryOrLeakProviderErrors() throws Exception {
        var emails = mock(ResendMailSender.EmailSender.class);
        var response = mock(CreateEmailResponse.class); when(response.getId()).thenReturn("message-id");
        when(emails.send(any(CreateEmailOptions.class))).thenReturn(response);
        var sender = new ResendMailSender(emails, "TutorLink <noreply@tutorlink.lat>");
        var plain = new SimpleMailMessage(); plain.setTo("person@example.invalid"); plain.setSubject("OTP"); plain.setText("Código 123456"); sender.send(plain);
        var mime = sender.createMimeMessage(); var helper = new MimeMessageHelper(mime, true, "UTF-8");
        helper.setTo("person@example.invalid"); helper.setSubject("Alternativas"); helper.setText("Texto", "<p>HTML</p>"); sender.send(mime);
        var captor = ArgumentCaptor.forClass(CreateEmailOptions.class); verify(emails,times(2)).send(captor.capture());
        assertThat(captor.getAllValues().get(0).getText()).contains("123456");
        assertThat(captor.getValue().getText()).isEqualTo("Texto"); assertThat(captor.getValue().getHtml()).isEqualTo("<p>HTML</p>");
        reset(emails); when(emails.send(any(CreateEmailOptions.class))).thenThrow(new ResendException("PRIVATE-OTP-123456"));
        assertThatThrownBy(() -> sender.send(plain)).isInstanceOf(MailSendException.class)
                .hasMessage("No se pudo enviar el correo mediante Resend").hasNoCause();
        verify(emails,times(1)).send(any(CreateEmailOptions.class));
    }

    @Test void rejectsAttachmentsBeforeMakingExternalCalls() throws Exception {
        var emails = mock(ResendMailSender.EmailSender.class); var sender = new ResendMailSender(emails,"TutorLink <noreply@tutorlink.lat>");
        var mime = sender.createMimeMessage(); var helper = new MimeMessageHelper(mime,true,"UTF-8");
        helper.setTo("person@example.invalid"); helper.setSubject("Adjunto"); helper.setText("body");
        helper.addAttachment("private.txt", new org.springframework.core.io.ByteArrayResource(new byte[]{1}));
        assertThatThrownBy(() -> sender.send(mime)).isInstanceOf(MailSendException.class);
        verifyNoInteractions(emails);
    }
}
