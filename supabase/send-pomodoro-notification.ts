// Supabase Edge Function: send-pomodoro-notification
// Handles Pomodoro transitions and delivers web push notifications using the
// standard `web-push` npm package so the PushSubscriber helper is not required.

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push";

const allowedOrigins = new Set([
  "https://nobel92435.github.io",
  "https://nobel92435.github.io/FOCUS-NOBEL/",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
]);

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin");
  const allowOrigin = origin && allowedOrigins.has(origin)
    ? origin
    : "https://nobel92435.github.io";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
  } satisfies Record<string, string>;
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

webpush.setVapidDetails(
  "mailto:nobelft26@gmail.com",
  VAPID_PUBLIC_KEY ?? "",
  VAPID_PRIVATE_KEY ?? "",
);

const supabaseAdmin = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  : null;

const DEFAULT_ICON =
  "https://placehold.co/192x192/0a0a0a/e0e0e0?text=Flow+192";
const DEFAULT_BADGE =
  "https://placehold.co/96x96/0a0a0a/e0e0e0?text=Flow";
const DEFAULT_VIBRATION = [200, 100, 200, 100, 200];

Deno.serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { userId, title, body, newState, oldState, options } =
      await req.json();

    if (!userId || !title || !body || !newState || !oldState) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!supabaseAdmin) {
      throw new Error("Supabase admin client is not configured");
    }

    const transition = await recordPomodoroTransition(
      supabaseAdmin,
      userId,
      oldState,
      newState,
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("push_subscription")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw new Error(`Profile fetch failed: ${profileError.message}`);
    }

    const subscription = normalizeSubscription(profile?.push_subscription);

    let notificationDelivered = false;
    let deliveryError: string | null = null;

    if (subscription) {
      try {
        const enrichedOptions = buildNotificationOptions(options, {
          oldState,
          newState,
        });
        await webpush.sendNotification(
          subscription,
          JSON.stringify({ title, body, options: enrichedOptions }),
          { TTL: 300, urgency: "high" },
        );
        notificationDelivered = true;
      } catch (pushError) {
        deliveryError = pushError instanceof Error
          ? pushError.message
          : String(pushError);
        console.error("Failed to send push notification:", pushError);
      }
    } else {
      deliveryError = "No push subscription found for user.";
      console.warn(deliveryError);
    }

    const responseBody: Record<string, unknown> = {
      success: notificationDelivered,
      message: notificationDelivered
        ? "Notification sent."
        : "No push notification delivered.",
      delivered: notificationDelivered,
      recorded: transition.recorded,
      session: transition.session,
      profile: transition.profile,
    };

    if (deliveryError) {
      responseBody.error = deliveryError;
    }

    return new Response(JSON.stringify(responseBody), {
      status: notificationDelivered ? 200 : 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({
      error: String(error instanceof Error ? error.message : error),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

type SupabaseAdmin = ReturnType<typeof createClient>;

type PomodoroState = "work" | "short_break" | "long_break" | string;

interface SessionRecord {
  profile_id: string;
  subject: string;
  durationSeconds: number;
  endedAt: string;
  type: "study" | "break";
  id?: string;
  [key: string]: unknown;
}

interface ProfileSnapshot {
  total_study_seconds?: number | null;
  total_break_seconds?: number | null;
  total_time_today?: { date: string; seconds: number } | null;
  total_break_time_today?: { date: string; seconds: number } | null;
  current_streak?: number | null;
  pomodoroCycle?: number | null;
  studying?: Record<string, unknown> | null;
}

function normalizeSubscription(raw: unknown) {
  if (!raw) return null;

  let parsed: any = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      console.warn("Failed to parse stored push subscription", error);
      return null;
    }
  }

  if (!parsed || typeof parsed !== "object") return null;

  const endpoint = typeof parsed.endpoint === "string"
    ? parsed.endpoint
    : null;
  if (!endpoint) return null;

  const expirationTime = parsed.expirationTime ?? null;

  const extractKey = (value: unknown) => {
    if (!value) return null;
    if (typeof value === "string") {
      return value.trim() || null;
    }
    if (typeof value === "object" && typeof (value as any).data === "string") {
      return (value as any).data.trim() || null;
    }
    return null;
  };

  const auth = extractKey(parsed.keys?.auth);
  const p256dh = extractKey(parsed.keys?.p256dh);

  if (!auth || !p256dh) return null;

  return {
    endpoint,
    expirationTime,
    keys: {
      auth,
      p256dh,
    },
  };
}

async function recordPomodoroTransition(
  supabase: SupabaseAdmin,
  userId: string,
  oldState: PomodoroState,
  newState: PomodoroState,
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "pomodoro_settings, studying, total_study_seconds, total_time_today, total_break_seconds, total_break_time_today, last_study_day, current_streak, pomodoroCycle",
    )
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new Error(`Could not fetch profile: ${profileError.message}`);
  }

  const nowIso = new Date().toISOString();
  const settings = profile.pomodoro_settings || {
    work: 25,
    short_break: 5,
    long_break: 15,
  };

  const studyingData = profile.studying;
  let durationSeconds = 0;

  if (oldState === "work") durationSeconds = settings.work * 60;
  else if (oldState === "short_break") {
    durationSeconds = settings.short_break * 60;
  } else if (oldState === "long_break") {
    durationSeconds = settings.long_break * 60;
  }

  const MAX_BREAK_SECONDS = 3 * 3600;
  const sessionType = oldState === "work" ? "study" : "break";
  const cappedDuration = sessionType === "break"
    ? Math.min(durationSeconds, MAX_BREAK_SECONDS)
    : durationSeconds;

  let recordedSession: SessionRecord | null = null;

  if (cappedDuration > 0) {
    const subject = oldState === "work"
      ? studyingData?.subject || "Focus"
      : oldState.replace("_", " ");

    const payload: SessionRecord = {
      profile_id: userId,
      subject,
      durationSeconds: cappedDuration,
      endedAt: nowIso,
      type: sessionType,
    };

    const { data: insertedSession, error: insertError } = await supabase
      .from("sessions")
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error inserting session: ${insertError.message}`);
    }

    recordedSession = insertedSession as SessionRecord;
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = new Date(today.getTime() - 86400000)
    .toISOString()
    .split("T")[0];

  const profileUpdate: Record<string, unknown> = {};

  if (recordedSession) {
    if (recordedSession.type === "study") {
      const lastStudyDay: string = profile.last_study_day || "";
      let currentStreak: number = profile.current_streak || 0;
      if (lastStudyDay !== todayStr) {
        currentStreak = lastStudyDay === yesterdayStr ? currentStreak + 1 : 1;
        profileUpdate.current_streak = currentStreak;
        profileUpdate.last_study_day = todayStr;
      }

      const currentDailyStudy = profile.total_time_today?.date === todayStr
        ? profile.total_time_today.seconds
        : 0;

      profileUpdate.total_study_seconds =
        (profile.total_study_seconds || 0) + recordedSession.durationSeconds;
      profileUpdate.total_time_today = {
        date: todayStr,
        seconds: currentDailyStudy + recordedSession.durationSeconds,
      };
    } else {
      const currentDailyBreak =
        profile.total_break_time_today?.date === todayStr
          ? profile.total_break_time_today.seconds
          : 0;

      profileUpdate.total_break_seconds =
        (profile.total_break_seconds || 0) + recordedSession.durationSeconds;
      profileUpdate.total_break_time_today = {
        date: todayStr,
        seconds: currentDailyBreak + recordedSession.durationSeconds,
      };
    }
  }

  profileUpdate.studying = buildStudyingStatus(newState, nowIso);

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId)
    .select(
      "total_study_seconds, total_break_seconds, total_time_today, total_break_time_today, current_streak, last_study_day, pomodoroCycle, studying",
    )
    .single();

  if (updateError) {
    throw new Error(`Error updating user status: ${updateError.message}`);
  }

  return {
    recorded: Boolean(recordedSession),
    session: recordedSession,
    profile: updatedProfile as ProfileSnapshot,
  };
}

function buildStudyingStatus(state: PomodoroState, startTimeIso: string) {
  if (state === "work") {
    return {
      type: "study",
      subject: "Focus",
      startTime: startTimeIso,
    };
  }

  if (typeof state === "string" && state.includes("break")) {
    return {
      type: "break",
      subject: state.replace("_", " "),
      startTime: startTimeIso,
    };
  }

  return null;
}

function buildNotificationOptions(
  baseOptions: Record<string, unknown> | undefined,
  transition: { oldState: PomodoroState; newState: PomodoroState },
) {
  const options = { ...(baseOptions ?? {}) } as Record<string, unknown>;

  options.tag = options.tag ?? "pomodoro-transition";
  options.renotify = options.renotify ?? true;
  options.requireInteraction = options.requireInteraction ?? true;
  options.vibrate = options.vibrate ?? DEFAULT_VIBRATION;
  options.icon = options.icon ?? DEFAULT_ICON;
  options.badge = options.badge ?? DEFAULT_BADGE;
  options.timestamp = options.timestamp ?? Date.now();

  const data = typeof options.data === "object" && options.data !== null
    ? { ...(options.data as Record<string, unknown>) }
    : {};

  data.transition = {
    oldState: transition.oldState,
    newState: transition.newState,
  };

  options.data = data;

  return options;
}

