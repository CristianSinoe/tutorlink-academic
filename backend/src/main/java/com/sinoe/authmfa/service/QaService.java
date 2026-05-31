package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.qa.*;
import com.sinoe.authmfa.domain.user.*;
import com.sinoe.authmfa.dto.QaDtos;
import com.sinoe.authmfa.dto.qa.QuestionConversationDto;
import com.sinoe.authmfa.dto.qa.QuestionConversationMessageDto;
import com.sinoe.authmfa.dto.qa.QuestionConversationMessageVersionDto;
import com.sinoe.authmfa.dto.qa.TutorDashboardSummaryDto;
import com.sinoe.authmfa.dto.qa.TutorHistoryItemDto;
import com.sinoe.authmfa.dto.qa.TutorRecentQuestionDto;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.sinoe.authmfa.dto.PagedResponse;
import org.springframework.data.domain.*;
import com.sinoe.authmfa.dto.qa.TutorPendingQuestionDto;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
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

    private static final String INVALID_QUESTION_STATUS_MESSAGE = "Estado de pregunta inválido: ";
    private static final String INVALID_QUESTION_SCOPE_MESSAGE = "Scope de pregunta inválido: ";

    private final UserRepository users;
    private final StudentRepository students;
    private final TutorRepository tutors;

    private final QuestionRepository questions;
    private final AnswerRepository answers;
    private final QuestionMessageRepository questionMessages;
    private final QuestionMessageRevisionRepository questionMessageRevisions;
    private final TutorStudentRepository tutorStudentRepository;
    private final EmailService emailService;
    private final ObjectProvider<QaService> selfProvider;

    // HELPERS

    private static final int MAX_MESSAGE_BODY_LENGTH = 8000;

    public User requireUserByEmail(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("user not found: " + email));
    }

    public User requireUserById(Long userId) {
        return users.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("user not found: " + userId));
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
        return self().createQuestion(studentId, scope, title, body, null);
    }

    @Transactional
    public Question createQuestion(Long studentId, Scope scope, String title, String body, String frontendBaseUrl) {
        String normalizedBody = normalizeMessageBody(body);
        Student student = requireStudentById(studentId);
        Tutor tutor = tutorStudentRepository.findByStudent_Id(student.getId())
                .map(TutorStudent::getTutor)
                .orElse(null);

        var q = Question.builder()
                .student(student)
                .tutor(tutor)
                .scope(scope)
                .title(title)
                .body(normalizedBody)
                .status(Status.PENDIENTE)
                .build();

        q = questions.save(q);

        createThreadMessage(q, student.getUser(), normalizedBody);
        notifyTutorAboutNewQuestion(q, tutor, frontendBaseUrl);

        return q;
    }

    // RESPONDER O CORREGIR

    @Transactional
    public Answer publishOrCorrect(Long userId, Long questionId, String body, boolean correction) {
        return self().publishOrCorrect(userId, questionId, body, correction, null);
    }

    @Transactional
    public Answer publishOrCorrect(Long userId, Long questionId, String body, boolean correction, String frontendBaseUrl) {
        String normalizedBody = normalizeMessageBody(body);
        Tutor tutor = requireTutorByUserId(userId);
        Question q = requireQuestion(questionId);
        ensureTutorCanWrite(tutor, q);

        if (q.getStatus() == Status.RECHAZADA)
            throw new IllegalStateException("Pregunta rechazada");

        if (correction && q.getCurrentAnswer() == null)
            throw new IllegalStateException("No hay respuesta previa");

        int nextVersion = (q.getCurrentAnswer() == null)
                ? 1
                : q.getCurrentAnswer().getVersion() + 1;

        QuestionMessage threadMessage = createThreadMessage(q, tutor.getUser(), normalizedBody);
        var ans = Answer.builder()
                .question(q)
                .tutor(tutor)
                .body(normalizedBody)
                .version(nextVersion)
                .threadMessage(threadMessage)
                .build();

        ans = answers.save(ans);

        q.setCurrentAnswer(ans);
        q.setRejectReason(null);
        q.setTutor(tutor); // aseguramos tutor asignado
        q.setStatus(correction ? Status.CORREGIDA : Status.PUBLICADA);

        questions.save(q);
        notifyStudentAboutTutorReply(q, tutor, threadMessage.getCreatedAt(), frontendBaseUrl);

        return ans;
    }

    // RECHAZAR PREGUNTA

    @Transactional
    public void reject(Long userId, Long questionId, String reason) {
        Tutor tutor = requireTutorByUserId(userId);
        Question q = requireQuestion(questionId);
        ensureTutorCanWrite(tutor, q);

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
        Tutor tutor = requireTutorByUserId(userId);
        Question q = requireQuestion(questionId);
        ensureTutorCanWrite(tutor, q);

        if (q.getScope() != newScope) {
            q.setScope(newScope);
            questions.save(q);
        }
    }

    @Transactional(readOnly = true)
    public QuestionConversationDto getQuestionConversation(Long viewerUserId, Long questionId) {
        User viewer = requireUserById(viewerUserId);
        Question question = requireQuestion(questionId);
        ensureCanReadQuestion(viewer, question);

        List<QuestionMessage> persistedMessages =
                questionMessages.findByQuestion_IdAndVisibleTrueOrderByCreatedAtAscIdAsc(questionId);
        Map<Long, List<QuestionMessageRevision>> revisionsByMessageId = loadRevisionsByMessageId(persistedMessages);
        List<Answer> allAnswers = answers.findByQuestion_IdOrderByVersionAsc(questionId);

        List<QuestionConversationMessageDto> messages = new ArrayList<>();
        if (shouldAddVirtualOpeningMessage(question, persistedMessages)) {
            messages.add(buildVirtualQuestionOpening(question));
        }

        for (Answer answer : allAnswers) {
            if (answer.getThreadMessage() == null) {
                messages.add(buildVirtualAnswerMessage(answer));
            }
        }

        persistedMessages.stream()
                .map(message -> toConversationMessageDto(message, viewer, revisionsByMessageId.getOrDefault(message.getId(), List.of())))
                .forEach(messages::add);

        messages.sort(Comparator
                .comparing(QuestionConversationMessageDto::createdAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(QuestionConversationMessageDto::id, Comparator.nullsLast(Comparator.naturalOrder())));

        StudentContactInfo studentInfo = extractStudentContactInfo(question);
        TutorContactInfo tutorInfo = extractTutorContactInfo(question, allAnswers);

        return new QuestionConversationDto(
                question.getId(),
                question.getTitle(),
                enumName(question.getStatus()),
                enumName(question.getScope()),
                question.getCreatedAt(),
                question.getRejectReason(),
                studentInfo.name(),
                studentInfo.email(),
                tutorInfo.fullName(),
                tutorInfo.email(),
                canReply(viewer, question),
                messages
        );
    }

    @Transactional
    public QuestionConversationMessageDto addConversationMessage(
            Long senderUserId,
            Long questionId,
            String body,
            String frontendBaseUrl) {
        User sender = requireUserById(senderUserId);
        Question question = requireQuestion(questionId);
        String normalizedBody = normalizeMessageBody(body);

        if (question.getStatus() == Status.RECHAZADA) {
            throw new IllegalStateException("No se pueden agregar mensajes a una pregunta rechazada");
        }

        QuestionMessage message;
        if (sender.getRole() == UserRole.ESTUDIANTE) {
            validateStudentQuestionOwnership(sender.getId(), question);
            message = createThreadMessage(question, sender, normalizedBody);
            notifyTutorAboutStudentFollowUp(question, message.getCreatedAt(), frontendBaseUrl);
        } else if (sender.getRole() == UserRole.TUTOR) {
            Tutor tutor = requireTutorByUserId(sender.getId());
            ensureTutorCanWrite(tutor, question);
            message = createThreadMessage(question, sender, normalizedBody);
            if (question.getCurrentAnswer() == null) {
                createAnswerFromThreadMessage(question, tutor, normalizedBody, message, false);
            }
            notifyStudentAboutTutorReply(question, tutor, message.getCreatedAt(), frontendBaseUrl);
        } else {
            throw new IllegalArgumentException("Solo estudiantes o tutores pueden enviar mensajes");
        }

        return toConversationMessageDto(message, sender, List.of());
    }

    @Transactional
    public QuestionConversationMessageDto correctConversationMessage(
            Long editorUserId,
            Long messageId,
            String body,
            String frontendBaseUrl) {
        User editor = requireUserById(editorUserId);
        QuestionMessage message = questionMessages.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("message not found: " + messageId));
        Question question = message.getQuestion();
        ensureCanReadQuestion(editor, question);
        ensureCanCorrectMessage(editor, message);

        String normalizedBody = normalizeMessageBody(body);
        List<QuestionMessageRevision> existingRevisions =
                questionMessageRevisions.findByQuestionMessage_IdOrderByCreatedAtAscIdAsc(messageId);
        String effectiveBody = resolveEffectiveBody(message, existingRevisions);

        if (effectiveBody.equals(normalizedBody)) {
            return toConversationMessageDto(message, editor, existingRevisions);
        }

        QuestionMessageRevision revision = QuestionMessageRevision.builder()
                .questionMessage(message)
                .createdByUser(editor)
                .body(normalizedBody)
                .build();
        questionMessageRevisions.save(revision);

        if (editor.getRole() == UserRole.TUTOR && question.getStatus() != Status.RECHAZADA) {
            question.setStatus(Status.CORREGIDA);
            questions.save(question);
            Tutor tutor = requireTutorByUserId(editorUserId);
            notifyStudentAboutTutorReply(question, tutor, revision.getCreatedAt(), frontendBaseUrl);
        } else if (editor.getRole() == UserRole.ESTUDIANTE) {
            notifyTutorAboutStudentFollowUp(question, revision.getCreatedAt(), frontendBaseUrl);
        }

        List<QuestionMessageRevision> refreshedRevisions =
                questionMessageRevisions.findByQuestionMessage_IdOrderByCreatedAtAscIdAsc(messageId);
        return toConversationMessageDto(message, editor, refreshedRevisions);
    }

    // LISTAR PREGUNTAS DEL ESTUDIANTE (PAGINADO)
    
    @Transactional(readOnly = true)
    public PagedResponse<QaDtos.QuestionSummary> findQuestionsForStudent(
            Long studentId,
            int page,
            int size,
            String status,
            String scope) {
        validatePageRequest(page, size);
        Status statusEnum = parseOptionalStatus(status, INVALID_QUESTION_STATUS_MESSAGE);
        Scope scopeEnum = parseOptionalScope(scope, INVALID_QUESTION_SCOPE_MESSAGE);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Question> result = findStudentQuestions(studentId, statusEnum, scopeEnum, pageable);
        List<QaDtos.QuestionSummary> content = result.getContent().stream()
                .map(this::toQuestionSummary)
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
                .map(this::toTutorRecentQuestionDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public java.util.List<TutorPendingQuestionDto> findPendingQuestionsForTutor(
            Long userId,
            String scopeRaw,
            String text) {

        Tutor tutor = requireTutorByUserId(userId);
        java.util.List<Question> base = questions
                .findByTutor_IdAndStatusOrderByCreatedAtAsc(tutor.getId(), Status.PENDIENTE);
        Scope scopeToFilter = parseOptionalScopeAllowAll(scopeRaw, INVALID_QUESTION_SCOPE_MESSAGE);
        String term = normalizeSearchTerm(text);

        return base.stream()
                .filter(q -> scopeToFilter == null || scopeToFilter.equals(q.getScope()))
                .filter(q -> matchesQuestionText(q, term))
                .map(this::toTutorPendingQuestionDto)
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
        List<Status> baseStatuses = List.of(
                Status.PUBLICADA,
                Status.CORREGIDA,
                Status.RECHAZADA);
        List<Question> base = questions.findByTutor_IdAndStatusInOrderByCreatedAtDesc(
                tutor.getId(),
                baseStatuses);
        Stream<Question> stream = base.stream();
        Status statusFilter = parseOptionalStatus(status, INVALID_QUESTION_STATUS_MESSAGE);
        Scope scopeFilter = parseOptionalScope(scope, INVALID_QUESTION_SCOPE_MESSAGE);
        String searchTerm = normalizeSearchTerm(text);

        stream = filterTutorHistory(stream, statusFilter, scopeFilter, searchTerm);

        return stream
                .map(this::toTutorHistoryItem)
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
        java.util.List<Answer> allAnswers = answers.findByTutor_IdOrderByCreatedAtDesc(tutor.getId());
        Map<Long, Answer> latestByQuestion = latestAnswersByQuestion(allAnswers);
        Status statusFilter = parseOptionalStatusAllowAll(statusRaw, INVALID_QUESTION_STATUS_MESSAGE);
        Scope scopeFilter = parseOptionalScopeAllowAll(scopeRaw, INVALID_QUESTION_SCOPE_MESSAGE);
        String term = normalizeSearchTerm(text);

        return latestByQuestion.values().stream()
                .filter(answer -> matchesTutorHistoryAnswer(answer, statusFilter, scopeFilter, term))
                .map(this::toTutorHistoryItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.sinoe.authmfa.dto.qa.AnswerHistoryDto> getAnswerHistoryForQuestion(Long viewerUserId, Long questionId) {
        User viewer = requireUserById(viewerUserId);
        Question question = requireQuestion(questionId);
        ensureCanReadQuestion(viewer, question);

        List<Answer> allAnswers = answers.findByQuestion_IdOrderByVersionAsc(questionId);
        List<com.sinoe.authmfa.dto.qa.AnswerHistoryDto> history = new ArrayList<>();
        int version = 1;

        for (Answer answer : allAnswers) {
            history.add(new com.sinoe.authmfa.dto.qa.AnswerHistoryDto(
                    answer.getId(),
                    version++,
                    answer.getBody(),
                    answer.getCreatedAt()));

            if (answer.getThreadMessage() == null) {
                continue;
            }

            List<QuestionMessageRevision> revisions =
                    questionMessageRevisions.findByQuestionMessage_IdOrderByCreatedAtAscIdAsc(answer.getThreadMessage().getId());

            for (QuestionMessageRevision revision : revisions) {
                history.add(new com.sinoe.authmfa.dto.qa.AnswerHistoryDto(
                        revision.getId(),
                        version++,
                        revision.getBody(),
                        revision.getCreatedAt()));
            }
        }

        return history;
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
        Student student = requireStudentByUserId(userId);
        Question q = questions.findById(questionId)
                .orElseThrow(() -> new IllegalArgumentException("Pregunta no encontrada"));
        validateStudentQuestionOwnership(student, q);
        List<Answer> allAnswers = answers.findByQuestion_IdOrderByVersionAsc(questionId);
        Answer lastAnswer = findLastAnswer(allAnswers);
        TutorContactInfo tutorInfo = extractTutorContactInfo(q, allAnswers);

        return new StudentQuestionDetailDto(
                q.getId(),
                q.getTitle(),
                q.getBody(),
                q.getStatus() != null ? q.getStatus().name() : null,
                q.getScope() != null ? q.getScope().name() : null,
                q.getCreatedAt(),
                tutorInfo.name(),
                tutorInfo.fullName(),
                tutorInfo.email(),
                lastAnswer != null ? lastAnswer.getBody() : null,
                lastAnswer != null ? lastAnswer.getVersion() : null,
                wasCorrected(lastAnswer),
                q.getRejectReason());
    }

    private void validatePageRequest(int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("El número de página no puede ser negativo");
        }
        if (size <= 0 || size > 100) {
            throw new IllegalArgumentException("El tamaño de página debe estar entre 1 y 100");
        }
    }

    private Page<Question> findStudentQuestions(Long studentId, Status status, Scope scope, Pageable pageable) {
        if (status == null && scope == null) {
            return questions.findByStudent_Id(studentId, pageable);
        }
        if (status != null && scope == null) {
            return questions.findByStudent_IdAndStatus(studentId, status, pageable);
        }
        if (status == null) {
            return questions.findByStudent_IdAndScope(studentId, scope, pageable);
        }
        return questions.findByStudent_IdAndStatusAndScope(studentId, status, scope, pageable);
    }

    private QaDtos.QuestionSummary toQuestionSummary(Question question) {
        return QaDtos.QuestionSummary.builder()
                .id(question.getId())
                .title(question.getTitle())
                .status(enumName(question.getStatus()))
                .scope(enumName(question.getScope()))
                .createdAt(question.getCreatedAt() != null ? question.getCreatedAt().toString() : null)
                .build();
    }

    private Status parseOptionalStatus(String value, String messagePrefix) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Status.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(messagePrefix + value);
        }
    }

    private Status parseOptionalStatusAllowAll(String value, String messagePrefix) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
            return null;
        }
        return parseOptionalStatus(value, messagePrefix);
    }

    private Scope parseOptionalScope(String value, String messagePrefix) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Scope.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(messagePrefix + value);
        }
    }

    private Scope parseOptionalScopeAllowAll(String value, String messagePrefix) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
            return null;
        }
        return parseOptionalScope(value, messagePrefix);
    }

    private String normalizeSearchTerm(String text) {
        return text != null && !text.isBlank() ? text.toLowerCase() : null;
    }

    private boolean matchesQuestionText(Question question, String term) {
        if (term == null) {
            return true;
        }
        String title = question.getTitle() != null ? question.getTitle().toLowerCase() : "";
        String body = question.getBody() != null ? question.getBody().toLowerCase() : "";
        return title.contains(term) || body.contains(term);
    }

    private Stream<Question> filterTutorHistory(
            Stream<Question> stream,
            Status statusFilter,
            Scope scopeFilter,
            String searchTerm) {
        if (statusFilter != null) {
            stream = stream.filter(question -> question.getStatus() == statusFilter);
        }
        if (scopeFilter != null) {
            stream = stream.filter(question -> question.getScope() == scopeFilter);
        }
        if (searchTerm != null) {
            stream = stream.filter(question -> matchesQuestionText(question, searchTerm));
        }
        return stream;
    }

    private TutorPendingQuestionDto toTutorPendingQuestionDto(Question question) {
        StudentContactInfo studentInfo = extractStudentContactInfo(question);
        return new TutorPendingQuestionDto(
                question.getId(),
                question.getTitle(),
                question.getBody(),
                enumName(question.getStatus()),
                enumName(question.getScope()),
                question.getCreatedAt(),
                studentInfo.name(),
                studentInfo.email());
    }

    private TutorRecentQuestionDto toTutorRecentQuestionDto(Question question) {
        StudentContactInfo studentInfo = extractStudentContactInfo(question);
        return new TutorRecentQuestionDto(
                question.getId(),
                question.getTitle(),
                enumName(question.getStatus()),
                enumName(question.getScope()),
                question.getCreatedAt(),
                studentInfo.name(),
                studentInfo.email());
    }

    private TutorHistoryItemDto toTutorHistoryItem(Question question) {
        StudentContactInfo studentInfo = extractStudentContactInfo(question);
        return new TutorHistoryItemDto(
                question.getId(),
                question.getTitle(),
                enumName(question.getStatus()),
                enumName(question.getScope()),
                resolveHistoryTimestamp(question),
                studentInfo.name(),
                studentInfo.email());
    }

    private TutorHistoryItemDto toTutorHistoryItem(Answer answer) {
        Question question = answer.getQuestion();
        StudentContactInfo studentInfo = extractStudentContactInfo(question);
        return new TutorHistoryItemDto(
                question.getId(),
                question.getTitle(),
                enumName(question.getStatus()),
                enumName(question.getScope()),
                answer.getCreatedAt() != null ? answer.getCreatedAt().toString() : null,
                studentInfo.name(),
                studentInfo.email());
    }

    private StudentContactInfo extractStudentContactInfo(Question question) {
        if (question.getStudent() == null || question.getStudent().getUser() == null) {
            return StudentContactInfo.empty();
        }
        User user = question.getStudent().getUser();
        return new StudentContactInfo(buildFullName(user), user.getEmail());
    }

    private TutorContactInfo extractTutorContactInfo(Question question, List<Answer> allAnswers) {
        Tutor tutor = question.getTutor();
        if (tutor == null && !allAnswers.isEmpty()) {
            Answer lastAnswer = findLastAnswer(allAnswers);
            tutor = lastAnswer != null ? lastAnswer.getTutor() : null;
        }
        if (tutor == null || tutor.getUser() == null) {
            return TutorContactInfo.empty();
        }
        User user = tutor.getUser();
        String fullName = buildFullName(user);
        return new TutorContactInfo(fullName, fullName, user.getEmail());
    }

    private String buildFullName(User user) {
        return Stream.of(user.getName(), user.getLastNamePaterno(), user.getLastNameMaterno())
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .collect(Collectors.joining(" "));
    }

    private String resolveHistoryTimestamp(Question question) {
        if (question.getCurrentAnswer() != null && question.getCurrentAnswer().getCreatedAt() != null) {
            return question.getCurrentAnswer().getCreatedAt().toString();
        }
        if (question.getUpdatedAt() != null) {
            return question.getUpdatedAt().toString();
        }
        return question.getCreatedAt() != null ? question.getCreatedAt().toString() : null;
    }

    private Map<Long, Answer> latestAnswersByQuestion(List<Answer> answers) {
        Map<Long, Answer> latestByQuestion = new LinkedHashMap<>();
        for (Answer answer : answers) {
            latestByQuestion.putIfAbsent(answer.getQuestion().getId(), answer);
        }
        return latestByQuestion;
    }

    private boolean matchesTutorHistoryAnswer(Answer answer, Status statusFilter, Scope scopeFilter, String term) {
        Question question = answer.getQuestion();
        if (statusFilter != null && question.getStatus() != statusFilter) {
            return false;
        }
        if (scopeFilter != null && question.getScope() != scopeFilter) {
            return false;
        }
        if (term == null) {
            return true;
        }

        String answerBody = answer.getBody() != null ? answer.getBody().toLowerCase() : "";
        return matchesQuestionText(question, term) || answerBody.contains(term);
    }

    private void validateStudentQuestionOwnership(Student student, Question question) {
        if (question.getStudent() == null || !question.getStudent().getId().equals(student.getId())) {
            throw new IllegalArgumentException("No tienes permiso para ver esta pregunta");
        }
    }

    private void validateStudentQuestionOwnership(Long studentUserId, Question question) {
        if (question.getStudent() == null
                || question.getStudent().getUser() == null
                || !Objects.equals(question.getStudent().getUser().getId(), studentUserId)) {
            throw new IllegalArgumentException("No tienes permiso para ver esta pregunta");
        }
    }

    private Answer findLastAnswer(List<Answer> allAnswers) {
        return allAnswers.isEmpty() ? null : allAnswers.get(allAnswers.size() - 1);
    }

    private boolean wasCorrected(Answer answer) {
        return answer != null && answer.getVersion() != null && answer.getVersion() > 1;
    }

    private String enumName(Enum<?> value) {
        return value != null ? value.name() : null;
    }

    private String normalizeMessageBody(String body) {
        String normalized = body != null ? body.trim() : "";
        if (!StringUtils.hasText(normalized)) {
            throw new IllegalArgumentException("El mensaje no puede estar vacío");
        }
        if (normalized.length() > MAX_MESSAGE_BODY_LENGTH) {
            throw new IllegalArgumentException("El mensaje excede la longitud máxima permitida");
        }
        return normalized;
    }

    private QuestionMessage createThreadMessage(Question question, User sender, String body) {
        QuestionMessage message = QuestionMessage.builder()
                .question(question)
                .senderUser(sender)
                .senderRole(sender.getRole())
                .messageType(QuestionMessageType.TEXT)
                .body(body)
                .visible(true)
                .build();
        return questionMessages.save(message);
    }

    private Answer createAnswerFromThreadMessage(
            Question question,
            Tutor tutor,
            String body,
            QuestionMessage threadMessage,
            boolean correction) {
        int nextVersion = (question.getCurrentAnswer() == null)
                ? 1
                : question.getCurrentAnswer().getVersion() + 1;

        Answer answer = Answer.builder()
                .question(question)
                .tutor(tutor)
                .body(body)
                .version(nextVersion)
                .threadMessage(threadMessage)
                .build();
        answer = answers.save(answer);

        question.setCurrentAnswer(answer);
        question.setRejectReason(null);
        question.setTutor(tutor);
        question.setStatus(correction ? Status.CORREGIDA : Status.PUBLICADA);
        questions.save(question);
        return answer;
    }

    private void notifyTutorAboutNewQuestion(Question question, Tutor tutor, String frontendBaseUrl) {
        if (tutor == null || tutor.getUser() == null || !StringUtils.hasText(tutor.getUser().getEmail())) {
            return;
        }
        emailService.sendTutorNewQuestionEmail(
                tutor.getUser().getEmail(),
                extractStudentContactInfo(question).name(),
                question.getTitle(),
                question.getCreatedAt(),
                question.getId(),
                frontendBaseUrl
        );
    }

    private void notifyStudentAboutTutorReply(
            Question question,
            Tutor tutor,
            Instant eventAt,
            String frontendBaseUrl) {
        if (question.getStudent() == null
                || question.getStudent().getUser() == null
                || !StringUtils.hasText(question.getStudent().getUser().getEmail())) {
            return;
        }
        String tutorName = tutor != null && tutor.getUser() != null
                ? buildFullName(tutor.getUser())
                : extractTutorContactInfo(question, answers.findByQuestion_IdOrderByVersionAsc(question.getId())).fullName();
        emailService.sendStudentTutorReplyEmail(
                question.getStudent().getUser().getEmail(),
                tutorName,
                question.getTitle(),
                eventAt,
                question.getId(),
                frontendBaseUrl
        );
    }

    private void notifyTutorAboutStudentFollowUp(Question question, Instant eventAt, String frontendBaseUrl) {
        Tutor tutor = question.getTutor();
        if (tutor == null && question.getStudent() != null) {
            tutor = tutorStudentRepository.findByStudent_Id(question.getStudent().getId())
                    .map(TutorStudent::getTutor)
                    .orElse(null);
        }
        if (tutor == null || tutor.getUser() == null || !StringUtils.hasText(tutor.getUser().getEmail())) {
            return;
        }
        emailService.sendTutorStudentFollowUpEmail(
                tutor.getUser().getEmail(),
                extractStudentContactInfo(question).name(),
                question.getTitle(),
                eventAt,
                question.getId(),
                frontendBaseUrl
        );
    }

    private QuestionConversationMessageDto toConversationMessageDto(
            QuestionMessage message,
            User viewer,
            List<QuestionMessageRevision> revisions) {
        List<QuestionConversationMessageVersionDto> versions = buildVersionHistory(
                message.getBody(),
                message.getCreatedAt(),
                revisions);
        QuestionConversationMessageVersionDto currentVersion = versions.get(versions.size() - 1);
        return new QuestionConversationMessageDto(
                message.getId(),
                buildFullName(message.getSenderUser()),
                enumName(message.getSenderRole()),
                currentVersion.body(),
                currentVersion.createdAt(),
                "MESSAGE",
                false,
                false,
                versions.size() > 1,
                canCorrectMessage(viewer, message),
                versions
        );
    }

    private QuestionConversationMessageDto buildVirtualQuestionOpening(Question question) {
        return new QuestionConversationMessageDto(
                null,
                extractStudentContactInfo(question).name(),
                UserRole.ESTUDIANTE.name(),
                question.getBody(),
                question.getCreatedAt(),
                "QUESTION",
                true,
                false,
                false,
                false,
                List.of(new QuestionConversationMessageVersionDto(
                        null,
                        1,
                        question.getBody(),
                        question.getCreatedAt(),
                        true,
                        true
                ))
        );
    }

    private QuestionConversationMessageDto buildVirtualAnswerMessage(Answer answer) {
        User tutorUser = answer.getTutor() != null ? answer.getTutor().getUser() : null;
        return new QuestionConversationMessageDto(
                null,
                tutorUser != null ? buildFullName(tutorUser) : null,
                UserRole.TUTOR.name(),
                answer.getBody(),
                answer.getCreatedAt(),
                "ANSWER",
                true,
                answer.getQuestion() != null
                        && answer.getQuestion().getCurrentAnswer() != null
                        && Objects.equals(answer.getQuestion().getCurrentAnswer().getId(), answer.getId()),
                false,
                false,
                List.of(new QuestionConversationMessageVersionDto(
                        null,
                        1,
                        answer.getBody(),
                        answer.getCreatedAt(),
                        true,
                        true
                ))
        );
    }

    private QaService self() {
        return selfProvider.getObject();
    }

    private boolean shouldAddVirtualOpeningMessage(Question question, List<QuestionMessage> persistedMessages) {
        if (persistedMessages.isEmpty()) {
            return true;
        }
        return persistedMessages.stream().noneMatch(message ->
                message.getSenderRole() == UserRole.ESTUDIANTE
                        && message.getSenderUser() != null
                        && question.getStudent() != null
                        && question.getStudent().getUser() != null
                        && Objects.equals(message.getSenderUser().getId(), question.getStudent().getUser().getId())
                        && Objects.equals(message.getBody(), question.getBody()));
    }

    private boolean canReply(User viewer, Question question) {
        if (question.getStatus() == Status.RECHAZADA) {
            return false;
        }
        return switch (viewer.getRole()) {
            case ESTUDIANTE -> question.getStudent() != null
                    && question.getStudent().getUser() != null
                    && Objects.equals(question.getStudent().getUser().getId(), viewer.getId());
            case TUTOR -> canTutorAccessQuestion(requireTutorByUserId(viewer.getId()), question);
            case ADMIN -> false;
        };
    }

    private boolean canCorrectMessage(User viewer, QuestionMessage message) {
        if (viewer.getRole() == UserRole.ADMIN || message.getQuestion() == null) {
            return false;
        }
        if (message.getQuestion().getStatus() == Status.RECHAZADA) {
            return false;
        }
        return message.getSenderUser() != null
                && Objects.equals(message.getSenderUser().getId(), viewer.getId());
    }

    private void ensureCanCorrectMessage(User viewer, QuestionMessage message) {
        if (!canCorrectMessage(viewer, message)) {
            throw new SecurityException("No puedes corregir este mensaje");
        }
    }

    private void ensureCanReadQuestion(User viewer, Question question) {
        switch (viewer.getRole()) {
            case ESTUDIANTE -> validateStudentQuestionOwnership(viewer.getId(), question);
            case TUTOR -> ensureTutorCanRead(requireTutorByUserId(viewer.getId()), question);
            case ADMIN -> {
                // lectura permitida
            }
        }
    }

    private void ensureTutorCanRead(Tutor tutor, Question question) {
        if (!canTutorAccessQuestion(tutor, question)) {
            throw new IllegalArgumentException("No tienes permiso para ver esta pregunta");
        }
    }

    private void ensureTutorCanWrite(Tutor tutor, Question question) {
        if (!canTutorAccessQuestion(tutor, question)) {
            throw new IllegalArgumentException("No tienes permiso para responder esta pregunta");
        }
    }

    private boolean canTutorAccessQuestion(Tutor tutor, Question question) {
        if (question.getTutor() != null && Objects.equals(question.getTutor().getId(), tutor.getId())) {
            return true;
        }
        if (question.getStudent() == null) {
            return false;
        }
        return tutorStudentRepository.findByStudent_Id(question.getStudent().getId())
                .map(TutorStudent::getTutor)
                .map(Tutor::getId)
                .filter(tutorId -> Objects.equals(tutorId, tutor.getId()))
                .isPresent();
    }

    private Map<Long, List<QuestionMessageRevision>> loadRevisionsByMessageId(List<QuestionMessage> messages) {
        List<Long> messageIds = messages.stream()
                .map(QuestionMessage::getId)
                .filter(Objects::nonNull)
                .toList();

        if (messageIds.isEmpty()) {
            return Map.of();
        }

        return questionMessageRevisions.findByQuestionMessage_IdInOrderByCreatedAtAscIdAsc(messageIds)
                .stream()
                .collect(Collectors.groupingBy(
                        revision -> revision.getQuestionMessage().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()));
    }

    private List<QuestionConversationMessageVersionDto> buildVersionHistory(
            String originalBody,
            Instant originalCreatedAt,
            List<QuestionMessageRevision> revisions) {
        List<QuestionConversationMessageVersionDto> versions = new ArrayList<>();
        versions.add(new QuestionConversationMessageVersionDto(
                null,
                1,
                originalBody,
                originalCreatedAt,
                revisions.isEmpty(),
                true
        ));

        for (int i = 0; i < revisions.size(); i++) {
            QuestionMessageRevision revision = revisions.get(i);
            versions.add(new QuestionConversationMessageVersionDto(
                    revision.getId(),
                    i + 2,
                    revision.getBody(),
                    revision.getCreatedAt(),
                    i == revisions.size() - 1,
                    false
            ));
        }

        return versions;
    }

    private String resolveEffectiveBody(QuestionMessage message, List<QuestionMessageRevision> revisions) {
        if (revisions.isEmpty()) {
            return message.getBody();
        }
        return revisions.get(revisions.size() - 1).getBody();
    }

    private record StudentContactInfo(String name, String email) {
        private static StudentContactInfo empty() {
            return new StudentContactInfo(null, null);
        }
    }

    private record TutorContactInfo(String name, String fullName, String email) {
        private static TutorContactInfo empty() {
            return new TutorContactInfo(null, null, null);
        }
    }

}
