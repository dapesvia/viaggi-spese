import { useEffect, useState, useMemo } from "react";
import { useTrip } from "@/lib/trip-context";
import { supabase, type Expense } from "@/lib/supabase";
import { TripSelector } from "@/components/trip-selector";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, PiggyBank, Calendar, MapPin, ChevronLeft, ChevronRight, X, CalendarDays, Gift } from "lucide-react";
import { createPortal } from "react-dom";
import { calculateSplit } from "@/lib/split-utils";
import { calculateGlobalBalance } from "@/lib/balance-utils";
import { StatsSkeleton } from "@/components/skeleton";

const CATEGORY_COLORS: Record<string, string> = {
    transport: "#3b82f6",
    food: "#f97316",
    accommodation: "#8b5cf6",
    activities: "#10b981",
    shopping: "#ec4899",
    other: "#6b7280"
};

const CATEGORY_LABELS: Record<string, string> = {
    transport: "Trasporti",
    food: "Cibo",
    accommodation: "Alloggio",
    activities: "Attività",
    shopping: "Shopping",
    other: "Altro"
};

const MONTHS = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];
const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// ─────────────────────────────────────────────────────
// Premium Calendar Overlay for the "Totale Storico" card
// ─────────────────────────────────────────────────────

interface StatsCalendarProps {
    open: boolean;
    onClose: () => void;
    tripDates: Set<string>;                  // YYYY-MM-DD strings with trips
    expenseDateAmounts: Map<string, number>;  // YYYY-MM-DD -> total expense amount
    tripDateAmounts: Map<string, number>;     // YYYY-MM-DD -> trip cost allocated
    totalAllTime: number;
    expenses?: Expense[];                     // Raw expenses for person filtering
    giftDateSet?: Set<string>;               // YYYY-MM-DD dates that have gift expenses
}

