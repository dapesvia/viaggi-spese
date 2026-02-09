import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Camera, Image as ImageIcon } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useTrip } from "@/lib/trip-context";
import { MobileDatePicker } from "./mobile-date-picker";
import { MobileMoneyInput } from "./mobile-money-input";
import { logActivity } from "@/lib/activity-log";
import { useToast } from "@/components/toast";

const CATEGORIES = [
  { id: "food", label: "Cibo", emoji: "🍽️" },
  { id: "transport", label: "Trasporti", emoji: "🚗" },
  { id: "accommodation", label: "Alloggio", emoji: "🏨" },
  { id: "activities", label: "Attività", emoji: "🎭" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "general", label: "Generali", emoji: "🛒" },
  { id: "other", label: "Altro", emoji: "💰" },
];

const SPLIT_OPTIONS = [
  { id: "equal", label: "50/50", detail: "Diviso a metà", icon: "⚖️" },
  { id: "me", label: "Solo per me", detail: "Pago solo io", icon: "👤" },
  { id: "partner", label: "Solo per lei", detail: "Paga solo lei", icon: "👩" },
  { id: "custom", label: "Manuale", detail: "Decidi importi", icon: "✍️" },
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
  onExpenseAdded?: () => void;
}

export function AddExpenseDrawer({ open, onOpenChange, onExpenseAdded }: AddExpenseDrawerProps) {
  const { currentTrip } = useTrip();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate initial date based on trip
  const getInitialDate = () => {
    if (!currentTrip) return new Date().toISOString().split('T')[0];
    const now = new Date();
    const start = new Date(currentTrip.start_date);
    const end = new Date(currentTrip.end_date);

    // If today is within trip range, use today. Otherwise use start date.
    if (now >= start && now <= end) {
      // Usa orario locale per evitare problemi timezone
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return currentTrip.start_date;
  };

  const [date, setDate] = useState(getInitialDate());

  // Update date when trip changes or drawer opens
  useEffect(() => {
    if (open && currentTrip) {
      setDate(getInitialDate());
    }
  }, [open, currentTrip]);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [category, setCategory] = useState("food");
  const [splitType, setSplitType] = useState("equal");
  const [payer, setPayer] = useState<"alex" | "tina">("alex");
  const [manualAlex, setManualAlex] = useState("");
  const [manualTina, setManualTina] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(getInitialDate()); // Fallback initial state

  // Sync expenseDate with calculated date
  useEffect(() => {
    setExpenseDate(date);
  }, [date]);

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

      const expenseData: any = {
        amount: amountNum,
        original_currency: currency,
        amount_in_eur: amountInEur,
        category,
        description: description || null,
        payer,
        split_type: splitType,
        expense_date: expenseDate,
        trip_id: currentTrip.id,
        receipt_url: receiptImage
      };

      if (splitType === 'custom') {
        expenseData.split_manual_alex = parseFloat(manualAlex) || 0;
        expenseData.split_manual_tina = parseFloat(manualTina) || 0;
      }

      const { error } = await supabase.from('expenses').insert(expenseData);

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
      if (onExpenseAdded) onExpenseAdded();
      toast('Spesa salvata!', 'success');
    } catch (error) {
      console.error('Errore salvataggio spesa:', error);
      toast('Errore nel salvare la spesa. Riprova.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setCurrency("EUR");
    setCategory("food");
    setSplitType("equal");
    setPayer("alex");
    setManualAlex("");
    setManualTina("");
    setDescription("");
    // Reset date to smart default
    if (currentTrip) {
      const now = new Date();
      const start = new Date(currentTrip.start_date);
      const end = new Date(currentTrip.end_date);
      if (now >= start && now <= end) {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
      } else {
        setDate(currentTrip.start_date);
      }
    }
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

            {/* Payer Toggle */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Chi ha pagato</label>
              <div className="flex p-1 bg-muted rounded-xl">
                <button onClick={() => setPayer('alex')} className={cn("flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all", payer === 'alex' ? "bg-background text-primary shadow" : "text-muted-foreground")}>👤 Alex</button>
                <button onClick={() => setPayer('tina')} className={cn("flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all", payer === 'tina' ? "bg-background text-primary shadow" : "text-muted-foreground")}>👩 Tina</button>
              </div>
            </div>

            {/* Split Type */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Come dividere
              </label>
              <div className="grid grid-cols-4 gap-2">
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

              {splitType === 'custom' && (
                <div className="mt-4 grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-xl">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Quota Alex (€)</label>
                    <input type="number" value={manualAlex} onChange={(e) => setManualAlex(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background" placeholder="0.00" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Quota Tina (€)</label>
                    <input type="number" value={manualTina} onChange={(e) => setManualTina(e.target.value)} className="w-full p-2 rounded-lg border border-border bg-background" placeholder="0.00" />
                  </div>
                </div>
              )}
            </div>

            {/* Date Picker - Limita a date viaggio */}
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Data Spesa
              </label>
              <MobileDatePicker
                value={expenseDate}
                onChange={setExpenseDate}
                label="📅 Seleziona data"
                minDate={currentTrip.start_date}
                maxDate={currentTrip.end_date}
              />
              <p className="text-xs text-muted-foreground mt-1 ml-1">
                Viaggio: {new Date(currentTrip.start_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - {new Date(currentTrip.end_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
              </p>
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
