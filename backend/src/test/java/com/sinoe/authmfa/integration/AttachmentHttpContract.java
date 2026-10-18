package com.sinoe.authmfa.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sinoe.authmfa.domain.institution.*;
import com.sinoe.authmfa.domain.user.*;
import com.sinoe.authmfa.domain.academic.*;
import com.sinoe.authmfa.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** HTTP -> JWT filter -> real context/authorization -> JDBC/JPA -> response. */
@SpringBootTest(properties={
    "security.jwt.secret=01234567890123456789012345678901", "recaptcha.site-key=test", "recaptcha.secret-key=test",
    "app.seed-admin.enabled=false", "admin.bootstrap.enabled=false",
    "tutorlink.attachments.approved-references[0].institution-id=1",
    "tutorlink.attachments.approved-references[0].url=https://materials.example.edu/guide.pdf",
    "tutorlink.attachments.approved-references[0].file-name=guide.pdf",
    "tutorlink.attachments.approved-references[0].mime-type=application/pdf",
    "tutorlink.attachments.approved-references[0].size-bytes=8", "logging.level.root=WARN"
})
@AutoConfigureMockMvc
abstract class AttachmentHttpContract {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired InstitutionRepository institutions;
    @Autowired InstitutionMembershipRepository memberships;
    @Autowired TeacherRepository teachers;
    @Autowired StudentRepository students;
    @Autowired JwtService jwt;
    @SpyBean AuditService audit;
    @MockBean EmailService email;
    @MockBean RecaptchaService recaptcha;
    User teacher, student, peer, colleague, admin, superAdmin;
    Institution institution;
    protected void initializeAcademicSchema() { }

