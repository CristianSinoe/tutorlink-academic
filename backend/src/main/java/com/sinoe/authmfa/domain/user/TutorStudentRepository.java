package com.sinoe.authmfa.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TutorStudentRepository extends JpaRepository<TutorStudent, Long> {

    // Para saber si un estudiante ya tiene tutor
    Optional<TutorStudent> findByStudent_Id(Long studentId);

    // Para listar todos los estudiantes de un tutor
    List<TutorStudent> findByTutor_Id(Long tutorId);

    @Query("SELECT DISTINCT ts.student.id FROM TutorStudent ts")
    List<Long> findAssignedStudentIds();

    @Query("SELECT DISTINCT ts.tutor.id FROM TutorStudent ts")
    List<Long> findAssignedTutorIds();

    // Búsqueda con filtros opcionales (tutorCode y/o matrícula)
    @Query("""
        SELECT ts
        FROM TutorStudent ts
        JOIN FETCH ts.tutor t
        JOIN FETCH t.user tu
        JOIN FETCH ts.student s
        JOIN FETCH s.user su
        WHERE (:tutorCode IS NULL OR t.tutorCode = :tutorCode)
          AND (:matricula IS NULL OR s.matricula = :matricula)
        """)
    List<TutorStudent> searchAssignments(
            @Param("tutorCode") String tutorCode,
            @Param("matricula") String matricula
    );
}
