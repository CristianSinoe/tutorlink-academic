package com.sinoe.authmfa.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TutorRepository extends JpaRepository<Tutor, Long> {

    Optional<Tutor> findByUser_Id(Long userId);

    Optional<Tutor> findByTutorCode(String tutorCode);
    
}
