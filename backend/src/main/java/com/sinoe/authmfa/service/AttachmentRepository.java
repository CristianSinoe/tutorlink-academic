package com.sinoe.authmfa.service;

import com.sinoe.authmfa.config.ApprovedAttachmentCatalog.Entry;
import com.sinoe.authmfa.dto.AttachmentDtos.Metadata;
import com.sinoe.authmfa.service.AttachmentAuthorizationService.Authorization;
import com.sinoe.authmfa.service.AttachmentAuthorizationService.ResourceType;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AttachmentRepository {
    private final JdbcTemplate jdbc;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;
    private static final String METADATA = "id,case when content_id is not null then 'CONTENT' "
            + "when task_id is not null then 'TASK' else 'SUBMISSION' end resource_type,"
            + "coalesce(content_id,task_id,submission_id) resource_id,title,file_name,mime_type,size_bytes,created_at";

    public record Content(String url, String fileName, String mimeType, Long sizeBytes, String publicId) { }

    public Optional<Metadata> metadata(long institutionId, long id) {
        return jdbc.query("select " + METADATA + " from tl_academic_attachments where institution_id=? "
                + "and id=? and unlinked_at is null", this::metadataRow, institutionId, id).stream().findFirst();
    }

    public List<Metadata> list(Authorization parent, int page, int size) {
        return jdbc.query("select " + METADATA + " from tl_academic_attachments where institution_id=? and "
                + column(parent.resourceType()) + "=? and unlinked_at is null order by id limit ? offset ?",
                this::metadataRow, parent.institutionId(), parent.resourceId(), size, (long) page * size);
    }

    public Optional<Content> content(long institutionId, long id) {
        return jdbc.query("select url,file_name,mime_type,size_bytes,public_id from tl_academic_attachments "
                + "where institution_id=? and id=? and unlinked_at is null", (rs,n) -> new Content(rs.getString("url"),
                rs.getString("file_name"),rs.getString("mime_type"),rs.getObject("size_bytes",Long.class),
                rs.getString("public_id")), institutionId,id).stream().findFirst();
    }

    public long insert(Authorization parent, Entry entry, String title) {
        var keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var statement = connection.prepareStatement("insert into tl_academic_attachments(institution_id,"
                    + "uploader_user_id," + column(parent.resourceType()) + ",title,file_name,url,mime_type,size_bytes) "
                    + "values(?,?,?,?,?,?,?,?)", new String[]{"id"});
            statement.setLong(1,parent.institutionId()); statement.setLong(2,parent.userId());
            statement.setLong(3,parent.resourceId()); statement.setString(4,title); statement.setString(5,entry.fileName());
            statement.setString(6,entry.url()); statement.setString(7,entry.mimeType()); statement.setObject(8,entry.sizeBytes());
            return statement;
        },keys);
        return java.util.Objects.requireNonNull(keys.getKey()).longValue();
    }

    public int unlink(Authorization reference, String reason) {
        return jdbc.update("update tl_academic_attachments set unlinked_at=current_timestamp,"
                + "unlinked_by_user_id=?,unlink_reason=? where institution_id=? and id=? and unlinked_at is null",
                reference.userId(),reason,reference.institutionId(),reference.attachmentId());
    }

    /** Locks protect facts, never decide permissions. Reauthorize after obtaining them. */
    public void lockAuthorizationFacts(Authorization authorized) {
        long institution = authorized.institutionId();
        long user = authorized.userId();
        lock("select id from tl_users where id=? for update",user);
        lock("select id from tl_institutions where id=? for update",institution);
        lock("select id from tl_institution_memberships where user_id=? and institution_id=? order by id for update",user,institution);
        String source = authorized.resourceType() == ResourceType.CONTENT ? "tl_course_contents" : "tl_tasks";
        Long group;
        if (authorized.resourceType() == ResourceType.SUBMISSION) {
            List<Long> tasks = jdbc.queryForList("select s.task_id from tl_task_submissions s join tl_tasks t on t.id=s.task_id "
                    + "join tl_course_groups g on g.id=t.group_id where s.id=? and g.institution_id=?",Long.class,
                    authorized.resourceId(),institution);
            if (tasks.isEmpty()) return;
            lock("select id from tl_tasks where id=? for update", tasks.get(0));
            lock("select id from tl_task_submissions where id=? for update",authorized.resourceId());
            if (!tasks.get(0).equals(jdbc.queryForObject("select task_id from tl_task_submissions where id=?",
                    Long.class,authorized.resourceId()))) {
                throw new AttachmentService.Conflict("La relación de la entrega cambió; vuelve a intentar la operación");
            }
            group = jdbc.queryForObject("select group_id from tl_tasks where id=?",Long.class,tasks.get(0));
        } else {
            List<Long> groups = jdbc.queryForList("select r.group_id from " + source + " r join tl_course_groups g "
                    + "on g.id=r.group_id where r.id=? and g.institution_id=?",Long.class,authorized.resourceId(),institution);
            if (groups.isEmpty()) return;
            lock("select id from " + source + " where id=? for update",authorized.resourceId());
            // Re-read after lock in case the parent changed while waiting.
            group = jdbc.queryForObject("select group_id from " + source + " where id=?",Long.class,authorized.resourceId());
        }
        lock("select id from tl_course_groups where id=? for update",group);
        lock("select c.id from tl_courses c join tl_course_groups g on g.course_id=c.id where g.id=? for update",group);
        lock("select p.id from tl_academic_periods p join tl_course_groups g on g.period_id=p.id where g.id=? for update",group);
        // Lock profiles before assignments/enrollments, including the submission owner and resource author.
        lock("select t.id from tl_teachers t where t.institution_id=? and (t.user_id=? or t.id in "
                + "(select author_teacher_id from " + source + " where group_id=?)) order by t.id for update",institution,user,group);
        lock("select st.id from tl_students st where st.institution_id=? and (st.user_id=? or st.id in "
                + "(select e.student_id from tl_course_enrollments e where e.group_id=?) or st.id in "
                + "(select student_id from tl_task_submissions where id=?)) order by st.id for update",institution,user,group,
                authorized.resourceType()==ResourceType.SUBMISSION ? authorized.resourceId() : -1L);
        lock("select id from tl_course_group_teachers where group_id=? order by id for update",group);
        lock("select id from tl_course_enrollments where group_id=? order by id for update",group);
        if (authorized.attachmentId() != null) {
            lock("select id from tl_academic_attachments where institution_id=? and id=? for update",institution,authorized.attachmentId());
        }
        // A first authorization may have populated JPA's identity map before waiting for locks.
        // Preserve decision events, then force revalidation to read current database state.
        entityManager.flush();
        entityManager.clear();
    }

    private void lock(String sql, Object... args) { jdbc.queryForList(sql, args); }
    private Metadata metadataRow(ResultSet rs, int row) throws SQLException {
        return new Metadata(rs.getLong("id"),rs.getString("resource_type"),rs.getLong("resource_id"),
                rs.getString("title"),rs.getString("file_name"),rs.getString("mime_type"),
                rs.getObject("size_bytes",Long.class),rs.getObject("created_at",OffsetDateTime.class));
    }
    private static String column(ResourceType type) {
        return switch(type) { case CONTENT -> "content_id"; case TASK -> "task_id"; case SUBMISSION -> "submission_id"; };
    }
}
