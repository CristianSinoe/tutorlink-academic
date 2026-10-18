package com.sinoe.authmfa.dto;

import jakarta.validation.constraints.*;
import java.time.OffsetDateTime;

public final class PlatformDtos {
 private PlatformDtos() { }
 public record InstitutionRequest(@NotBlank @Size(max=60) String code,@NotBlank @Size(max=180) String name,String timezone) { }
 public record InstitutionStatusRequest(@NotNull Boolean active) { }
 public record MembershipRequest(@NotNull Long userId) { }
 public record InstitutionResponse(Long id,String code,String name,String timezone,String status) { }
 public record MembershipResponse(Long id,Long userId,String email,String name,String role,String status,OffsetDateTime createdAt) { }
}
