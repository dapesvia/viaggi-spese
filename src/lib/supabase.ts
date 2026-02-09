import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Expense = {
  id: string;
  trip_id: string;
  amount: number;
  original_currency: string;
  amount_in_eur: number;
  category: "food" | "transport" | "accommodation" | "activities" | "shopping" | "other";
  description: string | null;
  paid_by_user_id: string;
  split_type: "equal" | "me" | "partner";
  receipt_url: string | null;
  expense_date: string;
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
