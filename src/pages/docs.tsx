export default function DocsPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Documenti</h1>
        <p className="text-muted-foreground">Biglietti, prenotazioni e ricevute</p>
      </header>

      <div className="text-center py-12 text-muted-foreground">
        <p>Nessun documento ancora</p>
        <p className="text-sm mt-2">Carica PDF e immagini dei vostri documenti di viaggio</p>
      </div>
    </div>
  );
}
