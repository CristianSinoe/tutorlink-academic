package com.sinoe.authmfa.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;

@Service
public class RecaptchaService {

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
                .uri("https://www.google.com/recaptcha/api/siteverify")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(RecaptchaResponse.class);

        return resp != null && resp.success;
    }

    public static class RecaptchaResponse {
        public boolean success;
        @JsonProperty("score")
        public Double score;
        @JsonProperty("action")
        public String action;
        @JsonProperty("challenge_ts")
        public String challengeTs;
        @JsonProperty("hostname")
        public String hostname;
        @JsonProperty("error-codes")
        public String[] errorCodes;
    }
}
