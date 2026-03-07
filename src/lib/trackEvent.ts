import { supabase } from "@/integrations/supabase/client";

export async function trackEvent(eventType: string, eventData?: Record<string, any>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("analytics_events" as any).insert({
      tutor_id: user.id,
      event_type: eventType,
      event_data: eventData || {},
    });
  } catch {
    // fire and forget
  }
}
