package com.sinoe.authmfa.integration;

import com.sinoe.authmfa.domain.institution.*;
import com.sinoe.authmfa.domain.user.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.Map;

abstract class Phase15Contract extends AttachmentHttpContract {
    @org.springframework.beans.factory.annotation.Autowired TutorRepository tutors;
    @org.springframework.beans.factory.annotation.Autowired com.sinoe.authmfa.service.OtpService otp;
    protected abstract void prepareSchema();
    @Test void foreignActivitiesRemainInaccessibleEvenToTheSameTeacherAccount() throws Exception {
        jdbc.update("insert into tl_institutions(id,code,name,timezone,status,created_at,updated_at) values(2,'B','Other school','UTC','ACTIVE',current_timestamp,current_timestamp)");
        var otherSchool=institutions.findById(2L).orElseThrow();
        memberships.save(InstitutionMembership.builder().user(teacher).institution(otherSchool).role(InstitutionRole.DOCENTE).build());
        var otherProfile=teachers.save(com.sinoe.authmfa.domain.academic.Teacher.builder().user(teacher).institution(otherSchool).teacherCode("B-T").build());
        jdbc.update("insert into tl_courses(id,institution_id,code,name) values(66,2,'B-C','Other course')");
        jdbc.update("insert into tl_academic_periods(id,institution_id,code,name,starts_on,ends_on) values(66,2,'B-P','Other period',current_date,current_date)");
        jdbc.update("insert into tl_course_groups(id,institution_id,course_id,period_id,code,name) values(66,2,66,66,'B-G','Other group')");
        jdbc.update("insert into tl_course_group_teachers(group_id,teacher_id) values(66,?)",otherProfile.getId());
        jdbc.update("insert into tl_course_contents(id,group_id,author_teacher_id,title,published) values(66,66,?,'Private other school',true)",otherProfile.getId());
        mvc.perform(as(put("/api/teacher/contents/66"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content("{\"title\":\"Intrusion\",\"published\":true}")).andExpect(status().isForbidden());
        mvc.perform(as(delete("/api/teacher/contents/66"),teacher,"DOCENTE")).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/teacher/contents").param("groupId","66"),teacher,"DOCENTE")).andExpect(status().isForbidden());
        mvc.perform(as(post("/api/teacher/contents"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content("{\"groupId\":66,\"title\":\"Intrusion\",\"published\":true}")).andExpect(status().isForbidden());
        assertEquals("Private other school",jdbc.queryForObject("select title from tl_course_contents where id=66",String.class));
        jdbc.update("delete from tl_course_group_teachers where group_id=1");
        mvc.perform(as(put("/api/teacher/contents/30"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content("{\"title\":\"Not assigned\",\"published\":true}")).andExpect(status().isForbidden());
    }

    @Test void failedActivityAuditRollsBackTheMutation() throws Exception {
        doThrow(new IllegalStateException("Audit unavailable")).when(audit).logSystem(eq(teacher.getId()),eq("ACADEMIC_CONTENT_UPDATED"),eq(true),isNull(),anyString());
        mvc.perform(as(put("/api/teacher/contents/30"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content("{\"title\":\"Must roll back\",\"published\":true}")).andExpect(status().isInternalServerError());
        assertEquals("Content",jdbc.queryForObject("select title from tl_course_contents where id=30",String.class));
    }
    @Test void teacherActivityCrudIsOwnedScopedAndAudited() throws Exception {
        memberships.save(InstitutionMembership.builder().user(teacher).institution(institution).role(InstitutionRole.TUTOR).build());
        for(String kind:java.util.List.of("tasks","contents")) {
            String create=kind.equals("tasks") ? "{\"groupId\":1,\"title\":\"New activity\",\"instructions\":\"Instructions\",\"dueAt\":\"2027-01-01T12:00:00Z\",\"published\":true,\"allowLateSubmissions\":false}" : "{\"groupId\":1,\"title\":\"New activity\",\"body\":\"Material\",\"published\":true}";
            var created=mvc.perform(as(post("/api/teacher/"+kind),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(create)).andExpect(status().isCreated()).andReturn();
            long id=json.readTree(created.getResponse().getContentAsString()).get("id").asLong();
            String update=create.replace("New activity","Updated activity");
            mvc.perform(as(put("/api/teacher/"+kind+"/"+id),colleague,"DOCENTE").contentType(APPLICATION_JSON).content(update)).andExpect(status().isForbidden());
            mvc.perform(as(put("/api/teacher/"+kind+"/"+id),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(update)).andExpect(status().isNoContent());
            mvc.perform(as(get("/api/teacher/"+kind).param("groupId","1").param("q","Updated activity"),teacher,"DOCENTE")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].can_manage").value(true));
            mvc.perform(as(get("/api/teacher/"+kind).param("groupId","1").param("q","Updated activity"),colleague,"DOCENTE")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].can_manage").value(false));
            mvc.perform(as(delete("/api/teacher/"+kind+"/"+id),colleague,"DOCENTE")).andExpect(status().isForbidden());
            mvc.perform(as(delete("/api/teacher/"+kind+"/"+id),teacher,"DOCENTE")).andExpect(status().isNoContent());
            mvc.perform(as(get("/api/teacher/"+kind).param("q","Updated activity"),teacher,"DOCENTE")).andExpect(jsonPath("$.totalElements").value(0));
        }
        assertEquals(UserRole.DOCENTE,users.findById(teacher.getId()).orElseThrow().getRole());
        assertEquals(2,memberships.findByUser_IdAndInstitution_IdAndStatus(teacher.getId(),1L,MembershipStatus.ACTIVE).size());
        verify(audit).logSystem(eq(teacher.getId()),eq("ACADEMIC_TASK_CREATED"),eq(true),isNull(),anyString());
        verify(audit).logSystem(eq(teacher.getId()),eq("ACADEMIC_TASK_UPDATED"),eq(true),isNull(),anyString());
        verify(audit).logSystem(eq(teacher.getId()),eq("ACADEMIC_TASK_DELETED"),eq(true),isNull(),anyString());
    }

    @Test void activityHistoryAndValidationCannotBeBypassed() throws Exception {
        String update="{\"title\":\"Changed\",\"dueAt\":\"2027-01-01T12:00:00Z\",\"published\":false,\"allowLateSubmissions\":true}";
        mvc.perform(as(put("/api/teacher/tasks/31"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(update)).andExpect(status().isConflict());
        mvc.perform(as(delete("/api/teacher/tasks/31"),teacher,"DOCENTE")).andExpect(status().isConflict());
        assertEquals(2,jdbc.queryForObject("select count(*) from tl_task_submissions where task_id=31",Integer.class));
        mvc.perform(as(put("/api/teacher/tasks/99999"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(update)).andExpect(status().isForbidden());
        mvc.perform(as(put("/api/teacher/tasks/31"),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content(update)).andExpect(status().isForbidden());
        mvc.perform(as(put("/api/teacher/tasks/31"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(update.replace("Changed"," "))).andExpect(status().isBadRequest());
        mvc.perform(as(put("/api/teacher/tasks/31"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(update.replace("Changed","X".repeat(201)))).andExpect(status().isBadRequest());
        mvc.perform(as(post("/api/attachments"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(body("CONTENT",30))).andExpect(status().isCreated());
        mvc.perform(as(delete("/api/teacher/contents/30"),teacher,"DOCENTE")).andExpect(status().isConflict());
        jdbc.update("update tl_institution_memberships set status='SUSPENDED' where user_id=? and role='DOCENTE'",teacher.getId());
        mvc.perform(as(delete("/api/teacher/contents/30"),teacher,"DOCENTE")).andExpect(status().isForbidden());
    }

    @Test void taskStudentsExposesFinalSubmissionsButNeverDrafts() throws Exception {
        jdbc.update("update tl_task_submissions set body='PRIVATE DRAFT' where id=32");
        jdbc.update("update tl_task_submissions set body='Final answer' where id=33");
        var result=mvc.perform(as(get("/api/teacher/tasks/31/students").param("size","1"),teacher,"DOCENTE")).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2)).andExpect(jsonPath("$.content[0].status").value("PENDING")).andReturn();
        assertFalse(result.getResponse().getContentAsString().contains("PRIVATE DRAFT"));
        mvc.perform(as(get("/api/teacher/tasks/31/students").param("status","ON_TIME"),teacher,"DOCENTE")).andExpect(jsonPath("$.content[0].body").value("Final answer")).andExpect(jsonPath("$.content[0].matricula").value("S2"));
        mvc.perform(as(get("/api/teacher/tasks/31/students").param("q","S1"),teacher,"DOCENTE")).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].submission_id").isEmpty());
        mvc.perform(as(get("/api/teacher/tasks/31/students").param("status","DRAFT"),teacher,"DOCENTE")).andExpect(status().isBadRequest());
        mvc.perform(as(get("/api/teacher/tasks/999/students"),teacher,"DOCENTE")).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/teacher/tasks/31/students"),student,"ESTUDIANTE")).andExpect(status().isForbidden());
    }
    @Override protected void initializeAcademicSchema() {prepareSchema();jdbc.update("delete from otp_codes");jdbc.update("delete from tl_tutor_students");jdbc.update("delete from tl_tutors");jdbc.update("delete from tl_institution_invitations");jdbc.update("delete from tl_course_question_messages");jdbc.update("delete from tl_course_questions");reset(email);}

    @Test void academicCatalogUpdatesPersistValidateAndRejectOtherInstitutions() throws Exception {
        String period="{\"code\":\"EDIT-P\",\"name\":\"Periodo actualizado\",\"startsOn\":\"2027-01-01\",\"endsOn\":\"2027-06-30\",\"status\":\"ACTIVE\"}";
        String course="{\"code\":\"EDIT-C\",\"name\":\"Curso actualizado\",\"description\":\"Descripción nueva\",\"active\":false}";
        mvc.perform(as(put("/api/admin/academic/periods/1"),admin,"ADMIN").contentType(APPLICATION_JSON).content(period)).andExpect(status().isNoContent());
        mvc.perform(as(put("/api/admin/academic/courses/1"),admin,"ADMIN").contentType(APPLICATION_JSON).content(course)).andExpect(status().isNoContent());
        mvc.perform(as(get("/api/admin/academic/periods").param("q","EDIT-P"),admin,"ADMIN")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].name").value("Periodo actualizado"));
        mvc.perform(as(get("/api/admin/academic/courses").param("q","EDIT-C"),admin,"ADMIN")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].active").value(false));
        mvc.perform(as(put("/api/admin/academic/periods/1"),admin,"ADMIN").contentType(APPLICATION_JSON).content(period.replace("2027-06-30","2026-01-01"))).andExpect(status().isBadRequest());
        mvc.perform(as(put("/api/admin/academic/courses/1"),teacher,"DOCENTE").contentType(APPLICATION_JSON).content(course)).andExpect(status().isForbidden());
        jdbc.update("insert into tl_institutions(id,code,name,timezone,status,created_at,updated_at) values(2,'B','Second','UTC','ACTIVE',current_timestamp,current_timestamp)");
        jdbc.update("insert into tl_courses(id,institution_id,code,name) values(88,2,'FOREIGN','Private course')");
        jdbc.update("insert into tl_academic_periods(id,institution_id,code,name,starts_on,ends_on) values(88,2,'FOREIGN','Private period',current_date,current_date)");
        for(String kind:java.util.List.of("courses","periods")) {
            mvc.perform(as(put("/api/admin/academic/"+kind+"/88"),admin,"ADMIN").contentType(APPLICATION_JSON).content(kind.equals("courses")?course:period)).andExpect(status().isForbidden());
            mvc.perform(as(put("/api/admin/academic/"+kind+"/99999"),admin,"ADMIN").contentType(APPLICATION_JSON).content(kind.equals("courses")?course:period)).andExpect(status().isForbidden());
        }
        assertEquals("Private course",jdbc.queryForObject("select name from tl_courses where id=88",String.class));
        jdbc.update("insert into tl_courses(id,institution_id,code,name) values(89,1,'DUP','Other')");
        mvc.perform(as(put("/api/admin/academic/courses/1"),admin,"ADMIN").contentType(APPLICATION_JSON).content(course.replace("EDIT-C","DUP"))).andExpect(status().isConflict());
        assertEquals("EDIT-C",jdbc.queryForObject("select code from tl_courses where id=1",String.class));
    }

    String invitationBody(String email,String role,String code) throws Exception {
        return json.writeValueAsString(Map.of("contactEmail",email,"role",role,"profile",Map.of("code",code,"department","Escuela local")));
    }
    String issue(String address,String role,String code) throws Exception {
        mvc.perform(as(post("/api/admin/institution/users/invitations"),admin,"ADMIN").contentType(APPLICATION_JSON).content(invitationBody(address,role,code)))
                .andExpect(status().isAccepted()).andExpect(jsonPath("$.status").value("PENDING")).andExpect(jsonPath("$.token").doesNotExist());
        var captor=ArgumentCaptor.forClass(String.class);
        verify(email,atLeastOnce()).sendInstitutionInvitation(eq(address),anyString(),captor.capture());return captor.getValue();
    }
    @Test void existingAccountGetsIndependentVerifiedProfilesAndTokensRemainValidElsewhere() throws Exception {
        jdbc.update("insert into tl_institutions(id,code,name,timezone,status,created_at,updated_at) values(2,'B','Second','UTC','ACTIVE',current_timestamp,current_timestamp)");
        var other=institutions.findById(2L).orElseThrow();
        memberships.save(InstitutionMembership.builder().institution(other).user(admin).role(InstitutionRole.ADMIN).build());
        mvc.perform(post("/api/admin/institution/users/invitations").header("Authorization",token(admin,2L)).contentType(APPLICATION_JSON)
                .content(invitationBody(student.getEmail(),"ESTUDIANTE","SECOND-S"))).andExpect(status().isAccepted());
        var proof=ArgumentCaptor.forClass(String.class);verify(email).sendInstitutionInvitation(eq(student.getEmail()),anyString(),proof.capture());
        assertEquals(0,jdbc.queryForObject("select count(*) from tl_institution_memberships where institution_id=2 and user_id=?",Integer.class,student.getId()));
        mvc.perform(post("/api/institution-invitations/accept").header("Authorization",token(teacher,1L)).contentType(APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("token",proof.getValue())))).andExpect(status().isForbidden());
        mvc.perform(post("/api/institution-invitations/accept").header("Authorization",token(student,1L)).contentType(APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("token",proof.getValue())))).andExpect(status().isOk());
        assertEquals(2,students.findAllByUser_Id(student.getId()).size());
        assertEquals("S1",students.findByInstitution_IdAndUser_Id(1L,student.getId()).orElseThrow().getMatricula());
        assertEquals("SECOND-S",students.findByInstitution_IdAndUser_Id(2L,student.getId()).orElseThrow().getMatricula());
        String firstToken=token(student,1L);
        mvc.perform(as(patch("/api/admin/institution/users/{id}/roles/ESTUDIANTE/status",student.getId()),admin,"ADMIN")
                .contentType(APPLICATION_JSON).content("{\"status\":\"SUSPENDED\"}")).andExpect(status().isOk());
        assertEquals(UserStatus.ACTIVE,users.findById(student.getId()).orElseThrow().getStatus());
        mvc.perform(get("/api/student/courses").header("Authorization",firstToken)).andExpect(status().isForbidden());
        mvc.perform(get("/api/student/courses").header("Authorization",token(student,2L))).andExpect(status().isOk());
        assertEquals("ACTIVE",jdbc.queryForObject("select status from tl_institution_memberships where institution_id=2 and user_id=?",String.class,student.getId()));
    }
    @Test void newInvitationRequiresProofAndCannotBeReplayedOrEscalated() throws Exception {
        String proof=issue("new.person@gmail.com","TUTOR","NEW-T");
        String request=json.writeValueAsString(Map.of("token",proof,"name","Nueva","lastNamePaterno","Persona","password","NewPassword1!"));
        mvc.perform(post("/api/institution-invitations/accept").contentType(APPLICATION_JSON).content(request)).andExpect(status().isOk());
        var user=users.findByEmail("new.person@gmail.com").orElseThrow();
        assertTrue(tutors.findByInstitution_IdAndUser_Id(1L,user.getId()).isPresent());
        assertNotNull(jdbc.queryForObject("select contact_verified_at from tl_institution_memberships where user_id=?",java.sql.Timestamp.class,user.getId()));
        assertEquals(64,jdbc.queryForObject("select length(token_hash) from tl_institution_invitations",Integer.class));
        mvc.perform(post("/api/institution-invitations/accept").contentType(APPLICATION_JSON).content(request)).andExpect(status().isForbidden());
        mvc.perform(post("/api/institution-invitations/accept").contentType(APPLICATION_JSON).content("{\"token\":\"bad\"}")).andExpect(status().isForbidden());
        mvc.perform(as(post("/api/admin/institution/users/invitations"),admin,"ADMIN").contentType(APPLICATION_JSON).content(invitationBody("x@example.edu","SUPER_ADMIN","X")))
                .andExpect(status().isBadRequest());
    }
    @Test void verifiedInstitutionalContactDoesNotOverwritePrincipalEmailAndExpiredProofIsDenied() throws Exception {
        String proof=issue("student@school.example.edu","ESTUDIANTE","S1");
        mvc.perform(post("/api/institution-invitations/accept").header("Authorization",token(student,1L)).contentType(APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("token",proof)))).andExpect(status().isOk());
        assertEquals("student@attachments.test",users.findById(student.getId()).orElseThrow().getEmail());
        assertEquals("student@school.example.edu",jdbc.queryForObject("select contact_email from tl_institution_memberships where user_id=? and role='ESTUDIANTE'",String.class,student.getId()));
        reset(email);String expired=issue("expired@school.example.edu","DOCENTE","EXPIRED");
        jdbc.update("update tl_institution_invitations set expires_at=? where accepted_at is null",java.sql.Timestamp.from(java.time.Instant.now().minusSeconds(1)));
        mvc.perform(post("/api/institution-invitations/accept").header("Authorization",token(student,1L)).contentType(APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("token",expired)))).andExpect(status().isForbidden());
    }
    @Test void ownProfilesMembershipsAndPaginationAreInstitutional() throws Exception {
        mvc.perform(as(get("/api/admin/institution/users/{id}",teacher.getId()),admin,"ADMIN")).andExpect(status().isOk()).andExpect(jsonPath("$.profiles[0].role").value("DOCENTE"));
        mvc.perform(as(put("/api/admin/institution/users/{id}/profiles/DOCENTE",teacher.getId()),admin,"ADMIN").contentType(APPLICATION_JSON)
                .content("{\"code\":\"NEW-CODE\",\"department\":\"Matemáticas\"}")).andExpect(status().isOk());
        mvc.perform(as(post("/api/admin/institution/users/{id}/roles",teacher.getId()),admin,"ADMIN").contentType(APPLICATION_JSON)
                .content("{\"role\":\"TUTOR\",\"code\":\"DUAL-T\"}")).andExpect(status().isOk());
        mvc.perform(as(get("/api/admin/institution/users").param("role","TUTOR").param("size","1"),admin,"ADMIN"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.items[0].roles.length()").value(2));
        mvc.perform(as(patch("/api/admin/institution/users/{id}/status",teacher.getId()),admin,"ADMIN").contentType(APPLICATION_JSON)
                .content("{\"status\":\"DISABLED\"}")).andExpect(status().isOk());
        assertEquals(UserStatus.ACTIVE,users.findById(teacher.getId()).orElseThrow().getStatus());
        assertEquals(2,jdbc.queryForObject("select count(*) from tl_institution_memberships where user_id=? and status='SUSPENDED'",Integer.class,teacher.getId()));
        mvc.perform(as(patch("/api/admin/institution/users/{id}/roles/TUTOR/status",teacher.getId()),admin,"ADMIN").contentType(APPLICATION_JSON)
                .content("{\"status\":\"ACTIVE\"}")).andExpect(status().isOk());
        mvc.perform(as(get("/api/admin/institution/users/{id}",superAdmin.getId()),admin,"ADMIN")).andExpect(status().isForbidden());
    }
    @Test void csvSupportsQuotedFieldsAndReportsPartialErrorsAndDuplicates() throws Exception {
        String csv="name,lastNamePaterno,email,code,career,semester\n\"Persona, Uno\",Demo,one@gmail.com,ONE,ISC,2\nOtra,Demo,one@gmail.com,TWO,ISC,2\nMal,Demo,bad@gmail.com,BAD,ISC,invalid\nDos,Demo,two@school.example.edu,TWO,ITI,3";
        mvc.perform(as(post("/api/admin/institution/users/import-csv").param("role","ESTUDIANTE"),admin,"ADMIN").contentType(APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("csv",csv)))).andExpect(status().isOk())
                .andExpect(jsonPath("$.invited").value(2)).andExpect(jsonPath("$.skipped").value(1)).andExpect(jsonPath("$.failed").value(1));
        assertTrue(users.findByEmail("one@gmail.com").isEmpty());
        mvc.perform(as(post("/api/admin/institution/users/import-csv").param("role","SUPER_ADMIN"),admin,"ADMIN").contentType(APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("csv",csv)))).andExpect(status().isBadRequest());
    }
    @Test void academicListsConversationsAndFinalSubmissionStateAreConsistent() throws Exception {
        mvc.perform(as(get("/api/admin/academic/courses"),admin,"ADMIN")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(as(get("/api/teacher/tasks").param("groupId","1"),teacher,"DOCENTE")).andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(31));
        mvc.perform(as(get("/api/teacher/groups/1/students"),teacher,"DOCENTE")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(as(get("/api/student/progress"),student,"ESTUDIANTE")).andExpect(status().isOk());
        mvc.perform(as(put("/api/student/tasks/31/submission"),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content("{\"body\":\"Final\",\"finalSubmission\":true}"))
                .andExpect(status().isNoContent());
        mvc.perform(as(put("/api/student/tasks/31/submission"),student,"ESTUDIANTE").contentType(APPLICATION_JSON).content("{\"body\":\"Alterada\",\"finalSubmission\":false}"))
                .andExpect(status().isConflict());
        mvc.perform(as(get("/api/student/tasks/31/submission"),student,"ESTUDIANTE")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ON_TIME"));
        mvc.perform(as(get("/api/teacher/tasks/31/submissions"),teacher,"DOCENTE")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
        var creation=mvc.perform(as(post("/api/student/course-questions"),student,"ESTUDIANTE").contentType(APPLICATION_JSON)
                .content("{\"groupId\":1,\"subject\":\"Consulta\",\"body\":\"Pregunta\"}")).andExpect(status().isCreated()).andReturn();
        long question=json.readTree(creation.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(as(get("/api/teacher/questions").param("status","OPEN"),teacher,"DOCENTE")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(as(post("/api/teacher/questions/{id}/messages",question),teacher,"DOCENTE").contentType(APPLICATION_JSON)
                .content("{\"body\":\"Respuesta\",\"primaryAnswer\":true,\"close\":true}")).andExpect(status().isNoContent());
        mvc.perform(as(post("/api/student/course-questions/{id}/messages",question),student,"ESTUDIANTE").contentType(APPLICATION_JSON)
                .content("{\"body\":\"Otra\"}")).andExpect(status().isConflict());
        mvc.perform(as(get("/api/student/course-questions/{id}/messages",question),peer,"ESTUDIANTE")).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/teacher/questions/{id}/messages",question),colleague,"DOCENTE")).andExpect(status().isOk());
    }
    @Test void adminReadsSanitizedGroupAssignmentsAndEnrollmentsWithIsolation() throws Exception {
        mvc.perform(as(get("/api/admin/academic/groups/1/teachers").param("q","T1").param("page","0").param("size","1"),admin,"ADMIN"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].code").value("T1"))
                .andExpect(jsonPath("$.content[0].teacherId").isNumber())
                .andExpect(jsonPath("$.content[0].email").doesNotExist())
                .andExpect(jsonPath("$.content[0].userId").doesNotExist());
        mvc.perform(as(get("/api/admin/academic/groups/1/enrollments").param("status","ACTIVE").param("size","1"),admin,"ADMIN"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content[0].matricula").exists())
                .andExpect(jsonPath("$.content[0].email").doesNotExist())
                .andExpect(jsonPath("$.content[0].userId").doesNotExist());
        long studentId=students.findByInstitution_IdAndUser_Id(1L,student.getId()).orElseThrow().getId();
        mvc.perform(as(delete("/api/admin/academic/groups/1/enrollments/{studentId}",studentId),admin,"ADMIN"))
                .andExpect(status().isNoContent());
        mvc.perform(as(get("/api/admin/academic/groups/1/enrollments").param("status","WITHDRAWN"),admin,"ADMIN"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].studentId").value(studentId))
                .andExpect(jsonPath("$.content[0].withdrawnAt").exists());
        mvc.perform(as(get("/api/admin/academic/groups/1/enrollments").param("status","INVALID"),admin,"ADMIN"))
                .andExpect(status().isBadRequest());
        mvc.perform(as(get("/api/admin/academic/groups/999/teachers"),admin,"ADMIN")).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/admin/academic/groups/999/enrollments"),admin,"ADMIN")).andExpect(status().isForbidden());
        mvc.perform(as(get("/api/admin/academic/groups/1/teachers").param("size","101"),admin,"ADMIN")).andExpect(status().isBadRequest());
    }
    @Test void loginOtpCanSelectAnOwnedInstitutionAndRegisterCannotEscalate() throws Exception {
        jdbc.update("insert into tl_institutions(id,code,name,timezone,status,created_at,updated_at) values(2,'LOGIN','Login school','UTC','ACTIVE',current_timestamp,current_timestamp)");
        memberships.save(InstitutionMembership.builder().institution(institutions.findById(2L).orElseThrow()).user(student).role(InstitutionRole.ESTUDIANTE).build());
        var code=otp.generateLoginOtpForUser(student.getId());
        var result=mvc.perform(post("/api/auth/login/verify-otp").contentType(APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("otpToken",code.getPublicId(),"code",code.getCode(),"institutionId",2))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.institutionId").value(2)).andReturn();
        String accessToken=json.readTree(result.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(get("/api/auth/institutions").header("Authorization","Bearer "+accessToken)).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(as(post("/api/auth/register"),teacher,"DOCENTE").contentType(APPLICATION_JSON)
                .content("{\"role\":\"SUPER_ADMIN\"}")).andExpect(status().isForbidden());
        assertEquals(1,jdbc.queryForObject("select count(*) from tl_users where role='SUPER_ADMIN'",Integer.class));
    }
    @Test void invitationResendAndCancellationInvalidateOldProofsWithoutDeletingHistory() throws Exception {
        String original=issue("resend@school.example.edu","DOCENTE","RESEND-D");
        long id=jdbc.queryForObject("select max(id) from tl_institution_invitations",Long.class);
        mvc.perform(as(get("/api/admin/institution/users/invitations"),admin,"ADMIN")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("PENDING")).andExpect(jsonPath("$.content[0].tokenHash").doesNotExist());
        mvc.perform(as(post("/api/admin/institution/users/invitations/{id}/resend",id),admin,"ADMIN")).andExpect(status().isOk());
        var proof=ArgumentCaptor.forClass(String.class);verify(email,times(2)).sendInstitutionInvitation(eq("resend@school.example.edu"),anyString(),proof.capture());
        assertNotEquals(original,proof.getValue());
        mvc.perform(post("/api/institution-invitations/accept").header("Authorization",token(teacher,1L)).contentType(APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("token",original)))).andExpect(status().isForbidden());
        mvc.perform(as(delete("/api/admin/institution/users/invitations/{id}",id),admin,"ADMIN")).andExpect(status().isNoContent());
        mvc.perform(post("/api/institution-invitations/accept").header("Authorization",token(teacher,1L)).contentType(APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("token",proof.getValue())))).andExpect(status().isForbidden());
        assertEquals(1,jdbc.queryForObject("select count(*) from tl_institution_invitations where revoked_at is not null",Integer.class));
    }
    @Test void staffExcelImportReusesTheExistingReaderAndKeepsTheInstitutionBoundary() throws Exception {
        byte[] workbook;
        try(var book=new org.apache.poi.xssf.usermodel.XSSFWorkbook();var bytes=new java.io.ByteArrayOutputStream()) {
            var sheet=book.createSheet("Staff");
            String[] header={"teacherCode","email","name","lastNamePaterno","lastNameMaterno","department","specialty","phone"};
            String[] data={"XLS-D","xlsx@school.example.edu","Docente","Demo","","Sistemas","Programación","123"};
            for(int row=0;row<2;row++) {var cells=sheet.createRow(row);String[] values=row==0 ? header : data;for(int col=0;col<values.length;col++) cells.createCell(col).setCellValue(values[col]);}
            book.write(bytes);workbook=bytes.toByteArray();
        }
        var file=new org.springframework.mock.web.MockMultipartFile("file","staff.xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",workbook);
        mvc.perform(as(multipart("/api/admin/institution/users/import-excel").file(file).param("role","DOCENTE"),admin,"ADMIN"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.invited").value(1)).andExpect(jsonPath("$.rows[0].invitationId").isNumber());
        assertTrue(users.findByEmail("xlsx@school.example.edu").isEmpty());
    }
}
