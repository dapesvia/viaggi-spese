import { createClient, User, Session } from "@supabase/supabase-js";

// @ts-ignore - Vite env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// @ts-ignore - Vite env
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== AUTH HELPERS ====================

export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username }
    }
  });

  if (error) throw error;

  // Crea profilo automaticamente
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      avatar_url: null
    });
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

// ==================== TYPE DEFINITIONS ====================

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Trip = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  cover_image_url: string | null;
  status: "upcoming" | "active" | "completed";
  budget: number | null;
  cost_payer: "alex" | "tina" | "split" | "custom" | null;
  cost_split_manual_alex: number;
  cost_split_manual_tina: number;
  destination_address: string | null;
  accommodation_name: string | null;
  accommodation_type: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TripParticipant = {
  id: string;
  trip_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: string;
};

export type Expense = {
  id: string;
  trip_id: string;
  amount: number;
  original_currency: string;
  amount_in_eur: number;
  category: "food" | "transport" | "accommodation" | "activities" | "shopping" | "other" | "general";
  description: string | null;
  paid_by_user_id: string; // Legacy/unused? Keeping for now.
  payer: "alex" | "tina"; // New field
  split_type: "equal" | "me" | "partner" | "70-30" | "60-40" | "custom";
  split_manual_alex?: number; // New field
  split_manual_tina?: number; // New field
  receipt_url: string | null;
  expense_date: string;
  is_gift?: boolean; // Gift expenses don't affect balance
  created_at: string;
  updated_at: string;
};

export type ItineraryItem = {
  id: string;
  trip_id: string;
  datetime: string;
  type: "flight" | "stay" | "activity" | "transport" | "restaurant";
  title: string;
  description: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  pdf_url: string | null;
  booking_reference: string | null;
  created_at: string;
  updated_at: string;
};
