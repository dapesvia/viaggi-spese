import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface MobileDatePickerProps {
    value: string;
    onChange: (date: string) => void;
    minDate?: string;
    maxDate?: string;
    placeholder?: string;
    label?: string;
}

const MONTHS = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function MobileDatePicker({
    value,
    onChange,
    minDate,
    maxDate,
    placeholder = "Seleziona data",
    label
}: MobileDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        return value ? new Date(value) : new Date();
    });

    const selectedDate = value ? new Date(value) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDateObj = minDate ? new Date(minDate) : null;
    const maxDateObj = maxDate ? new Date(maxDate) : null;

    const calendar = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Adjust for Monday start (0 = Monday, 6 = Sunday)
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;

        const days: (Date | null)[] = [];

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }

        // Days of month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [viewDate]);

    const prevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const selectDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        onChange(dateStr);
        setIsOpen(false);
    };

    const isDateDisabled = (date: Date) => {
        if (minDateObj && date < minDateObj) return true;
        if (maxDateObj && date > maxDateObj) return true;
        return false;
    };

    const isSelected = (date: Date) => {
        if (!selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const isToday = (date: Date) => {
        return date.toDateString() === today.toDateString();
    };

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('it-IT', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <>
            {/* Trigger Button */}
            <div>
                {label && (
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        {label}
                    </label>
                )}
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="w-full p-4 rounded-xl border-2 border-border bg-background hover:border-primary/50 focus:border-primary transition-colors text-left flex items-center justify-between"
                >
                    <span className={value ? "text-foreground" : "text-muted-foreground"}>
                        {value ? formatDisplayDate(value) : placeholder}
                    </span>
                    <span className="text-2xl">📅</span>
                </button>
            </div>

            {/* Calendar Modal */}
            {isOpen && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-full hover:bg-muted transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h3 className="text-lg font-bold">Seleziona Data</h3>
                                <div className="w-9" />
                            </div>

                            {/* Month Navigation */}
                            <div className="flex items-center justify-between p-4">
                                <button
                                    onClick={prevMonth}
                                    className="p-3 rounded-xl hover:bg-muted transition-colors active:scale-95"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-lg font-semibold">
                                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                                </span>
                                <button
                                    onClick={nextMonth}
                                    className="p-3 rounded-xl hover:bg-muted transition-colors active:scale-95"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Days of Week */}
                            <div className="grid grid-cols-7 gap-1 px-4">
                                {DAYS.map((day) => (
                                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1 p-4 pt-0">
                                {calendar.map((date, index) => (
                                    <div key={index} className="aspect-square">
                                        {date && (
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => !isDateDisabled(date) && selectDate(date)}
                                                disabled={isDateDisabled(date)}
                                                className={cn(
                                                    "w-full h-full rounded-xl flex items-center justify-center text-sm font-medium transition-all",
                                                    isSelected(date) && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                                                    isToday(date) && !isSelected(date) && "border-2 border-primary text-primary",
                                                    isDateDisabled(date) && "opacity-30 cursor-not-allowed",
                                                    !isSelected(date) && !isToday(date) && !isDateDisabled(date) && "hover:bg-muted active:bg-muted"
                                                )}
                                            >
                                                {date.getDate()}
                                            </motion.button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 p-4 pt-0">
                                <button
                                    onClick={() => selectDate(today)}
                                    className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors"
                                >
                                    Oggi
                                </button>
                                <button
                                    onClick={() => selectDate(new Date(today.getTime() + 86400000))}
                                    className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors"
                                >
                                    Domani
                                </button>
                            </div>

                            {/* Safe area padding for mobile */}
                            <div className="h-6" />
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
