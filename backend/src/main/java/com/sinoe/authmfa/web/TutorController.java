package com.sinoe.authmfa.web;

import com.sinoe.authmfa.domain.qa.*;
import com.sinoe.authmfa.dto.QaDtos;
import com.sinoe.authmfa.dto.qa.TutorDashboardSummaryDto;
import com.sinoe.authmfa.dto.qa.TutorHistoryItemDto;
import com.sinoe.authmfa.dto.qa.TutorRecentQuestionDto;
import com.sinoe.authmfa.service.AuditService;
import com.sinoe.authmfa.service.QaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.sinoe.authmfa.domain.user.User;
import com.sinoe.authmfa.dto.qa.TutorPendingQuestionDto;
import com.sinoe.authmfa.mapper.QaMapper;
import com.sinoe.authmfa.domain.user.Tutor;
import com.sinoe.authmfa.dto.qa.TutorProfileDto;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/tutor")
@RequiredArgsConstructor
public class TutorController {

    private final QuestionRepository questions;
    private final QaService qa;
    private final AuditService audit;
    private final AnswerRepository answers;

    record ApiMessage(String message) {
    }

    // LISTAR PREGUNTAS PENDIENTES

    @GetMapping("/questions/pending")
    public ResponseEntity<?> pending(@RequestParam(required = false) Scope scope) {

        List<Question> out = (scope == null)
                ? questions.findByStatusOrderByCreatedAtAsc(Status.PENDIENTE)
                : questions.findByStatusAndScopeOrderByCreatedAtAsc(Status.PENDIENTE, scope);

        return ResponseEntity.ok(out);
    }


    // RESPONDER

    @PostMapping("/questions/{id}/answer")
    public ResponseEntity<?> answer(
            @PathVariable("id") Long id,
            @Valid @RequestBody QaDtos.AnswerRequest dto,
            Authentication auth,
            HttpServletRequest req) {

        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        var ans = qa.publishOrCorrect(userId, id, dto.getBody(), false);

        audit.log(req, userId, "ANSWER", true, null, "publicada");

        // respuesta JSON sencilla
        java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("answerId", ans.getId());
        body.put("status", ans.getQuestion().getStatus().name());

        return ResponseEntity
                .created(URI.create("/api/student/questions/" + id))
                .body(body);
    }


    // CORREGIR

    @PostMapping("/questions/{id}/correct")
    public ResponseEntity<?> correct(
            @PathVariable("id") Long id,
            @Valid @RequestBody QaDtos.AnswerRequest dto,
            Authentication auth,
            HttpServletRequest req) {

        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        var ans = qa.publishOrCorrect(userId, id, dto.getBody(), true);

        audit.log(req, userId, "CORRECT", true, null, "corregida");

        java.util.Map<String, Object> body = new java.util.HashMap<>();
        body.put("answerId", ans.getId());
        body.put("status", ans.getQuestion().getStatus().name());

        return ResponseEntity
                .created(URI.create("/api/student/questions/" + id))
                .body(body);
    }


    // RECHAZAR

    @PostMapping("/questions/{id}/reject")
    public ResponseEntity<?> reject(
            @PathVariable("id") Long id, // 👈 CAMBIO
            @Valid @RequestBody QaDtos.RejectRequest dto,
            Authentication auth,
            HttpServletRequest req) {

        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        qa.reject(userId, id, dto.getReason());

        audit.log(req, userId, "REJECT", true, null, dto.getReason());

        return ResponseEntity.ok(new ApiMessage("REJECTED"));
    }


    // RECLASIFICAR

    @PostMapping("/questions/{id}/reclassify")
    public ResponseEntity<?> reclassify(
            @PathVariable("id") Long id, // 👈 CAMBIO
            @Valid @RequestBody QaDtos.ReclassifyRequest dto,
            Authentication auth,
            HttpServletRequest req) {

        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        qa.reclassify(userId, id, dto.getScope());

        audit.log(req, userId, "RECLASSIFY", true, null, "to " + dto.getScope());

        return ResponseEntity.ok(new ApiMessage("RECLASSIFIED"));
    }