function StatsCalendar({ open, onClose, tripDates, expenseDateAmounts, tripDateAmounts, totalAllTime, expenses, giftDateSet }: StatsCalendarProps) {
    const [viewDate, setViewDate] = useState(() => new Date());
    const [selectionMode, setSelectionMode] = useState<"single" | "range">("single");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [rangeStart, setRangeStart] = useState<Date | null>(null);
    const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
    const [personFilter, setPersonFilter] = useState<"all" | "alex" | "tina">("all");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calendar = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startDay = firstDay.getDay() - 1;
        if (startDay < 0) startDay = 6;
        const days: (Date | null)[] = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
        return days;
    }, [viewDate]);

    const fmtKey = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const hasTrip = (d: Date) => tripDates.has(fmtKey(d));
    const hasGift = (d: Date) => giftDateSet?.has(fmtKey(d)) ?? false;

    // Recompute expense amounts by person filter
    const filteredExpenseDateAmounts = useMemo(() => {
        if (personFilter === "all" || !expenses) return expenseDateAmounts;
        const map = new Map<string, number>();
        expenses.forEach(e => {
            if (e.payer === personFilter) {
                const key = e.expense_date;
                map.set(key, (map.get(key) || 0) + e.amount);
            }
        });
        return map;
    }, [personFilter, expenses, expenseDateAmounts]);

    // Filtered total for person
    const filteredPersonTotal = useMemo(() => {
        if (personFilter === "all" || !expenses) return totalAllTime;
        return expenses.filter(e => e.payer === personFilter).reduce((sum, e) => sum + e.amount, 0);
    }, [personFilter, expenses, totalAllTime]);

    const isInRange = (d: Date) => {
        if (selectionMode === "single") return selectedDate && d.toDateString() === selectedDate.toDateString();
        if (!rangeStart) return false;
        if (!rangeEnd) return d.toDateString() === rangeStart.toDateString();
        const t = d.getTime();
        return t >= rangeStart.getTime() && t <= rangeEnd.getTime();
    };

    const isRangeStart = (d: Date) => rangeStart && d.toDateString() === rangeStart.toDateString();
    const isRangeEnd = (d: Date) => rangeEnd && d.toDateString() === rangeEnd.toDateString();

    const handleDateClick = (d: Date) => {
        if (selectionMode === "single") {
            if (selectedDate && d.toDateString() === selectedDate.toDateString()) {
                setSelectedDate(null);
            } else {
                setSelectedDate(d);
            }
        } else {
            if (!rangeStart || (rangeStart && rangeEnd)) {
                setRangeStart(d);
                setRangeEnd(null);
            } else {
                if (d.getTime() < rangeStart.getTime()) {
                    setRangeEnd(rangeStart);
                    setRangeStart(d);
                } else {
                    setRangeEnd(d);
                }
            }
        }
    };

    // Calculate filtered total
    const filteredTotal = useMemo(() => {
        if (selectionMode === "single" && !selectedDate) return null;
        if (selectionMode === "range" && !rangeStart) return null;

        let total = 0;
        const useTrips = personFilter === "all"; // trip costs only when viewing "all"

        if (selectionMode === "single" && selectedDate) {
            const key = fmtKey(selectedDate);
            total += (filteredExpenseDateAmounts.get(key) || 0) + (useTrips ? (tripDateAmounts.get(key) || 0) : 0);
        } else if (selectionMode === "range" && rangeStart) {
            const end = rangeEnd || rangeStart;
            const current = new Date(rangeStart);
            while (current <= end) {
                const key = fmtKey(current);
                total += (filteredExpenseDateAmounts.get(key) || 0) + (useTrips ? (tripDateAmounts.get(key) || 0) : 0);
                current.setDate(current.getDate() + 1);
            }
        }

        return total;
    }, [selectedDate, rangeStart, rangeEnd, selectionMode, filteredExpenseDateAmounts, tripDateAmounts, personFilter]);

    const clearSelection = () => {
        setSelectedDate(null);
        setRangeStart(null);
        setRangeEnd(null);
    };

    // Count trips in current month for a small summary
    const tripsInMonth = useMemo(() => {
        let count = 0;
        calendar.forEach(d => {
            if (d && hasTrip(d)) count++;
        });
        return count;
    }, [calendar, tripDates]);

    if (!open) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[95vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                            <h3 className="text-lg font-bold">
                                {personFilter === "all" ? "📊" : personFilter === "alex" ? "👦🏻" : "👩🏻"} Calendario Spese
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {personFilter === "all"
                                    ? `Totale storico: \u20AC${filteredPersonTotal.toFixed(0)}`
                                    : `${personFilter === "alex" ? "Alex" : "Tina"}: \u20AC${filteredPersonTotal.toFixed(0)}`
                                }
                            </p>
                        </div>
                        <div className="w-9" />
                    </div>

                    {/* Person Filter Buttons */}
                    {expenses && expenses.length > 0 && (
                        <div className="flex gap-2 px-4 pt-3">
                            <button
                                onClick={() => setPersonFilter("all")}
                                className={cn(
                                    "flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                                    personFilter === "all"
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                👥 Tutti
                            </button>
                            <button
                                onClick={() => setPersonFilter("alex")}
                                className={cn(
                                    "flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                                    personFilter === "alex"
                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                👦🏻 Alex
                            </button>
                            <button
                                onClick={() => setPersonFilter("tina")}
                                className={cn(
                                    "flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                                    personFilter === "tina"
                                        ? "bg-pink-500 text-white shadow-lg shadow-pink-500/30"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                👩🏻 Tina
                            </button>
                        </div>
                    )}

                    {/* Mode Toggle */}
                    <div className="flex gap-2 px-4 pt-3">
                        <button
                            onClick={() => { setSelectionMode("single"); clearSelection(); }}
                            className={cn(
                                "flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all",
                                selectionMode === "single"
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            📅 Giorno singolo
                        </button>
                        <button
                            onClick={() => { setSelectionMode("range"); clearSelection(); }}
                            className={cn(
                                "flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all",
                                selectionMode === "range"
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            📆 Intervallo date
                        </button>
                    </div>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between p-4">
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                            className="p-3 rounded-xl hover:bg-muted transition-colors active:scale-95">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                            <span className="text-lg font-semibold">
                                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                            </span>
                            {tripsInMonth > 0 && (
                                <p className="text-xs text-primary font-medium">{tripsInMonth} giorni di viaggio</p>
                            )}
                        </div>
                        <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                            className="p-3 rounded-xl hover:bg-muted transition-colors active:scale-95">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-1 px-4">
                        {DAYS.map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 p-4 pt-1">
                        {calendar.map((date, index) => (
                            <div key={index} className="aspect-square relative">
                                {date && (
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => handleDateClick(date)}
                                        className={cn(
                                            "w-full h-full rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative",
                                            isInRange(date) && "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
                                            isInRange(date) && selectionMode === "range" && !isRangeStart(date) && !isRangeEnd(date) && "bg-primary/20 text-primary shadow-none rounded-none",
                                            isRangeStart(date) && selectionMode === "range" && "rounded-r-none",
                                            isRangeEnd(date) && selectionMode === "range" && "rounded-l-none",
                                            date.toDateString() === today.toDateString() && !isInRange(date) && "border-2 border-primary/50 text-primary",
                                            // Gift day highlight
                                            hasGift(date) && !isInRange(date) && date.toDateString() !== today.toDateString() && "bg-pink-500/15 text-pink-400 border border-pink-500/30",
                                            !isInRange(date) && !hasGift(date) && date.toDateString() !== today.toDateString() && "hover:bg-muted active:bg-muted"
                                        )}
                                    >
                                        {date.getDate()}
                                        {/* Trip dot indicator */}
                                        {hasTrip(date) && (
                                            <span className={cn(
                                                "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                                                isInRange(date) ? "bg-white/80" : "bg-primary"
                                            )} />
                                        )}
                                        {/* Gift dot indicator */}
                                        {hasGift(date) && !hasTrip(date) && (
                                            <span className={cn(
                                                "absolute bottom-1 w-1.5 h-1.5 rounded-full",
                                                isInRange(date) ? "bg-pink-300" : "bg-pink-500"
                                            )} />
                                        )}
                                    </motion.button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 px-4 pb-2 justify-center flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            Viaggio
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="w-2 h-2 rounded-full border-2 border-primary/50" />
                            Oggi
                        </div>
                        {giftDateSet && giftDateSet.size > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="w-2 h-2 rounded-full bg-pink-500" />
                                Regalo 🎁
                            </div>
                        )}
                    </div>

                    {/* Filtered Total Result */}
                    <AnimatePresence>
                        {filteredTotal !== null && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="mx-4 mb-3 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">
                                            {selectionMode === "single"
                                                ? `Spese del ${selectedDate?.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}`
                                                : rangeEnd
                                                    ? `Dal ${rangeStart?.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} al ${rangeEnd?.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}`
                                                    : `Dal ${rangeStart?.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}`
                                            }
                                            {personFilter !== "all" && (
                                                <span className="ml-1 font-semibold">
                                                    ({personFilter === "alex" ? "👦🏻 Alex" : "👩🏻 Tina"})
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-2xl font-black text-green-500">{"\u20AC"}{filteredTotal.toFixed(2)}</p>
                                    </div>
                                    <button
                                        onClick={clearSelection}
                                        className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Quick actions */}
                    <div className="flex gap-2 px-4 pb-4">
                        <button
                            onClick={() => {
                                setSelectionMode("single");
                                setSelectedDate(today);
                                setRangeStart(null);
                                setRangeEnd(null);
                            }}
                            className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 font-medium text-sm transition-colors"
                        >
                            Oggi
                        </button>
                        <button
                            onClick={() => {
                                // This month range
                                setSelectionMode("range");
                                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                setRangeStart(startOfMonth);
                                setRangeEnd(endOfMonth);
                                setSelectedDate(null);
                            }}
                            className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 font-medium text-sm transition-colors"
                        >
                            Questo mese
                        </button>
                        <button
                            onClick={() => {
                                // Last 30 days
                                setSelectionMode("range");
                                const start = new Date(today);
                                start.setDate(start.getDate() - 30);
                                setRangeStart(start);
                                setRangeEnd(today);
                                setSelectedDate(null);
                            }}
                            className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 font-medium text-sm transition-colors"
                        >
                            Ultimi 30gg
                        </button>
                    </div>

                    <div className="h-6" />
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}


// ─────────────────────────────────────────────────────
// Stats Page
// ─────────────────────────────────────────────────────

export default function StatsPage() {
    const { trips, currentTrip } = useTrip();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showGiftCalendar, setShowGiftCalendar] = useState(false);

    useEffect(() => {
        loadAllExpenses();
    }, []);

    useEffect(() => {
        if (currentTrip) {
            loadTripExpenses();
        }
    }, [currentTrip]);

    const loadAllExpenses = async () => {
        const { data } = await supabase
            .from('expenses')
            .select('*')
            .order('expense_date', { ascending: false });
        setAllExpenses(data || []);
        setLoading(false);
    };

    const loadTripExpenses = async () => {
        if (!currentTrip) return;
        const { data } = await supabase
            .from('expenses')
            .select('*')
            .eq('trip_id', currentTrip.id);
        setExpenses(data || []);
    };

    // Helper
    const isSettlement = (e: Expense) => e.description?.startsWith('💸');
    const realExpenses = useMemo(() => expenses.filter(e => !isSettlement(e) && e.is_gift !== true), [expenses]);
    const realAllExpenses = useMemo(() => allExpenses.filter(e => !isSettlement(e) && e.is_gift !== true), [allExpenses]);
    const giftExpenses = useMemo(() => allExpenses.filter(e => !isSettlement(e) && e.is_gift === true), [allExpenses]);

    // Build trip date sets for the calendar
    const tripDates = useMemo(() => {
        const dates = new Set<string>();
        trips.forEach(trip => {
            const start = new Date(trip.start_date);
            const end = new Date(trip.end_date);
            const current = new Date(start);
            while (current <= end) {
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, '0');
                const d = String(current.getDate()).padStart(2, '0');
                dates.add(`${y}-${m}-${d}`);
                current.setDate(current.getDate() + 1);
            }
        });
        return dates;
    }, [trips]);

    // Build expense amount by date
    const expenseDateAmounts = useMemo(() => {
        const map = new Map<string, number>();
        realAllExpenses.forEach(e => {
            const key = e.expense_date; // YYYY-MM-DD
            map.set(key, (map.get(key) || 0) + e.amount);
        });
        return map;
    }, [realAllExpenses]);

    // Build trip cost by start date (EXCLUDE gift trips)
    const tripDateAmounts = useMemo(() => {
        const map = new Map<string, number>();
        trips.forEach(t => {
            if (t.budget && !t.is_gift) {
                const key = t.start_date;
                map.set(key, (map.get(key) || 0) + t.budget);
            }
        });
        return map;
    }, [trips]);

    // Build gift expense amount by date
    const giftDateAmounts = useMemo(() => {
        const map = new Map<string, number>();
        giftExpenses.forEach(e => {
            const key = e.expense_date;
            map.set(key, (map.get(key) || 0) + e.amount);
        });
        return map;
    }, [giftExpenses]);

    // Build set of dates that have gift expenses (for calendar highlighting)
    const giftDateSet = useMemo(() => {
        const set = new Set<string>();
        giftExpenses.forEach(e => set.add(e.expense_date));
        trips.filter(t => t.is_gift).forEach(t => set.add(t.start_date));
        return set;
    }, [giftExpenses, trips]);

    // Stats per categoria (viaggio corrente) - EXCLUDE SETTLEMENTS
    const categoryData = Object.entries(
        realExpenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({
        name: CATEGORY_LABELS[name] || name,
        value: Math.round(value * 100) / 100,
        color: CATEGORY_COLORS[name] || "#6b7280"
    })).sort((a, b) => b.value - a.value);

    // Category breakdown for ALL-TIME storico (exclude gifts)
    const storicoCategoryData = Object.entries(
        realAllExpenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({
        name: CATEGORY_LABELS[name] || name,
        value: Math.round(value * 100) / 100,
        color: CATEGORY_COLORS[name] || "#6b7280"
    })).sort((a, b) => b.value - a.value);

    // Category breakdown for GIFT expenses
    const giftCategoryData = Object.entries(
        giftExpenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({
        name: CATEGORY_LABELS[name] || name,
        value: Math.round(value * 100) / 100,
        color: CATEGORY_COLORS[name] || "#6b7280"
    })).sort((a, b) => b.value - a.value);

    // Stats per viaggio (tutti i viaggi) - EXCLUDE SETTLEMENTS
    const tripData = trips.map(trip => {
        const tripExpenses = realAllExpenses.filter(e => e.trip_id === trip.id);
        const total = tripExpenses.reduce((sum, e) => sum + e.amount, 0);
        return {
            name: trip.name.length > 12 ? trip.name.slice(0, 12) + "..." : trip.name,
            speso: Math.round(total),
            costo: trip.budget || 0
        };
    }).filter(t => t.speso > 0 || t.costo > 0);

    // Calcolo Bilancio Globale (include settlements)
    const globalBalance = calculateGlobalBalance(trips, allExpenses);

    // Calcolo "Tu hai speso" REALE (senza rimborsi, senza regali)
    let displayAlexConsumed = 0;
    let displayTinaConsumed = 0;

    trips.forEach(trip => {
        if (trip.is_gift) return;
        const tripCost = trip.budget || 0;
        const tripCostPerPerson = tripCost / 2;
        displayAlexConsumed += tripCostPerPerson;
        displayTinaConsumed += tripCostPerPerson;
    });

    realAllExpenses.forEach(e => {
        const amount = e.amount_in_eur;
        const split = calculateSplit(amount, e.split_type, e.split_manual_alex, e.split_manual_tina);
        displayAlexConsumed += split.alex;
        displayTinaConsumed += split.tina;
    });

    // Totali - EXCLUDE SETTLEMENTS AND GIFTS
    const totalSpentExpenses = realExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTripCost = (currentTrip && !currentTrip.is_gift) ? (currentTrip.budget || 0) : 0;
    const totalSpent = totalSpentExpenses + totalTripCost;

    const totalAllTimeExpenses = realAllExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalAllTimeTrips = trips.filter(t => !t.is_gift).reduce((sum, t) => sum + (t.budget || 0), 0);
    const totalAllTime = totalAllTimeExpenses + totalAllTimeTrips;

    // Gift totals
    const totalGiftExpenses = giftExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalGiftTrips = trips.filter(t => t.is_gift).reduce((sum, t) => sum + (t.budget || 0), 0);
    const totalGifts = totalGiftExpenses + totalGiftTrips;

    const avgPerTrip = trips.length > 0 ? totalAllTime / trips.length : 0;

    if (loading) {
        return (
            <div className="container max-w-2xl mx-auto px-4 py-6">
                <div className="mb-6 space-y-3">
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                </div>
                <StatsSkeleton />
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto px-4 py-6 pb-24">
            <header className="mb-6 space-y-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statistiche</h1>
                    <p className="text-muted-foreground text-xs">Analizza le tue spese 📊</p>
                </div>
                <TripSelector />
            </header>

            {/* Global Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "mb-6 p-6 rounded-3xl border-2 shadow-lg relative overflow-hidden",
                    globalBalance > 5
                        ? "bg-green-500/10 border-green-500/20"
                        : globalBalance < -5
                            ? "bg-orange-500/10 border-orange-500/20"
                            : "bg-muted/30 border-border/50"
                )}
            >
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        ⚖️ Bilancio Globale
                    </h2>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/10 relative z-10">
                    {globalBalance > 5 ? (
                        <>
                            <p className="text-muted-foreground font-medium">Tina ti deve in totale</p>
                            <div className="flex items-center gap-2 text-green-500">
                                <TrendingUp className="w-8 h-8" />
                                <span className="text-4xl font-black tracking-tight">€{Math.abs(globalBalance).toFixed(2)}</span>
                            </div>
                        </>
                    ) : globalBalance < -5 ? (
                        <>
                            <p className="text-muted-foreground font-medium">Devi a Tina in totale</p>
                            <div className="flex items-center gap-2 text-orange-500">
                                <TrendingUp className="w-8 h-8 rotate-180" />
                                <span className="text-4xl font-black tracking-tight">€{Math.abs(globalBalance).toFixed(2)}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="text-3xl">🎉</span>
                            <p className="font-bold text-muted-foreground">Siete pari in totale!</p>
                        </>
                    )}
                </div>

                {/* Totals overlay */}
                <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Tu hai speso</p>
                        <p className="text-lg font-bold text-blue-500">€{displayAlexConsumed.toFixed(0)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Lei ha speso</p>
                        <p className="text-lg font-bold text-pink-500">€{displayTinaConsumed.toFixed(0)}</p>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <PiggyBank className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-muted-foreground">Questo viaggio</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-500">€{totalSpent.toFixed(0)}</p>
                </motion.div>

                {/* TOTALE STORICO — clickable to open calendar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setShowCalendar(true)}
                    className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 cursor-pointer hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 transition-all active:scale-[0.97] group relative"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Totale storico</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-green-500">€{totalAllTime.toFixed(0)}</p>
                        <CalendarDays className="w-5 h-5 text-green-500/50 group-hover:text-green-500 transition-colors" />
                    </div>
                    <p className="text-[10px] text-green-500/60 mt-1 group-hover:text-green-500/80 transition-colors">
                        Tap per calendario →
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        <span className="text-xs text-muted-foreground">Viaggi totali</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-500">{trips.length}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="text-xs text-muted-foreground">Media/viaggio</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-500">€{avgPerTrip.toFixed(0)}</p>
                </motion.div>

                {/* TOTALE REGALI */}
                {totalGifts > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        onClick={() => setShowGiftCalendar(true)}
                        className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 cursor-pointer hover:border-pink-500/40 hover:shadow-lg hover:shadow-pink-500/10 transition-all active:scale-[0.97] group relative"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Gift className="w-4 h-4 text-pink-500" />
                            <span className="text-xs text-muted-foreground">Totale regali</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold text-pink-500">&euro;{totalGifts.toFixed(0)}</p>
                            <CalendarDays className="w-5 h-5 text-pink-500/50 group-hover:text-pink-500 transition-colors" />
                        </div>
                        <p className="text-[10px] text-pink-500/60 mt-1 group-hover:text-pink-500/80 transition-colors">
                            Tap per calendario &rarr;
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Storico Category Breakdown */}
            {storicoCategoryData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/15"
                >
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Categorie Storico
                    </h3>
                    <div className="space-y-2">
                        {storicoCategoryData.map((cat) => {
                            const pct = totalAllTimeExpenses > 0 ? (cat.value / totalAllTimeExpenses) * 100 : 0;
                            return (
                                <div key={cat.name} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between text-xs mb-0.5">
                                            <span className="font-medium">{cat.name}</span>
                                            <span className="text-muted-foreground">&euro;{cat.value.toFixed(0)} ({pct.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: 0.5, duration: 0.6 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Gift Category Breakdown */}
            {giftCategoryData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-pink-500/5 to-rose-500/5 border border-pink-500/15"
                >
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-pink-500" />
                        Categorie Regali
                    </h3>
                    <div className="space-y-2">
                        {giftCategoryData.map((cat) => {
                            const pct = totalGiftExpenses > 0 ? (cat.value / totalGiftExpenses) * 100 : 0;
                            return (
                                <div key={cat.name} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between text-xs mb-0.5">
                                            <span className="font-medium">{cat.name}</span>
                                            <span className="text-muted-foreground">&euro;{cat.value.toFixed(0)} ({pct.toFixed(0)}%)</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ delay: 0.6, duration: 0.6 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
            {categoryData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6 p-4 rounded-2xl bg-card border border-border"
                >
                    <h2 className="text-lg font-semibold mb-4">Spese per Categoria</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`€${(value as number).toFixed(2)}`, 'Speso']}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mt-2 justify-center">
                        {categoryData.map((cat) => (
                            <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                />
                                <span>{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Bar Chart - Confronto viaggi */}
            {tripData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-2xl bg-card border border-border"
                >
                    <h2 className="text-lg font-semibold mb-4">Confronto Viaggi</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tripData} layout="vertical">
                                <XAxis type="number" tickFormatter={(v) => `€${v}`} />
                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value) => [`€${value}`, '']}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                                />
                                <Legend />
                                <Bar dataKey="speso" name="Spese Extra" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="costo" name="Costo Iniziale" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* Empty state */}
            {categoryData.length === 0 && tripData.length === 0 && (
                <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nessun dato</h3>
                    <p className="text-muted-foreground text-sm">
                        Aggiungi spese per vedere le statistiche
                    </p>
                </div>
            )}

            {/* Calendar Overlay - Storico */}
            <StatsCalendar
                open={showCalendar}
                onClose={() => setShowCalendar(false)}
                tripDates={tripDates}
                expenseDateAmounts={expenseDateAmounts}
                tripDateAmounts={tripDateAmounts}
                totalAllTime={totalAllTime}
                expenses={realAllExpenses}
                giftDateSet={giftDateSet}
            />

            {/* Calendar Overlay - Regali */}
            <StatsCalendar
                open={showGiftCalendar}
                onClose={() => setShowGiftCalendar(false)}
                tripDates={tripDates}
                expenseDateAmounts={giftDateAmounts}
                tripDateAmounts={new Map()}
                totalAllTime={totalGifts}
                expenses={giftExpenses}
            />
        </div>
    );
}
