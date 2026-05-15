package com.sinoe.authmfa.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

@Service
public class RecaptchaService {

    private static final String VERIFY_URI = "https://www.google.com/recaptcha/api/siteverify";

    private final String secret;
    private final RestClient http;

    public RecaptchaService(@Value("${recaptcha.secret-key}") String secret) {
        this.secret = secret;
        this.http = RestClient.create();
    }

    public boolean verify(String token, String remoteIp) {
        if (secret == null || secret.isBlank())
            return false;
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
