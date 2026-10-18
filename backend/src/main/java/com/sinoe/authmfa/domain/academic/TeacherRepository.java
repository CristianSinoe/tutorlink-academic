package com.sinoe.authmfa.domain.academic;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByInstitution_IdAndUser_Id(Long institutionId, Long userId);
}
