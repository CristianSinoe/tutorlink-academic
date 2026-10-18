package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.institution.*;
import com.sinoe.authmfa.domain.user.*;
import com.sinoe.authmfa.dto.PlatformDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor
public class PlatformService {
 private final InstitutionRepository institutions; private final InstitutionMembershipRepository memberships; private final UserRepository users;
 public List<InstitutionResponse> list() { return institutions.findAll().stream().map(this::response).toList(); }
 @Transactional public InstitutionResponse create(String code,String name,String timezone) { if(institutions.findByCode(code.trim().toUpperCase()).isPresent()) throw new IllegalStateException("El código institucional ya existe"); return response(institutions.save(Institution.builder().code(code.trim().toUpperCase()).name(name.trim()).timezone(timezone==null||timezone.isBlank()?"America/Mexico_City":timezone).build())); }
 @Transactional public InstitutionResponse update(long id,String code,String name,String timezone) { Institution i=institutions.findById(id).orElseThrow(()->new IllegalArgumentException("Institución no encontrada")); i.setCode(code.trim().toUpperCase()); i.setName(name.trim()); if(timezone!=null&&!timezone.isBlank())i.setTimezone(timezone); return response(institutions.save(i)); }
 @Transactional public InstitutionResponse status(long id,boolean active) { Institution i=institutions.findById(id).orElseThrow(()->new IllegalArgumentException("Institución no encontrada")); i.setStatus(active?InstitutionStatus.ACTIVE:InstitutionStatus.INACTIVE); return response(institutions.save(i)); }
 @Transactional public MembershipResponse grantAdmin(long institutionId,long userId) { return membership(grant(institutionId,userId,InstitutionRole.ADMIN)); }
 @Transactional public void revokeAdmin(long institutionId,long userId) { InstitutionMembership m=memberships.findByInstitution_IdAndUser_IdAndRole(institutionId,userId,InstitutionRole.ADMIN).orElseThrow(()->new IllegalArgumentException("Membresía no encontrada")); m.setStatus(MembershipStatus.REVOKED);  memberships.save(m); }
 public List<MembershipResponse> memberships(long institutionId) { return memberships.findAll().stream().filter(m->m.getInstitution().getId().equals(institutionId)).map(this::membership).toList(); }
 private InstitutionMembership grant(long institutionId,long userId,InstitutionRole role) { Institution i=institutions.findById(institutionId).orElseThrow(()->new IllegalArgumentException("Institución no encontrada")); User u=users.findById(userId).orElseThrow(()->new IllegalArgumentException("Usuario no encontrado")); if(u.getRole()==UserRole.SUPER_ADMIN)throw new SecurityException("SUPER_ADMIN no se asigna mediante membresías"); InstitutionMembership m=memberships.findByInstitution_IdAndUser_IdAndRole(institutionId,userId,role).orElse(InstitutionMembership.builder().institution(i).user(u).role(role).build()); m.setStatus(MembershipStatus.ACTIVE);  return memberships.save(m); }
 private void bump(User u){u.setAuthorizationVersion(u.getAuthorizationVersion()+1);users.save(u);} private InstitutionResponse response(Institution i){return new InstitutionResponse(i.getId(),i.getCode(),i.getName(),i.getTimezone(),i.getStatus().name());} private MembershipResponse membership(InstitutionMembership m){User u=m.getUser();return new MembershipResponse(m.getId(),u.getId(),u.getEmail(),u.getName(),m.getRole().name(),m.getStatus().name(),m.getCreatedAt());}
}
