package com.sinoe.authmfa.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import static com.sinoe.authmfa.service.AttachmentAuthorizationService.ResourceType;
import static org.junit.jupiter.api.Assertions.*;

/** Real SQL checks; the PostgreSQL subclass runs the same contract against Testcontainers. */
public class AttachmentAuthorizationRepositoryTest {
    protected JdbcTemplate jdbc;
    protected AttachmentAuthorizationRepository repository;

    protected JdbcTemplate database() {
        return new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:attachments" + System.nanoTime()
                + ";MODE=PostgreSQL;DB_CLOSE_DELAY=-1", "sa", ""));
    }

    @BeforeEach void setup() {
        jdbc = database();
        for (String table : new String[]{"tl_academic_attachments", "tl_task_submissions", "tl_tasks",
                "tl_course_contents", "tl_course_enrollments", "tl_course_group_teachers", "tl_students",
                "tl_teachers", "tl_course_groups", "tl_academic_periods", "tl_courses"}) {
            jdbc.execute("drop table if exists " + table + " cascade");
        }
        jdbc.execute("create table tl_courses(id bigint primary key,institution_id bigint)");
        jdbc.execute("create table tl_academic_periods(id bigint primary key,institution_id bigint)");
        jdbc.execute("create table tl_course_groups(id bigint primary key,institution_id bigint,course_id bigint,period_id bigint)");
        jdbc.execute("create table tl_teachers(id bigint primary key,institution_id bigint,user_id bigint)");
        jdbc.execute("create table tl_students(id bigint primary key,institution_id bigint,user_id bigint)");
        jdbc.execute("create table tl_course_group_teachers(group_id bigint,teacher_id bigint)");
        jdbc.execute("create table tl_course_enrollments(group_id bigint,student_id bigint,status varchar(20))");
        jdbc.execute("create table tl_course_contents(id bigint primary key,group_id bigint,author_teacher_id bigint,published boolean)");
        jdbc.execute("create table tl_tasks(id bigint primary key,group_id bigint,author_teacher_id bigint,published boolean,due_at timestamp with time zone,allow_late_submissions boolean)");
        jdbc.execute("create table tl_task_submissions(id bigint primary key,task_id bigint,student_id bigint,status varchar(20))");
        jdbc.execute("create table tl_academic_attachments(id bigint primary key,institution_id bigint,content_id bigint,task_id bigint,submission_id bigint,unlinked_at timestamp with time zone)");
        jdbc.update("insert into tl_courses values(1,1)");
        jdbc.update("insert into tl_academic_periods values(1,1)");
        jdbc.update("insert into tl_course_groups values(1,1,1,1)");
        jdbc.update("insert into tl_teachers values(1,1,10)");
        jdbc.update("insert into tl_students values(1,1,11)");
        jdbc.update("insert into tl_course_group_teachers values(1,1)");
        jdbc.update("insert into tl_course_enrollments values(1,1,'ACTIVE')");
        jdbc.update("insert into tl_course_contents values(30,1,1,true)");
        jdbc.update("insert into tl_tasks values(30,1,1,true,cast('2026-10-11 18:00:00+00' as timestamp with time zone),false)");
        jdbc.update("insert into tl_task_submissions values(30,30,1,'ON_TIME')");
        jdbc.update("insert into tl_academic_attachments values(40,1,30,null,null,null)");
        repository = new AttachmentAuthorizationRepository(jdbc);
    }

    @ParameterizedTest @EnumSource(ResourceType.class)
    void verifiesAssignedTeacherAndActiveEnrollment(ResourceType type) {
        var teacher = repository.resource(1,10,type,30).orElseThrow();
        assertTrue(teacher.teacherAssigned()); assertFalse(teacher.studentEnrolled());
        assertTrue(repository.resource(1,11,type,30).orElseThrow().studentEnrolled());
        assertFalse(repository.resource(1,99,type,30).orElseThrow().teacherAssigned());
        assertTrue(repository.resource(2,10,type,30).isEmpty());
        if (type == ResourceType.SUBMISSION) {
            assertEquals(11L,teacher.ownerUserId()); assertTrue(teacher.ownerEnrolled());
            assertEquals(java.time.Instant.parse("2026-10-11T18:00:00Z"),teacher.dueAt());
        }
    }
    @ParameterizedTest @EnumSource(ResourceType.class)
    void rejectsCrossInstitutionParentRelations(ResourceType type) {
        for (String table : new String[]{"tl_courses","tl_academic_periods","tl_teachers"}) {
            jdbc.update("update " + table + " set institution_id=2 where id=1");
            assertTrue(repository.resource(1,10,type,30).isEmpty());
            jdbc.update("update " + table + " set institution_id=1 where id=1");
        }
    }
    @Test void rejectsForeignStudentOwnerAndInvalidAcademicRelationships() {
        jdbc.update("update tl_students set institution_id=2");
        assertTrue(repository.resource(1,10,ResourceType.SUBMISSION,30).isEmpty());
        assertFalse(repository.resource(1,11,ResourceType.TASK,30).orElseThrow().studentEnrolled());
        jdbc.update("update tl_students set institution_id=1");
        jdbc.update("update tl_course_enrollments set status='WITHDRAWN'");
        var r = repository.resource(1,11,ResourceType.SUBMISSION,30).orElseThrow();
        assertFalse(r.studentEnrolled()); assertFalse(r.ownerEnrolled());
        jdbc.update("delete from tl_course_group_teachers");
        assertFalse(repository.resource(1,10,ResourceType.CONTENT,30).orElseThrow().teacherAssigned());
    }
    @Test void referenceLookupIsInstitutionScopedAndExcludesUnlinked() {
        assertEquals(30L,repository.reference(1,40).orElseThrow().contentId());
        assertTrue(repository.reference(2,40).isEmpty());
        assertTrue(repository.reference(1,999).isEmpty());
        jdbc.update("update tl_academic_attachments set unlinked_at=current_timestamp where id=40");
        assertTrue(repository.reference(1,40).isEmpty());
    }
    @Test void attachmentInstitutionCannotOverrideParentInstitution() {
        jdbc.update("update tl_academic_attachments set institution_id=2 where id=40");
        var ref = repository.reference(2,40).orElseThrow();
        assertTrue(repository.resource(2,10,ResourceType.CONTENT,ref.contentId()).isEmpty());
    }
}
