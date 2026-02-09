import { TripCard } from "@/components/trip-card";

export default function HomePage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Trips</h1>
        <p className="text-muted-foreground">Plan and track your adventures together</p>
      </header>

      <div className="space-y-4">
        {/* Placeholder - will be replaced with real data */}
        <TripCard
          name="Summer in Italy"
          startDate="2024-07-15"
          endDate="2024-07-30"
          status="upcoming"
          coverImage="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800"
        />
      </div>
    </div>
  );
}
