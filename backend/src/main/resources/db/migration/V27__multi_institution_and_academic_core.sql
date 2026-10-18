CREATE TABLE IF NOT EXISTS tl_institutions (
    id BIGSERIAL PRIMARY KEY, code VARCHAR(60) NOT NULL UNIQUE, name VARCHAR(180) NOT NULL,
    timezone VARCHAR(60) NOT NULL DEFAULT 'America/Mexico_City', status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_institution_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
INSERT INTO tl_institutions (code, name) SELECT 'TUTORLINK_LEGACY', 'TutorLink Legacy'
WHERE NOT EXISTS (SELECT 1 FROM tl_institutions WHERE code = 'TUTORLINK_LEGACY');

ALTER TABLE tl_users ADD COLUMN IF NOT EXISTS authorization_version BIGINT NOT NULL DEFAULT 1;
ALTER TABLE tl_users DROP CONSTRAINT IF EXISTS tl_users_role_check;
ALTER TABLE tl_users ADD CONSTRAINT tl_users_role_check CHECK (role::text IN ('ESTUDIANTE','TUTOR','DOCENTE','ADMIN','SUPER_ADMIN'));

CREATE TABLE IF NOT EXISTS tl_institution_memberships (
    id BIGSERIAL PRIMARY KEY, institution_id BIGINT NOT NULL REFERENCES tl_institutions(id),
    user_id BIGINT NOT NULL REFERENCES tl_users(id) ON DELETE CASCADE, role VARCHAR(20) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_membership_institution_user_role UNIQUE (institution_id, user_id, role),
    CONSTRAINT ck_membership_role CHECK (role IN ('ADMIN','ESTUDIANTE','TUTOR','DOCENTE')),
    CONSTRAINT ck_membership_status CHECK (status IN ('ACTIVE','REVOKED'))
);
INSERT INTO tl_institution_memberships (institution_id, user_id, role)
SELECT i.id, u.id, u.role::text FROM tl_users u CROSS JOIN tl_institutions i
WHERE i.code = 'TUTORLINK_LEGACY' AND u.role::text IN ('ADMIN','ESTUDIANTE','TUTOR')
ON CONFLICT (institution_id, user_id, role) DO NOTHING;
CREATE TABLE IF NOT EXISTS tl_platform_roles (
    user_id BIGINT NOT NULL REFERENCES tl_users(id) ON DELETE CASCADE, role VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (user_id, role),
    CONSTRAINT ck_platform_role CHECK (role = 'SUPER_ADMIN')
);

ALTER TABLE tl_students ADD COLUMN IF NOT EXISTS institution_id BIGINT REFERENCES tl_institutions(id);
ALTER TABLE tl_tutors ADD COLUMN IF NOT EXISTS institution_id BIGINT REFERENCES tl_institutions(id);
UPDATE tl_students SET institution_id = (SELECT id FROM tl_institutions WHERE code = 'TUTORLINK_LEGACY') WHERE institution_id IS NULL;
UPDATE tl_tutors SET institution_id = (SELECT id FROM tl_institutions WHERE code = 'TUTORLINK_LEGACY') WHERE institution_id IS NULL;
ALTER TABLE tl_students ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE tl_tutors ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE tl_students DROP CONSTRAINT IF EXISTS tl_students_matricula_key;
ALTER TABLE tl_tutors DROP CONSTRAINT IF EXISTS tl_tutors_tutor_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS uk_students_institution_matricula ON tl_students(institution_id, matricula);
CREATE UNIQUE INDEX IF NOT EXISTS uk_tutors_institution_code ON tl_tutors(institution_id, tutor_code);

CREATE TABLE IF NOT EXISTS tl_teachers (
 id BIGSERIAL PRIMARY KEY, institution_id BIGINT NOT NULL REFERENCES tl_institutions(id), user_id BIGINT NOT NULL REFERENCES tl_users(id) ON DELETE CASCADE,
 teacher_code VARCHAR(50) NOT NULL, department VARCHAR(100), specialty VARCHAR(150), phone VARCHAR(30),
 UNIQUE(institution_id,user_id), UNIQUE(institution_id,teacher_code));
CREATE TABLE IF NOT EXISTS tl_academic_periods (
 id BIGSERIAL PRIMARY KEY, institution_id BIGINT NOT NULL REFERENCES tl_institutions(id), code VARCHAR(50) NOT NULL, name VARCHAR(140) NOT NULL,
 starts_on DATE NOT NULL, ends_on DATE NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', UNIQUE(institution_id,code), CHECK(ends_on >= starts_on));
CREATE TABLE IF NOT EXISTS tl_courses (
 id BIGSERIAL PRIMARY KEY, institution_id BIGINT NOT NULL REFERENCES tl_institutions(id), code VARCHAR(50) NOT NULL, name VARCHAR(180) NOT NULL,
 description TEXT, active BOOLEAN NOT NULL DEFAULT TRUE, UNIQUE(institution_id,code));
CREATE TABLE IF NOT EXISTS tl_course_groups (
 id BIGSERIAL PRIMARY KEY, institution_id BIGINT NOT NULL REFERENCES tl_institutions(id), course_id BIGINT NOT NULL REFERENCES tl_courses(id),
 period_id BIGINT NOT NULL REFERENCES tl_academic_periods(id), code VARCHAR(50) NOT NULL, name VARCHAR(180) NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE(course_id,period_id,code));
CREATE TABLE IF NOT EXISTS tl_course_group_teachers (
 id BIGSERIAL PRIMARY KEY, group_id BIGINT NOT NULL REFERENCES tl_course_groups(id) ON DELETE CASCADE, teacher_id BIGINT NOT NULL REFERENCES tl_teachers(id),
 assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(group_id,teacher_id));
CREATE TABLE IF NOT EXISTS tl_course_enrollments (
 id BIGSERIAL PRIMARY KEY, group_id BIGINT NOT NULL REFERENCES tl_course_groups(id) ON DELETE CASCADE, student_id BIGINT NOT NULL REFERENCES tl_students(id),
 status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), withdrawn_at TIMESTAMPTZ,
 UNIQUE(group_id,student_id), CHECK(status IN ('ACTIVE','WITHDRAWN')));
CREATE TABLE IF NOT EXISTS tl_course_contents (
 id BIGSERIAL PRIMARY KEY, group_id BIGINT NOT NULL REFERENCES tl_course_groups(id) ON DELETE CASCADE, author_teacher_id BIGINT NOT NULL REFERENCES tl_teachers(id),
 title VARCHAR(200) NOT NULL, body TEXT, published BOOLEAN NOT NULL DEFAULT FALSE, published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS tl_tasks (
 id BIGSERIAL PRIMARY KEY, group_id BIGINT NOT NULL REFERENCES tl_course_groups(id) ON DELETE CASCADE, author_teacher_id BIGINT NOT NULL REFERENCES tl_teachers(id),
 title VARCHAR(200) NOT NULL, instructions TEXT, published BOOLEAN NOT NULL DEFAULT FALSE, published_at TIMESTAMPTZ, due_at TIMESTAMPTZ NOT NULL,
 allow_late_submissions BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS tl_task_submissions (
 id BIGSERIAL PRIMARY KEY, task_id BIGINT NOT NULL REFERENCES tl_tasks(id) ON DELETE CASCADE, student_id BIGINT NOT NULL REFERENCES tl_students(id),
 body TEXT, status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', submitted_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(task_id,student_id), CHECK(status IN ('DRAFT','ON_TIME','LATE')));
CREATE TABLE IF NOT EXISTS tl_class_sessions (
 id BIGSERIAL PRIMARY KEY, group_id BIGINT NOT NULL REFERENCES tl_course_groups(id) ON DELETE CASCADE, teacher_id BIGINT NOT NULL REFERENCES tl_teachers(id),
 starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, topic VARCHAR(250), CHECK(ends_at >= starts_at));
CREATE TABLE IF NOT EXISTS tl_attendance_records (
 id BIGSERIAL PRIMARY KEY, session_id BIGINT NOT NULL REFERENCES tl_class_sessions(id) ON DELETE CASCADE, student_id BIGINT NOT NULL REFERENCES tl_students(id),
 status VARCHAR(20) NOT NULL, recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(session_id,student_id), CHECK(status IN ('PRESENT','ABSENT','LATE','EXCUSED')));
CREATE TABLE IF NOT EXISTS tl_academic_attachments (
 id BIGSERIAL PRIMARY KEY, institution_id BIGINT NOT NULL REFERENCES tl_institutions(id), uploader_user_id BIGINT NOT NULL REFERENCES tl_users(id),
 content_id BIGINT REFERENCES tl_course_contents(id) ON DELETE CASCADE, task_id BIGINT REFERENCES tl_tasks(id) ON DELETE CASCADE, submission_id BIGINT REFERENCES tl_task_submissions(id) ON DELETE CASCADE,
 title VARCHAR(200), file_name VARCHAR(255) NOT NULL, url VARCHAR(2000) NOT NULL, mime_type VARCHAR(150), size_bytes BIGINT, public_id VARCHAR(255), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK((CASE WHEN content_id IS NULL THEN 0 ELSE 1 END + CASE WHEN task_id IS NULL THEN 0 ELSE 1 END + CASE WHEN submission_id IS NULL THEN 0 ELSE 1 END) = 1));
CREATE TABLE IF NOT EXISTS tl_course_questions (
 id BIGSERIAL PRIMARY KEY, group_id BIGINT NOT NULL REFERENCES tl_course_groups(id) ON DELETE CASCADE, student_id BIGINT NOT NULL REFERENCES tl_students(id),
 target_teacher_id BIGINT REFERENCES tl_teachers(id), responsible_teacher_id BIGINT REFERENCES tl_teachers(id), subject VARCHAR(200) NOT NULL, body TEXT NOT NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'OPEN', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), closed_at TIMESTAMPTZ, CHECK(status IN ('OPEN','IN_PROGRESS','CLOSED')));
CREATE TABLE IF NOT EXISTS tl_course_question_messages (
 id BIGSERIAL PRIMARY KEY, question_id BIGINT NOT NULL REFERENCES tl_course_questions(id) ON DELETE CASCADE, author_user_id BIGINT NOT NULL REFERENCES tl_users(id),
 body TEXT NOT NULL, is_primary_answer BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS idx_memberships_user_institution ON tl_institution_memberships(user_id,institution_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON tl_course_enrollments(student_id,status);
