package com.sinoe.authmfa.domain.qa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface QuestionMessageRevisionRepository extends JpaRepository<QuestionMessageRevision, Long> {

    List<QuestionMessageRevision> findByQuestionMessage_IdOrderByCreatedAtAscIdAsc(Long questionMessageId);

    List<QuestionMessageRevision> findByQuestionMessage_IdInOrderByCreatedAtAscIdAsc(Collection<Long> questionMessageIds);
}
