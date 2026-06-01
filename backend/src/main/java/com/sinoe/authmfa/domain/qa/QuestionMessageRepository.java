package com.sinoe.authmfa.domain.qa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionMessageRepository extends JpaRepository<QuestionMessage, Long> {

    List<QuestionMessage> findByQuestion_IdAndVisibleTrueOrderByCreatedAtAscIdAsc(Long questionId);
}
