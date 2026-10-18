package com.sinoe.authmfa.web;
import com.sinoe.authmfa.dto.PlatformDtos.*; import com.sinoe.authmfa.service.PlatformService; import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.http.ResponseEntity; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/platform") @RequiredArgsConstructor public class PlatformController { private final PlatformService platform;
 @GetMapping("/institutions") public List<InstitutionResponse> list(){return platform.list();}
 @PostMapping("/institutions") public ResponseEntity<InstitutionResponse> create(@Valid @RequestBody InstitutionRequest r){return ResponseEntity.status(201).body(platform.create(r.code(),r.name(),r.timezone()));}
 @PutMapping("/institutions/{id}") public InstitutionResponse update(@PathVariable long id,@Valid @RequestBody InstitutionRequest r){return platform.update(id,r.code(),r.name(),r.timezone());}
 @PatchMapping("/institutions/{id}/status") public InstitutionResponse status(@PathVariable long id,@Valid @RequestBody InstitutionStatusRequest r){return platform.status(id,r.active());}
 @GetMapping("/institutions/{id}/memberships") public List<MembershipResponse> memberships(@PathVariable long id){return platform.memberships(id);}
 @PostMapping("/institutions/{id}/admins") public ResponseEntity<MembershipResponse> admin(@PathVariable long id,@Valid @RequestBody MembershipRequest r){return ResponseEntity.status(201).body(platform.grantAdmin(id,r.userId()));}
 @DeleteMapping("/institutions/{id}/admins/{userId}") public ResponseEntity<Void> revoke(@PathVariable long id,@PathVariable long userId){platform.revokeAdmin(id,userId);return ResponseEntity.noContent().build();}}
