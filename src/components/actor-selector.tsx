import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentActor, setCurrentActor } from "@/lib/activity-log";
import { cn } from "@/lib/utils";

export function ActorSelector() {
    const [actor, setActor] = useState<"Alex" | "Tina">("Alex");
    const [showSelector, setShowSelector] = useState(false);

    useEffect(() => {
        setActor(getCurrentActor());
    }, []);

    const handleSelect = (newActor: "Alex" | "Tina") => {
        setActor(newActor);
        setCurrentActor(newActor);
        setShowSelector(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowSelector(!showSelector)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95",
                    actor === "Alex"
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        : "bg-pink-500/10 text-pink-500 border border-pink-500/20"
                )}
            >
                <span className="text-base">{actor === "Alex" ? "👤" : "👩"}</span>
                <span>{actor}</span>
            </button>

            <AnimatePresence>
                {showSelector && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setShowSelector(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 top-full mt-2 z-50 bg-background border border-border rounded-xl shadow-xl overflow-hidden min-w-[140px]"
                        >
                            <div className="p-1">
                                <button
                                    onClick={() => handleSelect("Alex")}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                        actor === "Alex" ? "bg-blue-500/10" : "hover:bg-muted"
                                    )}
                                >
                                    <span className="text-xl">👤</span>
                                    <span className={cn(
                                        "font-medium",
                                        actor === "Alex" && "text-blue-500"
                                    )}>Alex</span>
                                </button>
                                <button
                                    onClick={() => handleSelect("Tina")}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                        actor === "Tina" ? "bg-pink-500/10" : "hover:bg-muted"
                                    )}
                                >
                                    <span className="text-xl">👩</span>
                                    <span className={cn(
                                        "font-medium",
                                        actor === "Tina" && "text-pink-500"
                                    )}>Tina</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
