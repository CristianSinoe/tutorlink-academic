package com.sinoe.authmfa.config;

import com.resend.Resend;
import com.sinoe.authmfa.service.ResendMailSender;
import jakarta.mail.internet.InternetAddress;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;

/** HTTPS transport behind the mail interface already used by OTP and alerts. */
@Configuration(proxyBeanMethods = false)
@Profile("!demo & !demo-snapshot")
@ConditionalOnProperty(name = "tutorlink.mail.provider", havingValue = "resend")
public class ResendMailConfiguration {
    @Bean
    Resend resendClient(@Value("${resend.api-key:}") String apiKey) {
        if (apiKey.isBlank()) throw new IllegalStateException("Configura RESEND_API_KEY en los secretos del backend");
        return new Resend(apiKey);
    }

    @Bean
    JavaMailSender resendMailSender(Resend client,
            @Value("${resend.from-email:TutorLink <noreply@tutorlink.lat>}") String from) throws Exception {
        var address = new InternetAddress(from, true);
        address.validate();
        return new ResendMailSender(client, from);
    }
}
