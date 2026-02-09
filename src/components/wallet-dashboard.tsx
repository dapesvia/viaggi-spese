import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Trash2, Loader2, Edit2, Handshake, BarChart3, History, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, type Expense } from "@/lib/supabase";
import { useTrip } from "@/lib/trip-context";

import { EditExpenseDrawer } from "./edit-expense-drawer";
import { SettleDebtDrawer } from "./settle-debt-drawer";
import { ConfirmDialog } from "./confirm-dialog";
import { logActivity } from "@/lib/activity-log";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽️",
  transport: "🚗",
  accommodation: "🏨",
  activities: "🎭",
  shopping: "🛍️",
  other: "💰",
};

// Calculate split amounts based on split type
// Calculate split amounts based on split type
function calculateSplit(amount: number, splitType: string, manualAlex: number = 0, manualTina: number = 0): { alex: number; tina: number } {
  switch (splitType) {
    case 'me':
      return { alex: amount, tina: 0 };
    case 'partner':
      return { alex: 0, tina: amount };
    case '70-30':
      return { alex: amount * 0.7, tina: amount * 0.3 };
    case '60-40':
      return { alex: amount * 0.6, tina: amount * 0.4 };
    case 'custom':
      return { alex: manualAlex, tina: manualTina };
    case 'equal':
    default:
      return { alex: amount / 2, tina: amount / 2 };
  }
}

// ...

// In WalletDashboard component:

// Calculate balance
// Logic: 
// Credit = Paid - Consumed
// If Alex paid 100 and consumed 50, credit is +50.
// If Tina paid 0 and consumed 50, credit is -50.
// Net Balance defined as "How much Tina owes Alex" = AlexCredit - TinaCredit? 
// Wait.
// Simplest: 
// Balance > 0 implies Tina owes Alex.
// Balance = (AlexPaid - AlexConsumed) - (TinaPaid - TinaConsumed)? No.
// Balance = (AlexPaid - AlexConsumed).
// Check: Alex pays 100 (50/50). Paid=100. Consumed=50. Balance = +50. Tina owes Alex 50. Correct.
// Check: Tina pays 100 (50/50). Paid=0. Consumed=50. Balance = -50. Alex owes Tina 50. Correct.



