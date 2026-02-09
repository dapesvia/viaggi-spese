import { type Expense, type Trip } from "./supabase";

const CATEGORY_LABELS: Record<string, string> = {
    food: "Cibo",
    transport: "Trasporti",
    accommodation: "Alloggio",
    activities: "Attività",
    shopping: "Shopping",
    other: "Altro",
};

export async function exportTripToPDF(trip: Trip, expenses: Expense[]) {
    // Calculate totals
    const total = expenses.reduce((sum, e) => sum + e.amount_in_eur, 0);

    let alexTotal = 0;
    let tinaTotal = 0;

    expenses.forEach(e => {
        if (e.split_type === 'me') {
            alexTotal += e.amount_in_eur;
        } else if (e.split_type === 'partner') {
            tinaTotal += e.amount_in_eur;
        } else {
            alexTotal += e.amount_in_eur / 2;
            tinaTotal += e.amount_in_eur / 2;
        }
    });

    const balance = alexTotal - tinaTotal;

    // Group by category
    const byCategory: Record<string, number> = {};
    expenses.forEach(e => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount_in_eur;
    });

    // Build HTML content
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Riepilogo ${trip.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; background: #fff; color: #1a1a1a; }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .subtitle { color: #666; margin-bottom: 32px; }
    .card { background: #f5f5f5; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .card h3 { font-size: 14px; color: #888; margin-bottom: 12px; text-transform: uppercase; }
    .amount { font-size: 32px; font-weight: bold; color: #6366f1; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .balance { font-size: 18px; margin-top: 8px; }
    .balance.positive { color: #22c55e; }
    .balance.negative { color: #f59e0b; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
    .text-right { text-align: right; }
    .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>✈️ ${trip.name}</h1>
  <p class="subtitle">${new Date(trip.start_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })} - ${new Date(trip.end_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  
  <div class="card">
    <h3>Totale Speso</h3>
    <div class="amount">€${total.toFixed(2)}</div>
    ${trip.budget ? `<p style="color: #666; margin-top: 8px;">${((total / trip.budget) * 100).toFixed(1)}% del budget di €${trip.budget}</p>` : ''}
  </div>
  
  <div class="grid">
    <div class="card">
      <h3>Alex ha pagato</h3>
      <div class="amount" style="color: #3b82f6;">€${alexTotal.toFixed(2)}</div>
    </div>
    <div class="card">
      <h3>Tina ha pagato</h3>
      <div class="amount" style="color: #ec4899;">€${tinaTotal.toFixed(2)}</div>
    </div>
  </div>
  
  <div class="card">
    <h3>Bilancio</h3>
    <p class="balance ${balance > 0 ? 'positive' : balance < 0 ? 'negative' : ''}">
      ${balance > 5 ? `Tina deve ad Alex €${Math.abs(balance).toFixed(2)}` :
            balance < -5 ? `Alex deve a Tina €${Math.abs(balance).toFixed(2)}` :
                'Siete pari! 🎉'}
    </p>
  </div>
  
  <div class="card">
    <h3>Spese per Categoria</h3>
    <table>
      <thead>
        <tr><th>Categoria</th><th class="text-right">Importo</th><th class="text-right">%</th></tr>
      </thead>
      <tbody>
        ${Object.entries(byCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, amount]) => `
            <tr>
              <td>${CATEGORY_LABELS[cat] || cat}</td>
              <td class="text-right">€${amount.toFixed(2)}</td>
              <td class="text-right">${((amount / total) * 100).toFixed(0)}%</td>
            </tr>
          `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="card">
    <h3>Tutte le Spese (${expenses.length})</h3>
    <table>
      <thead>
        <tr><th>Data</th><th>Descrizione</th><th>Chi</th><th class="text-right">Importo</th></tr>
      </thead>
      <tbody>
        ${expenses
            .sort((a, b) => new Date(a.expense_date).getTime() - new Date(b.expense_date).getTime())
            .map(e => `
            <tr>
              <td>${new Date(e.expense_date).toLocaleDateString('it-IT')}</td>
              <td>${e.description || CATEGORY_LABELS[e.category]}</td>
              <td>${e.split_type === 'me' ? 'Alex' : e.split_type === 'partner' ? 'Tina' : '50/50'}</td>
              <td class="text-right">€${e.amount_in_eur.toFixed(2)}</td>
            </tr>
          `).join('')}
      </tbody>
    </table>
  </div>
  
  <p class="footer">Generato da Viaggi & Spese il ${new Date().toLocaleDateString('it-IT')}</p>
</body>
</html>
  `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
}
