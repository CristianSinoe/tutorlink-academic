package com.sinoe.authmfa.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinoe.authmfa.domain.otp.OtpCode;
import com.sinoe.authmfa.domain.otp.OtpRepository;
import com.sinoe.authmfa.domain.user.UserRepository;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.net.StandardProtocolFamily;
import java.net.UnixDomainSocketAddress;
import java.nio.channels.Channels;
import java.nio.channels.ServerSocketChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermission;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.SmartLifecycle;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Local-only OTP bridge for Cypress. It is deliberately absent from every HTTP
 * controller and only exists when both non-production profiles are selected.
 */
@Component
@Profile("demo & e2e")
public final class E2eOtpIpcBridge implements SmartLifecycle {
    private static final int MAX_REQUEST_LENGTH = 4096;
    private final DemoMailbox mailbox;
    private final OtpRepository otps;
    private final UserRepository users;
    private final ObjectMapper json;
    private final String token;
    private final Path socket;
    private final ExecutorService workers = Executors.newCachedThreadPool(r -> {
        Thread thread = new Thread(r, "tutorlink-e2e-otp-ipc"); thread.setDaemon(true); return thread;
    });
    private volatile boolean running;
    private ServerSocketChannel server;

    public E2eOtpIpcBridge(DemoMailbox mailbox, OtpRepository otps, UserRepository users, ObjectMapper json,
            @Value("${tutorlink.e2e.ipc.token:}") String token,
            @Value("${tutorlink.e2e.ipc.socket:}") String socket) {
        this.mailbox = mailbox; this.otps = otps; this.users = users; this.json = json;
        this.token = token; this.socket = socket == null || socket.isBlank() ? null : Path.of(socket);
    }

    @Override public synchronized void start() {
        if (running) return;
        if (token == null || token.length() < 32 || socket == null || !socket.isAbsolute())
            throw new IllegalStateException("E2E OTP IPC requiere token local y socket Unix absoluto");
        try {
            Path parent = socket.getParent();
            if (parent == null || !Files.isDirectory(parent)) throw new IllegalStateException("Directorio IPC E2E inválido");
            setPermissions(parent, Set.of(PosixFilePermission.OWNER_READ, PosixFilePermission.OWNER_WRITE, PosixFilePermission.OWNER_EXECUTE));
            Files.deleteIfExists(socket);
            server = ServerSocketChannel.open(StandardProtocolFamily.UNIX);
            server.bind(UnixDomainSocketAddress.of(socket));
            setPermissions(socket, Set.of(PosixFilePermission.OWNER_READ, PosixFilePermission.OWNER_WRITE));
            running = true;
            workers.submit(this::serve);
        } catch (IOException ex) { throw new IllegalStateException("No se pudo iniciar IPC OTP E2E", ex); }
    }

    private void serve() {
        while (running) try { var client = server.accept(); workers.submit(() -> respond(client)); }
        catch (IOException ignored) { if (running) stop(); }
    }
    private void respond(java.nio.channels.SocketChannel client) {
        try (client; var input = new BufferedReader(Channels.newReader(client, StandardCharsets.UTF_8));
                var output = new BufferedWriter(Channels.newWriter(client, StandardCharsets.UTF_8))) {
            String request = input.readLine();
            String code = request != null && request.length() <= MAX_REQUEST_LENGTH ? resolve(request) : null;
            output.write(code == null ? "{\"ok\":false}\n" : json.writeValueAsString(java.util.Map.of("ok", true, "code", code)) + "\n");
            output.flush();
        } catch (Exception ignored) { /* responses intentionally disclose no OTP state */ }
    }
    /** Package-visible for isolated bridge tests; it never forms an HTTP API. */
    String resolve(String raw) {
        try {
            JsonNode request = json.readTree(raw);
            String supplied = request.path("secret").asText("");
            String email = request.path("email").asText("");
            String publicId = request.path("otpToken").asText("");
            if (!java.security.MessageDigest.isEqual(token.getBytes(StandardCharsets.UTF_8), supplied.getBytes(StandardCharsets.UTF_8))) return null;
            OtpCode otp = otps.findByPublicIdAndPurpose(publicId, "LOGIN").orElse(null);
            if (otp == null || otp.isConsumed() || otp.getExpiresAt().isBefore(Instant.now())) return null;
            var user = users.findById(otp.getUserId()).orElse(null);
            if (user == null || !user.getEmail().equalsIgnoreCase(email) || !mailbox.containsCode(email, otp.getCode())) return null;
            return otp.getCode();
        } catch (Exception ignored) { return null; }
    }
    private static void setPermissions(Path path, Set<PosixFilePermission> permissions) {
        try { Files.setPosixFilePermissions(path, permissions); } catch (UnsupportedOperationException | IOException ignored) { }
    }
    @Override public synchronized void stop() {
        running = false; try { if (server != null) server.close(); } catch (IOException ignored) { }
        workers.shutdownNow(); mailbox.clear(); try { if (socket != null) Files.deleteIfExists(socket); } catch (IOException ignored) { }
    }
    @Override public boolean isRunning() { return running; }
    @Override public int getPhase() { return Integer.MAX_VALUE; }
}
