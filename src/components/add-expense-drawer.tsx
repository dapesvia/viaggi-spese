import { useState } from "react";
import { motion } from "framer-motion";
import { X, Euro, Calendar } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useTrip } from "@/lib/trip-context";

const CATEGORIES = [
  { id: "food", label: "Cibo", emoji: "🍽️" },
  { id: "transport", label: "Trasporti", emoji: "🚗" },
  { id: "accommodation", label: "Alloggio", emoji: "🏨" },
  { id: "activities", label: "Attività", emoji: "🎭" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "other", label: "Altro", emoji: "💰" },
];

const SPLIT_OPTIONS = [
  { id: "equal", label: "Diviso 50/50", icon: "⚖️" },
  { id: "me", label: "Solo Alex", icon: "👤" },
  { id: "partner", label: "Solo Tina", icon: "👥" },
];

interface AddExpenseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddExpenseDrawer({ open, onOpenChange }: AddExpenseDrawerProps) {
  const { currentTrip } = useTrip();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [splitType, setSplitType] = useState("equal");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleNumberClick = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    if (amount.split(".")[1]?.length >= 2) return;
    setAmount((prev) => prev + num);
  };

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const handleSave = async () => {
    if (!amount || amount === "0" || !currentTrip) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('expenses').insert({
        amount: parseFloat(amount),
        original_currency: 'EUR',
        amount_in_eur: parseFloat(amount),
        category,
        description: description || null,
        paid_by_user_id: null, // No auth
        split_type: splitType,
        expense_date: expenseDate,
        trip_id: currentTrip.id
      });

      if (error) throw error;

      onOpenChange(false);
      setAmount("");
      setDescription("");
      setCategory("food");
      setSplitType("equal");
      setExpenseDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Errore salvataggio spesa:', error);
      alert('Errore nel salvare la spesa. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentTrip) {
    return null;
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl glass border-t border-border/50 max-h-[92vh]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex-shrink-0 mx-auto w-12 h-1.5 rounded-full bg-muted my-4" />

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Nuova Spesa</h2>
                <p className="text-sm text-muted-foreground">{currentTrip.name}</p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Display */}
            <div className="mb-4 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-center gap-2 text-4xl font-bold">
                <Euro className="w-8 h-8 text-primary" />
                <span>{amount || "0.00"}</span>
              </div>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((key) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => (key === "⌫" ? handleBackspace() : handleNumberClick(key))}
                  className="h-14 rounded-xl bg-muted hover:bg-muted/80 font-semibold text-lg transition-colors active:bg-muted/60"
                >
                  {key}
                </motion.button>
              ))}
            </div>

            {/* Category Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Categoria
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all active:scale-95",
                      category === cat.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-2xl mb-1">{cat.emoji}</div>
                    <div className="text-xs font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Type */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Chi paga
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SPLIT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSplitType(opt.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all active:scale-95",
                      splitType === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-xl mb-1">{opt.icon}</div>
                    <div className="text-xs font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-base"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Descrizione (opzionale)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Es: Cena al ristorante"
                className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-base"
              />
            </div>

            {/* Save Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={!amount || amount === "0" || loading}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
            >
              {loading ? "Salvataggio..." : "Salva Spesa"}
            </motion.button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
