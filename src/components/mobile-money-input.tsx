import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface MobileMoneyInputProps {
    value: string;
    onChange: (value: string) => void;
    currency?: string;
    onCurrencyChange?: (currency: string) => void;
    label?: string;
    placeholder?: string;
}

const CURRENCIES = [
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "USD", symbol: "$", name: "Dollaro USA" },
    { code: "GBP", symbol: "£", name: "Sterlina" },
    { code: "CHF", symbol: "Fr", name: "Franco Svizzero" },
    { code: "JPY", symbol: "¥", name: "Yen" },
    { code: "CZK", symbol: "Kč", name: "Corona Ceca" },
    { code: "PLN", symbol: "zł", name: "Zloty" },
    { code: "HRK", symbol: "kn", name: "Kuna Croata" },
    { code: "THB", symbol: "฿", name: "Baht Thai" },
];

export function MobileMoneyInput({
    value,
    onChange,
    currency = "EUR",
    onCurrencyChange,
    label,
    placeholder = "0.00"
}: MobileMoneyInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showCurrencies, setShowCurrencies] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const currentCurrency = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    const handleOpen = () => {
        setTempValue(value);
        setIsOpen(true);
    };

    const handleKeyPress = (key: string) => {
        if (key === "backspace") {
            setTempValue(prev => prev.slice(0, -1));
        } else if (key === ".") {
            if (!tempValue.includes(".")) {
                setTempValue(prev => prev + ".");
            }
        } else if (key === "clear") {
            setTempValue("");
        } else {
            // Limit decimal places to 2
            const parts = tempValue.split(".");
            if (parts[1]?.length >= 2) return;
            setTempValue(prev => prev + key);
        }
    };

    const handleConfirm = () => {
        onChange(tempValue);
        setIsOpen(false);
    };

    const selectCurrency = (code: string) => {
        onCurrencyChange?.(code);
        setShowCurrencies(false);
    };

    return (
        <>
            {/* Trigger */}
            <div>
                {label && (
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {label}
                    </label>
                )}
                <button
                    type="button"
                    onClick={handleOpen}
                    className="w-full p-4 rounded-xl border-2 border-border bg-background hover:border-primary/50 focus:border-primary transition-colors"
                >
                    <div className="flex items-center justify-center gap-2">
                        {onCurrencyChange && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCurrencies(true);
                                }}
                                className="px-3 py-1 rounded-lg bg-muted text-sm font-medium"
                            >
                                {currentCurrency.code}
                            </button>
                        )}
                        <span className={cn(
                            "text-3xl font-bold",
                            value ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {currentCurrency.symbol}{value || placeholder}
                        </span>
                    </div>
                </button>
            </div>

            {/* Numeric Keypad Modal */}
            {isOpen && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-background rounded-t-3xl overflow-hidden"
                        >
                            {/* Amount Display */}
                            <div className="p-6 border-b border-border">
                                <div className="flex items-center justify-center gap-3">
                                    {onCurrencyChange && (
                                        <button
                                            onClick={() => setShowCurrencies(true)}
                                            className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors"
                                        >
                                            {currentCurrency.code}
                                        </button>
                                    )}
                                    <span className="text-4xl font-bold text-primary">
                                        {currentCurrency.symbol}{tempValue || "0.00"}
                                    </span>
                                </div>
                            </div>

                            {/* Keypad */}
                            <div className="grid grid-cols-3 gap-2 p-4">
                                {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"].map((key) => (
                                    <motion.button
                                        key={key}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleKeyPress(key)}
                                        className="h-16 rounded-2xl bg-muted hover:bg-muted/80 font-bold text-xl flex items-center justify-center transition-colors active:bg-muted/60"
                                    >
                                        {key === "backspace" ? <Delete className="w-6 h-6" /> : key}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 p-4 pt-0">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 h-14 rounded-xl border-2 border-border font-semibold transition-colors hover:bg-muted"
                                >
                                    Annulla
                                </button>
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleConfirm}
                                    disabled={!tempValue}
                                    className="flex-1 h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    Conferma
                                </motion.button>
                            </div>

                            <div className="h-6" />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}

            {/* Currency Picker */}
            {showCurrencies && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60"
                        onClick={() => setShowCurrencies(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-background rounded-t-3xl max-h-[60vh] overflow-hidden"
                        >
                            <div className="p-4 border-b border-border">
                                <h3 className="text-lg font-bold text-center">Seleziona Valuta</h3>
                            </div>
                            <div className="overflow-y-auto max-h-[50vh]">
                                {CURRENCIES.map((curr) => (
                                    <button
                                        key={curr.code}
                                        onClick={() => selectCurrency(curr.code)}
                                        className={cn(
                                            "w-full p-4 flex items-center gap-4 hover:bg-muted transition-colors",
                                            curr.code === currency && "bg-primary/10"
                                        )}
                                    >
                                        <span className="text-2xl w-10">{curr.symbol}</span>
                                        <div className="text-left">
                                            <p className="font-medium">{curr.code}</p>
                                            <p className="text-sm text-muted-foreground">{curr.name}</p>
                                        </div>
                                        {curr.code === currency && (
                                            <Check className="w-5 h-5 text-primary ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="h-6" />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
