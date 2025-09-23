// Supabase Edge Function: send-pomodoro-notification
// Handles Pomodoro transitions and delivers web push notifications.
// Includes logic to automatically delete expired subscriptions.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push";

const allowedOrigins = new Set([
  "https://nobel92435.github.io",
  "https://nobel92435.github.io/FOCUS-NOBEL/",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173"
]);

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : "https://nobel92435.github.io";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400"
  };
}

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
const DEFAULT_HEADS_UP_TAG = "pomodoro-heads-up";
const DEFAULT_FINAL_TAG = "pomodoro-transition";

function normalizeType(value?: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : undefined;
}

function isHeadsUpType(type?: string) {
  if (!type) return false;
  return type.includes("heads_up");
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

function buildSessionMetadata(session: Record<string, unknown> | undefined, oldState: string, newState: string) {
  const now = Date.now();
  const base: Record<string, unknown> = {
    id: crypto.randomUUID(),
    oldState,
    newState,
    headsUpSeconds: 60,
    endTimestamp: now,
    endAt: new Date(now).toISOString()
  };

  if (session && typeof session === "object") {
    Object.assign(base, session);
  }

  if (typeof base.endTimestamp !== "number") {
    const parsed = base.endAt ? Date.parse(String(base.endAt)) : NaN;
    if (!Number.isNaN(parsed)) {
      base.endTimestamp = parsed;
    } else {
      base.endTimestamp = now;
      base.endAt = new Date(now).toISOString();
    }
  }

  if (typeof base.id !== "string" || !base.id) {
    base.id = crypto.randomUUID();
  }

  return base;
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

  options.tag = options.tag ?? (isHeadsUp ? DEFAULT_HEADS_UP_TAG : DEFAULT_FINAL_TAG);
  options.renotify = options.renotify ?? true;
  options.requireInteraction = options.requireInteraction ?? !isHeadsUp;
  options.vibrate = options.vibrate ?? DEFAULT_VIBRATION;
  options.icon = options.icon ?? DEFAULT_ICON;
  options.badge = options.badge ?? DEFAULT_BADGE;
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
  input: Record<string, unknown>,
  session: Record<string, unknown>,
  options: Record<string, unknown>,
  isHeadsUp: boolean
) {
  const payload = {
    title: String(input.title ?? "FocusFlow"),
    body: String(input.body ?? ""),
    options,
    session,
    oldState: String(input.oldState ?? ""),
    newState: String(input.newState ?? ""),
    type: isHeadsUp ? "pomodoro_heads_up" : "pomodoro_final"
  };

  return payload;
}

async function fetchLatestSubscription(userId: string) {
  if (!supabaseAdmin) throw new Error("Supabase admin client is not configured");
  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch push subscription: ${error.message}`);
  }

  return data;
}

function buildTopic(session: Record<string, unknown>) {
  const sessionId = typeof session.id === "string" && session.id.trim() !== "" ? session.id.trim() : crypto.randomUUID();
  return {
    topic: `session_${sessionId}`,
    sessionId
  };
}

function normalizePayload(input: Record<string, unknown>) {
  const userId = typeof input.userId === "string" ? input.userId.trim() : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const newState = typeof input.newState === "string" ? input.newState.trim() : "";
  const oldState = typeof input.oldState === "string" ? input.oldState.trim() : "";

  if (!userId || !title || !body || !newState || !oldState) {
    throw new Error("Missing required parameters.");
  }

  return {
    userId,
    title,
    body,
    newState,
    oldState,
    appId: typeof input.appId === "string" ? input.appId.trim() : undefined,
    type: normalizeType(input.type),
    options: typeof input.options === "object" && input.options !== null ? input.options as Record<string, unknown> : undefined,
    session: typeof input.session === "object" && input.session !== null ? input.session as Record<string, unknown> : undefined
  };
}

async function handleExpiredSubscription(id: string | null | undefined) {
  if (!id || !supabaseAdmin) return;
  try {
    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Failed to delete expired subscription:", error);
    } else {
      console.log("Successfully deleted expired subscription.");
    }
  } catch (err) {
    console.error("An exception occurred while trying to delete expired subscription:", err);
  }
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const payload = await req.json();
    const normalized = normalizePayload(payload ?? {});
    const headsUpNotification = isHeadsUpType(normalized.type);
    const sessionMeta = buildSessionMetadata(normalized.session, normalized.oldState, normalized.newState);
    const options = buildNotificationOptions(normalized.options, {
      oldState: normalized.oldState,
      newState: normalized.newState
    }, sessionMeta, headsUpNotification);
    const finalPayload = buildNotificationPayload(normalized, sessionMeta, options, headsUpNotification);

    if (!supabaseAdmin) {
      throw new Error("Supabase admin client is not configured");
    }

    const subscriptionRecord = await fetchLatestSubscription(normalized.userId);
    if (!subscriptionRecord || !subscriptionRecord.endpoint) {
      return new Response(JSON.stringify({
        success: false,
        delivered: false,
        error: "No push subscription found for user.",
        headsUp: headsUpNotification,
        type: normalized.type ?? null
      }), {
        status: 202,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const subscription = {
      endpoint: subscriptionRecord.endpoint,
      keys: {
        p256dh: subscriptionRecord.p256dh,
        auth: subscriptionRecord.auth
      }
    };

    const { topic, sessionId } = buildTopic(sessionMeta);

    try {
      await webpush.sendNotification(subscription, JSON.stringify(finalPayload), {
        TTL: 30,
        urgency: "high",
        headers: {
          Topic: topic
        }
      });
    } catch (pushError) {
      console.error("Failed to send push notification:", pushError);
      if (pushError && typeof pushError === "object" && "statusCode" in pushError && pushError.statusCode === 410) {
        console.log(`Subscription expired for endpoint: ${subscriptionRecord.endpoint}. Deleting from database.`);
        await handleExpiredSubscription(subscriptionRecord.id);
      }
      const message = pushError instanceof Error ? pushError.message : String(pushError);
      return new Response(JSON.stringify({
        success: false,
        delivered: false,
        error: message,
        headsUp: headsUpNotification,
        type: normalized.type ?? null
      }), {
        status: 202,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      delivered: true,
      recorded: false,
      sessionId,
      session: sessionMeta,
      headsUp: headsUpNotification,
      type: normalized.type ?? null
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({
      error: String(error instanceof Error ? error.message : error)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
