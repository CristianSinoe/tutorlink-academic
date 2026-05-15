package com.sinoe.authmfa.web;

import com.sinoe.authmfa.dto.AuthDtos;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AuthDtos.ApiMessage> handleValidation(MethodArgumentNotValidException ex) {
        var field = ex.getBindingResult().getFieldErrors().stream().findFirst();
        String msg = field.map(f -> f.getField() + ": " + f.getDefaultMessage()).orElse("Datos inválidos");
        return ResponseEntity.badRequest().body(new AuthDtos.ApiMessage(msg));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<AuthDtos.ApiMessage> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.badRequest().body(new AuthDtos.ApiMessage(ex.getMessage()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<AuthDtos.ApiMessage> notFound(EntityNotFoundException ex) {
        return ResponseEntity.status(404).body(new AuthDtos.ApiMessage(ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AuthDtos.ApiMessage> illegal(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(new AuthDtos.ApiMessage(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<AuthDtos.ApiMessage> generic(Exception ex) {
        return ResponseEntity.status(500).body(new AuthDtos.ApiMessage("Error interno: " + ex.getMessage()));
    }
}
