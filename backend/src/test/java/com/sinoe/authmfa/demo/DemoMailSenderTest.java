package com.sinoe.authmfa.demo;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
class DemoMailSenderTest {
    @Test
    void printsOtpAndActivationLinkWithoutSmtp(CapturedOutput output) throws Exception {
        var sender = new DemoMailSender();
        sender.setHost("unreachable.invalid");
        var otp = new SimpleMailMessage();
        otp.setTo("student@example.invalid");
        otp.setSubject("OTP demo");
        otp.setText("Tu código es 123456");
        sender.send(otp);
        var message = sender.createMimeMessage();
        var helper = new MimeMessageHelper(message, "UTF-8");
        helper.setTo("student@example.invalid");
        helper.setSubject("Activación demo");
        helper.setText("<a href='http://localhost/first-login?token=demo'>Activar</a>", true);
        sender.send(message);
        assertThat(output).contains("123456", "http://localhost/first-login?token=demo");
    }
}
