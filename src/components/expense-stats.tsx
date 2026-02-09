import { useMemo } from "react";
import { motion } from "framer-motion";
import { PieChart, TrendingUp, Calendar } from "lucide-react";
import { type Expense } from "@/lib/supabase";

interface ExpenseStatsProps {
    expenses: Expense[];
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
    food: { label: "Cibo", color: "#ef4444", emoji: "🍽️" },
    transport: { label: "Trasporti", color: "#3b82f6", emoji: "🚗" },
    accommodation: { label: "Alloggio", color: "#8b5cf6", emoji: "🏨" },
    activities: { label: "Attività", color: "#10b981", emoji: "🎭" },
    shopping: { label: "Shopping", color: "#f59e0b", emoji: "🛍️" },
    other: { label: "Altro", color: "#6b7280", emoji: "💰" },
};

export function ExpenseStats({ expenses }: ExpenseStatsProps) {
    const stats = useMemo(() => {
        const byCategory: Record<string, number> = {};
        const byDate: Record<string, number> = {};
        let alexPaid = 0;
        let tinaPaid = 0;

        expenses.forEach((exp) => {
            // By category
            byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount_in_eur;

            // By date
            const date = exp.expense_date.split('T')[0];
            byDate[date] = (byDate[date] || 0) + exp.amount_in_eur;

            // By payer
            if (exp.split_type === 'me') {
                alexPaid += exp.amount_in_eur;
            } else if (exp.split_type === 'partner') {
                tinaPaid += exp.amount_in_eur;
            } else {
                alexPaid += exp.amount_in_eur / 2;
                tinaPaid += exp.amount_in_eur / 2;
            }
        });

        const total = expenses.reduce((sum, e) => sum + e.amount_in_eur, 0);
        const sortedDates = Object.keys(byDate).sort();
        const maxDaily = Math.max(...Object.values(byDate), 1);

        return { byCategory, byDate, sortedDates, total, maxDaily, alexPaid, tinaPaid };
    }, [expenses]);

    if (expenses.length === 0) return null;

    return (
        <div className="space-y-6">
            {/* Category Breakdown */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl glass border border-border/50"
            >
                <div className="flex items-center gap-2 mb-4">
                    <PieChart className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Spese per Categoria</h3>
                </div>

                <div className="space-y-3">
                    {Object.entries(stats.byCategory)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, amount]) => {
                            const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
                            const percentage = (amount / stats.total) * 100;

                            return (
                                <div key={category}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="flex items-center gap-2 text-sm">
                                            <span>{config.emoji}</span>
                                            <span>{config.label}</span>
                                        </span>
                                        <span className="text-sm font-medium">
                                            €{amount.toFixed(2)} ({percentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: config.color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </motion.div>

            {/* Who Paid What */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 rounded-2xl glass border border-border/50"
            >
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Chi ha pagato cosa</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm text-muted-foreground mb-1">Alex ha pagato</p>
                        <p className="text-2xl font-bold text-blue-500">€{stats.alexPaid.toFixed(2)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                        <p className="text-sm text-muted-foreground mb-1">Tina ha pagato</p>
                        <p className="text-2xl font-bold text-pink-500">€{stats.tinaPaid.toFixed(2)}</p>
                    </div>
                </div>
            </motion.div>

            {/* Daily Trend */}
            {stats.sortedDates.length > 1 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 rounded-2xl glass border border-border/50"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Trend Giornaliero</h3>
                    </div>

                    <div className="flex items-end gap-1 h-24">
                        {stats.sortedDates.slice(-7).map((date) => {
                            const amount = stats.byDate[date];
                            const height = (amount / stats.maxDaily) * 100;
                            const day = new Date(date).toLocaleDateString("it-IT", { weekday: "short" });

                            return (
                                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        transition={{ duration: 0.5 }}
                                        className="w-full bg-primary/80 rounded-t-md min-h-[4px]"
                                        title={`€${amount.toFixed(2)}`}
                                    />
                                    <span className="text-[10px] text-muted-foreground">{day}</span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
