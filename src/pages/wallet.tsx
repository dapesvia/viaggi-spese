import { useState, useEffect } from "react";
import { WalletDashboard } from "@/components/wallet-dashboard";
import { ActorSelector } from "@/components/actor-selector";
import { TripSelector } from "@/components/trip-selector";
import { ActivityLogPanel } from "@/components/activity-log-panel";
import { FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { useTrip } from "@/lib/trip-context";
import { supabase, type Expense } from "@/lib/supabase";
import { exportTripToPDF } from "@/lib/export-pdf";

export default function WalletPage() {
  const { currentTrip } = useTrip();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (currentTrip) {
      loadExpenses();
    } else {
      setExpenses([]);
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
      <header className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Portafoglio</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Gestisci le spese del viaggio</p>
          </div>
          <div className="flex items-center gap-2">
            <ActorSelector />
            {currentTrip && expenses.length > 0 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                title="Esporta PDF"
              >
                <FileDown className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Trip Selector */}
        <TripSelector />
      </header>

      <WalletDashboard />

      {/* Activity Log - nascosto, collapsabile */}
      <ActivityLogPanel />

      <ActivityLogPanel />
    </div>
  );
}
