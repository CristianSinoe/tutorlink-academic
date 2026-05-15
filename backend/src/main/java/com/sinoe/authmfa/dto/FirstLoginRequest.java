// src/main/java/com/sinoe/authmfa/dto/FirstLoginRequest.java
package com.sinoe.authmfa.dto;

import jakarta.validation.constraints.NotBlank;

public record FirstLoginRequest(
        @NotBlank String token,
        @NotBlank String password
) {}
