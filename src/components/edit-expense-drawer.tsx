import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Euro, Calendar, Save } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { supabase, type Expense } from "@/lib/supabase";
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

interface EditExpenseDrawerProps {
    expense: Expense | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

export function EditExpenseDrawer({ expense, open, onOpenChange, onSaved }: EditExpenseDrawerProps) {
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("food");
    const [splitType, setSplitType] = useState("equal");
    const [payer, setPayer] = useState<"alex" | "tina">("alex");
    const [manualAlex, setManualAlex] = useState("");
    const [manualTina, setManualTina] = useState("");
    const [description, setDescription] = useState("");
    const [expenseDate, setExpenseDate] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (expense) {
            setAmount(expense.amount_in_eur.toString());
            setCategory(expense.category);
            setSplitType(expense.split_type);
            setPayer(expense.payer || (expense.split_type === 'partner' ? 'tina' : 'alex'));
            setManualAlex(expense.split_manual_alex?.toString() || "");
            setManualTina(expense.split_manual_tina?.toString() || "");
            setDescription(expense.description || "");
            setExpenseDate(expense.expense_date.split('T')[0]);
        }
    }, [expense]);

    const handleSave = async () => {
        if (!amount || !expense) return;

        setLoading(true);
        try {
            const updateData: any = {
                amount: parseFloat(amount),
                amount_in_eur: parseFloat(amount),
                category,
                split_type: splitType,
                payer,
                description: description || null,
                expense_date: expenseDate,
            };

            if (splitType === 'custom') {
                updateData.split_manual_alex = parseFloat(manualAlex) || 0;
                updateData.split_manual_tina = parseFloat(manualTina) || 0;
            }

            const { error } = await supabase
                .from('expenses')
                .update(updateData)
                .eq('id', expense.id);

            if (error) throw error;

            onOpenChange(false);
            onSaved();
            toast('Modifiche salvate!', 'success');
        } catch (error) {
            console.error('Errore aggiornamento:', error);
            toast('Errore nel salvare le modifiche.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content
                    className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl glass border-t border-border/50 max-h-[85vh]"
                    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                >
                    <div className="flex-shrink-0 mx-auto w-12 h-1.5 rounded-full bg-muted my-4" />

                    <div className="flex-1 overflow-y-auto px-4 pb-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold">Modifica Spesa</h2>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-2 rounded-full hover:bg-muted transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Amount */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                <Euro className="w-4 h-4 inline mr-1" />
                                Importo
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-4 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors text-2xl font-bold text-center"
                            />
                        </div>

                        {/* Category */}
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
                                            "p-3 rounded-xl border-2 transition-all",
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
                                    <button
                                        key={opt.id}
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
                                    </button>
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
                                className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none"
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Descrizione
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Es: Cena al ristorante"
                                className="w-full p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none"
                            />
                        </div>

                        {/* Save Button */}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={!amount || loading}
                            className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg disabled:opacity-50 shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {loading ? "Salvataggio..." : "Salva Modifiche"}
                        </motion.button>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
