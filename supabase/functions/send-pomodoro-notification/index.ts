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

function normalizeType(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : undefined;
}

function isHeadsUpType(type?: string) {
  if (!type) return false;
  return type.includes("heads_up");
}

type TransitionResult = {
  recorded: boolean;
  session: unknown;
  profile: unknown;
};

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const payload = await req.json();
    const {
      userId,
      title,
      body,
      newState,
      oldState,
      options: incomingOptions,
      type
    } = (payload ?? {}) as Record<string, unknown>;
    const options = incomingOptions as Record<string, unknown> | undefined;
    if (
      typeof userId !== "string" ||
      typeof title !== "string" ||
      typeof body !== "string" ||
      typeof newState !== "string" ||
      typeof oldState !== "string" ||
      !userId.trim() ||
      !title.trim() ||
      !body.trim() ||
      !newState.trim() ||
      !oldState.trim()
    ) {
      return new Response(JSON.stringify({
        error: "Missing required parameters."
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const userIdStr = userId.trim();
    const titleStr = title.trim();
    const bodyStr = body.trim();
    const newStateStr = newState.trim();
    const oldStateStr = oldState.trim();

    if (!supabaseAdmin) {
      throw new Error("Supabase admin client is not configured");
    }

    const normalizedType = normalizeType(type) || normalizeType((options as any)?.data?.type);
    const headsUpNotification = isHeadsUpType(normalizedType);

    const { data: subscriptionRecord, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userIdStr)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      throw new Error(`Failed to fetch push subscription: ${subError.message}`);
    }

    let transition: TransitionResult = { recorded: false, session: null, profile: null };

    if (!headsUpNotification) {
      transition = await recordPomodoroTransition(supabaseAdmin, userIdStr, oldStateStr, newStateStr);
    }

    let notificationDelivered = false;
    let deliveryError: string | null = null;

    if (subscriptionRecord && subscriptionRecord.endpoint) {
      const subscription = {
        endpoint: subscriptionRecord.endpoint,
        keys: {
          p256dh: subscriptionRecord.p256dh,
          auth: subscriptionRecord.auth
        }
      };

      try {
        const enrichedOptions = buildNotificationOptions(
          options as Record<string, any> | undefined,
          { oldState: oldStateStr, newState: newStateStr },
          headsUpNotification
        );
        await webpush.sendNotification(
          subscription,
          JSON.stringify({ title: titleStr, body: bodyStr, options: enrichedOptions }),
          {
            TTL: headsUpNotification ? 30 : 300,
            urgency: "high"
          }
        );
        notificationDelivered = true;
      } catch (pushError: any) {
        deliveryError = pushError instanceof Error ? pushError.message : String(pushError);
        console.error("Failed to send push notification:", pushError);

        if (pushError?.statusCode === 410) {
          console.log(`Subscription expired for endpoint: ${pushError.endpoint}. Deleting from database.`);
          try {
            const { error: deleteError } = await supabaseAdmin
              .from("push_subscriptions")
              .delete()
              .eq("id", subscriptionRecord.id);
            if (deleteError) {
              console.error("Failed to delete expired subscription:", deleteError);
            } else {
              console.log("Successfully deleted expired subscription.");
            }
          } catch (dbError) {
            console.error("An exception occurred while trying to delete expired subscription:", dbError);
          }
        }
      }
    } else {
      deliveryError = "No push subscription found for user.";
      console.warn(deliveryError);
    }

    const responseBody: Record<string, unknown> = {
      success: notificationDelivered,
      message: notificationDelivered ? "Notification sent." : "No push notification delivered.",
      delivered: notificationDelivered,
      recorded: transition.recorded,
      session: transition.session,
      profile: transition.profile,
      type: normalizedType ?? null,
      headsUp: headsUpNotification
    };

    if (deliveryError) {
      responseBody.error = deliveryError;
    }

    return new Response(JSON.stringify(responseBody), {
      status: notificationDelivered ? 200 : 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({
      error: String(error instanceof Error ? error.message : error)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function recordPomodoroTransition(supabase: any, userId: string, oldState: string, newState: string) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "pomodoro_settings, studying, total_study_seconds, total_time_today, total_break_seconds, total_break_time_today, last_study_day, current_streak, pomodoroCycle"
    )
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new Error(`Could not fetch profile: ${profileError.message}`);
  }

  const nowIso = new Date().toISOString();
  const settings = profile.pomodoro_settings || { work: 25, short_break: 5, long_break: 15 };
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
  const cappedDuration = sessionType === "break" ? Math.min(durationSeconds, MAX_BREAK_SECONDS) : durationSeconds;

  let recordedSession = null;

  if (cappedDuration > 0) {
    const subject = oldState === "work" ? studyingData?.subject || "Focus" : oldState.replace("_", " ");
    const payload = {
      profile_id: userId,
      subject,
      durationSeconds: cappedDuration,
      endedAt: nowIso,
      type: sessionType
    };

    const { data: insertedSession, error: insertError } = await supabase
      .from("sessions")
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error inserting session: ${insertError.message}`);
    }

    recordedSession = insertedSession;
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split("T")[0];

  const profileUpdate: Record<string, unknown> = {};

  if (recordedSession) {
    if (recordedSession.type === "study") {
      const lastStudyDay = profile.last_study_day || "";
      let currentStreak = profile.current_streak || 0;

      if (lastStudyDay !== todayStr) {
        currentStreak = lastStudyDay === yesterdayStr ? currentStreak + 1 : 1;
        profileUpdate.current_streak = currentStreak;
        profileUpdate.last_study_day = todayStr;
      }

      const currentDailyStudy = profile.total_time_today?.date === todayStr ? profile.total_time_today.seconds : 0;
      profileUpdate.total_study_seconds = (profile.total_study_seconds || 0) + recordedSession.durationSeconds;
      profileUpdate.total_time_today = {
        date: todayStr,
        seconds: currentDailyStudy + recordedSession.durationSeconds
      };
    } else {
      const currentDailyBreak = profile.total_break_time_today?.date === todayStr ? profile.total_break_time_today.seconds : 0;
      profileUpdate.total_break_seconds = (profile.total_break_seconds || 0) + recordedSession.durationSeconds;
      profileUpdate.total_break_time_today = {
        date: todayStr,
        seconds: currentDailyBreak + recordedSession.durationSeconds
      };
    }
  }

  profileUpdate.studying = buildStudyingStatus(newState, nowIso);

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId)
    .select(
      "total_study_seconds, total_break_seconds, total_time_today, total_break_time_today, current_streak, last_study_day, pomodoroCycle, studying"
    )
    .single();

  if (updateError) {
    throw new Error(`Error updating user status: ${updateError.message}`);
  }

  return {
    recorded: Boolean(recordedSession),
    session: recordedSession,
    profile: updatedProfile
  };
}

function buildStudyingStatus(state: string, startTimeIso: string) {
  if (state === "work") {
    return {
      type: "study",
      subject: "Focus",
      startTime: startTimeIso
    };
  }

  if (typeof state === "string" && state.includes("break")) {
    return {
      type: "break",
      subject: state.replace("_", " "),
      startTime: startTimeIso
    };
  }

  return null;
}

function buildNotificationOptions(
  baseOptions: Record<string, any> | undefined,
  transition: { oldState: string; newState: string },
  isHeadsUp: boolean
) {
  const options = {
    ...(baseOptions ?? {})
  };

  options.tag = options.tag ?? (isHeadsUp ? "pomodoro-heads-up" : "pomodoro-transition");
  options.renotify = options.renotify ?? true;
  options.requireInteraction = options.requireInteraction ?? !isHeadsUp;
  options.vibrate = options.vibrate ?? DEFAULT_VIBRATION;
  options.icon = options.icon ?? DEFAULT_ICON;
  options.badge = options.badge ?? DEFAULT_BADGE;
  options.timestamp = options.timestamp ?? Date.now();

  const data = typeof options.data === "object" && options.data !== null ? { ...options.data } : {};
  data.transition = {
    oldState: transition.oldState,
    newState: transition.newState
  };
  data.type = data.type ?? (isHeadsUp ? "HEADS_UP" : "TIMER_ENDED");

  options.data = data;

  return options;
}
