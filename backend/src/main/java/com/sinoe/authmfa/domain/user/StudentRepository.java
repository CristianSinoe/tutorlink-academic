package com.sinoe.authmfa.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByUser_Id(Long userId);

    Optional<Student> findByMatricula(String matricula);

    // Devuelve estudiantes que NO tienen ningún tutor asignado (sin registros en TutorStudent), opcionalmente filtrando por prefijo de matrícula / nombre
    @Query("""
            SELECT s
            FROM Student s
            JOIN s.user u
            LEFT JOIN TutorStudent ts ON ts.student = s
            WHERE ts.id IS NULL
              AND (
                    :term IS NULL
                    OR :term = ''
                    OR LOWER(s.matricula) LIKE LOWER(CONCAT(:term, '%'))
                    OR LOWER(u.name) LIKE LOWER(CONCAT(:term, '%'))
                    OR LOWER(u.lastNamePaterno) LIKE LOWER(CONCAT(:term, '%'))
                    OR LOWER(u.lastNameMaterno) LIKE LOWER(CONCAT(:term, '%'))
                  )
            ORDER BY s.matricula ASC
            """)
    List<Student> findUnassignedStudentsByTerm(@Param("term") String term);
}
