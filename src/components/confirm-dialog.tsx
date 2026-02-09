import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Elimina",
    loading = false
}: ConfirmDialogProps) {
    const [step, setStep] = useState(1);

    const handleConfirm = () => {
        if (step === 1) {
            setStep(2);
        } else {
            onConfirm();
        }
    };

    const handleClose = () => {
        setStep(1);
        onClose();
    };

    if (!open) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm p-6 rounded-2xl bg-background border border-border shadow-2xl"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-destructive" />
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold mb-2">{title}</h3>
                    <p className="text-muted-foreground mb-6">{message}</p>

                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20"
                        >
                            <p className="text-sm text-destructive font-medium">
                                ⚠️ Sei sicuro? Questa azione è irreversibile!
                            </p>
                        </motion.div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
                        >
                            Annulla
                        </button>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-destructive text-white font-medium disabled:opacity-50"
                        >
                            {loading ? "Eliminazione..." : step === 1 ? confirmText : "Conferma eliminazione"}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
