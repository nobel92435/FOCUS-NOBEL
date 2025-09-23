// Supabase Edge Function: pomodoro-alert-scheduler
// Invoked via cron (every minute) to deliver scheduled Pomodoro heads-up and final push notifications.
// Uses web-push with high urgency hints and per-session collapse keys.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error("Missing VAPID keys");
}

webpush.setVapidDetails("mailto:nobelft26@gmail.com", VAPID_PUBLIC_KEY ?? "", VAPID_PRIVATE_KEY ?? "");

const supabaseAdmin = SUPABASE_URL && SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null;

const DEFAULT_ICON = "https://placehold.co/192x192/0a0a0a/e0e0e0?text=Flow+192";
const DEFAULT_BADGE = "https://placehold.co/96x96/0a0a0a/e0e0e0?text=Flow";
const DEFAULT_VIBRATION = [200, 100, 200, 100, 200];
const HEADS_UP_TAG = "pomodoro-heads-up";
const FINAL_TAG = "pomodoro-transition";

interface SchedulerJob {
  id: string;
  user_id: string;
  subscription_id: string;
  session_id?: string | null;
  session_start_at?: string | null;
  session_end_at?: string | null;
  heads_up_offset_seconds?: number | null;
  heads_up_sent: boolean;
  final_sent: boolean;
  payload: Record<string, unknown> | null;
  send_at?: string | null;
  client_group_id?: string | null;
  subscription?: {
    id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  } | null;
}

interface SchedulerResult {
  jobId: string;
  headsUpSent: boolean;
  finalSent: boolean;
  errors: string[];
}

function normalizeSession(job: SchedulerJob, transition: { oldState: string; newState: string }) {
  const base: Record<string, unknown> = {
    id: job.session_id || crypto.randomUUID(),
    startAt: job.session_start_at ?? undefined,
    endAt: job.session_end_at ?? undefined,
    headsUpSeconds: job.heads_up_offset_seconds ?? 60,
    oldState: transition.oldState,
    newState: transition.newState
  };

  const payloadSession = job.payload && typeof job.payload === "object" && "session" in job.payload
    ? (job.payload.session as Record<string, unknown>)
    : undefined;

  if (payloadSession) {
    Object.assign(base, payloadSession);
  }

  if (!base.endAt && typeof job.session_end_at === "string") {
    base.endAt = job.session_end_at;
  }

  if (typeof base.endTimestamp !== "number") {
    const parsed = base.endAt ? Date.parse(String(base.endAt)) : NaN;
    if (!Number.isNaN(parsed)) {
      base.endTimestamp = parsed;
    } else {
      const now = Date.now();
      base.endTimestamp = now;
      base.endAt = new Date(now).toISOString();
    }
  }

  if (typeof base.id !== "string" || base.id.trim() === "") {
    base.id = crypto.randomUUID();
  }

  return base;
}

function ensureActions(options: Record<string, unknown>) {
  const actions = Array.isArray(options.actions) ? options.actions : [];
  if (actions.length === 0) {
    options.actions = [
      { action: "open", title: "Open" },
      { action: "snooze-5m", title: "Snooze 5m" }
    ];
  }
}

function buildNotificationOptions(
  baseOptions: Record<string, unknown> | undefined,
  transition: { oldState: string; newState: string },
  session: Record<string, unknown>,
  isHeadsUp: boolean
) {
  const options: Record<string, unknown> = {
    ...(baseOptions ?? {})
  };

  options.tag = options.tag ?? (isHeadsUp ? HEADS_UP_TAG : FINAL_TAG);
  options.renotify = options.renotify ?? true;
  options.requireInteraction = options.requireInteraction ?? !isHeadsUp;
  options.icon = options.icon ?? DEFAULT_ICON;
  options.badge = options.badge ?? DEFAULT_BADGE;
  options.vibrate = options.vibrate ?? DEFAULT_VIBRATION;
  options.timestamp = options.timestamp ?? Date.now();
  ensureActions(options);

  const data = typeof options.data === "object" && options.data !== null ? { ...options.data } : {};
  data.transition = {
    oldState: transition.oldState,
    newState: transition.newState
  };
  data.type = data.type ?? (isHeadsUp ? "HEADS_UP" : "TIMER_ENDED");
  data.session = {
    ...(typeof data.session === "object" && data.session !== null ? data.session : {}),
    ...session
  };
  options.data = data;

  return options;
}

