import { useEffect, useState } from "react";
import { useTrip } from "@/lib/trip-context";
import { supabase, type Expense } from "@/lib/supabase";
import { TripSelector } from "@/components/trip-selector";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, PiggyBank, Calendar, MapPin } from "lucide-react";

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

export default function StatsPage() {
    const { trips, currentTrip } = useTrip();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

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

    // Stats per categoria (viaggio corrente)
    const categoryData = Object.entries(
        expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {} as Record<string, number>)
    ).map(([name, value]) => ({
        name: CATEGORY_LABELS[name] || name,
        value: Math.round(value * 100) / 100,
        color: CATEGORY_COLORS[name] || "#6b7280"
    }));

    // Stats per viaggio (tutti i viaggi)
    const tripData = trips.map(trip => {
        const tripExpenses = allExpenses.filter(e => e.trip_id === trip.id);
        const total = tripExpenses.reduce((sum, e) => sum + e.amount, 0);
        return {
            name: trip.name.length > 12 ? trip.name.slice(0, 12) + "..." : trip.name,
            speso: Math.round(total),
            costo: trip.budget || 0
        };
    }).filter(t => t.speso > 0 || t.costo > 0);

    // Calcolo Bilancio Globale
    let globalAlexPaid = 0;
    let globalAlexConsumed = 0;
    let globalTinaConsumed = 0;

    // Helper duplicato da WalletDashboard per sicurezza
    const calculateSplit = (amount: number, splitType: string, manualAlex: number = 0, manualTina: number = 0) => {
        switch (splitType) {
            case 'me': return { alex: amount, tina: 0 };
            case 'partner': return { alex: 0, tina: amount };
            case '70-30': return { alex: amount * 0.7, tina: amount * 0.3 };
            case '60-40': return { alex: amount * 0.6, tina: amount * 0.4 };
            case 'custom': return { alex: manualAlex, tina: manualTina };
            case 'equal':
            default: return { alex: amount / 2, tina: amount / 2 };
        }
    };

    // 1. Aggiungi il costo iniziale dei viaggi al conteggio
    trips.forEach(trip => {
        const tripCost = trip.budget || 0;
        const tripPayer = (trip.cost_payer as "alex" | "tina" | "split") || 'split';
        const tripCostPerPerson = tripCost / 2;

        if (tripPayer === 'alex') {
            globalAlexPaid += tripCost;
        } else if (tripPayer === 'split') {
            globalAlexPaid += tripCostPerPerson;
        }
        // Se ha pagato Tina, alexPaid non aumenta.

        globalAlexConsumed += tripCostPerPerson;
        globalTinaConsumed += tripCostPerPerson;
    });

    allExpenses.forEach(e => {
        const amount = e.amount_in_eur;
        const payer = e.payer || (e.split_type === 'partner' ? 'tina' : 'alex');

        if (payer === 'alex') globalAlexPaid += amount;

        const split = calculateSplit(amount, e.split_type, e.split_manual_alex, e.split_manual_tina);
        globalAlexConsumed += split.alex;
        globalTinaConsumed += split.tina;
    });

    const globalBalance = globalAlexPaid - globalAlexConsumed;

    // Totali
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalAllTime = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const avgPerTrip = trips.length > 0 ? totalAllTime / trips.length : 0;

    if (loading) {
        return (
            <div className="container max-w-2xl mx-auto px-4 py-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-muted rounded w-1/3" />
                    <div className="h-64 bg-muted rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto px-4 py-6 pb-24">
            <header className="mb-6 space-y-4">
                <div>
                    <h1 className="text-3xl font-bold">Statistiche</h1>
                    <p className="text-muted-foreground text-sm">Analizza le tue spese</p>
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
                        <p className="text-lg font-bold text-blue-500">€{globalAlexConsumed.toFixed(0)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Lei ha speso</p>
                        <p className="text-lg font-bold text-pink-500">€{globalTinaConsumed.toFixed(0)}</p>
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

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Totale storico</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">€{totalAllTime.toFixed(0)}</p>
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
            </div>

            {/* Pie Chart - Spese per categoria */}
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
                                        borderRadius: '12px'
                                    }}
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
                                        borderRadius: '12px'
                                    }}
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
        </div>
    );
}
