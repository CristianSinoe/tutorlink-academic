package com.sinoe.authmfa.web;

import com.sinoe.authmfa.domain.qa.AnswerRepository;
import com.sinoe.authmfa.domain.qa.Question;
import com.sinoe.authmfa.domain.qa.QuestionRepository;
import com.sinoe.authmfa.domain.user.Student;
import com.sinoe.authmfa.domain.user.TutorStudentRepository;
import com.sinoe.authmfa.dto.ApiPayload;
import com.sinoe.authmfa.dto.AuthDtos;
import com.sinoe.authmfa.dto.QaDtos;
import com.sinoe.authmfa.dto.PagedResponse;
import com.sinoe.authmfa.dto.qa.AnswerHistoryDto;
import com.sinoe.authmfa.dto.qa.StudentQuestionDetailDto;
import com.sinoe.authmfa.mapper.QaMapper;
import com.sinoe.authmfa.service.AuditService;
import com.sinoe.authmfa.service.QaService;
import com.sinoe.authmfa.service.RecaptchaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
public class StudentController {

    private static final String CREATE_QUESTION = "CREATE_QUESTION";
    private static final String EXCEPTION = "EXCEPTION";
    private static final String INVALID_RECAPTCHA_MESSAGE = "reCAPTCHA inválido";

    private final QaService qa;
    private final QuestionRepository questions;
    private final AnswerRepository answers;
    private final RecaptchaService recaptcha;
    private final AuditService audit;
    private final TutorStudentRepository tutorStudents;

    public record CreateQuestionResponse(Long id, String status) implements ApiPayload {
    }

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
    @PostMapping("/questions")
    public ResponseEntity<ApiPayload> create(
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
                audit.log(req, null, CREATE_QUESTION, false, "RECAPTCHA_FAIL", INVALID_RECAPTCHA_MESSAGE);
                return ResponseEntity
                        .badRequest()
                        .body(new AuthDtos.ApiMessage(INVALID_RECAPTCHA_MESSAGE));
            }

            var q = qa.createQuestion(
                    student.getId(),
                    dto.getScope(),
                    dto.getTitle(),
                    dto.getBody());

            audit.log(req, user.getId(), CREATE_QUESTION, true, null, "creada");

            return ResponseEntity
                    .created(URI.create("/api/student/questions/" + q.getId()))
                    .body(new CreateQuestionResponse(q.getId(), q.getStatus().name()));

        } catch (Exception ex) {
            audit.log(req, null, CREATE_QUESTION, false, EXCEPTION, ex.getMessage());
            return ResponseEntity
                    .internalServerError()
                    .body(new AuthDtos.ApiMessage("Error creando la pregunta"));
        }
    }

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

    @GetMapping("/questions/{id}")
    public ResponseEntity<StudentQuestionDetailDto> getMyQuestionDetail(
            Authentication auth,
            @PathVariable(name = "id") Long id) {

        String email = auth.getName();
        var user = qa.requireUserByEmail(email);

        StudentQuestionDetailDto dto = qa.getStudentQuestionDetail(user.getId(), id);

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/questions/{id}/answers")
    public ResponseEntity<List<AnswerHistoryDto>> getAnswerHistory(
            @PathVariable("id") Long id,
            Authentication auth) {

        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        Student student = qa.requireStudentByUserId(userId);

        Question q = questions.findById(id).orElse(null);

        if (q == null || q.getStudent() == null
                || !q.getStudent().getId().equals(student.getId())) {
            throw new EntityNotFoundException("No encontrada");
        }

        List<AnswerHistoryDto> list = answers.findByQuestion_IdOrderByVersionAsc(id)
                .stream()
                .map(QaMapper::toHistory)
                .toList();

        return ResponseEntity.ok(list);
    }

    @GetMapping("/my-tutor")
    public ResponseEntity<MyTutorDto> getMyTutor(Authentication auth) {

        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        Student student = qa.requireStudentByUserId(userId);

        var opt = tutorStudents.findByStudent_Id(student.getId());

        if (opt.isEmpty() || opt.get().getTutor() == null) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
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

    private static String realIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            int comma = xf.indexOf(',');
            return (comma > 0 ? xf.substring(0, comma) : xf).trim();
        }
        return req.getRemoteAddr();
    }
}
