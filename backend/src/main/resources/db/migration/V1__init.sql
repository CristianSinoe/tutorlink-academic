-- Usuarios y roles (simple por ahora dentro de usuario)
CREATE TABLE IF NOT EXISTS tl_users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ESTUDIANTE','TUTOR')),
  career VARCHAR(120),
  plan VARCHAR(120),
  semester INT,
  birth_date DATE NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preguntas / Respuestas
CREATE TYPE tl_scope AS ENUM ('GENERAL','PROGRAMA','PLAN','SEMESTRE');
CREATE TYPE tl_status AS ENUM ('PENDIENTE','PUBLICADA','RECHAZADA');

CREATE TABLE IF NOT EXISTS tl_questions (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES tl_users(id),
  scope tl_scope NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  status tl_status NOT NULL DEFAULT 'PENDIENTE',
  reject_reason TEXT,
  current_answer_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tl_answers (
  id BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES tl_questions(id),
  tutor_id BIGINT NOT NULL REFERENCES tl_users(id),
  body TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de alcance y cambios
CREATE TABLE IF NOT EXISTS tl_question_audit (
  id BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES tl_questions(id),
  changed_by BIGINT REFERENCES tl_users(id),
  change_type VARCHAR(40) NOT NULL, -- 'RECLASIFICAR','PUBLICAR','CORREGIR','RECHAZAR','CREAR'
  from_scope tl_scope,
  to_scope tl_scope,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auditoría general de acciones (login, registro, endpoints, errores)
CREATE TABLE IF NOT EXISTS tl_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES tl_users(id),
  action VARCHAR(120) NOT NULL,
  success BOOLEAN NOT NULL,
  error_code VARCHAR(80),
  message TEXT,
  ip VARCHAR(64),
  user_agent TEXT,
  path VARCHAR(255),
  method VARCHAR(12),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_questions_status ON tl_questions(status);
CREATE INDEX IF NOT EXISTS idx_answers_question ON tl_answers(question_id);
