import { supabase } from "./supabase";

export type ActivityAction = "create" | "update" | "delete" | "settle";
export type EntityType = "expense" | "trip" | "itinerary";

export interface ActivityLog {
    id: string;
    trip_id: string;
    actor: "Alex" | "Tina";
    action: ActivityAction;
    entity_type: EntityType;
    entity_id: string | null;
    description: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

// Get current actor from localStorage or default to Alex
export function getCurrentActor(): "Alex" | "Tina" {
    if (typeof window !== "undefined") {
        return (localStorage.getItem("currentActor") as "Alex" | "Tina") || "Alex";
    }
    return "Alex";
}

export function setCurrentActor(actor: "Alex" | "Tina") {
    if (typeof window !== "undefined") {
        localStorage.setItem("currentActor", actor);
    }
}

export async function logActivity(
    tripId: string,
    action: ActivityAction,
    entityType: EntityType,
    description: string,
    entityId?: string,
    metadata?: Record<string, unknown>
) {
    try {
        await supabase.from("activity_logs").insert({
            trip_id: tripId,
            actor: getCurrentActor(),
            action,
            entity_type: entityType,
            entity_id: entityId || null,
            description,
            metadata: metadata || {},
        });
    } catch (error) {
        console.error("Error logging activity:", error);
    }
}

export async function getActivityLogs(tripId: string, limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching activity logs:", error);
        return [];
    }

    return data || [];
}

// Format relative time in Italian
export function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ora";
    if (diffMins < 60) return `${diffMins} min fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays === 1) return "Ieri";
    if (diffDays < 7) return `${diffDays}g fa`;
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

// Get action emoji
export function getActionEmoji(action: ActivityAction): string {
    switch (action) {
        case "create": return "➕";
        case "update": return "✏️";
        case "delete": return "🗑️";
        case "settle": return "💸";
        default: return "📝";
    }
}
