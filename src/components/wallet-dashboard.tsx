import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Euro, Trash2, Loader2, Edit2, Handshake, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, type Expense } from "@/lib/supabase";
import { useTrip } from "@/lib/trip-context";
import { ExpenseStats } from "./expense-stats";
import { EditExpenseDrawer } from "./edit-expense-drawer";
import { SettleDebtDrawer } from "./settle-debt-drawer";
import { ConfirmDialog } from "./confirm-dialog";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽️",
  transport: "🚗",
  accommodation: "🏨",
  activities: "🎭",
  shopping: "🛍️",
  other: "💰",
};

export function WalletDashboard() {
  const { currentTrip } = useTrip();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showSettleDrawer, setShowSettleDrawer] = useState(false);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (currentTrip) {
      loadExpenses();

      // Realtime subscription
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

  // Calculate balance between Alex and Tina
  const alexTotal = expenses
    .filter(e => e.split_type === 'me' || e.split_type === 'equal')
    .reduce((sum, e) => {
      if (e.split_type === 'equal') return sum + e.amount_in_eur / 2;
      return sum + e.amount_in_eur;
    }, 0);

  const tinaTotal = expenses
    .filter(e => e.split_type === 'partner' || e.split_type === 'equal')
    .reduce((sum, e) => {
      if (e.split_type === 'equal') return sum + e.amount_in_eur / 2;
      return sum + e.amount_in_eur;
    }, 0);

  const balance = alexTotal - tinaTotal;

  return (
    <div className="space-y-6">
      {/* Trip indicator */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Viaggio: <span className="font-medium text-foreground">{currentTrip.name}</span>
        </div>
        <button
          onClick={() => setShowStats(!showStats)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            showStats ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
          title="Statistiche"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
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

      {/* Balance Card with Settle Button */}
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
        <div className="flex items-center justify-center gap-3">
          {balance > 5 ? (
            <>
              <TrendingUp className="w-6 h-6 text-green-500" />
              <p className="text-xl">
                Tina ti deve{" "}
                <span className="font-bold text-green-500">€{Math.abs(balance).toFixed(2)}</span>
              </p>
            </>
          ) : balance < -5 ? (
            <>
              <TrendingDown className="w-6 h-6 text-orange-500" />
              <p className="text-xl">
                Tu devi a Tina{" "}
                <span className="font-bold text-orange-500">€{Math.abs(balance).toFixed(2)}</span>
              </p>
            </>
          ) : (
            <p className="text-xl text-muted-foreground">Tutto a posto! 🎉</p>
          )}
        </div>
      </motion.div>

      {/* Stats Section */}
      {showStats && <ExpenseStats expenses={expenses} />}

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Spese Recenti</h3>
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nessuna spesa ancora</p>
            <p className="text-sm mt-2">Tocca il pulsante + per aggiungere la prima spesa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl glass border border-border/50 group"
              >
                <div className="text-3xl">{CATEGORY_ICONS[expense.category]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{expense.description || "Spesa"}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.split_type === 'me' ? '👤 Alex' :
                      expense.split_type === 'partner' ? '👥 Tina' : '⚖️ Diviso'} •{" "}
                    {new Date(expense.expense_date).toLocaleDateString("it-IT")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold whitespace-nowrap">€{expense.amount_in_eur.toFixed(2)}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </div>
  );
}