export function WalletDashboard() {
  const { currentTrip } = useTrip();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [showHistory, setShowHistory] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showSettleDrawer, setShowSettleDrawer] = useState(false);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (currentTrip) {
      loadExpenses();

      const channel = supabase
        .channel('expenses-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${currentTrip.id}` },
          () => loadExpenses()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentTrip]);

  const loadExpenses = async () => {
    if (!currentTrip) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', currentTrip.id)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Errore caricamento spese:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteExpense) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', deleteExpense.id);

      if (error) throw error;

      // Log activity
      if (currentTrip) {
        await logActivity(
          currentTrip.id,
          "delete",
          "expense",
          `ha eliminato "${deleteExpense.description || 'spesa'}" (€${deleteExpense.amount_in_eur.toFixed(2)})`,
          deleteExpense.id
        );
      }

      setDeleteExpense(null);
      loadExpenses();
    } catch (error) {
      console.error('Errore eliminazione:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (!currentTrip) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Seleziona un viaggio dalla home per vedere le spese</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount_in_eur, 0);
  const tripCost = currentTrip.budget || 0;
  const tripPayer = currentTrip.cost_payer || 'split';
  const totalTripCost = tripCost + totalSpent;

  // Calculate balance with custom splits AND initial trip cost
  let alexPaid = 0;
  let alexConsumed = 0;
  let tinaConsumed = 0;

  // 1. Add Initial Trip Cost Logic
  const tripCostPerPerson = tripCost / 2;

  if (tripPayer === 'alex') {
    alexPaid += tripCost;
  } else if (tripPayer === 'tina') {
    // alexPaid doesn't increase
  } else if (tripPayer === 'split') {
    alexPaid += tripCostPerPerson;
  } else if (tripPayer === 'custom') {
    alexPaid += (currentTrip.cost_split_manual_alex || 0);
  }

  // Both consume half the trip cost
  alexConsumed += tripCostPerPerson;
  tinaConsumed += tripCostPerPerson;

  // 2. Add Expenses Logic
  expenses.forEach(e => {
    const amount = e.amount_in_eur;

    // Who Paid?
    const payer = e.payer || (e.split_type === 'partner' ? 'tina' : 'alex');

    if (payer === 'alex') {
      alexPaid += amount;
    }

    // Who Consumed?
    const split = calculateSplit(amount, e.split_type, e.split_manual_alex, e.split_manual_tina);
    alexConsumed += split.alex;
    tinaConsumed += split.tina;
  });

  const balance = alexPaid - alexConsumed;

  // Variables for display
  const alexTotal = alexConsumed;
  const tinaTotal = tinaConsumed;

  // Get settlement history
  const settlements = expenses.filter(e => e.description?.startsWith('💸'));

  // Get split type label
  const getSplitLabel = (splitType: string) => {
    switch (splitType) {
      case 'me': return '👤 Alex';
      case 'partner': return '👩 Tina';
      case '70-30': return '📊 70/30';
      case '60-40': return '📊 60/40';
      case 'custom': return '✏️ Manuale';
      default: return '⚖️ 50/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Trip indicator & Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Viaggio: <span className="font-medium text-foreground">{currentTrip.name}</span>
        </div>
        <div className="flex gap-2">
          {settlements.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showHistory ? "bg-green-500 text-white" : "hover:bg-muted"
              )}
              title="Storico saldi"
            >
              <History className="w-5 h-5" />
            </button>
          )}
          <Link
            to="/stats"
            className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
            title="Statistiche complete"
          >
            <BarChart3 className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Cost Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 backdrop-blur-sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end border-b border-border/50 pb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Costo Totale Viaggio</p>
              <div className="flex items-center gap-1">
                <span className="text-3xl font-bold">€{totalTripCost.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                {expenses.length} spese
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Volo + Hotel</p>
              <p className="text-lg font-semibold">€{tripCost.toFixed(2)}</p>
              {tripPayer === 'custom' ? (
                <div className="flex flex-col text-[10px] text-muted-foreground leading-tight">
                  <span>Alex: €{(currentTrip.cost_split_manual_alex || 0).toFixed(0)}</span>
                  <span>Tina: €{(currentTrip.cost_split_manual_tina || 0).toFixed(0)}</span>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {tripPayer === 'split' ? 'Pagato diviso' : `Pagato da ${tripPayer === 'alex' ? 'Alex' : 'Tina'}`}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Spese Extra</p>
              <p className="text-lg font-semibold text-orange-500">+ €{totalSpent.toFixed(2)}</p>
            </div>
          </div>

          {/* Progress Bar Visual (Extra Expenses vs Total) */}
          <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden mt-1">
            <div
              className="absolute top-0 left-0 h-full bg-indigo-500/50"
              style={{ width: `${(tripCost / totalTripCost) * 100}%` }}
            />
            <div
              className="absolute top-0 right-0 h-full bg-orange-500/50"
              style={{ width: `${(totalSpent / totalTripCost) * 100}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Balance Card */}
      {/* Balance Card - High Visibility */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "p-6 rounded-3xl border-2 shadow-lg relative overflow-hidden",
          balance > 5
            ? "bg-green-500/10 border-green-500/20"
            : balance < -5
              ? "bg-orange-500/10 border-orange-500/20"
              : "bg-muted/30 border-border/50"
        )}
      >
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-xl font-bold flex items-center gap-2">
            ⚖️ Bilancio
          </h3>
          {Math.abs(balance) >= 1 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettleDrawer(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all font-semibold"
            >
              <Handshake className="w-5 h-5" />
              <span>Salda</span>
            </motion.button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/10 relative z-10">
          {balance > 5 ? (
            <>
              <p className="text-muted-foreground font-medium text-lg">Tina ti deve</p>
              <div className="flex items-center gap-3 text-green-500">
                <TrendingUp className="w-8 h-8" />
                <span className="text-4xl font-black tracking-tight">€{Math.abs(balance).toFixed(2)}</span>
              </div>
            </>
          ) : balance < -5 ? (
            <>
              <p className="text-muted-foreground font-medium text-lg">Tu devi a Tina</p>
              <div className="flex items-center gap-3 text-orange-500">
                <TrendingDown className="w-8 h-8" />
                <span className="text-4xl font-black tracking-tight">€{Math.abs(balance).toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <span className="text-4xl">🎉</span>
              <p className="text-xl font-bold text-muted-foreground">Siete pari!</p>
            </div>
          )}
        </div>

        {/* Totals overlay */}
        <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Tu hai speso</p>
            <p className="text-lg font-bold text-blue-500">€{alexTotal.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
            <p className="text-xs text-muted-foreground mb-1">Tina ha speso</p>
            <p className="text-lg font-bold text-pink-500">€{tinaTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Decorative background blur */}
        <div className={cn(
          "absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none",
          balance > 5 ? "bg-green-500" : balance < -5 ? "bg-orange-500" : "bg-primary"
        )} />
      </motion.div>

      {/* Settlement History */}
      <AnimatePresence>
        {showHistory && settlements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-2xl glass border border-green-500/20"
          >
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-green-500" />
              Storico Saldi
            </h3>
            <div className="space-y-2">
              {settlements.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-green-500/5">
                  <div>
                    <p className="text-sm font-medium">{s.description?.replace('💸 ', '')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.expense_date).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <span className="font-bold text-green-500">€{s.amount_in_eur.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Section */}


      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Spese Recenti</h3>
        {expenses.filter(e => !e.description?.startsWith('💸')).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nessuna spesa ancora</p>
            <p className="text-sm mt-2">Tocca il pulsante + per aggiungere la prima spesa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses
              .filter(e => !e.description?.startsWith('💸'))
              .map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                  className="flex items-center gap-3 p-4 rounded-xl glass border border-border/50 group"
                >
                  <div className="text-2xl">{CATEGORY_ICONS[expense.category]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{expense.description || "Spesa"}</p>
                    <p className="text-xs text-muted-foreground">
                      {getSplitLabel(expense.split_type)} •{" "}
                      {new Date(expense.expense_date).toLocaleDateString("it-IT")}
                      {expense.original_currency !== 'EUR' && ` • ${expense.original_currency}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-right">
                      <p className="font-bold">€{expense.amount_in_eur.toFixed(2)}</p>
                      {expense.original_currency !== 'EUR' && (
                        <p className="text-xs text-muted-foreground">
                          {expense.amount.toFixed(2)} {expense.original_currency}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {expense.receipt_url && (
                        <button
                          onClick={() => setViewingReceipt(expense.receipt_url)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Receipt className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingExpense(expense)}
                        className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-primary" />
                      </button>
                      <button
                        onClick={() => setDeleteExpense(expense)}
                        className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>

      {/* Edit Expense Drawer */}
      <EditExpenseDrawer
        expense={editingExpense}
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        onSaved={loadExpenses}
      />

      {/* Settle Debt Drawer */}
      <SettleDebtDrawer
        open={showSettleDrawer}
        onOpenChange={setShowSettleDrawer}
        balance={balance}
        onSettled={loadExpenses}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteExpense}
        onClose={() => setDeleteExpense(null)}
        onConfirm={handleDeleteExpense}
        title="Elimina spesa"
        message={`Eliminare "${deleteExpense?.description || 'questa spesa'}" di €${deleteExpense?.amount_in_eur.toFixed(2)}?`}
        confirmText="Elimina"
        loading={deleting}
      />

      {/* Receipt Viewer */}
      <AnimatePresence>
        {viewingReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setViewingReceipt(null)}
          >
            <img
              src={viewingReceipt}
              alt="Scontrino"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
