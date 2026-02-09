"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Euro, Receipt, User, Users } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "food", label: "Food", emoji: "🍽️" },
  { id: "transport", label: "Transport", emoji: "🚗" },
  { id: "accommodation", label: "Stay", emoji: "🏨" },
  { id: "activities", label: "Activities", emoji: "🎭" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "other", label: "Other", emoji: "💰" },
];

const SPLIT_TYPES = [
  { id: "equal", label: "Split 50/50", icon: Users },
  { id: "me", label: "Just Me", icon: User },
  { id: "partner", label: "Just Partner", icon: User },
];

interface AddExpenseDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddExpenseDrawer({ open, onOpenChange }: AddExpenseDrawerProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [splitType, setSplitType] = useState("equal");
  const [paidBy, setPaidBy] = useState<"me" | "partner">("me");

  const handleNumberClick = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    if (amount.split(".")[1]?.length >= 2) return;
    setAmount((prev) => prev + num);
  };

  const handleBackspace = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const handleSave = () => {
    // TODO: Save to Supabase
    console.log({ amount, category, splitType, paidBy });
    onOpenChange(false);
    setAmount("");
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl glass border-t border-border/50 max-h-[90vh]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex-shrink-0 mx-auto w-12 h-1.5 rounded-full bg-muted my-4" />

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Add Expense</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Display */}
            <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-center gap-2 text-4xl font-bold">
                <Euro className="w-8 h-8 text-primary" />
                <span>{amount || "0.00"}</span>
              </div>
            </div>

            {/* Category Selection */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Category
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

            {/* Paid By */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Paid by
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaidBy("me")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all",
                    paidBy === "me"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <User className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Me</div>
                </button>
                <button
                  onClick={() => setPaidBy("partner")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all",
                    paidBy === "partner"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <User className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Partner</div>
                </button>
              </div>
            </div>

            {/* Split Type */}
            <div className="mb-6">
              <label className="text-sm font-medium text-muted-foreground mb-3 block">
                Split
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SPLIT_TYPES.map((split) => (
                  <button
                    key={split.id}
                    onClick={() => setSplitType(split.id)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all",
                      splitType === split.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <split.icon className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">{split.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((key) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => (key === "⌫" ? handleBackspace() : handleNumberClick(key))}
                  className="h-16 rounded-xl bg-muted hover:bg-muted/80 font-semibold text-lg transition-colors"
                >
                  {key}
                </motion.button>
              ))}
            </div>

            {/* Save Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={!amount || amount === "0"}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Expense
            </motion.button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
