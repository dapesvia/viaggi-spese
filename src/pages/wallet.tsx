import { useState, useEffect } from "react";
import { WalletDashboard } from "@/components/wallet-dashboard";
import { AddExpenseDrawer } from "@/components/add-expense-drawer";
import { Plus, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTrip } from "@/lib/trip-context";
import { supabase, type Expense } from "@/lib/supabase";
import { exportTripToPDF } from "@/lib/export-pdf";

export default function WalletPage() {
  const { currentTrip } = useTrip();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (currentTrip) {
      loadExpenses();
    }
  }, [currentTrip]);

  const loadExpenses = async () => {
    if (!currentTrip) return;
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', currentTrip.id)
      .order('expense_date', { ascending: false });
    setExpenses(data || []);
  };

  const handleExport = () => {
    if (currentTrip && expenses.length > 0) {
      exportTripToPDF(currentTrip, expenses);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Portafoglio</h1>
            <p className="text-muted-foreground">Gestisci le spese del viaggio</p>
          </div>
          {currentTrip && expenses.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
              title="Esporta PDF"
            >
              <FileDown className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">PDF</span>
            </motion.button>
          )}
        </div>
      </header>

      <WalletDashboard />

      {/* FAB */}
      {currentTrip && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddExpense(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      <AddExpenseDrawer open={showAddExpense} onOpenChange={setShowAddExpense} />
    </div>
  );
}
