package com.sinoe.authmfa.config;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Set;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

@Configuration(proxyBeanMethods = false)
@Profile("prod")
public class ProductionConfiguration {
    /** Validate before any demo seeder/mail sender/datasource is instantiated. */
    @Bean
    static BeanFactoryPostProcessor productionGuard(Environment environment) {
        return factory -> validate(environment);
    }

    static void validate(Environment env) {
        if (Arrays.stream(env.getActiveProfiles()).anyMatch(Set.of("dev", "demo", "demo-snapshot", "e2e", "test")::contains))
            fail("prod no puede combinarse con perfiles de desarrollo o pruebas");
        if (env.getProperty("app.seed-admin.enabled", Boolean.class, false)
                || env.getProperty("admin.bootstrap.enabled", Boolean.class, false))
            fail("Desactiva seed-admin y bootstrap en producción");
        if (!"resend".equals(env.getProperty("tutorlink.mail.provider"))) fail("prod requiere Resend");
        for (var key : new String[]{"resend.api-key", "spring.datasource.username", "spring.datasource.password", "security.jwt.secret", "recaptcha.site-key", "recaptcha.secret-key"}) {
            var value = env.getProperty(key, "");
            if (value.isBlank() || value.contains("change_me") || value.startsWith("replace_") || value.startsWith("your_"))
                fail("Falta configurar " + key);
        }
        if (env.getProperty("recaptcha.site-key", "").startsWith("6LeIxAcT")
                || env.getProperty("recaptcha.secret-key", "").startsWith("6LeIxAcT"))
            fail("No uses reCAPTCHA de prueba en producción");
        var frontend = env.getRequiredProperty("tutorlink.frontend-base-url");
        exactHttpsOrigin(frontend);
        var origins = env.getRequiredProperty("tutorlink.security.cors.allowed-origin-patterns").split(",");
        for (var origin : origins) exactHttpsOrigin(origin.trim());
        if (Arrays.stream(origins).map(String::trim).noneMatch(frontend::equals)) fail("CORS debe incluir el origen del frontend");
        var url = env.getRequiredProperty("spring.datasource.url");
        if (!url.startsWith("jdbc:postgresql://") || !url.contains("sslmode=verify-full&sslrootcert="))
            fail("PostgreSQL requiere TLS verify-full y certificado CA");
        var certificate = url.substring(url.indexOf("sslrootcert=") + "sslrootcert=".length()).split("&")[0];
        if (!Files.isReadable(Path.of(certificate))) fail("Falta el archivo CA de Aiven");
    }

    private static void exactHttpsOrigin(String value) {
        try {
            var uri = URI.create(value);
            if (!"https".equals(uri.getScheme()) || uri.getHost() == null || value.contains("*")
                    || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null
                    || (uri.getPath() != null && !uri.getPath().isEmpty())) throw new IllegalArgumentException();
        } catch (IllegalArgumentException error) { fail("Configura orígenes HTTPS exactos, sin rutas ni comodines"); }
    }

    private static void fail(String message) { throw new IllegalStateException(message); }
}
