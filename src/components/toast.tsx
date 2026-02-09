import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "success") => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast: addToast }}>
            {children}

            {/* Toast container */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            layout
                            className={cn(
                                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl",
                                t.type === "success" && "bg-emerald-500/15 border-emerald-500/25 text-emerald-400",
                                t.type === "error" && "bg-red-500/15 border-red-500/25 text-red-400",
                                t.type === "warning" && "bg-amber-500/15 border-amber-500/25 text-amber-400",
                                t.type === "info" && "bg-blue-500/15 border-blue-500/25 text-blue-400",
                            )}
                        >
                            {t.type === "success" && <Check className="w-5 h-5 flex-shrink-0" />}
                            {t.type === "error" && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                            {t.type === "warning" && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                            {t.type === "info" && <Info className="w-5 h-5 flex-shrink-0" />}
                            <span className="text-sm font-medium text-foreground flex-1">{t.message}</span>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="p-0.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                            >
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
}
