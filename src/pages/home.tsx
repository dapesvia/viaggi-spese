import { TripCard } from "@/components/trip-card";

export default function HomePage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">I Vostri Viaggi</h1>
        <p className="text-muted-foreground">Pianificate e tracciate le vostre avventure insieme</p>
      </header>

      <div className="space-y-4">
        <TripCard
          name="Estate in Italia"
          startDate="2024-07-15"
          endDate="2024-07-30"
          status="upcoming"
          coverImage="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800"
        />
      </div>
    </div>
  );
}
