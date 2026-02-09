import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Clock } from "lucide-react";
import { getActivityLogs, formatRelativeTime, getActionEmoji, type ActivityLog } from "@/lib/activity-log";
import { useTrip } from "@/lib/trip-context";
import { cn } from "@/lib/utils";

export function ActivityLogPanel() {
    const { currentTrip } = useTrip();
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentTrip && isOpen) {
            loadLogs();
        }
    }, [currentTrip, isOpen]);

    const loadLogs = async () => {
        if (!currentTrip) return;
        setLoading(true);
        const data = await getActivityLogs(currentTrip.id);
        setLogs(data);
        setLoading(false);
    };

    if (!currentTrip) return null;

    return (
        <div className="mt-6">
            {/* Collapsible Header - subtle design */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
                <Clock className="w-3 h-3" />
                <span>Cronologia attività</span>
                <ChevronDown className={cn(
                    "w-3 h-3 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Log Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/30 mt-2">
                            {loading ? (
                                <p className="text-center text-xs text-muted-foreground py-4">Caricamento...</p>
                            ) : logs.length === 0 ? (
                                <p className="text-center text-xs text-muted-foreground py-4">
                                    Nessuna attività registrata
                                </p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {logs.map((log) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-start gap-2 text-xs"
                                        >
                                            <span className="text-base">{getActionEmoji(log.action)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate">
                                                    <span className={cn(
                                                        "font-medium",
                                                        log.actor === "Alex" ? "text-blue-500" : "text-pink-500"
                                                    )}>
                                                        {log.actor}
                                                    </span>
                                                    {" "}
                                                    <span className="text-muted-foreground">{log.description}</span>
                                                </p>
                                            </div>
                                            <span className="text-muted-foreground/60 whitespace-nowrap">
                                                {formatRelativeTime(log.created_at)}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