    @BeforeEach void fixture() {
        reset(audit);
        initializeAcademicSchema();
        for (String table : new String[]{"tl_audit_log","tl_academic_attachments","tl_attendance_records","tl_class_sessions",
                "tl_task_submissions","tl_tasks","tl_course_contents","tl_course_enrollments","tl_course_group_teachers",
                "tl_course_groups","tl_courses","tl_academic_periods","tl_teachers","tl_students","tl_institution_memberships",
                "tl_institutions","tl_users"}) jdbc.update("delete from "+table);
        jdbc.update("insert into tl_institutions(id,code,name,timezone,status,created_at,updated_at) values(1,'ATT','Attachments','UTC','ACTIVE',current_timestamp,current_timestamp)");
        institution=institutions.findById(1L).orElseThrow();
        teacher=user("teacher",UserRole.DOCENTE); student=user("student",UserRole.ESTUDIANTE);
        peer=user("peer",UserRole.ESTUDIANTE); colleague=user("colleague",UserRole.DOCENTE);
        admin=user("admin",UserRole.ADMIN); superAdmin=user("super",UserRole.SUPER_ADMIN);
        var t=teachers.save(Teacher.builder().institution(institution).user(teacher).teacherCode("T1").build());
        var other=teachers.save(Teacher.builder().institution(institution).user(colleague).teacherCode("T2").build());
        var st=students.save(Student.builder().institution(institution).user(student).matricula("S1").build());
        var p=students.save(Student.builder().institution(institution).user(peer).matricula("S2").build());
        jdbc.update("insert into tl_courses(id,institution_id,code,name) values(1,1,'C','Course')");
        jdbc.update("insert into tl_academic_periods(id,institution_id,code,name,starts_on,ends_on) values(1,1,'P','Period',current_date,current_date)");
        jdbc.update("insert into tl_course_groups(id,institution_id,course_id,period_id,code,name) values(1,1,1,1,'G','Group')");
        jdbc.update("insert into tl_course_group_teachers(group_id,teacher_id) values(1,?),(1,?)",t.getId(),other.getId());
        jdbc.update("insert into tl_course_enrollments(group_id,student_id,status) values(1,?,'ACTIVE'),(1,?,'ACTIVE')",st.getId(),p.getId());
        jdbc.update("insert into tl_course_contents(id,group_id,author_teacher_id,title,published) values(30,1,?,'Content',true)",t.getId());
        jdbc.update("insert into tl_tasks(id,group_id,author_teacher_id,title,published,due_at,allow_late_submissions) values(31,1,?,'Task',true,?,false)",
                t.getId(),java.sql.Timestamp.from(java.time.Instant.now().plusSeconds(3600)));
        jdbc.update("insert into tl_task_submissions(id,task_id,student_id,status) values(32,31,?,'DRAFT'),(33,31,?,'ON_TIME')",st.getId(),p.getId());
    }
    User user(String name,UserRole role) {
        var user=users.save(User.builder().email(name+"@attachments.test").name(name).lastNamePaterno("Test")
                .passwordHash("unused").role(role).status(UserStatus.ACTIVE).build());
        if(role!=UserRole.SUPER_ADMIN) memberships.save(InstitutionMembership.builder().user(user).institution(institution)
                .role(InstitutionRole.valueOf(role.name())).build());
        return user;
    }
    protected String token(User user, Long institutionId) {
        var claims=new java.util.HashMap<String,Object>();
        claims.put("uid",user.getId()); claims.put("authVersion",user.getAuthorizationVersion());
        if(institutionId!=null) claims.put("institutionId",institutionId);
        return "Bearer "+jwt.generate(claims,user.getEmail());
    }
    MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder request,User user,String role) {
        return request.header("Authorization",token(user,1L)).param("actingRole",role);
    }
    String body(String type,long id) throws Exception {
        return json.writeValueAsString(Map.of("resourceType",type,"resourceId",id,"fileName","guide.pdf",
                "url","https://materials.example.edu/guide.pdf","mimeType","application/pdf","sizeBytes",8));
    }
    protected long create(User user,String role,String type,long id) throws Exception {
        var result=mvc.perform(as(post("/api/attachments"),user,role).contentType(APPLICATION_JSON).content(body(type,id)))
                .andExpect(status().isCreated()).andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.url").doesNotExist()).andExpect(jsonPath("$.publicId").doesNotExist()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
    @Test void registersAllThreeTypesAndReadsApprovedContent() throws Exception {
        long id=create(teacher,"DOCENTE","CONTENT",30);
        create(teacher,"DOCENTE","TASK",31);
        create(student,"ESTUDIANTE","SUBMISSION",32);
        mvc.perform(as(get("/api/attachments/{id}",id),student,"ESTUDIANTE"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.fileName").value("guide.pdf"))
                .andExpect(jsonPath("$.url").doesNotExist()).andExpect(jsonPath("$.publicId").doesNotExist());
        mvc.perform(as(get("/api/attachments/{id}/content-reference",id),student,"ESTUDIANTE"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.url").value("https://materials.example.edu/guide.pdf"))
                .andExpect(jsonPath("$.publicId").doesNotExist());
    }
    @Test void emptyAndPaginatedListsRequireParentPermission() throws Exception {
        mvc.perform(as(get("/api/attachments").param("resourceType","CONTENT").param("resourceId","30"),student,"ESTUDIANTE"))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        long first=create(teacher,"DOCENTE","CONTENT",30); long second=create(teacher,"DOCENTE","CONTENT",30);
        mvc.perform(as(get("/api/attachments").param("resourceType","CONTENT").param("resourceId","30").param("size","1").param("page","1"),admin,"ADMIN"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].id").value(second))
                .andExpect(jsonPath("$[0].url").doesNotExist()).andExpect(jsonPath("$[0].publicId").doesNotExist());
        assertTrue(first<second);
        mvc.perform(as(get("/api/attachments").param("resourceType","CONTENT").param("resourceId","999"),admin,"ADMIN"))
                .andExpect(status().isForbidden());
        jdbc.update("update tl_course_contents set published=false where id=30");
        mvc.perform(as(get("/api/attachments").param("resourceType","CONTENT").param("resourceId","30"),student,"ESTUDIANTE"))
                .andExpect(status().isForbidden());
    }
    @Test void registrationDeniesColleagueStudentAndAdministrativeRoles() throws Exception {
        for (var pair : new Object[][]{{colleague,"DOCENTE"},{student,"ESTUDIANTE"},{admin,"ADMIN"},{superAdmin,"SUPER_ADMIN"}})
            mvc.perform(as(post("/api/attachments"),(User)pair[0],(String)pair[1]).contentType(APPLICATION_JSON).content(body("CONTENT",30)))
                    .andExpect(status().isForbidden());
        mvc.perform(as(post("/api/attachments"),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content(body("SUBMISSION",33)))
                .andExpect(status().isForbidden());
        mvc.perform(as(post("/api/attachments"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(body("CONTENT",999)))
                .andExpect(status().isForbidden());
    }
    @Test void rejectsArbitraryUrlsAndAlteredMetadata() throws Exception {
        for(var change : Map.of("url","https://private.example/secret","fileName","forged.pdf","mimeType","text/plain","sizeBytes",99,"publicId","forged-provider-id").entrySet()) {
            var payload=json.readTree(body("CONTENT",30)); ((com.fasterxml.jackson.databind.node.ObjectNode)payload).set(change.getKey(),json.valueToTree(change.getValue()));
            mvc.perform(as(post("/api/attachments"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(json.writeValueAsString(payload)))
                    .andExpect(status().isBadRequest());
        }
        assertEquals(0,jdbc.queryForObject("select count(*) from tl_academic_attachments",Integer.class));
    }
    @Test void unlinksWithoutDeletingHistoryAndAuditsActor() throws Exception {
        long id=create(student,"ESTUDIANTE","SUBMISSION",32);
        mvc.perform(as(post("/api/attachments/{id}/unlink",id),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content("{}"))
                .andExpect(status().isNoContent());
        var row=jdbc.queryForMap("select unlinked_at,unlinked_by_user_id from tl_academic_attachments where id=?",id);
        assertNotNull(row.get("unlinked_at")); assertEquals(student.getId(),((Number)row.get("unlinked_by_user_id")).longValue());
        mvc.perform(as(get("/api/attachments/{id}",id),student,"ESTUDIANTE")).andExpect(status().isForbidden());
        mvc.perform(as(post("/api/attachments/{id}/unlink",id),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(as(get("/api/attachments").param("resourceType","SUBMISSION").param("resourceId","32"),student,"ESTUDIANTE"))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        assertEquals(1,jdbc.queryForObject("select count(*) from tl_audit_log where action='ATTACHMENT_UNLINKED' and success=true",Integer.class));
    }
    @Test void administrativeUnlinkRequiresReasonAndNeverExposesContent() throws Exception {
        long id=create(student,"ESTUDIANTE","SUBMISSION",32);
        jdbc.update("update tl_task_submissions set status='ON_TIME' where id=32");
        for (User user : new User[]{admin,superAdmin}) {
            String role=user==admin ? "ADMIN" : "SUPER_ADMIN";
            mvc.perform(as(get("/api/attachments/{id}",id),user,role)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.url").doesNotExist()).andExpect(jsonPath("$.publicId").doesNotExist());
            mvc.perform(as(get("/api/attachments/{id}/content-reference",id),user,role)).andExpect(status().isForbidden());
            mvc.perform(as(post("/api/attachments/{id}/unlink",id),user,role).contentType(APPLICATION_JSON).content("{\"reason\":\"  \"}"))
                    .andExpect(status().isForbidden());
        }
        String reason="Retiro justificado https://private.example/token";
        mvc.perform(as(post("/api/attachments/{id}/unlink",id),admin,"ADMIN").contentType(APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("reason",reason)))).andExpect(status().isNoContent());
        assertEquals(reason,jdbc.queryForObject("select unlink_reason from tl_academic_attachments where id=?",String.class,id));
        String detail=jdbc.queryForObject("select message from tl_audit_log where action='ATTACHMENT_UNLINKED' and success=true",String.class);
        assertFalse(detail.contains("private.example"));
    }
    @Test void finalAndExpiredDraftsCannotBeModifiedButLateAllowedDraftCan() throws Exception {
        long id=create(student,"ESTUDIANTE","SUBMISSION",32);
        for(String status : new String[]{"ON_TIME","LATE"}) {
            jdbc.update("update tl_task_submissions set status=? where id=32",status);
            mvc.perform(as(post("/api/attachments/{id}/unlink",id),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content("{}"))
                    .andExpect(status().isForbidden());
            mvc.perform(as(post("/api/attachments"),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content(body("SUBMISSION",32)))
                    .andExpect(status().isForbidden());
            mvc.perform(as(get("/api/attachments/{id}/content-reference",id),student,"ESTUDIANTE")).andExpect(status().isOk());
            mvc.perform(as(get("/api/attachments/{id}",id),teacher,"DOCENTE")).andExpect(status().isOk());
            mvc.perform(as(get("/api/attachments/{id}",id),peer,"ESTUDIANTE")).andExpect(status().isForbidden());
        }
        jdbc.update("update tl_task_submissions set status='DRAFT' where id=32");
        jdbc.update("update tl_tasks set due_at=? where id=31",java.sql.Timestamp.from(java.time.Instant.now().minusSeconds(10)));
        mvc.perform(as(post("/api/attachments/{id}/unlink",id),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(as(post("/api/attachments"),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content(body("SUBMISSION",32)))
                .andExpect(status().isForbidden());
        mvc.perform(as(get("/api/attachments/{id}",id),student,"ESTUDIANTE")).andExpect(status().isOk());
        jdbc.update("update tl_tasks set allow_late_submissions=true where id=31");
        create(student,"ESTUDIANTE","SUBMISSION",32);
        mvc.perform(as(post("/api/attachments/{id}/unlink",id),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content("{}"))
                .andExpect(status().isNoContent());
    }
    @Test void legacyReferencesKeepMetadataButCannotExposeUrl() throws Exception {
        jdbc.update("insert into tl_academic_attachments(institution_id,uploader_user_id,content_id,file_name,url,public_id) "
                +"values(1,?,30,'old.pdf','https://private.example/secret','private-id')",teacher.getId());
        long id=jdbc.queryForObject("select max(id) from tl_academic_attachments",Long.class);
        mvc.perform(as(get("/api/attachments/{id}",id),admin,"ADMIN")).andExpect(status().isOk())
                .andExpect(jsonPath("$.url").doesNotExist()).andExpect(jsonPath("$.publicId").doesNotExist());
        var result=mvc.perform(as(get("/api/attachments/{id}/content-reference",id),teacher,"DOCENTE"))
                .andExpect(status().isConflict()).andReturn();
        assertFalse(result.getResponse().getContentAsString().contains("private.example"));
        mvc.perform(as(post("/api/attachments/{id}/unlink",id),teacher,"DOCENTE").contentType(APPLICATION_JSON).content("{}"))
                .andExpect(status().isNoContent());
    }
    @Test void isolationAndExplicitSuperContextAreEnforced() throws Exception {
        long id=create(teacher,"DOCENTE","CONTENT",30);
        jdbc.update("insert into tl_institutions(id,code,name,timezone,status,created_at,updated_at) values(2,'OTHER','Other','UTC','ACTIVE',current_timestamp,current_timestamp)");
        for(String suffix : new String[]{"","/content-reference"})
            mvc.perform(get("/api/attachments/{id}"+suffix,id).header("Authorization",token(superAdmin,2L)).param("actingRole","SUPER_ADMIN"))
                    .andExpect(status().isForbidden());
        mvc.perform(post("/api/attachments/{id}/unlink",id).header("Authorization",token(superAdmin,2L)).param("actingRole","SUPER_ADMIN")
                .contentType(APPLICATION_JSON).content("{\"reason\":\"Administrative\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/attachments").header("Authorization",token(superAdmin,2L)).param("actingRole","DOCENTE")
                .contentType(APPLICATION_JSON).content(body("CONTENT",30))).andExpect(status().isForbidden());
        mvc.perform(get("/api/attachments/{id}",id).header("Authorization",token(superAdmin,null)).param("actingRole","SUPER_ADMIN"))
                .andExpect(status().isForbidden());
        jdbc.update("update tl_institutions set status='INACTIVE' where id=1");
        mvc.perform(as(get("/api/attachments/{id}",id),superAdmin,"SUPER_ADMIN")).andExpect(status().isUnauthorized());
    }
    @Test void combinedRolesStillNeedExplicitAcademicSelection() throws Exception {
        long id=create(teacher,"DOCENTE","CONTENT",30);
        memberships.save(InstitutionMembership.builder().institution(institution).user(teacher).role(InstitutionRole.ADMIN).build());
        mvc.perform(as(get("/api/attachments/{id}/content-reference",id),teacher,"ADMIN")).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/attachments/{id}/content-reference",id),teacher,"DOCENTE")).andExpect(status().isOk());
        mvc.perform(as(get("/api/attachments/{id}/content-reference",id),superAdmin,"DOCENTE")).andExpect(status().isForbidden());
    }
    @Test void unauthenticatedAndInvalidRequestsAreSanitized() throws Exception {
        mvc.perform(get("/api/attachments/1").param("actingRole","ADMIN")).andExpect(status().isUnauthorized());
        for(var request : new MockHttpServletRequestBuilder[]{get("/api/attachments/1"),get("/api/attachments/not-a-number").param("actingRole","ADMIN"),
                get("/api/attachments/1").param("actingRole","TUTOR"),get("/api/attachments").param("actingRole","ADMIN").param("resourceType","BAD").param("resourceId","30"),
                get("/api/attachments").param("actingRole","ADMIN").param("resourceType","CONTENT").param("resourceId","30").param("size","101"),
                get("/api/attachments").param("actingRole","ADMIN").param("resourceType","CONTENT").param("resourceId","30").param("page","-1")})
            mvc.perform(request.header("Authorization",token(admin,1L))).andExpect(status().isBadRequest());
        mvc.perform(as(post("/api/attachments"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content("{broken"))
                .andExpect(status().isBadRequest());
    }
    @Test void auditFailureRollsBackCreationAndUnlink() throws Exception {
        doThrow(new IllegalStateException("secret sql https://private.example")).when(audit)
                .logSystem(anyLong(),eq("ATTACHMENT_CREATED"),eq(true),isNull(),anyString());
        var result=mvc.perform(as(post("/api/attachments"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(body("CONTENT",30)))
                .andExpect(status().isInternalServerError()).andReturn();
        assertEquals("{\"message\":\"Error interno\"}",result.getResponse().getContentAsString());
        assertEquals(0,jdbc.queryForObject("select count(*) from tl_academic_attachments",Integer.class));
        reset(audit);
        long id=create(teacher,"DOCENTE","CONTENT",30);
        doThrow(new IllegalStateException("audit failure")).when(audit)
                .logSystem(anyLong(),eq("ATTACHMENT_UNLINKED"),eq(true),isNull(),anyString());
        mvc.perform(as(post("/api/attachments/{id}/unlink",id),teacher,"DOCENTE").contentType(APPLICATION_JSON).content("{}"))
                .andExpect(status().isInternalServerError());
        assertNull(jdbc.queryForMap("select unlinked_at from tl_academic_attachments where id=?",id).get("unlinked_at"));
        assertTrue(jdbc.queryForObject("select count(*) from tl_audit_log where action='ATTACHMENT_UNLINK' and success=false",Integer.class)>0);
    }
}
