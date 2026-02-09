import { useState } from "react";
import { motion } from "framer-motion";
import { X, Euro } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { User } from "../App";

const CATEGORIES = [
  { id: "food", label: "Cibo", emoji: "🍽️" },
  { id: "transport", label: "Trasporti", emoji: "🚗" },
  { id: "accommodation", label: "Alloggio", emoji: "🏨" },
  { id: "activities", label: "Attività", emoji: "🎭" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "other", label: "Altro", emoji: "💰" },
];

interface AddExpenseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
}

export function AddExpenseDrawer({ open, onOpenChange, currentUser }: AddExpenseDrawerProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [paidBy, setPaidBy] = useState<User>(currentUser);
  const [description, setDescription] = useState("");

  const handleNumberClick = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    if (amount.split(".")[1]?.length >= 2) return;
    setAmount((prev) => prev + num);
  };

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const handleSave = async () => {
    if (!amount || amount === "0") return;

    try {
      const { error } = await supabase.from('expenses').insert({
        amount: parseFloat(amount),
        original_currency: 'EUR',
        amount_in_eur: parseFloat(amount),
        category,
        description: description || null,
        paid_by_user_id: paidBy,
        split_type: 'equal',
        expense_date: new Date().toISOString().split('T')[0],
        trip_id: '00000000-0000-0000-0000-000000000000' // Default trip
      });

      if (error) throw error;

      onOpenChange(false);
      setAmount("");
      setDescription("");
      
      // Ricarica la pagina per mostrare la nuova spesa
      window.location.reload();
    } catch (error) {
      console.error('Errore salvataggio spesa:', error);
      alert('Errore nel salvare la spesa. Riprova.');
    }
  };

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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Nuova Spesa</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Display - Più grande e touch-friendly */}
            <div className="mb-6 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-center gap-2 text-5xl font-bold">
                <Euro className="w-10 h-10 text-primary" />
                <span>{amount || "0.00"}</span>
              </div>
            </div>

            {/* Numeric Keypad - Prima per facilità mobile */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((key) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => (key === "⌫" ? handleBackspace() : handleNumberClick(key))}
                  className="h-16 rounded-xl bg-muted hover:bg-muted/80 font-semibold text-xl transition-colors active:bg-muted/60"
                >
                  {key}
                </motion.button>
              ))}
            </div>

            {/* Category Selection - Icone più grandi */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Categoria
              </label>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all active:scale-95",
                      category === cat.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-3xl mb-1">{cat.emoji}</div>
                    <div className="text-xs font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Paid By - Bottoni grandi e chiari */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Chi ha pagato?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaidBy("alex")}
                  className={cn(
                    "p-5 rounded-xl border-2 transition-all active:scale-95",
                    paidBy === "alex"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="text-3xl mb-2">👨</div>
                  <div className="text-lg font-semibold">Alex</div>
                </button>
                <button
                  onClick={() => setPaidBy("valentina")}
                  className={cn(
                    "p-5 rounded-xl border-2 transition-all active:scale-95",
                    paidBy === "valentina"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="text-3xl mb-2">👩</div>
                  <div className="text-lg font-semibold">Valentina</div>
                </button>
              </div>
            </div>

            {/* Description - Opzionale */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Descrizione (opzionale)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Es: Cena al ristorante"
                className="w-full p-4 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-base"
              />
            </div>

            {/* Save Button - Grande e visibile */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={!amount || amount === "0"}
              className="w-full h-16 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
            >
              Salva Spesa
            </motion.button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
