// Supabase Edge Function: send-wake-up-notification
// Sends an urgent wake-up push notification to all of a user's known devices.

console.log("Supabase function 'send-wake-up-notification' is initializing...");

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SupabaseAdmin = ReturnType<typeof createClient>;
type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type SendResult = {
  id: string;
  endpoint: string;
  delivered: boolean;
  statusCode?: number;
  removed?: boolean;
  error?: string;
};

async function fetchSubscriptionsForUser(
  supabaseAdmin: SupabaseAdmin,
  userId: string,
): Promise<PushSubscriptionRow[]> {
  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function deleteSubscription(
  supabaseAdmin: SupabaseAdmin,
  id: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("id", id);

  if (error) {
    console.warn("Failed to delete expired subscription", { id, error });
  }
}

function buildWakePayload(input: { senderName?: string; appId?: string | null }) {
  const senderName = (input.senderName || "A fellow student").trim();
  const title = "Wake Up Call! Wake Up Call!";
  const body = `${senderName} is calling you to get back in focus!`;

  return {
    title,
    body,
    options: {
      body,
      icon: "https://nobel92435.github.io/Focus-Clock/images/icons/icon-192x192.png",
      badge: "https://nobel92435.github.io/Focus-Clock/images/icons/icon-96x96.png",
      vibrate: [200, 100, 200, 100, 200],
      tag: "wake-up-alert",
      renotify: true,
      requireInteraction: true,
      data: {
        type: "WAKE_UP_ALERT",
        appId: input.appId ?? null,
      },
      actions: [
        { action: "open", title: "Open App" },
        { action: "acknowledge", title: "I'm on it" },
      ],
    },
  };
}

async function sendWakeNotification(
  supabaseAdmin: SupabaseAdmin,
  subscription: PushSubscriptionRow,
  payload: unknown,
): Promise<SendResult> {
  const webPushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(
      webPushSubscription,
      JSON.stringify(payload),
      { TTL: 3600, urgency: "high" },
    );

    return {
      id: subscription.id,
      endpoint: subscription.endpoint,
      delivered: true,
    };
  } catch (pushError) {
    const statusCode = (pushError as { statusCode?: number }).statusCode;
    console.error("Failed to send wake-up notification", pushError);

    const isSubscriptionGone =
      statusCode === 410 ||
      statusCode === 404 ||
      statusCode === 403;

    if (isSubscriptionGone) {
      await deleteSubscription(supabaseAdmin, subscription.id);
    }

    return {
      id: subscription.id,
      endpoint: subscription.endpoint,
      delivered: false,
      statusCode,
      removed: isSubscriptionGone || undefined,
      error: pushError instanceof Error
        ? pushError.message
        : String(pushError),
    };
  }
}

serve(async (req) => {
  console.log(`Received request: ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    console.log("Responding to OPTIONS preflight request.");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error("CRITICAL: Missing one or more required environment variables.");
      throw new Error("Server configuration error: Missing required environment variables.");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    webpush.setVapidDetails(
      "mailto:nobelft26@gmail.com",
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY,
    );

    let payload: { targetUserId?: string; senderName?: string; appId?: string | null };

    try {
      console.log("Attempting to parse request body as JSON...");
      payload = await req.json();
      console.log("Successfully parsed JSON payload:", payload);
    } catch (jsonError) {
      console.error("CRITICAL: Failed to parse request body as JSON.", jsonError);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid JSON in request body." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { targetUserId, senderName, appId } = payload;

    if (!targetUserId || !targetUserId.trim()) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing targetUserId." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const subscriptions = await fetchSubscriptionsForUser(
      supabaseAdmin,
      targetUserId.trim(),
    );

    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          delivered: false,
          message: "No push subscriptions found for the target user.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const notificationPayload = buildWakePayload({ senderName, appId });

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        sendWakeNotification(supabaseAdmin, subscription, notificationPayload)
      ),
    );

    const deliveredResults: SendResult[] = [];
    const failedResults: SendResult[] = [];

    results.forEach((result, index) => {
      const subscription = subscriptions[index];

      if (result.status === "fulfilled") {
        (result.value.delivered ? deliveredResults : failedResults).push(result.value);
        return;
      }

      failedResults.push({
        id: subscription.id,
        endpoint: subscription.endpoint,
        delivered: false,
        error: result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
      });
    });

    const delivered = deliveredResults.length > 0;

    const removedCount = failedResults.reduce(
      (total, result) => total + (result.removed ? 1 : 0),
      0,
    );

    const responseMessage = delivered
      ? undefined
      : removedCount > 0
      ? "Stale push subscription(s) were removed for this user. Ask them to reopen the app to refresh notifications."
      : "Wake-up notification could not be delivered to any registered device.";

    return new Response(
      JSON.stringify({
        success: delivered,
        delivered,
        results: [...deliveredResults, ...failedResults],
        removedCount,
        message: responseMessage,
      }),
      {
        status: delivered ? 200 : 207,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error(`[ERROR] Unhandled error:`, error);
    const errorMessage = error instanceof Error
      ? error.message
      : "An unknown server error occurred.";

    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