    // DASHBOARD DEL TUTOR


    @GetMapping("/dashboard/summary")
    public ResponseEntity<TutorDashboardSummaryDto> dashboardSummary(Authentication auth) {

        String email = auth.getName();
        User user = qa.requireUserByEmail(email);

        TutorDashboardSummaryDto dto = qa.getTutorDashboardSummary(user.getId());

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/questions/recent")
    public ResponseEntity<List<TutorRecentQuestionDto>> recentQuestions(
            @RequestParam(name = "size", defaultValue = "5") int size,
            Authentication auth) {
        String email = auth.getName();
        User user = qa.requireUserByEmail(email);

        List<TutorRecentQuestionDto> list = qa.findRecentQuestionsForTutor(user.getId(), size);

        return new ResponseEntity<>(list, HttpStatus.OK);
    }

 
    // HISTORIAL DE RESPUESTAS (TUTOR)

    @GetMapping("/answers/history")
    public ResponseEntity<?> getAnswerHistoryForTutor(
            @RequestParam("questionId") Long questionId,
            Authentication auth) {
        // 1) Obtener al tutor autenticado
        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        Tutor tutor = qa.requireTutorByUserId(userId);

        // 2) Buscar la pregunta
        Question q = questions.findById(questionId).orElse(null);
        if (q == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiMessage("Pregunta no encontrada"));
        }

        // 3) Cargar todas las respuestas de esa pregunta
        List<Answer> allAnswers = answers.findByQuestion_IdOrderByVersionAsc(questionId);

        // 4) Verificar si hay al menos una respuesta de ESTE tutor
        boolean hasAnswersFromTutor = allAnswers.stream()
                .anyMatch(a -> a.getTutor() != null
                        && a.getTutor().getId().equals(tutor.getId()));

        if (!hasAnswersFromTutor) {
            // Si el tutor nunca respondió esta pregunta, devolvemos lista vacía
            return ResponseEntity.ok(List.of());
        }

        // 5) Mapear historial con el mismo DTO que usa el estudiante
        var list = allAnswers.stream()
                .map(QaMapper::toHistory)
                .toList();

        return ResponseEntity.ok(list);
    }


    // PREGUNTAS PENDIENTES DEL TUTOR

    @GetMapping("/questions/pending/my")
    public ResponseEntity<java.util.List<TutorPendingQuestionDto>> myPendingQuestions(
            @RequestParam(name = "scope", required = false) String scope,
            @RequestParam(name = "q", required = false) String text,
            Authentication auth) {
        String email = auth.getName();
        User user = qa.requireUserByEmail(email);

        java.util.List<TutorPendingQuestionDto> list = qa.findPendingQuestionsForTutor(user.getId(), scope, text);

        return ResponseEntity.ok(list);
    }


    // HISTORIAL DE RESPUESTAS (LISTADO)

    @GetMapping("/questions/history")
    public ResponseEntity<java.util.List<TutorHistoryItemDto>> history(
            Authentication auth,
            @RequestParam(name = "scope", required = false) String scope,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "q", required = false) String text) {
        String email = auth.getName();
        User user = qa.requireUserByEmail(email);

        var list = qa.findTutorHistoryForTutor(
                user.getId(),
                scope,
                status,
                text);

        return ResponseEntity.ok(list);
    }


    // PERFIL DEL TUTOR

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        TutorProfileDto dto = qa.getTutorProfile(userId);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody TutorProfileDto dto,
            Authentication auth,
            HttpServletRequest req) {
        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        qa.updateTutorProfile(userId, dto);

        audit.log(req, userId, "UPDATE_TUTOR_PROFILE", true, null, null);

        return ResponseEntity.ok(new ApiMessage("Perfil actualizado"));
    }

}