function buildNotificationPayload(
  title: string,
  body: string,
  options: Record<string, unknown>,
  session: Record<string, unknown>,
  transition: { oldState: string; newState: string },
  type: "pomodoro_heads_up" | "pomodoro_final"
) {
  return {
    title,
    body,
    options,
    session,
    oldState: transition.oldState,
    newState: transition.newState,
    type
  };
}

function extractTransition(job: SchedulerJob) {
  const payload = job.payload || {};
  const fromPayload = typeof payload.transition === "object" && payload.transition !== null
    ? payload.transition as Record<string, unknown>
    : {};

  const fromHeadsUp = typeof payload.headsUp === "object" && payload.headsUp !== null
    ? (payload.headsUp as Record<string, unknown>).transition as Record<string, unknown> | undefined
    : undefined;

  const oldState = String(
    fromHeadsUp?.oldState ||
    fromPayload.oldState ||
    (payload.oldState as string | undefined) ||
    "work"
  );
  const newState = String(
    fromHeadsUp?.newState ||
    fromPayload.newState ||
    (payload.newState as string | undefined) ||
    "break"
  );

  return { oldState, newState };
}

function buildTopic(session: Record<string, unknown>) {
  const sessionId = typeof session.id === "string" && session.id.trim() !== ""
    ? session.id.trim()
    : crypto.randomUUID();
  return {
    topic: `session_${sessionId}`,
    sessionId
  };
}

function parseNotificationTemplate(template: unknown) {
  if (typeof template !== "object" || template === null) {
    return { title: undefined, body: undefined, options: undefined };
  }
  const record = template as Record<string, unknown>;
  return {
    title: typeof record.title === "string" ? record.title : undefined,
    body: typeof record.body === "string" ? record.body : undefined,
    options: typeof record.options === "object" && record.options !== null
      ? record.options as Record<string, unknown>
      : undefined
  };
}

async function markJob(jobId: string, updates: Record<string, unknown>) {
  if (!supabaseAdmin) return;
  try {
    const { error } = await supabaseAdmin
      .from("pomodoro_notification_jobs")
      .update(updates)
      .eq("id", jobId);
    if (error) {
      console.error("Failed to update pomodoro_notification_jobs:", error);
    }
  } catch (error) {
    console.error("Exception while updating pomodoro_notification_jobs:", error);
  }
}

async function deleteJob(jobId: string) {
  if (!supabaseAdmin) return;
  try {
    const { error } = await supabaseAdmin
      .from("pomodoro_notification_jobs")
      .delete()
      .eq("id", jobId);
    if (error) {
      console.error("Failed to delete completed job:", error);
    }
  } catch (error) {
    console.error("Exception while deleting job:", error);
  }
}

async function removeSubscription(subscriptionId: string) {
  if (!supabaseAdmin) return;
  try {
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("id", subscriptionId);
    if (error) {
      console.error("Failed to delete push subscription:", error);
    }
  } catch (error) {
    console.error("Exception while deleting push subscription:", error);
  }
}

async function fetchDueJobs(nowIso: string) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured");
  }

  const { data, error } = await supabaseAdmin
    .from("pomodoro_notification_jobs")
    .select(`
      id,
      user_id,
      subscription_id,
      session_id,
      session_start_at,
      session_end_at,
      heads_up_offset_seconds,
      heads_up_sent,
      final_sent,
      payload,
      send_at,
      client_group_id,
      subscription:push_subscriptions!inner(id, endpoint, p256dh, auth)
    `)
    .or(
      `and(heads_up_sent.eq.false,send_at.lte.${nowIso}),and(final_sent.eq.false,session_end_at.lte.${nowIso})`
    )
    .order("session_end_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch scheduled jobs: ${error.message}`);
  }

  return (data ?? []) as SchedulerJob[];
}

