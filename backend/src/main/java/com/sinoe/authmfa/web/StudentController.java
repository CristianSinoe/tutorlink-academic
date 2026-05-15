package com.sinoe.authmfa.web;

import com.sinoe.authmfa.domain.qa.AnswerRepository;
import com.sinoe.authmfa.domain.qa.Question;
import com.sinoe.authmfa.domain.qa.QuestionRepository;
import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.TutorStudentRepository;
import com.sinoe.authmfa.dto.QaDtos;
import com.sinoe.authmfa.dto.PagedResponse;
import com.sinoe.authmfa.dto.qa.StudentQuestionDetailDto;
import com.sinoe.authmfa.mapper.QaMapper;
import com.sinoe.authmfa.service.AuditService;
import com.sinoe.authmfa.service.QaService;
import com.sinoe.authmfa.service.RecaptchaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private final QaService qa;
    private final QuestionRepository questions;
    private final AnswerRepository answers;
    private final RecaptchaService recaptcha;
    private final AuditService audit;
    private final TutorStudentRepository tutorStudents;


    // DTOs internos

    public record ApiMessage(String message) {
    }

    public record CreateQuestionResponse(Long id, String status) {
    }

    // DTO sencillo para exponer el tutor del estudiante
    public record MyTutorDto(
            Long tutorId,
            String tutorCode,
            String name,
            String lastNamePaterno,
            String lastNameMaterno,
            String email,
            String department,
            String specialty,
            String phone) {
    }

    // 1) CREAR PREGUNTA

    @PostMapping("/questions")
    public ResponseEntity<?> create(
            @Valid @RequestBody QaDtos.NewQuestion dto,
            Authentication auth,
            HttpServletRequest req) {

        String email = auth.getName();
        var user = qa.requireUserByEmail(email);
        Student student = qa.requireStudentByUserId(user.getId());
        String clientIp = realIp(req);

        try {
            boolean human = recaptcha.verify(dto.getRecaptchaToken(), clientIp);
            if (!human) {
                audit.log(req, null, "CREATE_QUESTION", false,
                        "RECAPTCHA_FAIL", "reCAPTCHA inválido");
                return ResponseEntity
                        .badRequest()
                        .body(new ApiMessage("reCAPTCHA inválido"));
            }

            // 👇 IMPORTANTE: usamos el ID DEL ESTUDIANTE para que se asigne el tutor
            var q = qa.createQuestion(
                    student.getId(),
                    dto.getScope(),
                    dto.getTitle(),
                    dto.getBody());

            audit.log(req, user.getId(), "CREATE_QUESTION", true, null, "creada");

            return ResponseEntity
                    .created(URI.create("/api/student/questions/" + q.getId()))
                    .body(new CreateQuestionResponse(q.getId(), q.getStatus().name()));

        } catch (Exception ex) {
            audit.log(req, null, "CREATE_QUESTION", false,
                    "EXCEPTION", ex.getMessage());
            return ResponseEntity
                    .internalServerError()
                    .body(new ApiMessage("Error creando la pregunta"));
        }
    }

    // 2) MIS PREGUNTAS (PAGINADAS)

    @GetMapping("/questions/my")
    public ResponseEntity<PagedResponse<QaDtos.QuestionSummary>> myQuestions(
            Authentication auth,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "scope", required = false) String scope) {

        String email = auth.getName();
        var user = qa.requireUserByEmail(email);
        Student student = qa.requireStudentByUserId(user.getId());

        var result = qa.findQuestionsForStudent(
                student.getId(),
                page,
                size,
                status,
                scope);

        return ResponseEntity.ok(result);
    }

    // 3) DETALLE DE PREGUNTA PROPIA

    @GetMapping("/questions/{id}")
    public ResponseEntity<StudentQuestionDetailDto> getMyQuestionDetail(
            Authentication auth,
            @PathVariable(name = "id") Long id) {

        String email = auth.getName();
        var user = qa.requireUserByEmail(email);

        // Solo devuelve detalle si la pregunta pertenece al estudiante
        StudentQuestionDetailDto dto = qa.getStudentQuestionDetail(user.getId(), id);

        return ResponseEntity.ok(dto);
    }

    // 4) HISTORIAL DE RESPUESTAS DE UNA PREGUNTA

    @GetMapping("/questions/{id}/answers")
    public ResponseEntity<?> getAnswerHistory(
            @PathVariable("id") Long id,
            Authentication auth) {

        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        Student student = qa.requireStudentByUserId(userId);

        Question q = questions.findById(id).orElse(null);

        if (q == null || q.getStudent() == null
                || !q.getStudent().getId().equals(student.getId())) {
            return ResponseEntity
                    .status(404)
                    .body(new ApiMessage("No encontrada"));
        }

        List<?> list = answers.findByQuestion_IdOrderByVersionAsc(id)
                .stream()
                .map(QaMapper::toHistory)
                .toList();

        return ResponseEntity.ok(list);
    }

    // 5) CONSULTAR MI TUTOR ASIGNADO

    @GetMapping("/my-tutor")
    public ResponseEntity<?> getMyTutor(Authentication auth) {

        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        Student student = qa.requireStudentByUserId(userId);

        var opt = tutorStudents.findByStudent_Id(student.getId());

        if (opt.isEmpty() || opt.get().getTutor() == null) {
            // Sin tutor asignado
            return ResponseEntity.noContent().build();
            // O si prefieres mensaje:
            // return ResponseEntity.status(404)
            //        .body(new ApiMessage("El estudiante aún no tiene tutor asignado"));
        }

        var ts = opt.get();
        var t = ts.getTutor();
        var u = t.getUser();

        MyTutorDto dto = new MyTutorDto(
                t.getId(),
                t.getTutorCode(),
                u.getName(),
                u.getLastNamePaterno(),
                u.getLastNameMaterno(),
                u.getEmail(),
                t.getDepartment(),
                t.getSpecialty(),
                t.getPhone());

        return ResponseEntity.ok(dto);
    }

    // HELPERS

    private static String realIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            int comma = xf.indexOf(',');
            return (comma > 0 ? xf.substring(0, comma) : xf).trim();
        }
        return req.getRemoteAddr();
    }
}
