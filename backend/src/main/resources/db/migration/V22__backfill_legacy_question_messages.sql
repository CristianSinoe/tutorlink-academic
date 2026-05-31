INSERT INTO tl_question_messages (
    question_id,
    sender_user_id,
    sender_role,
    message_type,
    body,
    visible,
    created_at
)
SELECT
    q.id,
    s.user_id,
    'ESTUDIANTE',
    'TEXT',
    q.body,
    TRUE,
    COALESCE(q.created_at, NOW())
FROM tl_questions q
JOIN tl_students s ON s.id = q.student_id
WHERE NOT EXISTS (
    SELECT 1
    FROM tl_question_messages qm
    WHERE qm.question_id = q.id
      AND qm.sender_user_id = s.user_id
);

WITH legacy_answers AS (
    SELECT
        a.id AS answer_id,
        a.question_id,
        t.user_id AS sender_user_id,
        a.body,
        COALESCE(a.created_at, NOW()) AS created_at,
        ROW_NUMBER() OVER (
            PARTITION BY a.question_id, t.user_id, a.body, COALESCE(a.created_at, NOW())
            ORDER BY a.id
        ) AS rn
    FROM tl_answers a
    JOIN tl_tutors t ON t.id = a.tutor_id
    WHERE a.thread_message_id IS NULL
),
inserted_messages AS (
    INSERT INTO tl_question_messages (
        question_id,
        sender_user_id,
        sender_role,
        message_type,
        body,
        visible,
        created_at
    )
    SELECT
        question_id,
        sender_user_id,
        'TUTOR',
        'TEXT',
        body,
        TRUE,
        created_at
    FROM legacy_answers
    RETURNING id, question_id, sender_user_id, body, created_at
),
ranked_inserted_messages AS (
    SELECT
        id,
        question_id,
        sender_user_id,
        body,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY question_id, sender_user_id, body, created_at
            ORDER BY id
        ) AS rn
    FROM inserted_messages
)
UPDATE tl_answers a
SET thread_message_id = rim.id
FROM legacy_answers la
JOIN ranked_inserted_messages rim
  ON rim.question_id = la.question_id
 AND rim.sender_user_id = la.sender_user_id
 AND rim.body = la.body
 AND rim.created_at = la.created_at
 AND rim.rn = la.rn
WHERE a.id = la.answer_id
  AND a.thread_message_id IS NULL;
