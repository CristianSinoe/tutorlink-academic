package com.sinoe.authmfa.domain.qa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findByQuestion_IdOrderByVersionAsc(Long questionId);

    long countByTutor_Id(Long tutorId);

    long countByTutor_IdAndCreatedAtBetween(
            Long tutorId,
            Instant start,
            Instant end);

    List<Answer> findByTutor_IdOrderByCreatedAtDesc(Long tutorId);

}
