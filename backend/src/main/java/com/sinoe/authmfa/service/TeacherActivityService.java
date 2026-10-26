package com.sinoe.authmfa.service;

import com.sinoe.authmfa.dto.academic.AcademicDtos.*;
import com.sinoe.authmfa.security.InstitutionAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

/** Author-owned activity management. Context, membership and group assignments remain authoritative. */
@Service @RequiredArgsConstructor @Transactional
public class TeacherActivityService {
    private final JdbcTemplate jdbc;
    private final InstitutionAccessService access;
    private final AcademicService academic;
    private final AuditService audit;

    public long createContent(Authentication auth, ContentRequest r) {
        var a=context(auth);
        long id=academic.content(a.institutionId(),a.user().getId(),r.groupId(),r.title(),r.body(),r.published());
        log(a,"CONTENT_CREATED",id);return id;
    }
    public long createTask(Authentication auth, TaskRequest r) {
        var a=context(auth);
        long id=academic.task(a.institutionId(),a.user().getId(),r.groupId(),r.title(),r.instructions(),r.dueAt(),r.published(),r.allowLateSubmissions());
        log(a,"TASK_CREATED",id);return id;
    }
    public void updateContent(Authentication auth,long id,ContentUpdate r) {
        var a=context(auth);owned(a,"tl_course_contents",id);
        jdbc.update("update tl_course_contents set title=?,body=?,published=?,published_at=case when ? then coalesce(published_at,current_timestamp) else null end,updated_at=current_timestamp where id=?",r.title(),r.body(),r.published(),r.published(),id);
        log(a,"CONTENT_UPDATED",id);
    }
    public void updateTask(Authentication auth,long id,TaskUpdate r) {
        var a=context(auth);owned(a,"tl_tasks",id);
        if(!r.published() && count("select count(*) from tl_task_submissions where task_id=?",id)>0)
            throw new AcademicService.AcademicConflictException("No se puede ocultar una tarea que ya tiene entregas o borradores de estudiantes.");
        jdbc.update("update tl_tasks set title=?,instructions=?,due_at=?,published=?,published_at=case when ? then coalesce(published_at,current_timestamp) else null end,allow_late_submissions=?,updated_at=current_timestamp where id=?",r.title(),r.instructions(),r.dueAt(),r.published(),r.published(),r.allowLateSubmissions(),id);
        log(a,"TASK_UPDATED",id);
    }
    public void delete(Authentication auth,boolean task,long id) {
        var a=context(auth);owned(a,task ? "tl_tasks" : "tl_course_contents",id);
        String parent=task ? "task_id" : "content_id";
        if((task && count("select count(*) from tl_task_submissions where task_id=?",id)>0)
                || count("select count(*) from tl_academic_attachments where "+parent+"=?",id)>0)
            throw new AcademicService.AcademicConflictException("La actividad tiene entregas o referencias históricas y no puede eliminarse.");
        jdbc.update("delete from "+(task ? "tl_tasks" : "tl_course_contents")+" where id=?",id);
        log(a,task ? "TASK_DELETED" : "CONTENT_DELETED",id);
    }
    private InstitutionAccessService.Access context(Authentication auth) {
        if(auth==null || !auth.isAuthenticated() || !(auth.getDetails() instanceof InstitutionAccessService.Access a) || a.institutionId()==null)
            throw new AccessDeniedException("Actividad no disponible");
        var fresh=access.resolve(a.user().getId(),a.institutionId(),a.user().getAuthorizationVersion());
        if(!fresh.roles().contains("DOCENTE")) throw new AccessDeniedException("Actividad no disponible");
        return fresh;
    }
    private void owned(InstitutionAccessService.Access a,String table,long id) {
        // Lock the parent first, as submission and attachment writes do, to preserve dependent history.
        var rows=jdbc.queryForList("select r.id,r.group_id from "+table+" r join tl_course_groups g on g.id=r.group_id "
                +"join tl_teachers t on t.id=r.author_teacher_id and t.institution_id=g.institution_id "
                +"where r.id=? and g.institution_id=? and t.user_id=? for update",id,a.institutionId(),a.user().getId());
        if(rows.size()!=1) throw new AccessDeniedException("Actividad no disponible");
        academic.requireGroupAccess(a.institutionId(),a.user().getId(),((Number)rows.get(0).get("group_id")).longValue(),true);
    }
    private long count(String sql,long id) {return jdbc.queryForObject(sql,Long.class,id);}
    private void log(InstitutionAccessService.Access a,String operation,long id) {
        audit.logSystem(a.user().getId(),"ACADEMIC_"+operation,true,null,"institution="+a.institutionId()+";resource="+id);
    }
}
