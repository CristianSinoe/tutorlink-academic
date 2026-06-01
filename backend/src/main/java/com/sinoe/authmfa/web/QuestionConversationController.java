package com.sinoe.authmfa.web;

import com.sinoe.authmfa.dto.AuthDtos;
import com.sinoe.authmfa.dto.qa.CreateQuestionMessageCorrectionRequest;
import com.sinoe.authmfa.dto.qa.CreateQuestionMessageRequest;
import com.sinoe.authmfa.dto.qa.QuestionConversationDto;
import com.sinoe.authmfa.dto.qa.QuestionConversationMessageDto;
import com.sinoe.authmfa.service.AuditService;
import com.sinoe.authmfa.service.QaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionConversationController {

    private final QaService qa;
    private final AuditService audit;

    @GetMapping("/{questionId}/messages")
    public ResponseEntity<QuestionConversationDto> getConversation(
            @PathVariable("questionId") Long questionId,
            Authentication auth) {
        Long userId = qa.requireUserByEmail(auth.getName()).getId();
        return ResponseEntity.ok(qa.getQuestionConversation(userId, questionId));
    }

    @PostMapping("/{questionId}/messages")
    public ResponseEntity<QuestionConversationMessageDto> createMessage(
            @PathVariable("questionId") Long questionId,
            @Valid @RequestBody CreateQuestionMessageRequest dto,
            Authentication auth,
            HttpServletRequest request) {
        var user = qa.requireUserByEmail(auth.getName());
        QuestionConversationMessageDto created = qa.addConversationMessage(
                user.getId(),
                questionId,
                dto.body(),
                resolveFrontendBaseUrl(request));

        audit.log(request, user.getId(), user.getRole().name() + "_THREAD_MESSAGE", true, null, "message created");

        return ResponseEntity
                .created(URI.create("/api/questions/" + questionId + "/messages"))
                .body(created);
    }

    @PostMapping("/messages/{messageId}/corrections")
    public ResponseEntity<QuestionConversationMessageDto> correctMessage(
            @PathVariable("messageId") Long messageId,
            @Valid @RequestBody CreateQuestionMessageCorrectionRequest dto,
            Authentication auth,
            HttpServletRequest request) {
        var user = qa.requireUserByEmail(auth.getName());
        QuestionConversationMessageDto corrected = qa.correctConversationMessage(
                user.getId(),
                messageId,
                dto.body(),
                resolveFrontendBaseUrl(request));

        audit.log(request, user.getId(), user.getRole().name() + "_MESSAGE_CORRECTION", true, null, "message corrected");

        return ResponseEntity.ok(corrected);
    }

    private static String resolveFrontendBaseUrl(HttpServletRequest request) {
        String origin = trimToNull(request.getHeader("Origin"));
        if (origin != null) {
            return stripTrailingSlash(origin);
        }

        String referer = trimToNull(request.getHeader("Referer"));
        if (referer != null) {
            try {
                java.net.URI uri = java.net.URI.create(referer);
                if (uri.getScheme() != null && uri.getAuthority() != null) {
                    return stripTrailingSlash(uri.getScheme() + "://" + uri.getAuthority());
                }
            } catch (IllegalArgumentException ignored) {
                // fallback by host
            }
        }

        return request.getScheme() + "://" + request.getServerName() + ":5173";
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
