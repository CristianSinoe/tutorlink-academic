package com.sinoe.authmfa.mapper;

import com.sinoe.authmfa.domain.qa.Answer;
import com.sinoe.authmfa.domain.qa.Question;
import com.sinoe.authmfa.dto.qa.*;

import java.util.Comparator;
import java.util.List;

public final class QaMapper {
    private QaMapper() {
    }

    public static QuestionSummaryDto toSummary(Question q) {
        return new QuestionSummaryDto(
                q.getId(),
                q.getTitle(),
                q.getStatus() != null ? q.getStatus().name() : null,
                q.getScope() != null ? q.getScope().name() : null,
                q.getCreatedAt());
    }

    public static QuestionDetailDto toDetail(Question q) {
        Answer ans = q.getCurrentAnswer(); // puede venir null
        Integer v = (ans != null ? ans.getVersion() : null);

        return new QuestionDetailDto(
                q.getId(),
                q.getTitle(),
                q.getBody(),
                q.getStatus() != null ? q.getStatus().name() : null,
                q.getScope() != null ? q.getScope().name() : null,
                q.getRejectReason(),
                ans != null ? ans.getId() : null,
                ans != null ? ans.getBody() : null,
                v,
                v != null && v > 1,
                q.getCreatedAt(),
                q.getUpdatedAt());
    }

    public static AnswerHistoryDto toHistory(Answer a) {
        return new AnswerHistoryDto(
                a.getId(),
                a.getVersion(),
                a.getBody(),
                a.getCreatedAt());
    }

    public static List<AnswerHistoryDto> toHistoryListSortedByVersion(List<Answer> answers) {
        return answers.stream()
                .sorted(Comparator.comparing(Answer::getVersion))
                .map(QaMapper::toHistory)
                .toList();
    }
}