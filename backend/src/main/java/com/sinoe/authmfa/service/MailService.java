package com.sinoe.authmfa.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {
  private final JavaMailSender mailSender;

  public void sendOtp(String to, String code) {
    SimpleMailMessage msg = new SimpleMailMessage();
    msg.setTo(to);
    msg.setSubject("Tu código OTP");
    msg.setText("Tu código de verificación es: " + code + "\nExpira en 5 minutos.");
    mailSender.send(msg);
  }
}
