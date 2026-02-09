export default function DocsPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Documents</h1>
        <p className="text-muted-foreground">Tickets, bookings, and receipts</p>
      </header>

      <div className="text-center py-12 text-muted-foreground">
        <p>No documents yet</p>
        <p className="text-sm mt-2">Upload PDFs and images of your travel documents</p>
      </div>
    </div>
  );
}
