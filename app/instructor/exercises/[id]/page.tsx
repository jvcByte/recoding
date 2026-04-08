import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import ExerciseManager from './ExerciseManager';

interface Props {
  params: { id: string };
}

export default async function ExercisePage({ params }: Props) {
  const { id } = params;

  // Fetch exercise with assigned user IDs
  const exerciseRows = await sql`
    SELECT e.id, e.slug, e.title, e.enabled, e.question_count,
           COALESCE(
             json_agg(ea.user_id) FILTER (WHERE ea.user_id IS NOT NULL),
             '[]'
           ) AS assigned_user_ids
    FROM exercises e
    LEFT JOIN exercise_assignments ea ON ea.exercise_id = e.id
    WHERE e.id = ${id}
    GROUP BY e.id, e.slug, e.title, e.enabled, e.question_count
  `;

  if (exerciseRows.length === 0) notFound();

  const exercise = exerciseRows[0] as {
    id: string;
    slug: string;
    title: string;
    enabled: boolean;
    question_count: number;
    assigned_user_ids: string[];
  };

  // Fetch sessions for this exercise
  const sessionRows = await sql`
    SELECT id, start_time, end_time, duration_limit, started_at
    FROM sessions
    WHERE exercise_id = ${id}
    ORDER BY started_at ASC NULLS FIRST
  `;

  // Fetch assigned users with usernames
  const assignedUserIds: string[] = exercise.assigned_user_ids;
  const assignedUsers =
    assignedUserIds.length > 0
      ? await sql`
          SELECT id, username FROM users WHERE id = ANY(${assignedUserIds}::uuid[])
        `
      : [];

  return (
    <ExerciseManager
      exercise={exercise}
      sessions={sessionRows as { id: string; start_time: string | null; end_time: string | null; duration_limit: string | null; started_at: string | null }[]}
      assignedUsers={assignedUsers as { id: string; username: string }[]}
    />
  );
}
