package com.sinoe.authmfa.service;

import com.sinoe.authmfa.security.InstitutionAccessService;
import com.sinoe.authmfa.service.AttachmentAuthorizationService;
import com.sinoe.authmfa.dto.PagedResponse;
import com.sinoe.authmfa.dto.academic.AcademicDtos.EnrollmentView;
import com.sinoe.authmfa.dto.academic.AcademicDtos.TeacherAssignmentView;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.sql.Timestamp;

@Service
@RequiredArgsConstructor
@Transactional
public class AcademicReadService {
    private final JdbcTemplate jdbc;
    private final InstitutionAccessService access;
    private final AcademicService academic;
    private final AttachmentAuthorizationService attachmentAccess;
    private final AuditService audit;

    public PagedResponse<Map<String,Object>> admin(Authentication auth,String kind,String q,Long courseId,Long periodId,int page,int size) {
        var a=context(auth,"ADMIN");
        String table=switch(kind){case "periods" -> "tl_academic_periods";case "courses" -> "tl_courses";case "groups" -> "tl_course_groups";default -> throw new IllegalArgumentException();};
        String where=" from "+table+" r where r.institution_id=?";List<Object> args=new ArrayList<>(List.of(a.institutionId()));
        if(kind.equals("groups")&&courseId!=null){where+=" and r.course_id=?";args.add(courseId);}
        if(kind.equals("groups")&&periodId!=null){where+=" and r.period_id=?";args.add(periodId);}
        where=search(where,args,q,"r.name","r.code");return page("r.*",where,args,page,size,"r.id");
    }
    public PagedResponse<TeacherAssignmentView> groupTeachers(Authentication auth,long groupId,String q,int page,int size) {
        var a=context(auth,"ADMIN");
        requireInstitutionGroup(groupId,a.institutionId());
        validatePage(page,size);
        String where=" from tl_course_group_teachers gt join tl_course_groups g on g.id=gt.group_id "
                +"join tl_teachers t on t.id=gt.teacher_id and t.institution_id=g.institution_id "
                +"join tl_users u on u.id=t.user_id where gt.group_id=? and g.institution_id=?";
        List<Object> args=new ArrayList<>(List.of(groupId,a.institutionId()));
        where=personSearch(where,args,q,"t.teacher_code");
        long total=jdbc.queryForObject("select count(*)"+where,Long.class,args.toArray());
        args.add(size);args.add((long)page*size);
        var items=jdbc.query("select t.id teacher_id,t.teacher_code,u.name,u.last_name_paterno,u.last_name_materno,"
                        +"t.department,t.specialty,gt.assigned_at"+where+" order by t.id limit ? offset ?",
                (rs,row) -> new TeacherAssignmentView(rs.getLong("teacher_id"),rs.getString("teacher_code"),
                        rs.getString("name"),rs.getString("last_name_paterno"),rs.getString("last_name_materno"),
                        rs.getString("department"),rs.getString("specialty"),instant(rs.getObject("assigned_at"))),args.toArray());
        return response(items,page,size,total);
    }
    public PagedResponse<EnrollmentView> groupEnrollments(Authentication auth,long groupId,String q,String status,int page,int size) {
        var a=context(auth,"ADMIN");
        requireInstitutionGroup(groupId,a.institutionId());
        validatePage(page,size);
        String normalized=status==null ? "ACTIVE" : status.toUpperCase(Locale.ROOT);
        if(!Set.of("ACTIVE","WITHDRAWN","ALL").contains(normalized)) throw new IllegalArgumentException("Estado de inscripción inválido");
        String where=" from tl_course_enrollments e join tl_course_groups g on g.id=e.group_id "
                +"join tl_students s on s.id=e.student_id and s.institution_id=g.institution_id "
                +"join tl_users u on u.id=s.user_id where e.group_id=? and g.institution_id=?";
        List<Object> args=new ArrayList<>(List.of(groupId,a.institutionId()));
        if(!"ALL".equals(normalized)){where+=" and e.status=?";args.add(normalized);}
        where=personSearch(where,args,q,"s.matricula");
        long total=jdbc.queryForObject("select count(*)"+where,Long.class,args.toArray());
        args.add(size);args.add((long)page*size);
        var items=jdbc.query("select s.id student_id,s.matricula,u.name,u.last_name_paterno,u.last_name_materno,"
                        +"s.career,s.plan,s.semester,e.status,e.enrolled_at,e.withdrawn_at"+where+" order by s.id limit ? offset ?",
                (rs,row) -> new EnrollmentView(rs.getLong("student_id"),rs.getString("matricula"),rs.getString("name"),
                        rs.getString("last_name_paterno"),rs.getString("last_name_materno"),rs.getString("career"),
                        rs.getString("plan"),(Integer)rs.getObject("semester"),rs.getString("status"),
                        instant(rs.getObject("enrolled_at")),instant(rs.getObject("withdrawn_at"))),args.toArray());
        return response(items,page,size,total);
    }
    public PagedResponse<Map<String,Object>> groups(Authentication auth,boolean teacher,String q,int page,int size) {
        var a=context(auth,teacher ? "DOCENTE" : "ESTUDIANTE");
        String where=" from tl_course_groups g join tl_courses c on c.id=g.course_id and c.institution_id=g.institution_id "
                +"join tl_academic_periods p on p.id=g.period_id and p.institution_id=g.institution_id where g.institution_id=?";
        List<Object> args=new ArrayList<>(List.of(a.institutionId()));
        where+=relationship(teacher);args.add(a.user().getId());where=search(where,args,q,"g.name","c.name");
        return page("g.id,g.code,g.name,g.course_id,g.period_id,c.name course_name,p.name period_name",where,args,page,size,"g.id");
    }
    public PagedResponse<Map<String,Object>> materials(Authentication auth,boolean teacher,String type,Long groupId,String q,int page,int size) {
        var a=context(auth,teacher ? "DOCENTE" : "ESTUDIANTE");
        if(groupId!=null) academic.requireGroupAccess(a.institutionId(),a.user().getId(),groupId,teacher);
        String table=type.equals("CONTENT") ? "tl_course_contents" : type.equals("TASK") ? "tl_tasks" : null;
        if(table==null) throw new IllegalArgumentException();
        String where=" from "+table+" r join tl_course_groups g on g.id=r.group_id "
                +"join tl_teachers author on author.id=r.author_teacher_id and author.institution_id=g.institution_id where g.institution_id=?";
        List<Object> args=new ArrayList<>(List.of(a.institutionId()));
        where+=relationship(teacher);args.add(a.user().getId());
        if(groupId!=null){where+=" and g.id=?";args.add(groupId);}
        if(teacher){where+=" and (r.published=true or author.user_id=?)";args.add(a.user().getId());}else where+=" and r.published=true";
        where=search(where,args,q,"r.title","g.name");
        var result=page("r.*",where,args,page,size,"r.id");
        for(var row:result.getContent()) attachmentAccess.authorizeResourceMetadata(auth,AttachmentAuthorizationService.ResourceType.valueOf(type),((Number)row.get("id")).longValue(),
                teacher ? AttachmentAuthorizationService.ActingRole.DOCENTE : AttachmentAuthorizationService.ActingRole.ESTUDIANTE);
        return result;
    }
    public PagedResponse<Map<String,Object>> questions(Authentication auth,boolean teacher,Long groupId,String state,String q,int page,int size) {
        var a=context(auth,teacher ? "DOCENTE" : "ESTUDIANTE");
        if(groupId!=null) academic.requireGroupAccess(a.institutionId(),a.user().getId(),groupId,teacher);
        if(state!=null&&!Set.of("OPEN","IN_PROGRESS","CLOSED").contains(state)) throw new IllegalArgumentException("Estado inválido");
        String where=" from tl_course_questions r join tl_course_groups g on g.id=r.group_id "
                +"join tl_students s on s.id=r.student_id and s.institution_id=g.institution_id where g.institution_id=?";
        List<Object> args=new ArrayList<>(List.of(a.institutionId()));
        where+=relationship(teacher);args.add(a.user().getId());
        if(!teacher){where+=" and s.user_id=?";args.add(a.user().getId());}
        if(groupId!=null){where+=" and g.id=?";args.add(groupId);}if(state!=null){where+=" and r.status=?";args.add(state);}
        where=search(where,args,q,"r.subject","g.name");
        return page("r.*,g.name group_name",where,args,page,size,"r.id");
    }
    public PagedResponse<Map<String,Object>> messages(Authentication auth,boolean teacher,long question,int page,int size) {
        var a=context(auth,teacher ? "DOCENTE" : "ESTUDIANTE");
        var rows=jdbc.queryForList("select q.group_id,s.user_id from tl_course_questions q join tl_course_groups g on g.id=q.group_id "
                +"join tl_students s on s.id=q.student_id and s.institution_id=g.institution_id where q.id=? and g.institution_id=?",question,a.institutionId());
        if(rows.size()!=1||(!teacher&&((Number)rows.get(0).get("user_id")).longValue()!=a.user().getId())) throw new AccessDeniedException("Consulta no disponible");
        academic.requireGroupAccess(a.institutionId(),a.user().getId(),((Number)rows.get(0).get("group_id")).longValue(),teacher);
        return page("r.id,r.author_user_id,u.name author_name,u.last_name_paterno author_last_name_paterno,r.body,r.is_primary_answer,r.created_at"," from tl_course_question_messages r join tl_users u on u.id=r.author_user_id where r.question_id=?",new ArrayList<>(List.of(question)),page,size,"r.id");
    }
    public Map<String,Object> question(Authentication auth,boolean teacher,long id) {
        messages(auth,teacher,id,0,1);
        var row=jdbc.queryForMap("select id,group_id,student_id,target_teacher_id,responsible_teacher_id,subject,body,status,created_at,closed_at from tl_course_questions where id=?",id);
        Map<String,Object> normalized=new LinkedHashMap<>();row.forEach((key,value) -> normalized.put(key.toLowerCase(Locale.ROOT),value));return normalized;
    }
    public PagedResponse<Map<String,Object>> submissions(Authentication auth,long task,int page,int size) {
        var a=context(auth,"DOCENTE");
        var parent=attachmentAccess.authorizeResourceMetadata(auth,AttachmentAuthorizationService.ResourceType.TASK,task,AttachmentAuthorizationService.ActingRole.DOCENTE);
        String where=" from tl_task_submissions r join tl_tasks t on t.id=r.task_id join tl_course_groups g on g.id=t.group_id "
                +"join tl_students s on s.id=r.student_id and s.institution_id=g.institution_id "
                +"join tl_course_enrollments e on e.group_id=g.id and e.student_id=s.id and e.status='ACTIVE' "
                +"where t.id=? and g.institution_id=? and r.status in ('ON_TIME','LATE')";
        var result=page("r.*",where,new ArrayList<>(List.of(task,parent.institutionId())),page,size,"r.id");
        for(var row:result.getContent()) attachmentAccess.authorizeResourceMetadata(auth,AttachmentAuthorizationService.ResourceType.SUBMISSION,((Number)row.get("id")).longValue(),AttachmentAuthorizationService.ActingRole.DOCENTE);
        return result;
    }
    @Transactional
    public void studentMessage(Authentication auth,long question,String body) {
        if(body==null||body.isBlank()||body.length()>8000) throw new IllegalArgumentException();
        var a=context(auth,"ESTUDIANTE");messages(auth,false,question,0,1);
        var state=jdbc.queryForList("select status from tl_course_questions where id=? for update",question);
        if(state.isEmpty()||"CLOSED".equals(state.get(0).get("status"))) throw new AcademicService.AcademicConflictException("Consulta cerrada");
        jdbc.update("insert into tl_course_question_messages(question_id,author_user_id,body,is_primary_answer) values(?,?,?,false)",question,a.user().getId(),body);
        audit.logSystem(a.user().getId(),"ACADEMIC_QUESTION_FOLLOWUP",true,null,"institution="+a.institutionId()+";question="+question);
    }
    public PagedResponse<Map<String,Object>> attendance(Authentication auth,Long group,String status,int page,int size) {
        var a=context(auth,"ESTUDIANTE");
        if(group!=null) academic.requireGroupAccess(a.institutionId(),a.user().getId(),group,false);
        if(status!=null&&!Set.of("PRESENT","ABSENT","LATE","EXCUSED").contains(status)) throw new IllegalArgumentException();
        String where=" from tl_attendance_records r join tl_class_sessions cs on cs.id=r.session_id join tl_course_groups g on g.id=cs.group_id "
                +"join tl_students s on s.id=r.student_id and s.institution_id=g.institution_id where g.institution_id=? and s.user_id=?";
        List<Object> args=new ArrayList<>(List.of(a.institutionId(),a.user().getId()));
        if(group!=null){where+=" and g.id=?";args.add(group);}if(status!=null){where+=" and r.status=?";args.add(status);}
        return page("r.id,r.status,r.recorded_at,cs.starts_at,cs.topic,g.id group_id,g.name group_name",where,args,page,size,"r.id");
    }
    public PagedResponse<Map<String,Object>> roster(Authentication auth,long group,int page,int size) {
        var a=context(auth,"DOCENTE");academic.requireGroupAccess(a.institutionId(),a.user().getId(),group,true);
        return page("s.id student_id,s.matricula,u.name,u.last_name_paterno,e.status enrollment_status", " from tl_course_enrollments e join tl_students s on s.id=e.student_id "
                +"join tl_users u on u.id=s.user_id join tl_course_groups g on g.id=e.group_id and g.institution_id=s.institution_id "
                +"where g.id=? and g.institution_id=? and e.status='ACTIVE'",new ArrayList<>(List.of(group,a.institutionId())),page,size,"s.id");
    }
    public PagedResponse<Map<String,Object>> sessions(Authentication auth,Long group,int page,int size) {
        var a=context(auth,"DOCENTE");if(group!=null) academic.requireGroupAccess(a.institutionId(),a.user().getId(),group,true);
        String where=" from tl_class_sessions r join tl_course_groups g on g.id=r.group_id where g.institution_id=?"+relationship(true);
        List<Object> args=new ArrayList<>(List.of(a.institutionId(),a.user().getId()));
        if(group!=null){where+=" and g.id=?";args.add(group);}return page("r.*",where,args,page,size,"r.id");
    }
    public PagedResponse<Map<String,Object>> progress(Authentication auth,int page,int size) {
        var a=context(auth,"ESTUDIANTE");
        String where=" from (select g.id,g.name,count(distinct t.id) published_tasks,"
                +"count(distinct case when ts.status='ON_TIME' then ts.id end) on_time,"
                +"count(distinct case when ts.status='LATE' then ts.id end) late,"
                +"count(distinct ar.id) attendance_total,count(distinct case when ar.status in ('PRESENT','LATE','EXCUSED') then ar.id end) attendance_positive "
                +"from tl_course_groups g join tl_course_enrollments e on e.group_id=g.id and e.status='ACTIVE' "
                +"join tl_students s on s.id=e.student_id and s.institution_id=g.institution_id "
                +"left join tl_tasks t on t.group_id=g.id and t.published=true left join tl_task_submissions ts on ts.task_id=t.id and ts.student_id=s.id "
                +"left join tl_class_sessions cs on cs.group_id=g.id left join tl_attendance_records ar on ar.session_id=cs.id and ar.student_id=s.id "
                +"where g.institution_id=? and s.user_id=? group by g.id,g.name) r";
        return page("r.*",where,new ArrayList<>(List.of(a.institutionId(),a.user().getId())),page,size,"r.id");
    }
    private InstitutionAccessService.Access context(Authentication auth,String role) {
        if(auth==null||!(auth.getDetails() instanceof InstitutionAccessService.Access c)||c.institutionId()==null) throw new AccessDeniedException("Contexto requerido");
        var fresh=access.resolve(c.user().getId(),c.institutionId(),c.user().getAuthorizationVersion());
        if(!fresh.roles().contains(role)&&!(role.equals("ADMIN")&&fresh.roles().contains("SUPER_ADMIN"))) throw new AccessDeniedException("Rol requerido");return fresh;
    }
    private String relationship(boolean teacher) {
        return teacher ? " and exists(select 1 from tl_course_group_teachers gt join tl_teachers tp on tp.id=gt.teacher_id where gt.group_id=g.id and tp.institution_id=g.institution_id and tp.user_id=?)"
                : " and exists(select 1 from tl_course_enrollments ce join tl_students sp on sp.id=ce.student_id where ce.group_id=g.id and sp.institution_id=g.institution_id and sp.user_id=? and ce.status='ACTIVE')";
    }
    private String search(String where,List<Object> args,String query,String a,String b) {
        if(query!=null&&!query.isBlank()){String term="%"+query.toLowerCase(Locale.ROOT)+"%";where+=" and (lower("+a+") like ? or lower("+b+") like ?)";args.add(term);args.add(term);}return where;
    }
    private String personSearch(String where,List<Object> args,String query,String code) {
        if(query!=null&&!query.isBlank()){
            String term="%"+query.toLowerCase(Locale.ROOT)+"%";
            where+=" and (lower("+code+") like ? or lower(u.name) like ? or lower(coalesce(u.last_name_paterno,'')) like ? or lower(coalesce(u.last_name_materno,'')) like ?)";
            args.add(term);args.add(term);args.add(term);args.add(term);
        }
        return where;
    }
    private void requireInstitutionGroup(long groupId,long institutionId) {
        Integer count=jdbc.queryForObject("select count(*) from tl_course_groups where id=? and institution_id=?",Integer.class,groupId,institutionId);
        if(count==null||count!=1) throw new AccessDeniedException("Recurso no disponible en la institución activa");
    }
    private void validatePage(int page,int size) {
        if(page<0||size<1||size>100) throw new IllegalArgumentException("Paginación inválida");
    }
    private <T> PagedResponse<T> response(List<T> items,int page,int size,long total) {
        return new PagedResponse<>(items,page,size,total,(int)Math.min(Integer.MAX_VALUE,(total+size-1)/size));
    }
    private Instant instant(Object value) {
        if(value==null) return null;
        if(value instanceof Instant instant) return instant;
        if(value instanceof OffsetDateTime date) return date.toInstant();
        if(value instanceof Timestamp timestamp) return timestamp.toInstant();
        throw new IllegalStateException("Tipo temporal académico no compatible");
    }
    private PagedResponse<Map<String,Object>> page(String fields,String where,List<Object> args,int page,int size,String order) {
        if(page<0||size<1||size>100) throw new IllegalArgumentException("Paginación inválida");
        long total=jdbc.queryForObject("select count(*)"+where,Long.class,args.toArray());
        args.add(size);args.add((long)page*size);
        var items=jdbc.queryForList("select "+fields+where+" order by "+order+" limit ? offset ?",args.toArray()).stream().map(row -> {Map<String,Object> normalized=new LinkedHashMap<>();row.forEach((key,value) -> normalized.put(key.toLowerCase(Locale.ROOT),value));return normalized;}).toList();
        return new PagedResponse<>(items,page,size,total,(int)Math.min(Integer.MAX_VALUE,(total+size-1)/size));
    }
}
