package com.sinoe.authmfa.web;

import com.sinoe.authmfa.dto.AuthDtos;
import com.sinoe.authmfa.service.RecaptchaService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PublicController {

    private final RecaptchaService recaptcha;

    @PostMapping("/recaptcha/verify")
    public ResponseEntity<AuthDtos.ApiMessage> verify(@RequestBody String token, HttpServletRequest req) {
        boolean ok = recaptcha.verify(token, req.getRemoteAddr());
        return ResponseEntity.ok(new AuthDtos.ApiMessage(ok ? "OK" : "FAIL"));
    }

    @GetMapping("/health")
    public String health() {
        return "ok";
    }
}
