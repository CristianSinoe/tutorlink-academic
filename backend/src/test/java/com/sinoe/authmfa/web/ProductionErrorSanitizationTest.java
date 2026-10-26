package com.sinoe.authmfa.web;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
class ProductionErrorSanitizationTest {
    @Test void genericFailuresDoNotExposeProviderOrDatabaseDetails(CapturedOutput output) {
        var response=new GlobalExceptionHandler().generic(new RuntimeException("private-credentials-and-otp"));
        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(response.getBody().getMessage()).isEqualTo("Error interno");
        assertThat(output).doesNotContain("private-credentials-and-otp");
    }
}
