package com.sinoe.authmfa.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private static final String SECRET = "01234567890123456789012345678901";

    @Test
    void shouldGenerateAndParseTokenWithExpectedClaims() {
        JwtService service = new JwtService(SECRET, 120);

        String token = service.generate(
                Map.of("role", "ADMIN", "uid", 7L),
                "admin@tutorlink.test");

        Jws<Claims> parsed = service.parse(token);

        assertEquals("admin@tutorlink.test", parsed.getBody().getSubject());
        assertEquals("ADMIN", parsed.getBody().get("role"));
        assertEquals(7, ((Number) parsed.getBody().get("uid")).intValue());
        assertNotNull(parsed.getBody().getIssuedAt());
        assertNotNull(parsed.getBody().getExpiration());
        assertTrue(parsed.getBody().getExpiration().after(parsed.getBody().getIssuedAt()));
    }

    @Test
    void shouldRejectTokenSignedWithDifferentSecret() {
        JwtService issuer = new JwtService(SECRET, 120);
        JwtService validator = new JwtService("abcdefghijklmnopqrstuvwxyz123456", 120);

        String token = issuer.generate(Map.of("role", "TUTOR"), "tutor@tutorlink.test");

        assertThrows(JwtException.class, () -> validator.parse(token));
    }

    @Test
    void shouldRejectMalformedToken() {
        JwtService service = new JwtService(SECRET, 120);

        assertThrows(JwtException.class, () -> service.parse("this.is.not.a.valid.jwt"));
    }
}
