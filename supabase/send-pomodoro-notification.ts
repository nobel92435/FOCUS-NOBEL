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
    const { userId, title, body, newState, oldState } = await req.json();

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

    await handlePhaseEndOnServer(supabaseAdmin, userId, oldState);
    await updateUserStatusForNewPhase(supabaseAdmin, userId, newState);

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
        await webpush.sendNotification(
          subscription,
          JSON.stringify({ title, body }),
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

async function handlePhaseEndOnServer(
  supabase: SupabaseAdmin,
  userId: string,
  oldState: string,
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("pomodoro_settings, studying")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new Error(`Could not fetch profile: ${profileError.message}`);
  }

  const settings = profile.pomodoro_settings || {
    work: 25,
    short_break: 5,
    long_break: 15,
  };

  const studyingData = profile.studying;
  let durationSeconds = 0;

  if (oldState === "work") durationSeconds = settings.work * 60;
  else if (oldState === "short_break") durationSeconds = settings.short_break * 60;
  else if (oldState === "long_break") durationSeconds = settings.long_break * 60;

  if (durationSeconds > 0) {
    const sessionType = oldState === "work" ? "study" : "break";
    const subject = oldState === "work"
      ? studyingData?.subject || "Focus"
      : oldState.replace("_", " ");

    const { error: insertError } = await supabase.from("sessions").insert({
      profile_id: userId,
      subject,
      duration_seconds: durationSeconds,
      ended_at: new Date().toISOString(),
      type: sessionType,
    });

    if (insertError) {
      console.error("Error inserting session:", insertError.message);
    }
  }
}

async function updateUserStatusForNewPhase(
  supabase: SupabaseAdmin,
  userId: string,
  newState: string,
) {
  const startTime = new Date().toISOString();
  let newStudyingStatus: Record<string, unknown> | null = null;

  if (newState === "work") {
    newStudyingStatus = {
      type: "study",
      subject: "Focus",
      startTime,
    };
  } else if (newState.includes("break")) {
    newStudyingStatus = {
      type: "break",
      subject: newState.replace("_", " "),
      startTime,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ studying: newStudyingStatus })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user status:", error.message);
  }
}

