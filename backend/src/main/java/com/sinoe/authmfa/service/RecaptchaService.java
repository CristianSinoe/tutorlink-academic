package com.sinoe.authmfa.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;

@Service
public class RecaptchaService {

    private static final String VERIFY_URI = "https://www.google.com/recaptcha/api/siteverify";
    /** Google-published v2 test secret; accepted locally only with demo+e2e. */
    private static final String GOOGLE_TEST_SECRET = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

    private final String secret;
    private final String localE2eToken;
    private final boolean localE2e;
    private final RestClient http;

    @Autowired
    public RecaptchaService(@Value("${recaptcha.secret-key}") String secret,
            @Value("${tutorlink.e2e.recaptcha-token:}") String localE2eToken,
            Environment environment) {
        this.secret = secret;
        this.localE2eToken = localE2eToken;
        var profiles = Arrays.asList(environment.getActiveProfiles());
        this.localE2e = profiles.contains("demo") && profiles.contains("e2e");
        this.http = RestClient.create();
    }

    RecaptchaService(String secret, String localE2eToken, boolean localE2e) {
        this.secret = secret;
        this.localE2eToken = localE2eToken;
        this.localE2e = localE2e;
        this.http = RestClient.create();
    }

    public boolean verify(String token, String remoteIp) {
        if (secret == null || secret.isBlank())
            return false;
        // The real E2E runner cannot depend on outbound DNS/HTTP and sends a
        // per-run capability. This branch is impossible unless both isolated
        // non-production profiles are active; all other environments use the
        // Google verifier below.
        if (localE2e && GOOGLE_TEST_SECRET.equals(secret)) {
            return localE2eToken != null && !localE2eToken.isBlank() && token != null
                    && MessageDigest.isEqual(localE2eToken.getBytes(StandardCharsets.UTF_8),
                            token.getBytes(StandardCharsets.UTF_8));
        }
        var form = new LinkedMultiValueMap<String, String>();
        form.add("secret", secret);
        form.add("response", token);
        if (remoteIp != null)
            form.add("remoteip", remoteIp);

        RecaptchaResponse resp = http.post()
                .uri(VERIFY_URI)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(RecaptchaResponse.class);

        return resp != null && resp.isSuccess();
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class RecaptchaResponse {
        private boolean success;
        @JsonProperty("score")
        private Double score;
        @JsonProperty("action")
        private String action;
        @JsonProperty("challenge_ts")
        private String challengeTs;
        @JsonProperty("hostname")
        private String hostname;
        @JsonProperty("error-codes")
        private String[] errorCodes;
    }
}
