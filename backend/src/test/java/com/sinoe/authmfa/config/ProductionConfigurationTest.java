package com.sinoe.authmfa.config;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.env.MockEnvironment;
import static org.assertj.core.api.Assertions.*;

class ProductionConfigurationTest {
    @TempDir Path temporary;
    private MockEnvironment valid() throws Exception {
        var ca=Files.writeString(temporary.resolve("ca.pem"), "synthetic-ca-test");
        var env=new MockEnvironment(); env.setActiveProfiles("prod");
        return env.withProperty("tutorlink.mail.provider","resend").withProperty("resend.api-key","synthetic-api-key")
                .withProperty("spring.datasource.username","synthetic-user").withProperty("spring.datasource.password","synthetic-password")
                .withProperty("spring.datasource.url","jdbc:postgresql://db.example.org:5432/pilot?sslmode=verify-full&sslrootcert="+ca)
                .withProperty("security.jwt.secret","synthetic-jwt-key").withProperty("recaptcha.site-key","synthetic-public-key")
                .withProperty("recaptcha.secret-key","synthetic-private-key").withProperty("tutorlink.frontend-base-url","https://app.example.org")
                .withProperty("tutorlink.security.cors.allowed-origin-patterns","https://app.example.org");
    }
    @Test void acceptsExplicitProductionConfiguration() throws Exception { assertThatCode(() -> ProductionConfiguration.validate(valid())).doesNotThrowAnyException(); }
    @Test void rejectsMixedProfilesBeforeCreatingBeans() throws Exception {
        var env=valid(); env.setActiveProfiles("prod","demo");
        assertThatThrownBy(() -> ProductionConfiguration.validate(env)).hasMessageContaining("perfiles");
    }
    @Test void rejectsWildcardsAndDevelopmentRecaptcha() throws Exception {
        var env=valid().withProperty("tutorlink.security.cors.allowed-origin-patterns","https://*.example.org");
        assertThatThrownBy(() -> ProductionConfiguration.validate(env)).hasMessageContaining("orígenes HTTPS");
        final var invalid=valid().withProperty("recaptcha.site-key","6LeIxAcT-synthetic");
        assertThatThrownBy(() -> ProductionConfiguration.validate(invalid)).hasMessageContaining("reCAPTCHA de prueba");
    }
    @Test void rejectsMissingSecretsUnsafeDatabaseAndBootstrap() throws Exception {
        var noKey=valid().withProperty("resend.api-key","");
        assertThatThrownBy(() -> ProductionConfiguration.validate(noKey)).hasMessageContaining("resend.api-key");
        var unsafe=valid().withProperty("spring.datasource.url","jdbc:postgresql://db.example.org/db?sslmode=disable");
        assertThatThrownBy(() -> ProductionConfiguration.validate(unsafe)).hasMessageContaining("TLS");
        var bootstrap=valid().withProperty("admin.bootstrap.enabled","true");
        assertThatThrownBy(() -> ProductionConfiguration.validate(bootstrap)).hasMessageContaining("bootstrap");
        var missingCa=valid().withProperty("spring.datasource.url","jdbc:postgresql://db.example.org/db?sslmode=verify-full&sslrootcert=/missing-file");
        assertThatThrownBy(() -> ProductionConfiguration.validate(missingCa)).hasMessageContaining("archivo CA");
    }
}
