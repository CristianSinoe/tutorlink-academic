package com.sinoe.authmfa.dto.qa;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateQuestionMessageCorrectionRequest(
        @NotBlank
        @Size(max = 8000)
        String body
) {
}
