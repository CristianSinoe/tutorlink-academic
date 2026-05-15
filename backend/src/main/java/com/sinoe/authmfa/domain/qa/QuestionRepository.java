package com.sinoe.authmfa.domain.qa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    // Proyección ligera (para /student/questions/my)
    interface Row {
        Long getId();
        String getTitle();
        Status getStatus();
        Instant getCreatedAt();
    }

    // STUDENT

    List<Row> findByStudent_IdOrderByCreatedAtDesc(Long studentId);

    Page<Question> findByStudent_IdOrderByCreatedAtDesc(Long studentId, Pageable pageable);

    Page<Question> findByStudent_IdAndStatusOrderByCreatedAtDesc(Long studentId, Status status, Pageable pageable);

    Page<Question> findByStudent_IdAndScopeOrderByCreatedAtDesc(Long studentId, Scope scope, Pageable pageable);

    Page<Question> findByStudent_Id(Long studentId, Pageable pageable);

    Page<Question> findByStudent_IdAndStatus(Long studentId, Status status, Pageable pageable);

    Page<Question> findByStudent_IdAndScope(Long studentId, Scope scope, Pageable pageable);

    Page<Question> findByStudent_IdAndStatusAndScope(Long studentId, Status status, Scope scope, Pageable pageable);

    // TUTOR (global y por tutor)

    // global por estado
    List<Question> findByStatusOrderByCreatedAtAsc(Status status);

    List<Question> findByStatusAndScopeOrderByCreatedAtAsc(Status status, Scope scope);

    long countByStatus(Status status);

    // Contar SOLO las preguntas de un tutor por estado
    long countByTutor_IdAndStatus(Long tutorId, Status status);

    // Por tutor
    Page<Question> findByTutor_IdOrderByCreatedAtDesc(Long tutorId, Pageable pageable);

    // pendientes (o cualquier estado) de un tutor, orden asc
    List<Question> findByTutor_IdAndStatusOrderByCreatedAtAsc(Long tutorId, Status status);

    // historial del tutor
    List<Question> findByTutor_IdAndStatusInOrderByCreatedAtDesc(Long tutorId, List<Status> statuses);
}
