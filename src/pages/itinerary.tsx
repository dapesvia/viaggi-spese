export default function ItineraryPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Itinerario</h1>
        <p className="text-muted-foreground">Il vostro programma di viaggio</p>
      </header>

      <div className="text-center py-12 text-muted-foreground">
        <p>Nessun elemento nell'itinerario</p>
        <p className="text-sm mt-2">Tocca il pulsante + per aggiungere voli, soggiorni o attività</p>
      </div>
    </div>
  );
}
