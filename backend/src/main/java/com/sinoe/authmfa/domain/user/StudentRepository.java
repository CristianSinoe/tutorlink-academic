package com.sinoe.authmfa.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    java.util.List<Student> findAllByUser_Id(Long userId);
    Optional<Student> findByInstitution_IdAndUser_Id(Long institutionId,Long userId);
    java.util.List<Student> findByInstitution_Id(Long institutionId);
    default Optional<Student> findByUser_Id(Long userId) {
        Long institution=com.sinoe.authmfa.security.ScopedProfiles.institutionId();
        return institution==null ? com.sinoe.authmfa.security.ScopedProfiles.unique(findAllByUser_Id(userId)) : findByInstitution_IdAndUser_Id(institution,userId);
    }

    java.util.List<Student> findAllByMatricula(String matricula);
    Optional<Student> findByInstitution_IdAndMatricula(Long institutionId,String matricula);
    default Optional<Student> findByMatricula(String matricula) {
        Long institution=com.sinoe.authmfa.security.ScopedProfiles.institutionId();
        return institution==null ? com.sinoe.authmfa.security.ScopedProfiles.unique(findAllByMatricula(matricula)) : findByInstitution_IdAndMatricula(institution,matricula);
    }

    // Devuelve estudiantes que NO tienen ningún tutor asignado (sin registros en TutorStudent), opcionalmente filtrando por prefijo de matrícula / nombre
    @Query("""
            SELECT s
            FROM Student s
            JOIN s.user u
            LEFT JOIN TutorStudent ts ON ts.student = s
            WHERE ts.id IS NULL
              AND (:institution IS NULL OR s.institution.id=:institution)
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
    List<Student> findUnassignedStudentsScoped(@Param("institution") Long institution,@Param("term") String term);
    default List<Student> findUnassignedStudentsByTerm(String term) {return findUnassignedStudentsScoped(com.sinoe.authmfa.security.ScopedProfiles.institutionId(),term);}
}
