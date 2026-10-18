package com.sinoe.authmfa.service;

import com.sinoe.authmfa.domain.academic.TeacherRepository;
import com.sinoe.authmfa.domain.user.StudentRepository;
import com.sinoe.authmfa.security.InstitutionAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import java.time.*;
import java.util.*;

/** Academic write operations use context-bound SQL so every foreign relation is checked in its institution. */
@Service
@org.springframework.transaction.annotation.Transactional
@RequiredArgsConstructor
public class AcademicService {
    private final JdbcTemplate jdbc;
    private final TeacherRepository teachers;
    private final StudentRepository students;
    private final AuditService audit;
    private final java.time.Clock clock;
    private final InstitutionAccessService access;

    public void updatePeriod(long institutionId, long id, com.sinoe.authmfa.dto.academic.AcademicDtos.PeriodUpdate r) {
        requireAcademicAdmin(institutionId);
        requireCount("select count(*) from tl_academic_periods where id=? and institution_id=?",id,institutionId);
        if(r.endsOn().isBefore(r.startsOn())) throw new IllegalArgumentException("La fecha final debe ser igual o posterior a la fecha inicial");
        if(!Set.of("ACTIVE","INACTIVE").contains(r.status())) throw new IllegalArgumentException("Estado de periodo inválido");
        try {
            if(jdbc.update("update tl_academic_periods set code=?,name=?,starts_on=?,ends_on=?,status=? where id=? and institution_id=?",
                r.code().trim(),r.name().trim(),r.startsOn(),r.endsOn(),r.status(),id,institutionId)!=1) throw new AccessDeniedException("Acceso denegado");
        } catch(DataIntegrityViolationException ex) {throw new AcademicConflictException("El código del periodo ya existe o los datos no son válidos");}
        log(institutionId,"ACADEMIC_PERIOD_UPDATED",id);
    }
    public void updateCourse(long institutionId, long id, com.sinoe.authmfa.dto.academic.AcademicDtos.CourseUpdate r) {
        requireAcademicAdmin(institutionId);
        requireCount("select count(*) from tl_courses where id=? and institution_id=?",id,institutionId);
        try {
            if(jdbc.update("update tl_courses set code=?,name=?,description=?,active=? where id=? and institution_id=?",
                r.code().trim(),r.name().trim(),r.description(),r.active(),id,institutionId)!=1) throw new AccessDeniedException("Acceso denegado");
        } catch(DataIntegrityViolationException ex) {throw new AcademicConflictException("El código del curso ya existe o los datos no son válidos");}
        log(institutionId,"ACADEMIC_COURSE_UPDATED",id);
    }
    private void requireAcademicAdmin(long institutionId) {
        var auth=org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if(auth==null || !auth.isAuthenticated() || !(auth.getDetails() instanceof InstitutionAccessService.Access c)
            || !Objects.equals(c.institutionId(),institutionId)) throw new AccessDeniedException("Acceso denegado");
        var roles=access.resolve(c.user().getId(),institutionId,c.user().getAuthorizationVersion()).roles();
        if(!roles.contains("ADMIN") && !roles.contains("SUPER_ADMIN")) throw new AccessDeniedException("Acceso denegado");
    }

