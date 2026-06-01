package com.sinoe.authmfa.dto.qa;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateQuestionMessageRequest(
        @NotBlank
        @Size(max = 8000)
        String body
) {
}
