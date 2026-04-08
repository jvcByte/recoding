import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { sql } from '@/lib/db';

const POLL_INTERVAL_MS = 3000;
const LOOKBACK_SECONDS = 10;

export async function GET(req: NextRequest) {
  // Authenticate via getToken (works with streaming responses)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (token.role !== 'instructor') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let since = new Date(Date.now() - LOOKBACK_SECONDS * 1000).toISOString();
      let closed = false;

      // Detect client disconnect via the request signal
      req.signal.addEventListener('abort', () => {
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      });

      const encode = (data: string) => new TextEncoder().encode(data);

      const poll = async () => {
        if (closed) return;

        try {
          const nextSince = new Date().toISOString();

          // Query paste events newer than `since`
          const pasteEvents = await sql`
            SELECT
              pe.id,
              pe.submission_id,
              pe.char_count,
              pe.occurred_at,
              s.session_id
            FROM paste_events pe
            JOIN submissions s ON s.id = pe.submission_id
            WHERE pe.occurred_at > ${since}
            ORDER BY pe.occurred_at ASC
          `;

          // Query focus events newer than `since`
          const focusEvents = await sql`
            SELECT
              id,
              session_id,
              lost_at,
              regained_at,
              duration_ms
            FROM focus_events
            WHERE lost_at > ${since}
            ORDER BY lost_at ASC
          `;

          // Query edit events (keystroke batches) newer than `since`
          const editEvents = await sql`
            SELECT
              ee.id,
              ee.submission_id,
              ee.event_type,
              ee.char_count,
              ee.occurred_at,
              s.session_id
            FROM edit_events ee
            JOIN submissions s ON s.id = ee.submission_id
            WHERE ee.occurred_at > ${since}
            ORDER BY ee.occurred_at ASC
          `;

          // Push paste events
          for (const event of pasteEvents) {
            if (closed) return;
            const payload = JSON.stringify({
              type: 'paste',
              submission_id: event.submission_id,
              session_id: event.session_id,
              char_count: event.char_count,
              occurred_at: event.occurred_at,
            });
            controller.enqueue(encode(`data: ${payload}\n\n`));
          }

          // Push focus events
          for (const event of focusEvents) {
            if (closed) return;
            const payload = JSON.stringify({
              type: 'focus',
              session_id: event.session_id,
              lost_at: event.lost_at,
              regained_at: event.regained_at ?? null,
              duration_ms: event.duration_ms ?? null,
              occurred_at: event.lost_at,
            });
            controller.enqueue(encode(`data: ${payload}\n\n`));
          }

          // Push keystroke batch events (grouped by submission_id)
          if (editEvents.length > 0) {
            // Group by submission_id to send one event per submission batch
            const bySubmission = new Map<string, typeof editEvents>();
            for (const ev of editEvents) {
              const key = ev.submission_id as string;
              if (!bySubmission.has(key)) bySubmission.set(key, []);
              bySubmission.get(key)!.push(ev);
            }

            for (const [submissionId, events] of bySubmission) {
              if (closed) return;
              const latest = events[events.length - 1];
              const payload = JSON.stringify({
                type: 'keystroke_batch',
                submission_id: submissionId,
                session_id: latest.session_id,
                char_count: events.reduce((sum: number, e: { char_count: number }) => sum + e.char_count, 0),
                event_count: events.length,
                occurred_at: latest.occurred_at,
              });
              controller.enqueue(encode(`data: ${payload}\n\n`));
            }
          }

          // Advance the since cursor
          since = nextSince;

          // Push heartbeat to keep connection alive
          controller.enqueue(encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`));
        } catch (err) {
          // On DB error, push an error event but keep the stream alive
          if (!closed) {
            const payload = JSON.stringify({ type: 'error', message: 'Poll failed' });
            try {
              controller.enqueue(encode(`data: ${payload}\n\n`));
            } catch {
              // stream already closed
            }
          }
        }

        if (!closed) {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      };

      // Start polling
      await poll();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