async function sendNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: unknown,
  topic: string
) {
  await webpush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 30,
    urgency: "high",
    headers: {
      Topic: topic
    }
  });
}

Deno.serve(async (req) => {
  const now = new Date();
  const nowIso = now.toISOString();
  const results: SchedulerResult[] = [];

  try {
    const jobs = await fetchDueJobs(nowIso);

    for (const job of jobs) {
      const errors: string[] = [];
      const transition = extractTransition(job);
      const session = normalizeSession(job, transition);
      const { topic } = buildTopic(session);
      const subscriptionRecord = job.subscription;
      if (!subscriptionRecord) {
        errors.push("Missing subscription");
        continue;
      }

      const subscription = {
        endpoint: subscriptionRecord.endpoint,
        keys: {
          p256dh: subscriptionRecord.p256dh,
          auth: subscriptionRecord.auth
        }
      };

      const payloadRecord = job.payload || {};
      const headsUpTemplate = parseNotificationTemplate(payloadRecord.headsUp);
      const finalTemplate = parseNotificationTemplate(payloadRecord.final);

      const nowMs = now.getTime();
      const sendAtMs = job.send_at ? Date.parse(job.send_at) : NaN;
      const sessionEndMs = session.endTimestamp as number;

      let headsUpSent = job.heads_up_sent;
      let finalSent = job.final_sent;

      if (!headsUpSent && Number.isFinite(sendAtMs) && sendAtMs <= nowMs) {
        const options = buildNotificationOptions(headsUpTemplate.options, transition, session, true);
        const payload = buildNotificationPayload(
          headsUpTemplate.title || "Break is starting soon",
          headsUpTemplate.body || "Your session is ending shortly.",
          options,
          session,
          transition,
          "pomodoro_heads_up"
        );

        try {
          await sendNotification(subscription, payload, topic);
          headsUpSent = true;
        } catch (error) {
          console.error("Failed to deliver heads-up notification:", error);
          errors.push(error instanceof Error ? error.message : String(error));
          if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 410) {
            await removeSubscription(subscriptionRecord.id);
            headsUpSent = true;
            finalSent = true;
          }
        }
      }

      if (!finalSent && Number.isFinite(sessionEndMs) && sessionEndMs <= nowMs) {
        const options = buildNotificationOptions(finalTemplate.options, transition, session, false);
        const payload = buildNotificationPayload(
          finalTemplate.title || (transition.newState.includes("break") ? "Break time" : "Focus time!"),
          finalTemplate.body || (transition.newState.includes("break")
            ? "Enjoy your break."
            : "Break is over. Let's focus."),
          options,
          session,
          transition,
          "pomodoro_final"
        );

        try {
          await sendNotification(subscription, payload, topic);
          finalSent = true;
        } catch (error) {
          console.error("Failed to deliver final notification:", error);
          errors.push(error instanceof Error ? error.message : String(error));
          if (error && typeof error === "object" && "statusCode" in error && error.statusCode === 410) {
            await removeSubscription(subscriptionRecord.id);
            headsUpSent = true;
            finalSent = true;
          }
        }
      }

      const update: Record<string, unknown> = {};
      if (headsUpSent !== job.heads_up_sent) {
        update.heads_up_sent = headsUpSent;
      }
      if (finalSent !== job.final_sent) {
        update.final_sent = finalSent;
      }

      if (Object.keys(update).length > 0) {
        await markJob(job.id, update);
      }

      if (headsUpSent && finalSent) {
        const endMs = Number(session.endTimestamp);
        if (Number.isFinite(endMs) && endMs + 15 * 60 * 1000 < nowMs) {
          await deleteJob(job.id);
        }
      }

      results.push({
        jobId: job.id,
        headsUpSent,
        finalSent,
        errors
      });
    }

    return new Response(JSON.stringify({
      processed: results.length,
      results,
      timestamp: nowIso
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Scheduler error:", error);
    return new Response(JSON.stringify({
      error: String(error instanceof Error ? error.message : error),
      timestamp: nowIso
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
