package com.sinoe.authmfa.web;

import com.sinoe.authmfa.dto.AuthDtos;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import com.sinoe.authmfa.service.AcademicService.AcademicConflictException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<AuthDtos.ApiMessage> handleValidation(MethodArgumentNotValidException ex) {
        log.warn("Validation error", ex);
        var field = ex.getBindingResult().getFieldErrors().stream().findFirst();
        String msg = field.map(f -> f.getField() + ": " + f.getDefaultMessage()).orElse("Datos inválidos");
        return ResponseEntity.badRequest().body(new AuthDtos.ApiMessage(msg));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<AuthDtos.ApiMessage> handleConstraint(ConstraintViolationException ex) {
        log.warn("Constraint violation", ex);
        return ResponseEntity.badRequest().body(new AuthDtos.ApiMessage(ex.getMessage()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<AuthDtos.ApiMessage> notFound(EntityNotFoundException ex) {
        log.warn("Entity not found", ex);
        return ResponseEntity.status(404).body(new AuthDtos.ApiMessage(ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AuthDtos.ApiMessage> illegal(IllegalArgumentException ex) {
        log.warn("Illegal argument", ex);
        return ResponseEntity.badRequest().body(new AuthDtos.ApiMessage(ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<AuthDtos.ApiMessage> illegalState(IllegalStateException ex) {
        log.warn("Illegal state", ex);
        return ResponseEntity.badRequest().body(new AuthDtos.ApiMessage(ex.getMessage()));
    }

    @ExceptionHandler(AcademicConflictException.class)
    public ResponseEntity<AuthDtos.ApiMessage> conflict(AcademicConflictException ex) {
        return ResponseEntity.status(409).body(new AuthDtos.ApiMessage(ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<AuthDtos.ApiMessage> accessDenied() {
        return ResponseEntity.status(403).body(new AuthDtos.ApiMessage("Operación no autorizada"));
    }
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<AuthDtos.ApiMessage> security(SecurityException ex) {
        log.warn("Security exception", ex);
        return ResponseEntity.status(403).body(new AuthDtos.ApiMessage(ex.getMessage()));
    }

    @ExceptionHandler(ErrorResponseException.class)
    public ResponseEntity<AuthDtos.ApiMessage> errorResponse(ErrorResponseException ex) {
        log.warn("Error response exception", ex);
        String message = ex.getBody().getDetail();
        return ResponseEntity.status(ex.getStatusCode()).body(new AuthDtos.ApiMessage(message));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<AuthDtos.ApiMessage> generic(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(500).body(new AuthDtos.ApiMessage("Error interno: " + ex.getMessage()));
    }
}
