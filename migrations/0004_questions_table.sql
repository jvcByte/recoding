-- Migration 0004: move questions from filesystem to database

CREATE TABLE questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id    UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    question_index INT NOT NULL,
    text           TEXT NOT NULL,
    type           TEXT NOT NULL DEFAULT 'written' CHECK (type IN ('written', 'code')),
    language       TEXT NOT NULL DEFAULT 'text',
    starter        TEXT NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (exercise_id, question_index)
);

CREATE INDEX questions_exercise_idx ON questions (exercise_id, question_index);
