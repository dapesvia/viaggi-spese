import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, Camera, Image as ImageIcon } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useTrip } from "@/lib/trip-context";
import { MobileDatePicker } from "./mobile-date-picker";
import { MobileMoneyInput } from "./mobile-money-input";
import { logActivity } from "@/lib/activity-log";

const CATEGORIES = [
  { id: "food", label: "Cibo", emoji: "🍽️" },
  { id: "transport", label: "Trasporti", emoji: "🚗" },
  { id: "accommodation", label: "Alloggio", emoji: "🏨" },
  { id: "activities", label: "Attività", emoji: "🎭" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "other", label: "Altro", emoji: "💰" },
];

const SPLIT_OPTIONS = [
  { id: "equal", label: "50/50", detail: "Diviso a metà", icon: "⚖️" },
  { id: "me", label: "Alex", detail: "Pago solo io", icon: "👤" },
  { id: "partner", label: "Tina", detail: "Paga solo lei", icon: "👩" },
  { id: "70-30", label: "70/30", detail: "Io 70, lei 30", icon: "📊" },
  { id: "60-40", label: "60/40", detail: "Io 60, lei 40", icon: "📊" },
];

// Exchange rates (approximate - in production use API)
const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  CHF: 1.05,
  JPY: 0.0062,
  CZK: 0.041,
  PLN: 0.23,
  HRK: 0.13,
  THB: 0.027,
};

interface AddExpenseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddExpenseDrawer({ open, onOpenChange }: AddExpenseDrawerProps) {
  const { currentTrip } = useTrip();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [category, setCategory] = useState("food");
  const [splitType, setSplitType] = useState("equal");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const convertToEur = (amt: number, curr: string): number => {
    const rate = EXCHANGE_RATES[curr] || 1;
    return amt * rate;
  };

  const handleSave = async () => {
    if (!amount || amount === "0" || !currentTrip) return;

    setLoading(true);
    try {
      const amountNum = parseFloat(amount);
      const amountInEur = convertToEur(amountNum, currency);

      const { error } = await supabase.from('expenses').insert({
        amount: amountNum,
        original_currency: currency,
        amount_in_eur: amountInEur,
        category,
        description: description || null,
        paid_by_user_id: null,
        split_type: splitType,
        expense_date: expenseDate,
        trip_id: currentTrip.id,
        receipt_url: receiptImage // In production, upload to storage first
      });

      if (error) throw error;

      // Log activity
      const catLabel = CATEGORIES.find(c => c.id === category)?.label || category;
      await logActivity(
        currentTrip.id,
        "create",
        "expense",
        `ha aggiunto €${amountInEur.toFixed(2)} per ${catLabel}`,
        undefined,
        { amount: amountInEur, category, description }
      );

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Errore salvataggio spesa:', error);
      alert('Errore nel salvare la spesa. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setCurrency("EUR");
    setCategory("food");
    setSplitType("equal");
    setDescription("");
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setReceiptImage(null);
  };

  if (!currentTrip) return null;

  const amountInEur = amount ? convertToEur(parseFloat(amount), currency) : 0;

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

            {/* Amount Input */}
            <div className="mb-4">
              <MobileMoneyInput
                value={amount}
                onChange={setAmount}
                currency={currency}
                onCurrencyChange={setCurrency}
                label="Importo"
              />
              {currency !== "EUR" && amount && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  ≈ €{amountInEur.toFixed(2)} EUR
                </p>
              )}
            </div>

            {/* Category Selection */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Categoria
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all",
                      category === cat.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-2xl mb-1">{cat.emoji}</div>
                    <div className="text-xs font-medium">{cat.label}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Split Type with custom percentages */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Chi paga
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SPLIT_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSplitType(opt.id)}
                    className={cn(
                      "p-2 rounded-xl border-2 transition-all",
                      splitType === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-lg mb-0.5">{opt.icon}</div>
                    <div className="text-[10px] font-medium leading-tight">{opt.label}</div>
                  </motion.button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {SPLIT_OPTIONS.find(o => o.id === splitType)?.detail}
              </p>
            </div>

            {/* Date Picker */}
            <div className="mb-4">
              <MobileDatePicker
                value={expenseDate}
                onChange={setExpenseDate}
                label="📅 Data"
                maxDate={new Date().toISOString().split('T')[0]}
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
                className="w-full p-4 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-base"
              />
            </div>

            {/* Receipt Photo */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                📷 Foto scontrino (opzionale)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />

              {receiptImage ? (
                <div className="relative rounded-xl overflow-hidden h-32">
                  <img
                    src={receiptImage}
                    alt="Scontrino"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setReceiptImage(null)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-16 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-sm">Scatta</span>
                  </button>
                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute('capture');
                        fileInputRef.current.click();
                      }
                    }}
                    className="flex-1 h-16 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-muted-foreground"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-sm">Galleria</span>
                  </button>
                </div>
              )}
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
