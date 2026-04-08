import { sql } from './db';

/**
 * Appends a row to the audit_log table.
 * Fire-and-forget safe — errors are logged but never thrown to the caller.
 */
export async function audit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  detail?: Record<string, unknown>
): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_log (actor_id, action, target_type, target_id, detail)
      VALUES (
        ${actorId},
        ${action},
        ${targetType},
        ${targetId},
        ${detail ? JSON.stringify(detail) : null}
      )
    `;
  } catch (err) {
    console.error('[audit] Failed to write audit log:', (err as Error).message);
  }
}
