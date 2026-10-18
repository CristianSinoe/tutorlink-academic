package com.sinoe.authmfa.web;

import com.sinoe.authmfa.dto.AuthDtos.ApiMessage;
import com.sinoe.authmfa.service.AttachmentService.Conflict;
import jakarta.validation.ConstraintViolationException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/** Keep sanitized errors local to attachments without changing legacy response policies. */
@RestControllerAdvice(assignableTypes = AttachmentController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AttachmentExceptionHandler {
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiMessage> denied() {
        return ResponseEntity.status(403).body(new ApiMessage("No tienes autorización sobre esta referencia de adjunto"));
    }
    @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class,
            HttpMessageNotReadableException.class, MethodArgumentNotValidException.class,
            ServletRequestBindingException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiMessage> invalid() {
        return ResponseEntity.badRequest().body(new ApiMessage("Datos de adjunto inválidos"));
    }
    @ExceptionHandler(Conflict.class)
    public ResponseEntity<ApiMessage> conflict(Conflict ex) {
        return ResponseEntity.status(409).body(new ApiMessage(ex.getMessage()));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiMessage> internal() {
        return ResponseEntity.internalServerError().body(new ApiMessage("Error interno"));
    }
}
