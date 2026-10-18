package com.sinoe.authmfa.dto;

import jakarta.validation.constraints.*;
import java.util.*;

public final class InstitutionAdminDtos {
 private InstitutionAdminDtos() {}
 public record UserRequest(@NotBlank String name,@NotBlank String lastNamePaterno,String lastNameMaterno,@NotBlank @Email String email,@Size(min=8,max=255) String password,@NotBlank String role,@Size(max=50) String code,@Size(max=100) String department,@Size(max=150) String specialty,String career,String plan,@Min(1) @Max(20) Integer semester,@Size(max=30) String phone) {}
 public record RoleRequest(@NotBlank String role,@Size(max=50) String code,@Size(max=100) String department,@Size(max=150) String specialty,String career,String plan,@Min(1) @Max(20) Integer semester,@Size(max=30) String phone) {}
 public record StatusRequest(@NotBlank String status) {}
 public record UserResponse(Long userId,String email,String name,String status,List<String> roles,Map<String,Long> profiles) {}
 public record Profile(Long id,String role,@Size(max=50) String code,@Size(max=100) String department,@Size(max=150) String specialty,String career,String plan,@Min(1) @Max(20) Integer semester,@Size(max=30) String phone) {}
 public record Membership(String role,String status,String contactEmail,java.time.OffsetDateTime contactVerifiedAt) {}
 public record UserDetail(Long userId,String email,String name,String lastNamePaterno,String lastNameMaterno,String status,List<Profile> profiles,List<Membership> memberships) {}
 public record ProfileUpdate(@NotBlank @Size(max=50) String code,@Size(max=100) String department,@Size(max=150) String specialty,String career,String plan,@Min(1) @Max(20) Integer semester,@Size(max=30) String phone) {}
 public record ImportRequest(@NotBlank @Size(max=1000000) String csv) {}
 public record ImportRow(int row,String outcome,String message,Long userId,Long invitationId) {
  public ImportRow(int row,String outcome,String message,Long userId){this(row,outcome,message,userId,null);}
 }
 public record InvitationRequest(@NotBlank @Email @Size(max=190) String contactEmail,@NotBlank @Pattern(regexp="ESTUDIANTE|DOCENTE|TUTOR") String role,@NotNull @jakarta.validation.Valid ProfileUpdate profile) {}
 public record InvitationView(Long id,String contactEmail,String role,java.time.Instant expiresAt,String status) {}
 public record InvitationAccept(@NotBlank String token,@Size(max=120) String name,@Size(max=120) String lastNamePaterno,@Size(max=120) String lastNameMaterno,@Size(min=8,max=255) String password) {}
 public record ImportReport(int total,int created,int invited,int skipped,int failed,List<ImportRow> rows) {}
 public record PageResponse(List<UserResponse> items,long total,int page,int size) {}
}
