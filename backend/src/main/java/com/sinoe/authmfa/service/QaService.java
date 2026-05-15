package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.qa.*;
import com.sinoe.authmfa.domain.user.*;
import com.sinoe.authmfa.dto.QaDtos;
import com.sinoe.authmfa.dto.qa.TutorDashboardSummaryDto;
import com.sinoe.authmfa.dto.qa.TutorHistoryItemDto;
import com.sinoe.authmfa.dto.qa.TutorRecentQuestionDto;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sinoe.authmfa.dto.PagedResponse;
import org.springframework.data.domain.*;
import com.sinoe.authmfa.dto.qa.TutorPendingQuestionDto;
import java.util.stream.Stream;
import com.sinoe.authmfa.dto.qa.StudentQuestionDetailDto;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import com.sinoe.authmfa.dto.qa.TutorProfileDto;

@Service
@RequiredArgsConstructor
public class QaService {

    private final UserRepository users;
    private final StudentRepository students;
    private final TutorRepository tutors;

    private final QuestionRepository questions;
    private final AnswerRepository answers;
    private final TutorStudentRepository tutorStudentRepository;

    // HELPERS


    public User requireUserByEmail(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("user not found: " + email));
    }

    public Student requireStudentByUserId(Long userId) {
        return students.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalStateException("User is not a student: " + userId));
    }

    public Tutor requireTutorByUserId(Long userId) {
        return tutors.findByUser_Id(userId)
                .orElseThrow(() -> new IllegalStateException("User is not a tutor: " + userId));
    }

    public Question requireQuestion(Long id) {
        return questions.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("question not found: " + id));
    }

    public Student requireStudentById(Long studentId) {
        return students.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("No se encontró el estudiante con id=" + studentId));
    }


    // 1) CREAR PREGUNTA (ASIGNA TUTOR AUTOMÁTICAMENTE)

    @Transactional
    public Question createQuestion(Long studentId, Scope scope, String title, String body) {

        // 1) Obtenemos al estudiante por ID
        Student student = requireStudentById(studentId);

        // 2) Buscamos el tutor asignado a este estudiante en tl_tutor_students
        Tutor tutor = tutorStudentRepository.findByStudent_Id(student.getId())
                .map(TutorStudent::getTutor)
                .orElse(null); // Si no tiene tutor, se guarda como null

        // 3) Creamos la pregunta
        var q = Question.builder()
                .student(student)
                .tutor(tutor) // ya va con el tutor asignado (si existe)
                .scope(scope)
                .title(title)
                .body(body)
                .status(Status.PENDIENTE)
                .build();

        return questions.save(q);
    }

    // RESPONDER O CORREGIR

    @Transactional
    public Answer publishOrCorrect(Long userId, Long questionId, String body, boolean correction) {

        Tutor tutor = requireTutorByUserId(userId);
        Question q = requireQuestion(questionId);

        if (q.getStatus() == Status.RECHAZADA)
            throw new IllegalStateException("Pregunta rechazada");

        if (correction && q.getCurrentAnswer() == null)
            throw new IllegalStateException("No hay respuesta previa");

        int nextVersion = (q.getCurrentAnswer() == null)
                ? 1
                : q.getCurrentAnswer().getVersion() + 1;

        var ans = Answer.builder()
                .question(q)
                .tutor(tutor)
                .body(body)
                .version(nextVersion)
                .build();

        ans = answers.save(ans);

        q.setCurrentAnswer(ans);
        q.setRejectReason(null);
        q.setTutor(tutor); // aseguramos tutor asignado
        q.setStatus(correction ? Status.CORREGIDA : Status.PUBLICADA);

        questions.save(q);

        return ans;
    }

    // RECHAZAR PREGUNTA

    @Transactional
    public void reject(Long userId, Long questionId, String reason) {

        requireTutorByUserId(userId);
        Question q = requireQuestion(questionId);

        if (q.getStatus() == Status.RECHAZADA)
            return;

        if (q.getStatus() == Status.PUBLICADA || q.getStatus() == Status.CORREGIDA)
            throw new IllegalStateException("No puedes rechazar una pregunta respondida");

        q.setStatus(Status.RECHAZADA);
        q.setRejectReason(reason);
        q.setCurrentAnswer(null);

        questions.save(q);
    }

    // RECLASIFICAR

    @Transactional
    public void reclassify(Long userId, Long questionId, Scope newScope) {

        requireTutorByUserId(userId);
        Question q = requireQuestion(questionId);

        if (q.getScope() != newScope) {
            q.setScope(newScope);
            questions.save(q);
        }
    }

    // LISTAR PREGUNTAS DEL ESTUDIANTE (PAGINADO)
    
    @Transactional(readOnly = true)
    public PagedResponse<QaDtos.QuestionSummary> findQuestionsForStudent(
            Long studentId,
            int page,
            int size,
            String status,
            String scope) {
        if (page < 0) {
            throw new IllegalArgumentException("El número de página no puede ser negativo");
        }
        if (size <= 0 || size > 100) {
            throw new IllegalArgumentException("El tamaño de página debe estar entre 1 y 100");
        }

        Status statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Estado de pregunta inválido: " + status);
            }
        }

        Scope scopeEnum = null;
        if (scope != null && !scope.isBlank()) {
            try {
                scopeEnum = Scope.valueOf(scope.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Scope de pregunta inválido: " + scope);
            }
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Question> result;

        if (statusEnum == null && scopeEnum == null) {
            result = questions.findByStudent_Id(studentId, pageable);
        } else if (statusEnum != null && scopeEnum == null) {
            result = questions.findByStudent_IdAndStatus(studentId, statusEnum, pageable);
        } else if (statusEnum == null && scopeEnum != null) {
            result = questions.findByStudent_IdAndScope(studentId, scopeEnum, pageable);
        } else {
            result = questions.findByStudent_IdAndStatusAndScope(studentId, statusEnum, scopeEnum, pageable);
        }

        List<QaDtos.QuestionSummary> content = result.getContent().stream()
                .map(q -> QaDtos.QuestionSummary.builder()
                        .id(q.getId())
                        .title(q.getTitle())
                        .status(q.getStatus() != null ? q.getStatus().name() : null)
                        .scope(q.getScope() != null ? q.getScope().name() : null)
                        .createdAt(q.getCreatedAt() != null ? q.getCreatedAt().toString() : null)
                        .build())
                .toList();

        return new PagedResponse<>(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages());
    }

    // DETALLE DE PREGUNTA PARA UN ESTUDIANTE

    @Transactional(readOnly = true)
    public QaDtos.StudentQuestionDetail getQuestionDetailForStudent(Long userId, Long questionId) {
        // Obtener el estudiante a partir del userId
        Student student = requireStudentByUserId(userId);

        Question q = questions.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Pregunta no encontrada"));

        // Validar que la pregunta pertenezca al estudiante autenticado
        if (q.getStudent() == null || !q.getStudent().getId().equals(student.getId())) {
            throw new IllegalArgumentException("La pregunta no pertenece al estudiante autenticado");
        }

        // Tutor (puede ser null si aún no hay respuesta/asignación)
        Tutor tutor = q.getTutor();

        String tutorName = null;
        String tutorFullName = null;
        String tutorEmail = null;

        if (tutor != null && tutor.getUser() != null) {
            var tuUser = tutor.getUser();
            tutorName = tuUser.getName();
            tutorFullName = (tuUser.getName() + " " +
                    (tuUser.getLastNamePaterno() != null ? tuUser.getLastNamePaterno() : "") + " " +
                    (tuUser.getLastNameMaterno() != null ? tuUser.getLastNameMaterno() : "")).trim();
            tutorEmail = tuUser.getEmail();
        }

        String currentAnswerBody = null;
        Integer currentAnswerVersion = null;
        Boolean wasCorrected = null;
        String rejectReason = null;

        return QaDtos.StudentQuestionDetail.builder()
                .id(q.getId())
                .title(q.getTitle())
                .body(q.getBody())
                .status(q.getStatus() != null ? q.getStatus().name() : null)
                .scope(q.getScope() != null ? q.getScope().name() : null)
                .createdAt(q.getCreatedAt() != null ? q.getCreatedAt().toString() : null)
                .tutorName(tutorName)
                .tutorFullName(tutorFullName)
                .tutorEmail(tutorEmail)
                .currentAnswerBody(currentAnswerBody)
                .currentAnswerVersion(currentAnswerVersion)
                .wasCorrected(wasCorrected)
                .rejectReason(rejectReason)
                .build();
    }

    // DASHBOARD DEL TUTOR

    @Transactional(readOnly = true)
    public TutorDashboardSummaryDto getTutorDashboardSummary(Long userId) {
        Tutor tutor = requireTutorByUserId(userId);

        // 1) Preguntas pendientes SOLO de este tutor
        long pendingCount = questions.countByTutor_IdAndStatus(tutor.getId(), Status.PENDIENTE);

        // 2) Total de respuestas de este tutor
        long totalAnswers = answers.countByTutor_Id(tutor.getId());

        // 3) Respuestas de este tutor en el día de hoy
        LocalDate today = LocalDate.now(ZoneId.systemDefault());
        var startOfDay = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        var endOfDay = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        long todayAnswered = answers.countByTutor_IdAndCreatedAtBetween(
                tutor.getId(), startOfDay, endOfDay);

        return new TutorDashboardSummaryDto(
                pendingCount,
                todayAnswered,
                totalAnswers);
    }

    @Transactional(readOnly = true)
    public java.util.List<TutorRecentQuestionDto> findRecentQuestionsForTutor(Long userId, int size) {
        Tutor tutor = requireTutorByUserId(userId);

        int limit = Math.max(1, Math.min(size, 50));
        Page<Question> page = questions.findByTutor_IdOrderByCreatedAtDesc(
                tutor.getId(),
                org.springframework.data.domain.PageRequest.of(0, limit));

        return page.getContent().stream()
                .map(q -> {
                    String studentName = null;
                    String studentEmail = null;

                    if (q.getStudent() != null && q.getStudent().getUser() != null) {
                        var u = q.getStudent().getUser();
                        StringBuilder fullName = new StringBuilder();
                        if (u.getName() != null)
                            fullName.append(u.getName()).append(" ");
                        if (u.getLastNamePaterno() != null)
                            fullName.append(u.getLastNamePaterno()).append(" ");
                        if (u.getLastNameMaterno() != null)
                            fullName.append(u.getLastNameMaterno());
                        studentName = fullName.toString().trim();
                        studentEmail = u.getEmail();
                    }

                    return new TutorRecentQuestionDto(
                            q.getId(),
                            q.getTitle(),
                            q.getStatus() != null ? q.getStatus().name() : null,
                            q.getScope() != null ? q.getScope().name() : null,
                            q.getCreatedAt(),
                            studentName,
                            studentEmail);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public java.util.List<TutorPendingQuestionDto> findPendingQuestionsForTutor(
            Long userId,
            String scopeRaw,
            String text) {

        Tutor tutor = requireTutorByUserId(userId);

        // 1) Base: todas las preguntas PENDIENTE asignadas a este tutor
        java.util.List<Question> base = questions
                .findByTutor_IdAndStatusOrderByCreatedAtAsc(tutor.getId(), Status.PENDIENTE);

        // 2) Scope opcional lo calculamos y luego lo copiamos a una variable final
        Scope tmpScope = null;
        if (scopeRaw != null && !scopeRaw.isBlank() && !"ALL".equalsIgnoreCase(scopeRaw)) {
            try {
                tmpScope = Scope.valueOf(scopeRaw.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Scope de pregunta inválido: " + scopeRaw);
            }
        }
        final Scope scopeToFilter = tmpScope;

        // 3) Texto opcional normalizado a minúsculas (también final)
        final String term = (text != null && !text.isBlank())
                ? text.toLowerCase()
                : null;

        // 4) Stream con filtros + mapeo a DTO
        return base.stream()
                // filtrar por scope si aplica
                .filter(q -> scopeToFilter == null || scopeToFilter.equals(q.getScope()))
                // filtrar por texto si aplica
                .filter(q -> {
                    if (term == null)
                        return true;
                    String title = q.getTitle() != null ? q.getTitle().toLowerCase() : "";
                    String body = q.getBody() != null ? q.getBody().toLowerCase() : "";
                    return title.contains(term) || body.contains(term);
                })
                // mapear a DTO
                .map(q -> {
                    String studentName = null;
                    String studentEmail = null;

                    if (q.getStudent() != null && q.getStudent().getUser() != null) {
                        var u = q.getStudent().getUser();
                        StringBuilder fullName = new StringBuilder();
                        if (u.getName() != null)
                            fullName.append(u.getName()).append(" ");
                        if (u.getLastNamePaterno() != null)
                            fullName.append(u.getLastNamePaterno()).append(" ");
                        if (u.getLastNameMaterno() != null)
                            fullName.append(u.getLastNameMaterno());
                        studentName = fullName.toString().trim();
                        studentEmail = u.getEmail();
                    }

                    return new TutorPendingQuestionDto(
                            q.getId(),
                            q.getTitle(),
                            q.getStatus() != null ? q.getStatus().name() : null,
                            q.getScope() != null ? q.getScope().name() : null,
                            q.getCreatedAt(),
                            studentName,
                            studentEmail);
                })
                .toList();
    }

    // HISTORIAL DEL TUTOR
    
    @Transactional(readOnly = true)
    public List<TutorHistoryItemDto> findTutorHistory(
            Long userId,
            String text,
            String scope,
            String status) {
        Tutor tutor = requireTutorByUserId(userId);

        // Estados que consideramos en el historial
        List<Status> baseStatuses = List.of(
                Status.PUBLICADA,
                Status.CORREGIDA,
                Status.RECHAZADA);

        // Cargamos todas las preguntas de este tutor con esos estados
        List<Question> base = questions.findByTutor_IdAndStatusInOrderByCreatedAtDesc(
                tutor.getId(),
                baseStatuses);

        // Filtros opcionales en memoria
        Stream<Question> stream = base.stream();

        // Filtro por estado (si viene)
        if (status != null && !status.isBlank()) {
            Status statusFilter;
            try {
                statusFilter = Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Estado de pregunta inválido: " + status);
            }
            stream = stream.filter(q -> q.getStatus() == statusFilter);
        }

        // Filtro por scope (si viene)
        if (scope != null && !scope.isBlank()) {
            Scope scopeFilter;
            try {
                scopeFilter = Scope.valueOf(scope.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Scope de pregunta inválido: " + scope);
            }
            stream = stream.filter(q -> q.getScope() == scopeFilter);
        }

        // Filtro por texto (en título o cuerpo)
        if (text != null && !text.isBlank()) {
            String needle = text.toLowerCase();
            stream = stream.filter(q -> {
                String t = q.getTitle() != null ? q.getTitle().toLowerCase() : "";
                String b = q.getBody() != null ? q.getBody().toLowerCase() : "";
                return t.contains(needle) || b.contains(needle);
            });
        }

        return stream
                .map(q -> {
                    String studentName = null;
                    String studentEmail = null;

                    if (q.getStudent() != null && q.getStudent().getUser() != null) {
                        var u = q.getStudent().getUser();
                        StringBuilder fullName = new StringBuilder();
                        if (u.getName() != null)
                            fullName.append(u.getName()).append(" ");
                        if (u.getLastNamePaterno() != null)
                            fullName.append(u.getLastNamePaterno()).append(" ");
                        if (u.getLastNameMaterno() != null)
                            fullName.append(u.getLastNameMaterno());
                        studentName = fullName.toString().trim();
                        studentEmail = u.getEmail();
                    }

                    String answeredAt = null;
                    if (q.getCurrentAnswer() != null && q.getCurrentAnswer().getCreatedAt() != null) {
                        answeredAt = q.getCurrentAnswer().getCreatedAt().toString();
                    } else if (q.getUpdatedAt() != null) {
                        answeredAt = q.getUpdatedAt().toString();
                    } else if (q.getCreatedAt() != null) {
                        answeredAt = q.getCreatedAt().toString();
                    }

                    return new TutorHistoryItemDto(
                            q.getId(),
                            q.getTitle(),
                            q.getStatus() != null ? q.getStatus().name() : null,
                            q.getScope() != null ? q.getScope().name() : null,
                            answeredAt,
                            studentName,
                            studentEmail);
                })
                .toList();
    }

    // HISTORIAL DE RESPUESTAS DEL TUTOR (UNA FILA POR PREGUNTA)
    
    @Transactional(readOnly = true)
    public java.util.List<TutorHistoryItemDto> findTutorHistoryForTutor(
            Long userId,
            String scopeRaw,
            String statusRaw,
            String text) {
        Tutor tutor = requireTutorByUserId(userId);

        // 1) Todas las respuestas de este tutor, de la más nueva a la más vieja
        java.util.List<Answer> allAnswers = answers.findByTutor_IdOrderByCreatedAtDesc(tutor.getId());

        // 2) Nos quedamos SOLO con la última respuesta de cada pregunta
        Map<Long, Answer> latestByQuestion = new LinkedHashMap<>();
        for (Answer a : allAnswers) {
            Long qid = a.getQuestion().getId();
            // Como vienen ordenadas DESC, la primera que vemos es la última versión
            if (!latestByQuestion.containsKey(qid)) {
                latestByQuestion.put(qid, a);
            }
        }

        // 3) Parsear filtros (opcionales) usando temporales + finales

        // STATUS
        Status tmpStatus = null;
        if (statusRaw != null && !statusRaw.isBlank() && !"ALL".equalsIgnoreCase(statusRaw)) {
            try {
                tmpStatus = Status.valueOf(statusRaw.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Estado de pregunta inválido: " + statusRaw);
            }
        }
        final Status statusFilter = tmpStatus;

        // SCOPE
        Scope tmpScope = null;
        if (scopeRaw != null && !scopeRaw.isBlank() && !"ALL".equalsIgnoreCase(scopeRaw)) {
            try {
                tmpScope = Scope.valueOf(scopeRaw.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Scope de pregunta inválido: " + scopeRaw);
            }
        }
        final Scope scopeFilter = tmpScope;

        // TEXTO
        final String term = (text != null && !text.isBlank())
                ? text.toLowerCase()
                : null;

        // 4) Filtrar + mapear a DTO
        return latestByQuestion.values().stream()
                .filter(a -> {
                    Question q = a.getQuestion();
                    if (statusFilter != null && q.getStatus() != statusFilter)
                        return false;
                    if (scopeFilter != null && q.getScope() != scopeFilter)
                        return false;

                    if (term != null) {
                        String title = q.getTitle() != null ? q.getTitle().toLowerCase() : "";
                        String bodyQ = q.getBody() != null ? q.getBody().toLowerCase() : "";
                        String bodyA = a.getBody() != null ? a.getBody().toLowerCase() : "";
                        return title.contains(term) || bodyQ.contains(term) || bodyA.contains(term);
                    }
                    return true;
                })
                .map(a -> {
                    Question q = a.getQuestion();
                    String studentName = null;
                    String studentEmail = null;

                    if (q.getStudent() != null && q.getStudent().getUser() != null) {
                        var u = q.getStudent().getUser();
                        StringBuilder fullName = new StringBuilder();
                        if (u.getName() != null)
                            fullName.append(u.getName()).append(" ");
                        if (u.getLastNamePaterno() != null)
                            fullName.append(u.getLastNamePaterno()).append(" ");
                        if (u.getLastNameMaterno() != null)
                            fullName.append(u.getLastNameMaterno());
                        studentName = fullName.toString().trim();
                        studentEmail = u.getEmail();
                    }

                    String answeredAt = a.getCreatedAt() != null
                            ? a.getCreatedAt().toString()
                            : null;

                    return new TutorHistoryItemDto(
                            q.getId(),
                            q.getTitle(),
                            q.getStatus() != null ? q.getStatus().name() : null,
                            q.getScope() != null ? q.getScope().name() : null,
                            answeredAt,
                            studentName,
                            studentEmail);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public TutorProfileDto getTutorProfile(Long userId) {
        Tutor tutor = requireTutorByUserId(userId);

        return new TutorProfileDto(
                tutor.getBio(),
                tutor.getAcademicLink(),
                tutor.getProfessionalLink(),
                tutor.isNotifyNewQuestions(),
                tutor.isWeeklySummary());
    }

    @Transactional
    public void updateTutorProfile(Long userId, TutorProfileDto dto) {
        Tutor tutor = requireTutorByUserId(userId);

        tutor.setBio(dto.bio());
        tutor.setAcademicLink(dto.academicLink());
        tutor.setProfessionalLink(dto.professionalLink());

        if (dto.notifyNewQuestions() != null) {
            tutor.setNotifyNewQuestions(dto.notifyNewQuestions());
        }
        if (dto.weeklySummary() != null) {
            tutor.setWeeklySummary(dto.weeklySummary());
        }
    }

    @Transactional(readOnly = true)
    public StudentQuestionDetailDto getStudentQuestionDetail(Long userId, Long questionId) {
        // 1) Validar que el usuario sea estudiante y que la pregunta sea suya
        Student student = requireStudentByUserId(userId);

        Question q = questions.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Pregunta no encontrada"));

        if (q.getStudent() == null || !q.getStudent().getId().equals(student.getId())) {
            // si quieres ser más estricto, puedes lanzar 403 en el controller
            throw new IllegalArgumentException("No tienes permiso para ver esta pregunta");
        }

        // 2) Obtener todas las respuestas (ordenadas por versión)
        List<Answer> allAnswers = answers.findByQuestion_IdOrderByVersionAsc(questionId);

        Answer lastAnswer = null;
        if (!allAnswers.isEmpty()) {
            lastAnswer = allAnswers.get(allAnswers.size() - 1);
        }

        // 3) Datos del tutor (a partir de la última respuesta)
        String tutorName = null;
        String tutorFullName = null;
        String tutorEmail = null;

        if (lastAnswer != null && lastAnswer.getTutor() != null && lastAnswer.getTutor().getUser() != null) {
            User tu = lastAnswer.getTutor().getUser();
            tutorEmail = tu.getEmail();

            String fullName = java.util.stream.Stream.of(
                    tu.getName(),
                    tu.getLastNamePaterno(),
                    tu.getLastNameMaterno())
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.joining(" "));

            tutorName = fullName;
            tutorFullName = fullName;
        }

        // 4) Última respuesta
        String currentAnswerBody = lastAnswer != null ? lastAnswer.getBody() : null;
        Integer currentAnswerVersion = lastAnswer != null ? lastAnswer.getVersion() : null;
        boolean wasCorrected = lastAnswer != null
                && lastAnswer.getVersion() != null
                && lastAnswer.getVersion() > 1;

        // 5) Armar DTO
        return new StudentQuestionDetailDto(
                q.getId(),
                q.getTitle(),
                q.getBody(),
                q.getStatus() != null ? q.getStatus().name() : null,
                q.getScope() != null ? q.getScope().name() : null,
                q.getCreatedAt(),
                tutorName,
                tutorFullName,
                tutorEmail,
                currentAnswerBody,
                currentAnswerVersion,
                wasCorrected,
                q.getRejectReason());
    }

}
