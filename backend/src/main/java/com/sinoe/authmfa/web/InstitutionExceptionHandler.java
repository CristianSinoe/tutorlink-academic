package com.sinoe.authmfa.web;

import com.sinoe.authmfa.dto.AuthDtos.ApiMessage;
import com.sinoe.authmfa.service.AcademicService.AcademicConflictException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice(assignableTypes={InstitutionAdminController.class,InstitutionInvitationController.class,AdminUserController.class,
        com.sinoe.authmfa.web.academic.AcademicAdminController.class,com.sinoe.authmfa.web.academic.TeacherAcademicController.class,
        com.sinoe.authmfa.web.academic.StudentAcademicController.class})
@Order(Ordered.HIGHEST_PRECEDENCE)
public class InstitutionExceptionHandler {
    @ExceptionHandler(AccessDeniedException.class) public ResponseEntity<ApiMessage> denied(){return ResponseEntity.status(403).body(new ApiMessage("Operación no autorizada en la institución activa"));}
    @ExceptionHandler({AcademicConflictException.class,DataIntegrityViolationException.class}) public ResponseEntity<ApiMessage> conflict(){return ResponseEntity.status(409).body(new ApiMessage("Conflicto con el estado o relaciones existentes"));}
    @ExceptionHandler({IllegalArgumentException.class,ConstraintViolationException.class,HttpMessageNotReadableException.class,
            MethodArgumentNotValidException.class,ServletRequestBindingException.class,MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiMessage> invalid(){return ResponseEntity.badRequest().body(new ApiMessage("Datos inválidos"));}
    @ExceptionHandler(Exception.class) public ResponseEntity<ApiMessage> internal(){return ResponseEntity.internalServerError().body(new ApiMessage("Error interno"));}
}
