import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Euro, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, type Expense, type Profile } from "@/lib/supabase";
import { useTrip } from "@/lib/trip-context";

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽️",
  transport: "🚗",
  accommodation: "🏨",
  activities: "🎭",
  shopping: "🛍️",
  other: "💰",
};

interface ExpenseWithPayer extends Expense {
  payer?: Profile;
}

export function WalletDashboard() {
  const { currentTrip } = useTrip();
  const [expenses, setExpenses] = useState<ExpenseWithPayer[]>([]);
  const [loading, setLoading] = useState(true);

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

  const deleteExpense = async (id: string) => {
    if (!confirm('Eliminare questa spesa?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadExpenses();
    } catch (error) {
      console.error('Errore eliminazione:', error);
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
      <div className="text-sm text-muted-foreground">
        Viaggio: <span className="font-medium text-foreground">{currentTrip.name}</span>
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
        <h3 className="text-lg font-semibold mb-4">Bilancio</h3>
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
                <div className="flex-1">
                  <p className="font-medium">{expense.description || "Spesa"}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.split_type === 'me' ? '👤 Solo io' :
                      expense.split_type === 'partner' ? '👥 Solo partner' : '⚖️ Diviso'} •{" "}
                    {new Date(expense.expense_date).toLocaleDateString("it-IT")}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <p className="font-bold">€{expense.amount_in_eur.toFixed(2)}</p>
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
