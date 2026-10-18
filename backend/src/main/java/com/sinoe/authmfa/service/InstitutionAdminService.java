package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.academic.*;
import com.sinoe.authmfa.domain.institution.*;
import com.sinoe.authmfa.domain.user.*;
import com.sinoe.authmfa.dto.InstitutionAdminDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@RequiredArgsConstructor
public class InstitutionAdminService {
    private final UserRepository users;
    private final InstitutionRepository institutions;
    private final InstitutionMembershipRepository memberships;
    private final StudentRepository students;
    private final TutorRepository tutors;
    private final TeacherRepository teachers;
    private final JdbcTemplate jdbc;
    private final AuditService audit;

    @Transactional
    public UserResponse linkVerified(long institutionId,User u,String role,ProfileUpdate profile,String contactEmail) {
        Institution i=institution(institutionId);
        forbidSuper(u);
        grant(i,u,managedRole(role),profile.code(),profile.department(),profile.specialty(),profile.career(),profile.plan(),profile.semester(),profile.phone());
        var m=memberships.findByInstitution_IdAndUser_IdAndRole(institutionId,u.getId(),managedRole(role)).orElseThrow();
        m.setContactEmail(contactEmail);m.setContactVerifiedAt(java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC));memberships.save(m);
        return response(i,u);
    }
    @Transactional
    public UserResponse addRole(long institutionId,long userId,RoleRequest r) {
        Institution i=institution(institutionId); User u=member(institutionId,userId);
        grant(i,u,managedRole(r.role()),r.code(),r.department(),r.specialty(),r.career(),r.plan(),r.semester(),r.phone());
        return response(i,u);
    }
    @Transactional
    public void revoke(long institutionId,long userId,String rawRole) {
        member(institutionId,userId); InstitutionRole role=managedRole(rawRole);
        InstitutionMembership m=memberships.findByInstitution_IdAndUser_IdAndRole(institutionId,userId,role).orElseThrow(InstitutionAdminService::denied);
        if(m.getStatus()!=MembershipStatus.REVOKED) { m.setStatus(MembershipStatus.REVOKED); memberships.save(m);log(institutionId,"INSTITUTION_MEMBERSHIP_REVOKED",userId); }
    }
    @Transactional
    public UserResponse status(long institutionId,long userId,String value) {
        User u=member(institutionId,userId);
        MembershipStatus state=switch(value) {case "ACTIVE" -> MembershipStatus.ACTIVE;case "DISABLED","SUSPENDED" -> MembershipStatus.SUSPENDED;case "REVOKED" -> MembershipStatus.REVOKED;default -> throw new IllegalArgumentException("Estado institucional inválido");};
        int count=jdbc.update("update tl_institution_memberships set status=? where institution_id=? and user_id=? and role<>'ADMIN'",state.name(),institutionId,userId);
        if(count==0) throw new AccessDeniedException("ADMIN se gestiona desde la plataforma");
        log(institutionId,"INSTITUTION_MEMBERSHIPS_STATUS",userId);
        return response(institution(institutionId),u);
    }
    @Transactional
    public UserDetail membershipStatus(long institutionId,long userId,String role,String value) {
        User user=member(institutionId,userId);
        var m=memberships.findByInstitution_IdAndUser_IdAndRole(institutionId,userId,managedRole(role)).orElseThrow(InstitutionAdminService::denied);
        MembershipStatus state=MembershipStatus.valueOf(value);
        if(m.getStatus()!=state) {m.setStatus(state);memberships.saveAndFlush(m);log(institutionId,"INSTITUTION_MEMBERSHIP_STATUS",userId);}
        return detail(institutionId,userId);
    }
    @Transactional(readOnly=true)
    public PageResponse list(long institutionId,String q,String rawRole,String membershipStatus,String accountStatus,int page,int size) {
        if(page<0 || size<1 || size>100) throw new IllegalArgumentException("Paginación inválida");
        Institution i=institution(institutionId);
        List<Object> args=new ArrayList<>(List.of(institutionId));
        String where=" from tl_users u join tl_institution_memberships m on m.user_id=u.id where m.institution_id=?";
        if(membershipStatus!=null && !membershipStatus.equals("ALL")) { where+=" and m.status=?"; args.add(MembershipStatus.valueOf(membershipStatus).name()); }
        if(rawRole!=null && !rawRole.isBlank()) { where+=" and m.role=?"; args.add(InstitutionRole.valueOf(rawRole).name()); }
        if(accountStatus!=null && !accountStatus.isBlank()) { where+=" and cast(u.status as varchar)=?"; args.add(UserStatus.valueOf(accountStatus).name()); }
        if(q!=null && !q.isBlank()) { where+=" and (lower(u.name) like ? or lower(u.email) like ?)";
            String term="%"+q.trim().toLowerCase(Locale.ROOT).replace("%","\\%").replace("_","\\_")+"%"; args.add(term);args.add(term); }
        long count=jdbc.queryForObject("select count(distinct u.id)"+where,Long.class,args.toArray());
        args.add(size);args.add((long)page*size);
        List<Long> ids=jdbc.queryForList("select distinct u.id"+where+" order by u.id limit ? offset ?",Long.class,args.toArray());
        return new PageResponse(ids.stream().map(id -> response(i,users.findById(id).orElseThrow())).toList(),count,page,size);
    }
    public PageResponse list(long institutionId,String q,String role,int page,int size) { return list(institutionId,q,role,"ACTIVE",null,page,size); }

    @Transactional(readOnly=true)
    public UserDetail detail(long institutionId,long userId) {
        User u=member(institutionId,userId); List<Profile> profiles=new ArrayList<>();
        students.findByInstitution_IdAndUser_Id(institutionId,userId).ifPresent(s ->
            profiles.add(new Profile(s.getId(),"ESTUDIANTE",s.getMatricula(),null,null,s.getCareer(),s.getPlan(),s.getSemester(),s.getPhone())));
        tutors.findByInstitution_IdAndUser_Id(institutionId,userId).ifPresent(t ->
            profiles.add(new Profile(t.getId(),"TUTOR",t.getTutorCode(),t.getDepartment(),t.getSpecialty(),null,null,null,t.getPhone())));
        teachers.findByInstitution_IdAndUser_Id(institutionId,userId).ifPresent(t ->
            profiles.add(new Profile(t.getId(),"DOCENTE",t.getTeacherCode(),t.getDepartment(),t.getSpecialty(),null,null,null,t.getPhone())));
        var roles=jdbc.query("select role,status,contact_email,contact_verified_at from tl_institution_memberships where institution_id=? and user_id=? order by role",
                (rs,n) -> new Membership(rs.getString("role"),rs.getString("status"),rs.getString("contact_email"),rs.getObject("contact_verified_at",java.time.OffsetDateTime.class)),institutionId,userId);
        return new UserDetail(userId,u.getEmail(),u.getName(),u.getLastNamePaterno(),u.getLastNameMaterno(),u.getStatus().name(),profiles,roles);
    }
    @Transactional
    public UserDetail updateProfile(long institutionId,long userId,String rawRole,ProfileUpdate r) {
        member(institutionId,userId); InstitutionRole role=managedRole(rawRole);
        if(role==InstitutionRole.ESTUDIANTE) {
            Student s=students.findByInstitution_IdAndUser_Id(institutionId,userId).orElseThrow(InstitutionAdminService::denied);
            s.setMatricula(r.code());s.setCareer(r.career());s.setPlan(r.plan());s.setSemester(r.semester());s.setPhone(r.phone());students.saveAndFlush(s);
        } else if(role==InstitutionRole.TUTOR) {
            Tutor t=tutors.findByInstitution_IdAndUser_Id(institutionId,userId).orElseThrow(InstitutionAdminService::denied);
            t.setTutorCode(r.code());t.setDepartment(r.department());t.setSpecialty(r.specialty());t.setPhone(r.phone());tutors.saveAndFlush(t);
        } else {
            Teacher t=teachers.findByInstitution_IdAndUser_Id(institutionId,userId).orElseThrow(InstitutionAdminService::denied);
            t.setTeacherCode(r.code());t.setDepartment(r.department());t.setSpecialty(r.specialty());t.setPhone(r.phone());teachers.saveAndFlush(t);
        }
        log(institutionId,"INSTITUTION_PROFILE_UPDATED",userId);
        return detail(institutionId,userId);
    }
    private void grant(Institution i,User u,InstitutionRole role,String code,String dept,String specialty,String career,String plan,Integer semester,String phone) {
        if(role==InstitutionRole.ESTUDIANTE) {
            var profile=students.findByInstitution_IdAndUser_Id(i.getId(),u.getId());
            if(profile.isEmpty()) students.saveAndFlush(Student.builder().institution(i).user(u).matricula(required(code))
                    .career(career).plan(plan).semester(semester).phone(phone).build());
        } else if(role==InstitutionRole.TUTOR) {
            var profile=tutors.findByInstitution_IdAndUser_Id(i.getId(),u.getId());
            if(profile.isEmpty()) tutors.saveAndFlush(Tutor.builder().institution(i).user(u).tutorCode(required(code))
                    .department(dept).specialty(specialty).phone(phone).build());
        } else if(teachers.findByInstitution_IdAndUser_Id(i.getId(),u.getId()).isEmpty()) {
            teachers.saveAndFlush(Teacher.builder().institution(i).user(u).teacherCode(required(code)).department(dept).specialty(specialty).phone(phone).build());
        }
        var m=memberships.findByInstitution_IdAndUser_IdAndRole(i.getId(),u.getId(),role)
                .orElse(InstitutionMembership.builder().institution(i).user(u).role(role).build());
        if(m.getId()==null || m.getStatus()!=MembershipStatus.ACTIVE) { m.setStatus(MembershipStatus.ACTIVE);memberships.saveAndFlush(m);log(i.getId(),"INSTITUTION_MEMBERSHIP_GRANTED",u.getId()); }
    }
    private UserResponse response(Institution i,User u) {
        List<String> roles=memberships.findByUser_IdAndInstitution_IdAndStatus(u.getId(),i.getId(),MembershipStatus.ACTIVE)
                .stream().map(m -> m.getRole().name()).sorted().toList();
        Map<String,Long> p=new HashMap<>();
        students.findByInstitution_IdAndUser_Id(i.getId(),u.getId()).filter(s -> s.getInstitution().getId().equals(i.getId())).ifPresent(s -> p.put("ESTUDIANTE",s.getId()));
        tutors.findByInstitution_IdAndUser_Id(i.getId(),u.getId()).filter(t -> t.getInstitution().getId().equals(i.getId())).ifPresent(t -> p.put("TUTOR",t.getId()));
        teachers.findByInstitution_IdAndUser_Id(i.getId(),u.getId()).ifPresent(t -> p.put("DOCENTE",t.getId()));
        return new UserResponse(u.getId(),u.getEmail(),u.getName(),u.getStatus().name(),roles,p);
    }
    private void log(long institution,String action,long user) {
        var auth=org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        Long actor=auth!=null&&auth.getDetails() instanceof com.sinoe.authmfa.security.InstitutionAccessService.Access a ? a.user().getId() : null;
        audit.logSystem(actor,action,true,null,"institution="+institution+";user="+user);
    }
    private User member(long i,long u) {
        institution(i);
        if(jdbc.queryForObject("select count(*) from tl_institution_memberships where institution_id=? and user_id=?",Integer.class,i,u)==0) throw denied();
        User user=users.findById(u).orElseThrow(InstitutionAdminService::denied);forbidSuper(user);return user;
    }
    private Institution institution(long id) { return institutions.findById(id).filter(i -> i.getStatus()==InstitutionStatus.ACTIVE).orElseThrow(InstitutionAdminService::denied); }
    private InstitutionRole managedRole(String role) {
        InstitutionRole r=InstitutionRole.valueOf(role);
        if(r==InstitutionRole.ADMIN) throw new AccessDeniedException("ADMIN se gestiona desde la plataforma");return r;
    }
    private void forbidSuper(User u) { if(u.getRole()==UserRole.SUPER_ADMIN) throw denied(); }
    private String required(String s) { if(s==null||s.isBlank()) throw new IllegalArgumentException("Código de perfil requerido");return s.trim(); }
    private static AccessDeniedException denied() { return new AccessDeniedException("Usuario o perfil no disponible en la institución activa"); }
}
