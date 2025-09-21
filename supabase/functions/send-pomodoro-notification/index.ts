// Supabase Edge Function: send-pomodoro-notification
// Handles Pomodoro phase transitions by recording sessions, updating profile state,
// and dispatching web push notifications when a subscription is available.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { ApplicationServer, PushSubscriber } from "jsr:@negrel/webpush@0.3";

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

const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
const appServer = await ApplicationServer.new({
  contactInformation: "mailto:nobelft26@gmail.com",
  vapidKeys: {
    publicKey: VAPID_PUBLIC_KEY!,
    privateKey: VAPID_PRIVATE_KEY!,
  },
});

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders,
      });
    }

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

    const raw = profile?.push_subscription;
    if (raw) {
      try {
        const subscription = typeof raw === "string" ? JSON.parse(raw) : raw;
        const sub = PushSubscriber.fromJSON(subscription);
        await sub.pushTextMessage(
          appServer,
          JSON.stringify({ title, body }),
        );
      } catch (pushError) {
        console.error("Failed to send push notification:", pushError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: String(error?.message ?? error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function handlePhaseEndOnServer(
  supabase: ReturnType<typeof createClient>,
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
  supabase: ReturnType<typeof createClient>,
  userId: string,
  newState: string,
) {
  const startTime = new Date().toISOString();
  let newStudyingStatus = null;

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
