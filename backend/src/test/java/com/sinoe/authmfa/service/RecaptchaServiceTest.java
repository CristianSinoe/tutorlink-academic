package com.sinoe.authmfa.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class RecaptchaServiceTest {
    @Test
    void springCreatesTheServiceUsingTheConfiguredConstructor() {
        new ApplicationContextRunner()
                .withUserConfiguration(RecaptchaService.class)
                .withPropertyValues(
                        "spring.profiles.active=demo,e2e",
                        "recaptcha.secret-key=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe",
                        "tutorlink.e2e.recaptcha-token=per-run-token")
                .run(context -> {
                    assertThat(context).hasNotFailed().hasSingleBean(RecaptchaService.class);
                    var service = context.getBean(RecaptchaService.class);
                    assertThat(service.verify("per-run-token", "127.0.0.1")).isTrue();
                    assertThat(service.verify("wrong-token", "127.0.0.1")).isFalse();
                });
    }

    @Test
    void acceptsOnlyTheEphemeralTokenInTheIsolatedDemoE2eProfile() {
        var service = new RecaptchaService("6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe", "per-run-token", true);

        assertThat(service.verify("per-run-token", "127.0.0.1")).isTrue();
        assertThat(service.verify("e2e-local-test", "127.0.0.1")).isFalse();
        assertThat(service.verify(null, "127.0.0.1")).isFalse();
    }

    @Test
    void neverUsesTheLocalTokenOutsideTheIsolatedProfile() {
        var service = new RecaptchaService("", "per-run-token", false);

        assertThat(service.verify("per-run-token", "127.0.0.1")).isFalse();
    }

}
