import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ArrowRight, AlertTriangle } from "lucide-react";
import { Drawer } from "vaul";
import { supabase } from "@/lib/supabase";
import { useTrip } from "@/lib/trip-context";
import { useToast } from "@/components/toast";

interface SettleDebtDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    balance: number; // positive = Tina owes Alex, negative = Alex owes Tina
    onSettled: () => void;
}

export function SettleDebtDrawer({ open, onOpenChange, balance, onSettled }: SettleDebtDrawerProps) {
    const { currentTrip } = useTrip();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [confirmStep, setConfirmStep] = useState(false);

    const creditor = balance > 0 ? "Alex" : "Tina";
    const debtor = balance > 0 ? "Tina" : "Alex";
    const amount = Math.abs(balance);

    const handleSettle = async () => {
        if (!currentTrip || amount < 1) return;

        setLoading(true);
        try {
            // The debtor pays, so payer = debtor
            const payerValue = balance > 0 ? 'tina' : 'alex';

            const { error } = await supabase.from('expenses').insert({
                trip_id: currentTrip.id,
                amount: amount,
                original_currency: 'EUR',
                amount_in_eur: amount,
                category: 'other',
                description: `💸 Saldo debito: ${debtor} → ${creditor}`,
                paid_by_user_id: null,
                payer: payerValue,
                split_type: balance > 0 ? 'partner' : 'me',
                expense_date: new Date().toISOString().split('T')[0],
            });

            if (error) throw error;

            toast('Debito saldato! ✅', 'success');
            setConfirmStep(false);
            onOpenChange(false);
            onSettled();
        } catch (error) {
            console.error('Errore saldo:', error);
            toast('Errore nel registrare il saldo.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Reset confirm step when drawer closes
    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setConfirmStep(false);
        }
        onOpenChange(isOpen);
    };

    if (Math.abs(balance) < 1) return null;

    return (
        <Drawer.Root open={open} onOpenChange={handleOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content
                    className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl glass border-t border-border/50"
                    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                >
                    <div className="flex-shrink-0 mx-auto w-12 h-1.5 rounded-full bg-muted my-4" />

                    <div className="px-4 pb-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Salda Debito</h2>
                            <button
                                onClick={() => handleOpenChange(false)}
                                className="p-2 rounded-full hover:bg-muted transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Amount Display */}
                        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 mb-6">
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-2">
                                        <span className="text-xl">👤</span>
                                    </div>
                                    <p className="font-medium">{debtor}</p>
                                </div>

                                <div className="flex flex-col items-center">
                                    <ArrowRight className="w-6 h-6 text-green-500" />
                                    <p className="text-2xl font-bold text-green-500 mt-1">€{amount.toFixed(2)}</p>
                                </div>

                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                                        <span className="text-xl">👤</span>
                                    </div>
                                    <p className="font-medium">{creditor}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-center text-muted-foreground mb-6">
                            Conferma che {debtor} ha pagato €{amount.toFixed(2)} a {creditor} per saldare il debito.
                        </p>

                        <AnimatePresence mode="wait">
                            {!confirmStep ? (
                                /* Step 1: First press */
                                <motion.button
                                    key="step1"
                                    initial={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setConfirmStep(true)}
                                    className="w-full h-14 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    Conferma Saldo
                                </motion.button>
                            ) : (
                                /* Step 2: "Sei sicuro?" confirmation */
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                                >
                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-amber-500 text-sm">Sei sicuro?</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Questa azione registrerà il pagamento di €{amount.toFixed(2)}.
                                                Potrai annullarla eliminando la voce dallo storico saldi.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setConfirmStep(false)}
                                            className="h-14 rounded-xl bg-muted text-foreground font-semibold text-base"
                                        >
                                            Annulla
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleSettle}
                                            disabled={loading}
                                            className="h-14 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold text-base disabled:opacity-50 shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                                        >
                                            {loading ? "Registro..." : "✅ Confermo"}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
