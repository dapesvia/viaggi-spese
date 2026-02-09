import { useState } from "react";
import { WalletDashboard } from "@/components/wallet-dashboard";
import { AddExpenseDrawer } from "@/components/add-expense-drawer";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useTrip } from "@/lib/trip-context";

export default function WalletPage() {
  const { currentTrip } = useTrip();
  const [showAddExpense, setShowAddExpense] = useState(false);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Portafoglio</h1>
        <p className="text-muted-foreground">Gestisci le spese del viaggio</p>
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
