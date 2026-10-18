package com.sinoe.authmfa.demo;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
class DemoMailConfigurationTest {
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(DemoMailConfiguration.class);

    @Test
    void manualDemoPrintsTheLoginEmailInTheConsole(CapturedOutput output) {
        runner.withPropertyValues("spring.profiles.active=demo").run(context -> {
            assertThat(context).hasNotFailed().hasSingleBean(JavaMailSender.class);
            var sender = context.getBean(JavaMailSender.class);
            assertThat(sender).isInstanceOf(DemoMailSender.class);
            sendOtp(sender);
            assertThat(output).contains("[DEMO · correo simulado]", "Código de inicio de sesión", "123456");
        });
    }

    @Test
    void e2eCapturesTheLoginEmailWithoutPrintingItsContents(CapturedOutput output) {
        runner.withPropertyValues("spring.profiles.active=demo,e2e").run(context -> {
            assertThat(context).hasNotFailed().hasSingleBean(JavaMailSender.class);
            var sender = context.getBean(JavaMailSender.class);
            assertThat(sender).isInstanceOf(InMemoryDemoMailSender.class);
            sendOtp(sender);
            assertThat(context.getBean(DemoMailbox.class).latestFor("admin1.demo15@example.invalid"))
                    .hasValueSatisfying(message -> assertThat(message.body()).contains("123456"));
            assertThat(output).doesNotContain("123456", "[DEMO · correo simulado]");
        });
    }

    @Test
    void normalRuntimeDoesNotInstallADemoMailSender() {
        runner.withPropertyValues("spring.profiles.active=prod").run(context -> {
            assertThat(context).hasNotFailed().doesNotHaveBean(JavaMailSender.class)
                    .doesNotHaveBean(DemoMailbox.class);
        });
    }

    private void sendOtp(JavaMailSender sender) throws Exception {
        var message = sender.createMimeMessage();
        var helper = new MimeMessageHelper(message, "UTF-8");
        helper.setTo("admin1.demo15@example.invalid");
        helper.setSubject("Código de inicio de sesión");
        helper.setText("<p>Tu código es <strong>123456</strong></p>", true);
        sender.send(message);
    }
}
