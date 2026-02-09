export default function ItineraryPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Itinerary</h1>
        <p className="text-muted-foreground">Your travel schedule</p>
      </header>

      <div className="text-center py-12 text-muted-foreground">
        <p>No itinerary items yet</p>
        <p className="text-sm mt-2">Tap the + button to add flights, stays, or activities</p>
      </div>
    </div>
  );
}
