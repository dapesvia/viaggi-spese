"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Euro, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_EXPENSES = [
  { id: "1", category: "food", amount: 45.50, paidBy: "me", date: "2024-02-08", description: "Dinner at Trattoria" },
  { id: "2", category: "transport", amount: 120.00, paidBy: "partner", date: "2024-02-07", description: "Train tickets" },
  { id: "3", category: "accommodation", amount: 350.00, paidBy: "me", date: "2024-02-06", description: "Hotel Rome" },
];

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽️",
  transport: "🚗",
  accommodation: "🏨",
  activities: "🎭",
  shopping: "🛍️",
  other: "💰",
};

export function WalletDashboard() {
  const totalSpent = MOCK_EXPENSES.reduce((sum, exp) => sum + exp.amount, 0);
  const budget = 2000;
  const budgetPercentage = (totalSpent / budget) * 100;

  // Calculate balance (who owes who)
  const myTotal = MOCK_EXPENSES.filter(e => e.paidBy === "me").reduce((sum, e) => sum + e.amount, 0);
  const partnerTotal = MOCK_EXPENSES.filter(e => e.paidBy === "partner").reduce((sum, e) => sum + e.amount, 0);
  const balance = myTotal - partnerTotal;

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
            <div className="flex items-center gap-2">
              <Euro className="w-6 h-6 text-primary" />
              <span className="text-3xl font-bold">{totalSpent.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Budget</p>
            <span className="text-2xl font-semibold">€{budget}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              budgetPercentage > 90 ? "bg-destructive" : "bg-primary"
            )}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {budgetPercentage.toFixed(1)}% of budget used
        </p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl glass border border-border/50"
      >
        <h3 className="text-lg font-semibold mb-4">Balance</h3>
        <div className="flex items-center justify-center gap-3">
          {balance > 0 ? (
            <>
              <TrendingUp className="w-6 h-6 text-green-500" />
              <p className="text-xl">
                Partner owes you <span className="font-bold text-green-500">€{Math.abs(balance).toFixed(2)}</span>
              </p>
            </>
          ) : balance < 0 ? (
            <>
              <TrendingDown className="w-6 h-6 text-orange-500" />
              <p className="text-xl">
                You owe partner <span className="font-bold text-orange-500">€{Math.abs(balance).toFixed(2)}</span>
              </p>
            </>
          ) : (
            <p className="text-xl text-muted-foreground">All settled up! 🎉</p>
          )}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Expenses</h3>
        <div className="space-y-3">
          {MOCK_EXPENSES.map((expense, index) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl glass border border-border/50"
            >
              <div className="text-3xl">{CATEGORY_ICONS[expense.category]}</div>
              <div className="flex-1">
                <p className="font-medium">{expense.description}</p>
                <p className="text-sm text-muted-foreground">
                  Paid by {expense.paidBy === "me" ? "you" : "partner"} • {new Date(expense.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">€{expense.amount.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
