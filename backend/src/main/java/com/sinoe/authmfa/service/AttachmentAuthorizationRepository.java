package com.sinoe.authmfa.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import lombok.RequiredArgsConstructor;
import com.sinoe.authmfa.service.AttachmentAuthorizationService.ResourceType;

/** Authorization-only queries deliberately never select provider identifiers or URLs. */
@Repository
@RequiredArgsConstructor
public class AttachmentAuthorizationRepository {
    private final JdbcTemplate jdbc;

    public record Reference(Long contentId, Long taskId, Long submissionId) { }
    public record Resource(long authorUserId, Long ownerUserId, boolean published, String status,
                           Instant dueAt, boolean allowLate, boolean teacherAssigned,
                           boolean studentEnrolled, boolean ownerEnrolled) { }

    public Optional<Reference> reference(long institutionId, long id) {
        List<Reference> rows = jdbc.query("""
                select content_id, task_id, submission_id from tl_academic_attachments
                where institution_id=? and id=? and unlinked_at is null
                """, (rs, n) -> new Reference(rs.getObject("content_id", Long.class),
                rs.getObject("task_id", Long.class), rs.getObject("submission_id", Long.class)), institutionId, id);
        return rows.size() == 1 ? Optional.of(rows.get(0)) : Optional.empty();
    }

    public Optional<Resource> resource(long institutionId, long userId, ResourceType type, long id) {
        String table = switch (type) {
            case CONTENT -> "tl_course_contents r";
            case TASK -> "tl_tasks r";
            case SUBMISSION -> "tl_tasks r";
        };
        // Every parent and profile must belong to the group institution.
        String from = type == ResourceType.SUBMISSION
                ? "tl_tasks r join tl_course_groups g on g.id=r.group_id "
                    + "join tl_task_submissions s on s.task_id=r.id "
                    + "join tl_students owner on owner.id=s.student_id and owner.institution_id=g.institution_id"
                : table + " join tl_course_groups g on g.id=r.group_id";
        String fields = type == ResourceType.SUBMISSION
                ? "owner.user_id owner_user_id,s.status,r.due_at,r.allow_late_submissions"
                : "cast(null as bigint) owner_user_id,cast(null as varchar) status,"
                    + "cast(null as timestamp) due_at,false allow_late_submissions";
        String ownerEnrollment = type == ResourceType.SUBMISSION
                ? "exists(select 1 from tl_course_enrollments e where e.group_id=g.id "
                    + "and e.student_id=owner.id and e.status='ACTIVE')" : "false";
        String sql = "select author.user_id author_user_id,r.published," + fields + ","
                + "exists(select 1 from tl_course_group_teachers gt join tl_teachers t on t.id=gt.teacher_id "
                + "where gt.group_id=g.id and t.institution_id=g.institution_id and t.user_id=?) teacher_assigned,"
                + "exists(select 1 from tl_course_enrollments e join tl_students st on st.id=e.student_id "
                + "where e.group_id=g.id and e.status='ACTIVE' and st.institution_id=g.institution_id "
                + "and st.user_id=?) student_enrolled," + ownerEnrollment + " owner_enrolled from " + from
                + " join tl_courses c on c.id=g.course_id and c.institution_id=g.institution_id"
                + " join tl_academic_periods p on p.id=g.period_id and p.institution_id=g.institution_id"
                + " join tl_teachers author on author.id=r.author_teacher_id and author.institution_id=g.institution_id"
                + " where g.institution_id=? and " + (type == ResourceType.SUBMISSION ? "s.id" : "r.id") + "=?";
        List<Resource> rows = jdbc.query(sql, (rs, n) -> new Resource(rs.getLong("author_user_id"),
                rs.getObject("owner_user_id", Long.class), rs.getBoolean("published"), rs.getString("status"),
                rs.getTimestamp("due_at") == null ? null : rs.getTimestamp("due_at").toInstant(),
                rs.getBoolean("allow_late_submissions"), rs.getBoolean("teacher_assigned"),
                rs.getBoolean("student_enrolled"), rs.getBoolean("owner_enrolled")), userId, userId, institutionId, id);
        return rows.size() == 1 ? Optional.of(rows.get(0)) : Optional.empty();
    }
}
