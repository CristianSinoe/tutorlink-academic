package com.sinoe.authmfa.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinoe.authmfa.dto.InstitutionAdminDtos.*;
import com.sinoe.authmfa.domain.user.*;
import com.sinoe.authmfa.domain.institution.InstitutionRepository;
import com.sinoe.authmfa.security.InstitutionAccessService;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import java.time.*;
import java.util.*;
import java.security.*;

@Service
@RequiredArgsConstructor
public class InstitutionInvitationService {
    private final JdbcTemplate jdbc;
    private final InstitutionAccessService access;
    private final InstitutionRepository institutions;
    private final InstitutionAdminService admin;
    private final UserRepository users;
    private final UserService userService;
    private final EmailService email;
    private final ObjectMapper json;
    private final Validator validator;
    private final AuditService audit;
    private final Clock clock;

    @Transactional
    public InvitationView issue(long institution,long actor,long version,String role,String contact,ProfileUpdate profile) {
        var context=access.resolve(actor,institution,version);
        if(!context.roles().contains("ADMIN")&&!context.roles().contains("SUPER_ADMIN")) throw denied();
        if(!Set.of("ESTUDIANTE","DOCENTE","TUTOR").contains(role) || profile==null || !validator.validate(profile).isEmpty()
                || contact==null || !contact.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+") || contact.length()>190) throw new IllegalArgumentException("Invitación inválida");
        contact=contact.trim().toLowerCase(Locale.ROOT);
        jdbc.queryForList("select id from tl_institutions where id=? for update",institution);
        if(jdbc.queryForObject("select count(*) from tl_institution_invitations where institution_id=? and contact_email=? and role=? and accepted_at is null and revoked_at is null and expires_at>?",Integer.class,
                institution,contact,role,java.sql.Timestamp.from(clock.instant()))>0) throw new AcademicService.AcademicConflictException("Ya existe una invitación pendiente");
        String table=role.equals("ESTUDIANTE") ? "tl_students" : role.equals("TUTOR") ? "tl_tutors" : "tl_teachers";
        String code=role.equals("ESTUDIANTE") ? "matricula" : role.equals("TUTOR") ? "tutor_code" : "teacher_code";
        var pending=jdbc.queryForList("select profile_data::text as profile_data from tl_institution_invitations where institution_id=? and role=? and accepted_at is null and revoked_at is null and expires_at>?",institution,role,java.sql.Timestamp.from(clock.instant()));
        for(var row:pending) {
            try {var node=json.readTree((String)row.get("profile_data"));if(node.isTextual()) node=json.readTree(node.asText());
                if(profile.code().equals(node.path("code").asText())) throw new AcademicService.AcademicConflictException("Código reservado por una invitación pendiente");
            } catch(java.io.IOException ex) {throw new IllegalStateException("Perfil de invitación inválido");}
        }
        var owners=jdbc.queryForList("select user_id from "+table+" where institution_id=? and "+code+"=?",Long.class,institution,profile.code());
        var known=users.findByEmail(contact);
        Long target=owners.isEmpty() ? known.map(User::getId).orElse(null) : owners.get(0);
        if(known.isPresent()&&target!=null&&!target.equals(known.get().getId())) throw new AcademicService.AcademicConflictException("Código ya reservado");
        byte[] random=new byte[32];new SecureRandom().nextBytes(random);
        String token=Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        Instant expires=clock.instant().plus(Duration.ofHours(72));
        String payload;
        try {payload=json.writeValueAsString(profile);} catch(Exception ex) {throw new IllegalArgumentException("Perfil inválido");}
        String normalized=contact;
        var keys=new org.springframework.jdbc.support.GeneratedKeyHolder();
        jdbc.update(connection -> {
            var statement=connection.prepareStatement("insert into tl_institution_invitations(institution_id,created_by_user_id,contact_email,role,profile_data,token_hash,expires_at,target_user_id) values(?,?,?,?,cast(? as jsonb),?,?,?)",new String[]{"id"});
            statement.setLong(1,institution);statement.setLong(2,actor);statement.setString(3,normalized);statement.setString(4,role);
            statement.setString(5,payload);statement.setString(6,hash(token));statement.setObject(7,java.sql.Timestamp.from(expires));statement.setObject(8,target);return statement;
        },keys);
        long id=java.util.Objects.requireNonNull(keys.getKey()).longValue();
        String school=institutions.findById(institution).orElseThrow().getName();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { email.sendInstitutionInvitation(normalized,school,token); }
        });
        audit.logSystem(actor,"INSTITUTION_INVITATION_ISSUED",true,null,"institution="+institution+";invitation="+id+";role="+role);
        return new InvitationView(id,contact,role,expires,"PENDING");
    }
    @Transactional(readOnly=true)
    public com.sinoe.authmfa.dto.PagedResponse<InvitationView> list(long institution,long actor,long version,int page,int size) {
        var permitted=access.resolve(actor,institution,version);
        if(!permitted.roles().contains("ADMIN")&&!permitted.roles().contains("SUPER_ADMIN")) throw denied();
        if(page<0||size<1||size>100) throw new IllegalArgumentException("Paginación inválida");
        long total=jdbc.queryForObject("select count(*) from tl_institution_invitations where institution_id=?",Long.class,institution);
        var rows=jdbc.query("select id,contact_email,role,expires_at,accepted_at,revoked_at from tl_institution_invitations where institution_id=? order by id limit ? offset ?",
                (rs,n) -> new InvitationView(rs.getLong("id"),rs.getString("contact_email"),rs.getString("role"),rs.getTimestamp("expires_at").toInstant(),
                        rs.getTimestamp("accepted_at")!=null ? "ACCEPTED" : rs.getTimestamp("revoked_at")!=null ? "CANCELLED" : clock.instant().isBefore(rs.getTimestamp("expires_at").toInstant()) ? "PENDING" : "EXPIRED"),institution,size,(long)page*size);
        return new com.sinoe.authmfa.dto.PagedResponse<>(rows,page,size,total,(int)((total+size-1)/size));
    }
    @Transactional
    public InvitationView resend(long institution,long actor,long version,long id) {
        var permitted=access.resolve(actor,institution,version);
        if(!permitted.roles().contains("ADMIN")&&!permitted.roles().contains("SUPER_ADMIN")) throw denied();
        var rows=jdbc.queryForList("select contact_email,role from tl_institution_invitations where institution_id=? and id=? and accepted_at is null and revoked_at is null for update",institution,id);
        if(rows.size()!=1) throw denied();
        String contact=(String)rows.get(0).get("contact_email");String role=(String)rows.get(0).get("role");
        byte[] random=new byte[32];new SecureRandom().nextBytes(random);String token=Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        Instant expires=clock.instant().plus(Duration.ofHours(72));
        jdbc.update("update tl_institution_invitations set token_hash=?,expires_at=? where id=? and institution_id=?",hash(token),java.sql.Timestamp.from(expires),id,institution);
        String school=institutions.findById(institution).orElseThrow().getName();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCommit(){email.sendInstitutionInvitation(contact,school,token);}});
        audit.logSystem(actor,"INSTITUTION_INVITATION_RESENT",true,null,"institution="+institution+";invitation="+id);
        return new InvitationView(id,contact,role,expires,"PENDING");
    }
    @Transactional
    public void cancel(long institution,long actor,long version,long id) {
        var permitted=access.resolve(actor,institution,version);
        if(!permitted.roles().contains("ADMIN")&&!permitted.roles().contains("SUPER_ADMIN")) throw denied();
        int updated=jdbc.update("update tl_institution_invitations set revoked_at=? where institution_id=? and id=? and accepted_at is null and revoked_at is null",java.sql.Timestamp.from(clock.instant()),institution,id);
        if(updated!=1) throw denied();
        audit.logSystem(actor,"INSTITUTION_INVITATION_CANCELLED",true,null,"institution="+institution+";invitation="+id);
    }
    @Transactional
    public UserResponse accept(Authentication authentication,InvitationAccept request) {
        if(request.token()==null || !request.token().matches("[A-Za-z0-9_-]{43}")) throw denied();
        var rows=jdbc.queryForList("select id,institution_id,target_user_id,contact_email,role,profile_data::text as profile_data,expires_at,accepted_at,revoked_at "
                +"from tl_institution_invitations where token_hash=? for update",hash(request.token()));
        if(rows.size()!=1) throw denied();var invitation=rows.get(0);
        if(invitation.get("accepted_at")!=null || invitation.get("revoked_at")!=null || !clock.instant().isBefore(asInstant(invitation.get("expires_at")))) throw denied();
        String contact=(String)invitation.get("contact_email");
        User user;
        if(authentication!=null && authentication.isAuthenticated() && authentication.getDetails() instanceof InstitutionAccessService.Access a) {
            access.resolve(a.user().getId(),a.institutionId(),a.user().getAuthorizationVersion());
            user=users.findById(a.user().getId()).orElseThrow(InstitutionInvitationService::denied);
        } else {
            var existing=users.findByEmail(contact);
            if(existing.isPresent()) {
                user=existing.get();
                if(user.getStatus()!=UserStatus.ACTIVE || request.password()==null || !userService.checkPassword(user,request.password())) throw denied();
            } else {
                if(request.name()==null||request.name().isBlank()||request.lastNamePaterno()==null||request.lastNamePaterno().isBlank()
                        || request.password()==null||request.password().length()<8) throw new IllegalArgumentException("Datos de cuenta requeridos");
                user=userService.createUser(new UserService.CreateUserCommand(request.name(),request.lastNamePaterno(),request.lastNameMaterno(),contact,request.password(),UserRole.valueOf((String)invitation.get("role"))));
            }
        }
        if(user.getRole()==UserRole.SUPER_ADMIN || (invitation.get("target_user_id")!=null && ((Number)invitation.get("target_user_id")).longValue()!=user.getId())) throw denied();
        ProfileUpdate profile;
        try {var node=json.readTree((String)invitation.get("profile_data"));if(node.isTextual()) node=json.readTree(node.asText());profile=json.treeToValue(node,ProfileUpdate.class);} catch(Exception ex) {throw denied();}
        long institution=((Number)invitation.get("institution_id")).longValue();
        var result=admin.linkVerified(institution,user,(String)invitation.get("role"),profile,contact);
        jdbc.update("update tl_institution_invitations set accepted_at=?,accepted_by_user_id=? where id=?",java.sql.Timestamp.from(clock.instant()),user.getId(),invitation.get("id"));
        audit.logSystem(user.getId(),"INSTITUTION_INVITATION_ACCEPTED",true,null,"institution="+institution+";invitation="+invitation.get("id"));
        return result;
    }
    private static Instant asInstant(Object value) {
        if(value instanceof java.sql.Timestamp t) return t.toInstant();
        if(value instanceof OffsetDateTime t) return t.toInstant();
        throw new IllegalStateException("Fecha de invitación inválida");
    }
    private static String hash(String token) {
        try {return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8)));}
        catch(NoSuchAlgorithmException ex) {throw new IllegalStateException(ex);}
    }
    private static AccessDeniedException denied() {return new AccessDeniedException("Invitación o vinculación no autorizada");}
}
