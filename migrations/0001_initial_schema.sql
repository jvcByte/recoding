-- Migration 0001: initial schema

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('participant', 'instructor')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exercises (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug           TEXT NOT NULL UNIQUE,
    title          TEXT NOT NULL,
    enabled        BOOLEAN NOT NULL DEFAULT false,
    question_count INT NOT NULL
);

CREATE TABLE exercise_assignments (
    exercise_id UUID REFERENCES exercises(id),
    user_id     UUID REFERENCES users(id),
    PRIMARY KEY (exercise_id, user_id)
);

CREATE TABLE sessions (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id            UUID NOT NULL REFERENCES exercises(id),
    user_id                UUID NOT NULL REFERENCES users(id),
    start_time             TIMESTAMPTZ,
    end_time               TIMESTAMPTZ,
    duration_limit         INTERVAL,
    started_at             TIMESTAMPTZ,
    closed_at              TIMESTAMPTZ,
    current_question_index INT NOT NULL DEFAULT 0,
    UNIQUE (exercise_id, user_id)
);

CREATE TABLE submissions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     UUID NOT NULL REFERENCES sessions(id),
    question_index INT NOT NULL,
    response_text  TEXT NOT NULL DEFAULT '',
    is_final       BOOLEAN NOT NULL DEFAULT false,
    is_flagged     BOOLEAN NOT NULL DEFAULT false,
    flag_reasons   TEXT[],
    review_note    TEXT,
    submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (session_id, question_index)
);

CREATE TABLE autosave_history (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    response_text TEXT NOT NULL,
    saved_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE paste_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    char_count    INT NOT NULL,
    occurred_at   TIMESTAMPTZ NOT NULL
);

CREATE TABLE focus_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES sessions(id),
    lost_at     TIMESTAMPTZ NOT NULL,
    regained_at TIMESTAMPTZ,
    duration_ms INT
);

CREATE TABLE edit_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id),
    event_type    TEXT NOT NULL CHECK (event_type IN ('insert', 'delete')),
    position      INT NOT NULL,
    char_count    INT NOT NULL,
    occurred_at   TIMESTAMPTZ NOT NULL
);
