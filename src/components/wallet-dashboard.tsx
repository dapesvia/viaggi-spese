import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Euro, Trash2, Loader2, Edit2, Handshake, BarChart3, History, Receipt } from "lucide-react";
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
function calculateSplit(amount: number, splitType: string): { alex: number; tina: number } {
  switch (splitType) {
    case 'me':
      return { alex: amount, tina: 0 };
    case 'partner':
      return { alex: 0, tina: amount };
    case '70-30':
      return { alex: amount * 0.7, tina: amount * 0.3 };
    case '60-40':
      return { alex: amount * 0.6, tina: amount * 0.4 };
    case 'equal':
    default:
      return { alex: amount / 2, tina: amount / 2 };
  }
}

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
  const budget = currentTrip.budget || 2000;
  const budgetPercentage = (totalSpent / budget) * 100;

  // Calculate balance with custom splits
  let alexTotal = 0;
  let tinaTotal = 0;

  expenses.forEach(e => {
    const split = calculateSplit(e.amount_in_eur, e.split_type);
    alexTotal += split.alex;
    tinaTotal += split.tina;
  });

  const balance = alexTotal - tinaTotal;

  // Get settlement history
  const settlements = expenses.filter(e => e.description?.startsWith('💸'));

  // Get split type label
  const getSplitLabel = (splitType: string) => {
    switch (splitType) {
      case 'me': return '👤 Alex';
      case 'partner': return '👩 Tina';
      case '70-30': return '📊 70/30';
      case '60-40': return '📊 60/40';
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

      {/* Budget Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Totale Speso</p>
            <div className="flex items-center gap-2">
              <Euro className="w-6 h-6 text-primary" />
              <span className="text-3xl font-bold">{totalSpent.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Budget</p>
            <span className="text-2xl font-semibold">€{budget}</span>
          </div>
        </div>

        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              budgetPercentage > 90 ? "bg-destructive" : "bg-primary"
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {budgetPercentage.toFixed(1)}% del budget utilizzato
        </p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl glass border border-border/50"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Bilancio</h3>
          {Math.abs(balance) >= 1 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettleDrawer(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors"
            >
              <Handshake className="w-4 h-4" />
              <span className="text-sm font-medium">Salda</span>
            </motion.button>
          )}
        </div>

        {/* Who paid what summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-muted-foreground">Alex ha speso</p>
            <p className="text-lg font-bold text-blue-500">€{alexTotal.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
            <p className="text-xs text-muted-foreground">Tina ha speso</p>
            <p className="text-lg font-bold text-pink-500">€{tinaTotal.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-muted/50">
          {balance > 5 ? (
            <>
              <TrendingUp className="w-5 h-5 text-green-500" />
              <p className="text-lg">
                Tina ti deve{" "}
                <span className="font-bold text-green-500">€{Math.abs(balance).toFixed(2)}</span>
              </p>
            </>
          ) : balance < -5 ? (
            <>
              <TrendingDown className="w-5 h-5 text-orange-500" />
              <p className="text-lg">
                Tu devi a Tina{" "}
                <span className="font-bold text-orange-500">€{Math.abs(balance).toFixed(2)}</span>
              </p>
            </>
          ) : (
            <p className="text-lg text-muted-foreground">Tutto a posto! 🎉</p>
          )}
        </div>
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
