package com.sinoe.authmfa.web.dev;

import com.sinoe.authmfa.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Profile("dev") // solo se expone en perfil dev
@RestController
@RequestMapping("/dev/email-preview")
@RequiredArgsConstructor
public class EmailPreviewController {

    private final EmailService emailService;

    @GetMapping(value = "/first-login", produces = MediaType.TEXT_HTML_VALUE)
    public String previewFirstLoginEmail() {
        return emailService.buildFirstLoginEmailHtmlExample();
    }

    @GetMapping(value = "/password-otp", produces = MediaType.TEXT_HTML_VALUE)
    public String previewPasswordOtpEmail() {
        return emailService.buildPasswordChangeOtpEmailHtmlExample();
    }
}
