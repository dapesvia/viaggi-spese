import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { TrendingUp, TrendingDown, Trash2, Loader2, Edit2, Handshake, BarChart3, History, Receipt, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, type Expense } from "@/lib/supabase";
import { useTrip } from "@/lib/trip-context";
import { useToast } from "@/components/toast";
import { calculateSplit } from "@/lib/split-utils";
import { EditExpenseDrawer } from "./edit-expense-drawer";
import { AddExpenseDrawer } from "./add-expense-drawer";
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

/** Swipeable expense row for mobile */
function SwipeableExpenseRow({
  expense,
  onEdit,
  onDelete,
  onViewReceipt,
  getSplitLabel,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  onViewReceipt: (url: string) => void;
  getSplitLabel: (t: string) => string;
}) {
  const x = useMotionValue(0);
  const bg = useTransform(x, [-120, -60, 0], [
    "rgba(239,68,68,0.3)",
    "rgba(239,68,68,0.15)",
    "rgba(239,68,68,0)",
  ]);
  const deleteOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const deleteScale = useTransform(x, [-100, -50, 0], [1, 0.8, 0.5]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -100) {
      onDelete();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete backdrop */}
      <motion.div
        style={{ backgroundColor: bg }}
        className="absolute inset-0 flex items-center justify-end pr-6 rounded-xl"
      >
        <motion.div style={{ opacity: deleteOpacity, scale: deleteScale }}>
          <Trash2 className="w-5 h-5 text-red-400" />
        </motion.div>
      </motion.div>

      {/* Foreground row */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className="flex items-center gap-3 p-4 glass border border-border/50 group relative bg-background rounded-xl"
      >
        <div className="text-2xl">
          {expense.is_gift ? '🎁' : CATEGORY_ICONS[expense.category]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {expense.is_gift && <span className="text-purple-500 mr-1">🎁</span>}
            {expense.description || "Spesa"}
          </p>
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
                onClick={() => onViewReceipt(expense.receipt_url!)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Receipt className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-primary" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


export function WalletDashboard() {
  const { currentTrip } = useTrip();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
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
        .order('expense_date', { ascending: false });

      if (error) throw error;

      const allExpenses = data || [];
      const tripExpenses = allExpenses.filter(e => e.trip_id === currentTrip.id);

      setExpenses(tripExpenses);


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

      toast(`"${deleteExpense.description || 'Spesa'}" eliminata`, "success");
      setDeleteExpense(null);
      loadExpenses();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      toast("Errore nell'eliminazione", "error");
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

  // Filter out settlements for Stats/Totals (but keep for Balance)
  const isSettlement = (e: Expense) => e.description?.startsWith('💸');
  const isGift = (e: Expense) => e.is_gift === true;
  const realExpenses = expenses.filter(e => !isSettlement(e));

  const totalSpent = realExpenses.reduce((sum, exp) => sum + exp.amount_in_eur, 0);
  const tripCost = currentTrip.budget || 0;
  const tripPayer = currentTrip.cost_payer || 'split';
  const totalTripCost = tripCost + totalSpent;

  // Calculate balance with custom splits AND initial trip cost
  let alexPaid = 0;
  let alexConsumed = 0;
  let tinaConsumed = 0;

  // 1. Add Initial Trip Cost Logic (skip if trip is a gift)
  if (!currentTrip.is_gift) {
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
  }

  // 2. Add Expenses Logic
  expenses.forEach(e => {
    // Skip gift expenses for balance calculation
    if (isGift(e)) return;

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

  // Calculate local trip balance
  const balance = alexPaid - alexConsumed;

  // For display "Tu hai speso" / "Tina ha speso", we want real consumption excluding settlements
  // We re-calculate based on realExpenses
  let alexRealConsumed = 0;
  let tinaRealConsumed = 0;

  // Add initial trip split to real consumed (skip if gift)
  if (!currentTrip.is_gift) {
    const tripCostPerPersonDisplay = (currentTrip.budget || 0) / 2;
    alexRealConsumed += tripCostPerPersonDisplay;
    tinaRealConsumed += tripCostPerPersonDisplay;
  }

  realExpenses.forEach(e => {
    const amount = e.amount_in_eur;
    const split = calculateSplit(amount, e.split_type, e.split_manual_alex, e.split_manual_tina);
    alexRealConsumed += split.alex;
    tinaRealConsumed += split.tina;
  });

  // Variables for display
  const alexTotal = alexRealConsumed;
  const tinaTotal = tinaRealConsumed;

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
            ⚖️ Bilancio Viaggio
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
              <p className="text-muted-foreground font-medium text-lg">Tina ti deve in totale</p>
              <div className="flex items-center gap-3 text-green-500">
                <TrendingUp className="w-8 h-8" />
                <span className="text-4xl font-black tracking-tight">€{Math.abs(balance).toFixed(2)}</span>
              </div>
            </>
          ) : balance < -5 ? (
            <>
              <p className="text-muted-foreground font-medium text-lg">Tu devi a Tina in totale</p>
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

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Spese Recenti</h3>
          <p className="text-xs text-muted-foreground">← scorri per eliminare</p>
        </div>
        {realExpenses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nessuna spesa ancora</p>
            <p className="text-sm mt-2">Tocca il pulsante + per aggiungere la prima spesa</p>
          </div>
        ) : (
          <div className="space-y-3">
            {realExpenses
              .map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                >
                  <SwipeableExpenseRow
                    expense={expense}
                    onEdit={() => setEditingExpense(expense)}
                    onDelete={() => setDeleteExpense(expense)}
                    onViewReceipt={(url) => setViewingReceipt(url)}
                    getSplitLabel={getSplitLabel}
                  />
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

      {/* Add Expense FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddExpense(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-violet-600 text-white shadow-xl shadow-primary/30 flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <AddExpenseDrawer
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onExpenseAdded={loadExpenses}
      />
    </div>
  );
}
