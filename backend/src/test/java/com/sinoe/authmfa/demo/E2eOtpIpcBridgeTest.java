package com.sinoe.authmfa.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinoe.authmfa.domain.otp.OtpCode;
import com.sinoe.authmfa.domain.otp.OtpRepository;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.domain.user.UserRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mockito;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

class E2eOtpIpcBridgeTest {
    private static final String SECRET = "e2e-test-secret-with-at-least-thirty-two-bytes";
    private static final String EMAIL = "e2e-user@example.invalid";
    private static final String TOKEN = "challenge-public-id";
    private static final String CODE = "123456";

    @TempDir Path temporaryDirectory;

    @Test void rejectsWrongSecretUnknownExpiredConsumedAndOtherUser() {
        OtpRepository otps = Mockito.mock(OtpRepository.class);
        UserRepository users = Mockito.mock(UserRepository.class);
        DemoMailbox mailbox = mailbox();
        E2eOtpIpcBridge bridge = bridge(mailbox, otps, users);
        when(otps.findByPublicIdAndPurpose(TOKEN, "LOGIN")).thenReturn(Optional.of(otp(false, Instant.now().plusSeconds(60))));
        when(users.findById(7L)).thenReturn(Optional.of(user(EMAIL)));

        assertThat(bridge.resolve(request("incorrect", EMAIL, TOKEN))).isNull();
        when(otps.findByPublicIdAndPurpose("missing", "LOGIN")).thenReturn(Optional.empty());
        assertThat(bridge.resolve(request(SECRET, EMAIL, "missing"))).isNull();
        when(otps.findByPublicIdAndPurpose(TOKEN, "LOGIN")).thenReturn(Optional.of(otp(false, Instant.now().minusSeconds(1))));
        assertThat(bridge.resolve(request(SECRET, EMAIL, TOKEN))).isNull();
        when(otps.findByPublicIdAndPurpose(TOKEN, "LOGIN")).thenReturn(Optional.of(otp(true, Instant.now().plusSeconds(60))));
        assertThat(bridge.resolve(request(SECRET, EMAIL, TOKEN))).isNull();
        when(otps.findByPublicIdAndPurpose(TOKEN, "LOGIN")).thenReturn(Optional.of(otp(false, Instant.now().plusSeconds(60))));
        assertThat(bridge.resolve(request(SECRET, "other@example.invalid", TOKEN))).isNull();
    }

    @Test void resolvesOnlyMatchingLiveChallengeAndSupportsConcurrentRequests() throws Exception {
        OtpRepository otps = Mockito.mock(OtpRepository.class);
        UserRepository users = Mockito.mock(UserRepository.class);
        DemoMailbox mailbox = mailbox();
        E2eOtpIpcBridge bridge = bridge(mailbox, otps, users);
        when(otps.findByPublicIdAndPurpose(TOKEN, "LOGIN")).thenReturn(Optional.of(otp(false, Instant.now().plusSeconds(60))));
        when(users.findById(7L)).thenReturn(Optional.of(user(EMAIL)));

        var executor = Executors.newFixedThreadPool(4);
        try {
            List<Callable<String>> requests = java.util.stream.IntStream.range(0, 12)
                    .<Callable<String>>mapToObj(i -> () -> bridge.resolve(request(SECRET, EMAIL, TOKEN))).toList();
            assertThat(executor.invokeAll(requests).stream().map(future -> {
                try { return future.get(); } catch (Exception ex) { throw new AssertionError(ex); }
            })).containsOnly(CODE);
        } finally { executor.shutdownNow(); }
    }

    @Test void cleansSocketPathAndMailboxOnStop() throws Exception {
        DemoMailbox mailbox = mailbox();
        Path socket = temporaryDirectory.resolve("otp.sock");
        E2eOtpIpcBridge bridge = new E2eOtpIpcBridge(mailbox, Mockito.mock(OtpRepository.class), Mockito.mock(UserRepository.class), new ObjectMapper(), SECRET, socket.toString());
        // The Maven sandbox intentionally forbids bind(2) for AF_UNIX. The
        // actual bind/connect path is exercised by the non-sandboxed E2E run.
        Files.createFile(socket);
        assertThat(Files.exists(socket)).isTrue();
        bridge.stop();
        assertThat(bridge.isRunning()).isFalse();
        assertThat(Files.exists(socket)).isFalse();
        assertThat(mailbox.latestFor(EMAIL)).isEmpty();
    }

    @Test void isNotRegisteredWithoutBothDemoAndE2eProfiles() {
        try (AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext()) {
            context.getEnvironment().setActiveProfiles("demo");
            context.registerBean(DemoMailbox.class);
            context.register(E2eOtpIpcBridge.class);
            context.refresh();
            assertThat(context.getBeansOfType(E2eOtpIpcBridge.class)).isEmpty();
        }
    }

    private E2eOtpIpcBridge bridge(DemoMailbox mailbox, OtpRepository otps, UserRepository users) {
        return new E2eOtpIpcBridge(mailbox, otps, users, new ObjectMapper(), SECRET, temporaryDirectory.resolve("otp.sock").toString());
    }
    private DemoMailbox mailbox() { DemoMailbox mailbox = new DemoMailbox(); mailbox.add(EMAIL, "OTP", "Código " + CODE); return mailbox; }
    private OtpCode otp(boolean consumed, Instant expiresAt) { return OtpCode.builder().userId(7L).publicId(TOKEN).code(CODE).purpose("LOGIN").expiresAt(expiresAt).consumed(consumed).build(); }
    private User user(String email) { return User.builder().id(7L).email(email).build(); }
    private String request(String secret, String email, String token) { return "{\"secret\":\"" + secret + "\",\"email\":\"" + email + "\",\"otpToken\":\"" + token + "\"}"; }
}