    public long createPeriod(long institutionId, String code, String name, LocalDate startsOn, LocalDate endsOn) {
        return insert("insert into tl_academic_periods(institution_id,code,name,starts_on,ends_on) values(?,?,?,?,?) returning id", institutionId, code, name, startsOn, endsOn);
    }
    public long createCourse(long institutionId, String code, String name, String description) {
        return insert("insert into tl_courses(institution_id,code,name,description) values(?,?,?,?) returning id", institutionId, code, name, description);
    }
    public long createGroup(long institutionId, long courseId, long periodId, String code, String name) {
        requireCount("select count(*) from tl_courses where id=? and institution_id=?", courseId, institutionId);
        requireCount("select count(*) from tl_academic_periods where id=? and institution_id=?", periodId, institutionId);
        return insert("insert into tl_course_groups(institution_id,course_id,period_id,code,name) values(?,?,?,?,?) returning id", institutionId, courseId, periodId, code, name);
    }
    public void assignTeacher(long institutionId, long groupId, long teacherId) {
        requireGroup(institutionId, groupId); requireCount("select count(*) from tl_teachers t join tl_users u on u.id=t.user_id join tl_institution_memberships m on m.user_id=u.id and m.institution_id=t.institution_id where t.id=? and t.institution_id=? and m.role='DOCENTE' and m.status='ACTIVE' and u.status='ACTIVE'", teacherId, institutionId);
        jdbc.update("insert into tl_course_group_teachers(group_id,teacher_id) values(?,?)", groupId, teacherId); log(institutionId,"ACADEMIC_TEACHER_ASSIGNED",groupId);
    }
    public void enroll(long institutionId, long groupId, long studentId) {
        requireGroup(institutionId, groupId); requireCount("select count(*) from tl_students s join tl_users u on u.id=s.user_id join tl_institution_memberships m on m.user_id=u.id and m.institution_id=s.institution_id where s.id=? and s.institution_id=? and m.role='ESTUDIANTE' and m.status='ACTIVE' and u.status='ACTIVE'", studentId, institutionId);
        jdbc.update("insert into tl_course_enrollments(group_id,student_id,status,enrolled_at,withdrawn_at) values(?,?, 'ACTIVE', now(), null) on conflict(group_id,student_id) do update set status='ACTIVE',withdrawn_at=null", groupId, studentId); log(institutionId,"ACADEMIC_STUDENT_ENROLLED",groupId);
    }
    public void withdraw(long institutionId, long groupId, long studentId) { requireGroup(institutionId, groupId); jdbc.update("update tl_course_enrollments set status='WITHDRAWN', withdrawn_at=now() where group_id=? and student_id=?", groupId, studentId); log(institutionId,"ACADEMIC_STUDENT_WITHDRAWN",groupId); }
    public long content(long institutionId, long teacherUserId, long groupId, String title, String body, boolean published) {
        long teacherId = teacher(institutionId, teacherUserId); requireTeacherGroup(groupId, teacherId);
        return insert("insert into tl_course_contents(group_id,author_teacher_id,title,body,published,published_at) values(?,?,?,?,?,case when ? then now() else null end) returning id", groupId, teacherId, title, body, published, published);
    }
    public long task(long institutionId, long teacherUserId, long groupId, String title, String instructions, OffsetDateTime dueAt, boolean published, boolean late) {
        long teacherId = teacher(institutionId, teacherUserId); requireTeacherGroup(groupId, teacherId);
        return insert("insert into tl_tasks(group_id,author_teacher_id,title,instructions,due_at,published,published_at,allow_late_submissions) values(?,?,?,?,?,?,case when ? then now() else null end,?) returning id", groupId,teacherId,title,instructions,dueAt,published,published,late);
    }
    public void submit(long institutionId, long studentUserId, long taskId, String body, boolean finalSubmission) {
        long studentId=student(institutionId,studentUserId);
        var tasks=jdbc.queryForList("select t.id,t.group_id,t.published,t.due_at,t.allow_late_submissions from tl_tasks t "
                +"join tl_course_groups g on g.id=t.group_id where t.id=? and g.institution_id=? for update",taskId,institutionId);
        if(tasks.size()!=1) throw new AccessDeniedException("No tienes acceso a esta tarea");
        var task=tasks.get(0);
        if(!Boolean.TRUE.equals(task.get("published"))) throw new AccessDeniedException("No tienes acceso a esta tarea");
        requireCount("select count(*) from tl_course_enrollments where group_id=? and student_id=? and status='ACTIVE'",task.get("group_id"),studentId);
        var current=jdbc.queryForList("select id,status from tl_task_submissions where task_id=? and student_id=? for update",taskId,studentId);
        if(!current.isEmpty() && !"DRAFT".equals(current.get(0).get("status"))) throw new AcademicConflictException("La entrega final no admite modificaciones ni reentregas");
        Instant due=task.get("due_at") instanceof OffsetDateTime date ? date.toInstant() : ((java.sql.Timestamp)task.get("due_at")).toInstant();
        boolean late=clock.instant().isAfter(due);
        if(late&&!Boolean.TRUE.equals(task.get("allow_late_submissions"))) throw new AcademicConflictException("La fecha de entrega ya venció");
        String status=finalSubmission ? (late ? "LATE" : "ON_TIME") : "DRAFT";
        var submitted=finalSubmission ? java.sql.Timestamp.from(clock.instant()) : null;
        if(current.isEmpty()) jdbc.update("insert into tl_task_submissions(task_id,student_id,body,status,submitted_at) values(?,?,?,?,?)",taskId,studentId,body,status,submitted);
        else jdbc.update("update tl_task_submissions set body=?,status=?,submitted_at=?,updated_at=current_timestamp where id=? and status='DRAFT'",body,status,submitted,current.get(0).get("id"));
        log(institutionId,"ACADEMIC_SUBMISSION_SAVED",taskId);
    }
    public List<Map<String,Object>> groupsForTeacher(long institutionId, long userId) { long teacher=teacher(institutionId,userId); return jdbc.queryForList("select g.id,g.code,g.name,c.name course_name,p.name period_name from tl_course_groups g join tl_courses c on c.id=g.course_id join tl_academic_periods p on p.id=g.period_id join tl_course_group_teachers gt on gt.group_id=g.id where g.institution_id=? and gt.teacher_id=? order by g.name",institutionId,teacher); }
    public List<Map<String,Object>> groupsForStudent(long institutionId, long userId) { long student=student(institutionId,userId); return jdbc.queryForList("select g.id,g.code,g.name,c.name course_name,p.name period_name from tl_course_groups g join tl_courses c on c.id=g.course_id join tl_academic_periods p on p.id=g.period_id join tl_course_enrollments e on e.group_id=g.id where g.institution_id=? and e.student_id=? and e.status='ACTIVE' order by g.name",institutionId,student); }
    public List<Map<String,Object>> progress(long institutionId, long userId) { long student=student(institutionId,userId); return jdbc.queryForList("select g.id group_id,g.name, count(distinct t.id) published_tasks, count(distinct s.id) filter (where s.status='ON_TIME') on_time, count(distinct s.id) filter (where s.status='LATE') late, count(distinct a.id) filter (where a.status in ('PRESENT','LATE','EXCUSED')) attendance_positive, count(distinct a.id) attendance_total from tl_course_groups g join tl_course_enrollments e on e.group_id=g.id left join tl_tasks t on t.group_id=g.id and t.published=true left join tl_task_submissions s on s.task_id=t.id and s.student_id=e.student_id left join tl_class_sessions cs on cs.group_id=g.id left join tl_attendance_records a on a.session_id=cs.id and a.student_id=e.student_id where g.institution_id=? and e.student_id=? and e.status='ACTIVE' group by g.id,g.name", institutionId,student); }
    public long session(long institutionId,long userId,long groupId,OffsetDateTime starts,OffsetDateTime ends,String topic){if(!ends.isAfter(starts))throw new IllegalArgumentException("La sesión debe terminar después de iniciar");long t=teacher(institutionId,userId);requireTeacherGroup(groupId,t);return insert("insert into tl_class_sessions(group_id,teacher_id,starts_at,ends_at,topic) values(?,?,?,?,?) returning id",groupId,t,starts,ends,topic);}
    public void attendance(long institutionId,long userId,long sessionId,long studentId,String status){long t=teacher(institutionId,userId);requireCount("select count(*) from tl_class_sessions s join tl_course_group_teachers gt on gt.group_id=s.group_id join tl_course_enrollments e on e.group_id=s.group_id where s.id=? and gt.teacher_id=? and e.student_id=? and e.status='ACTIVE'",sessionId,t,studentId);if(!Set.of("PRESENT","ABSENT","LATE","EXCUSED").contains(status))throw new IllegalArgumentException("Estado de asistencia inválido");jdbc.update("insert into tl_attendance_records(session_id,student_id,status) values(?,?,?) on conflict(session_id,student_id) do update set status=excluded.status,recorded_at=now()",sessionId,studentId,status);log(institutionId,"ACADEMIC_ATTENDANCE_RECORDED",sessionId);}
    public List<Map<String,Object>> attendanceForStudent(long institutionId,long userId){long s=student(institutionId,userId);return jdbc.queryForList("select a.id,a.status,a.recorded_at,cs.starts_at,cs.topic,g.name group_name from tl_attendance_records a join tl_class_sessions cs on cs.id=a.session_id join tl_course_groups g on g.id=cs.group_id where g.institution_id=? and a.student_id=? order by cs.starts_at desc",institutionId,s);}
    public long question(long institutionId,long userId,long groupId,Long targetTeacher,String subject,String body){long s=student(institutionId,userId);requireCount("select count(*) from tl_course_enrollments e join tl_course_groups g on g.id=e.group_id where e.group_id=? and e.student_id=? and e.status='ACTIVE' and g.institution_id=?",groupId,s,institutionId);if(targetTeacher!=null)requireCount("select count(*) from tl_course_group_teachers gt join tl_teachers tp on tp.id=gt.teacher_id join tl_course_groups g on g.id=gt.group_id and g.institution_id=tp.institution_id join tl_institution_memberships m on m.user_id=tp.user_id and m.institution_id=g.institution_id where gt.group_id=? and gt.teacher_id=? and m.role='DOCENTE' and m.status='ACTIVE'",groupId,targetTeacher);return insert("insert into tl_course_questions(group_id,student_id,target_teacher_id,responsible_teacher_id,subject,body,status) values(?,?,?,?,?,?,'OPEN') returning id",groupId,s,targetTeacher,targetTeacher,subject,body);}
    public List<Map<String,Object>> questionsForStudent(long institutionId,long userId){long s=student(institutionId,userId);return jdbc.queryForList("select q.id,q.subject,q.body,q.status,q.created_at,g.name group_name from tl_course_questions q join tl_course_groups g on g.id=q.group_id where g.institution_id=? and q.student_id=? order by q.created_at desc",institutionId,s);}
    public List<Map<String,Object>> questionMessagesForStudent(long institutionId,long userId,long questionId){long s=student(institutionId,userId);requireCount("select count(*) from tl_course_questions q join tl_course_groups g on g.id=q.group_id where q.id=? and q.student_id=? and g.institution_id=?",questionId,s,institutionId);return jdbc.queryForList("select id,author_user_id,body,is_primary_answer,created_at from tl_course_question_messages where question_id=? order by created_at",questionId);}
    public void replyQuestion(long institutionId,long userId,long questionId,String body,boolean primary,boolean close) {
        long teacher=teacher(institutionId,userId);
        var questions=jdbc.queryForList("select q.id,q.responsible_teacher_id,q.status from tl_course_questions q "
                +"join tl_course_groups g on g.id=q.group_id where q.id=? and g.institution_id=? for update",questionId,institutionId);
        if(questions.size()!=1) throw new AccessDeniedException("Consulta no disponible");
        requireCount("select count(*) from tl_course_group_teachers gt join tl_course_questions q on q.group_id=gt.group_id where q.id=? and gt.teacher_id=?",questionId,teacher);
        var q=questions.get(0);
        if("CLOSED".equals(q.get("status"))) throw new AcademicConflictException("La consulta está cerrada");
        Long responsible=q.get("responsible_teacher_id")==null ? teacher : ((Number)q.get("responsible_teacher_id")).longValue();
        if((primary||close)&&responsible!=teacher) throw new AccessDeniedException("Solo el responsable puede cerrar o marcar respuesta principal");
        if(primary) jdbc.update("update tl_course_question_messages set is_primary_answer=false where question_id=?",questionId);
        jdbc.update("insert into tl_course_question_messages(question_id,author_user_id,body,is_primary_answer) values(?,?,?,?)",questionId,userId,body,primary);
        jdbc.update("update tl_course_questions set responsible_teacher_id=?,status=?,closed_at=? where id=?",responsible,
                close ? "CLOSED" : "IN_PROGRESS",close ? java.sql.Timestamp.from(clock.instant()) : null,questionId);
        log(institutionId,"ACADEMIC_QUESTION_REPLIED",questionId);
    }
    public Map<String,Object> ownSubmission(long institutionId,long userId,long taskId) {
        long student=student(institutionId,userId);
        requireCount("select count(*) from tl_tasks t join tl_course_groups g on g.id=t.group_id join tl_course_enrollments e on e.group_id=g.id "
                +"where t.id=? and g.institution_id=? and e.student_id=? and e.status='ACTIVE' and (t.published=true or exists(select 1 from tl_task_submissions owned where owned.task_id=t.id and owned.student_id=?))",taskId,institutionId,student,student);
        var rows=jdbc.queryForList("select id,task_id,body,status,submitted_at,created_at,updated_at from tl_task_submissions where task_id=? and student_id=?",taskId,student);
        if(rows.isEmpty()) return Map.of("taskId",taskId,"status","PENDING");var result=new java.util.LinkedHashMap<String,Object>();rows.get(0).forEach((key,value) -> result.put(key.toLowerCase(java.util.Locale.ROOT),value));return result;
    }
    private void log(long institution,String action,long resource) {
        var authentication=org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        Long actor=authentication!=null && authentication.getDetails() instanceof InstitutionAccessService.Access a ? a.user().getId() : null;
        audit.logSystem(actor,action,true,null,"institution="+institution+";resource="+resource);
    }
    private long teacher(long institutionId,long userId) { requireAcademicRole(institutionId,userId,"DOCENTE"); return teachers.findByInstitution_IdAndUser_Id(institutionId,userId).orElseThrow(() -> new AccessDeniedException("Perfil docente no encontrado")).getId(); }
    private long student(long institutionId,long userId) { requireAcademicRole(institutionId,userId,"ESTUDIANTE"); return students.findByInstitution_IdAndUser_Id(institutionId,userId).orElseThrow(() -> new AccessDeniedException("Perfil estudiantil no encontrado")).getId(); }
    private void requireGroup(long institutionId,long groupId) { requireCount("select count(*) from tl_course_groups where id=? and institution_id=?",groupId,institutionId); }
    private void requireTeacherGroup(long groupId,long teacherId) { requireCount("select count(*) from tl_course_group_teachers gt join tl_course_groups g on g.id=gt.group_id join tl_teachers t on t.id=gt.teacher_id where gt.group_id=? and gt.teacher_id=? and g.institution_id=t.institution_id",groupId,teacherId); }
    private void requireCount(String sql,Object... args) { if (jdbc.queryForObject(sql,Integer.class,args) == 0) throw new AccessDeniedException("Recurso no disponible en la institución activa"); }
    public void requireGroupAccess(long institution,long user,long group,boolean docente) {
        requireGroup(institution,group);
        if(docente) requireTeacherGroup(group,teacher(institution,user));
        else requireCount("select count(*) from tl_course_enrollments where group_id=? and student_id=? and status='ACTIVE'",group,student(institution,user));
    }
    private void requireAcademicRole(long institution,long user,String role) {
        var auth=org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if(auth==null || !(auth.getDetails() instanceof InstitutionAccessService.Access context)
                || !java.util.Objects.equals(context.institutionId(),institution) || !java.util.Objects.equals(context.user().getId(),user)) throw new AccessDeniedException("Contexto académico requerido");
        if(!access.resolve(user,institution,context.user().getAuthorizationVersion()).roles().contains(role)) throw new AccessDeniedException("Membresía académica requerida");
    }
    private long insert(String sql,Object... args) {
        try {
            var keys=new org.springframework.jdbc.support.GeneratedKeyHolder();
            jdbc.update(connection -> {
                var statement=connection.prepareStatement(sql.replace(" returning id",""),new String[]{"id"});
                for(int i=0;i<args.length;i++) statement.setObject(i+1,args[i]);return statement;
            },keys);
            long id=java.util.Objects.requireNonNull(keys.getKey()).longValue();
            var a=org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if(a!=null && a.getDetails() instanceof InstitutionAccessService.Access c) log(c.institutionId(),"ACADEMIC_"+sql.split("[ (]")[2].replace("tl_","").toUpperCase(java.util.Locale.ROOT)+"_CREATED",id);
            return id;
        } catch(DataIntegrityViolationException ex) {throw new AcademicConflictException("La relación ya existe o viola una restricción académica");}
    }
    public static class AcademicConflictException extends RuntimeException { public AcademicConflictException(String message) { super(message); } }
}
