// Supabase Edge Function: pomodoro-alert-debug
// Allows manual triggering of Pomodoro heads-up or final notifications for testing purposes.
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

function normalizeSession(job: Record<string, unknown>, transition: { oldState: string; newState: string }) {
  const base: Record<string, unknown> = {
    id: typeof job.session_id === "string" && job.session_id ? job.session_id : crypto.randomUUID(),
    startAt: job.session_start_at ?? undefined,
    endAt: job.session_end_at ?? undefined,
    headsUpSeconds: job.heads_up_offset_seconds ?? 60,
    oldState: transition.oldState,
    newState: transition.newState
  };

  const payload = typeof job.payload === "object" && job.payload !== null ? job.payload as Record<string, unknown> : {};
  if (payload.session && typeof payload.session === "object") {
    Object.assign(base, payload.session as Record<string, unknown>);
  }

  if (!base.endAt && typeof job.session_end_at === "string") {
    base.endAt = job.session_end_at;
  }

  if (typeof base.endTimestamp !== "number") {
    const parsed = base.endAt ? Date.parse(String(base.endAt)) : NaN;
    const fallback = Date.now();
    base.endTimestamp = Number.isNaN(parsed) ? fallback : parsed;
    base.endAt = new Date(base.endTimestamp as number).toISOString();
  }

  return base;
}

function extractTransition(job: Record<string, unknown>) {
  const payload = typeof job.payload === "object" && job.payload !== null ? job.payload as Record<string, unknown> : {};
  const transition = typeof payload.transition === "object" && payload.transition !== null
    ? payload.transition as Record<string, unknown>
    : {};
  const oldState = String(transition.oldState ?? payload.oldState ?? "work");
  const newState = String(transition.newState ?? payload.newState ?? "break");
  return { oldState, newState };
}

function parseTemplate(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  if (typeof value !== "object" || value === null) {
    return { title: undefined, body: undefined, options: undefined };
  }
  const record = value as Record<string, unknown>;
  return {
    title: typeof record.title === "string" ? record.title : undefined,
    body: typeof record.body === "string" ? record.body : undefined,
    options: typeof record.options === "object" && record.options !== null ? record.options as Record<string, unknown> : undefined
  };
}

async function fetchJob(jobId: string) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured");
  }

  const { data, error } = await supabaseAdmin
    .from("pomodoro_notification_jobs")
    .select(`
      *,
      subscription:push_subscriptions!inner(id, endpoint, p256dh, auth)
    `)
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch job: ${error.message}`);
  }

  if (!data) {
    throw new Error("Job not found");
  }

  return data as Record<string, unknown>;
}

async function sendNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: unknown,
  topic: string
) {
  await webpush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 30,
    urgency: "high",
    topic
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    const modeRaw = typeof body.mode === "string" ? body.mode.trim().toLowerCase() : "both";
    const mode = ["heads_up", "final", "both"].includes(modeRaw) ? modeRaw : "both";

    if (!jobId) {
      return new Response(JSON.stringify({ error: "Missing jobId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const job = await fetchJob(jobId);
    const subscription = job.subscription as Record<string, unknown> | undefined;
    if (!subscription) {
      throw new Error("Job is missing an active subscription");
    }

    const transition = extractTransition(job);
    const session = normalizeSession(job, transition);
    const topic = `session_${String(session.id)}`;
    const payloadRecord = typeof job.payload === "object" && job.payload !== null ? job.payload as Record<string, unknown> : {};
    const headsUpTemplate = parseTemplate(payloadRecord, "headsUp");
    const finalTemplate = parseTemplate(payloadRecord, "final");

    const subscriptionPayload = {
      endpoint: String(subscription.endpoint),
      keys: {
        p256dh: String(subscription.p256dh),
        auth: String(subscription.auth)
      }
    };

    const responses: Array<{ type: string; status: "sent" | "skipped" | "error"; message?: string }> = [];

    if (mode === "both" || mode === "heads_up") {
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
        await sendNotification(subscriptionPayload, payload, topic);
        responses.push({ type: "heads_up", status: "sent" });
      } catch (error) {
        responses.push({ type: "heads_up", status: "error", message: error instanceof Error ? error.message : String(error) });
      }
    } else {
      responses.push({ type: "heads_up", status: "skipped" });
    }

    if (mode === "both" || mode === "final") {
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
        await sendNotification(subscriptionPayload, payload, topic);
        responses.push({ type: "final", status: "sent" });
      } catch (error) {
        responses.push({ type: "final", status: "error", message: error instanceof Error ? error.message : String(error) });
      }
    } else {
      responses.push({ type: "final", status: "skipped" });
    }

    return new Response(JSON.stringify({
      jobId,
      session,
      responses
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Debug sender error:", error);
    return new Response(JSON.stringify({ error: String(error instanceof Error ? error.message : error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
