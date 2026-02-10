import { useState, useRef, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface MobileTimePickerProps {
    value: string; // HH:mm format
    onChange: (time: string) => void;
    label?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const ITEM_HEIGHT = 40; // Height of each number item

export function MobileTimePicker({ value, onChange, label }: MobileTimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Parse initial value or default to current time
    const initialTime = value || new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const [selectedHour, setSelectedHour] = useState(initialTime.split(':')[0]);
    const [selectedMinute, setSelectedMinute] = useState(initialTime.split(':')[1]);

    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    // Scroll to selected position when opening
    useEffect(() => {
        if (isOpen) {
            // Small timeout to allow render
            setTimeout(() => {
                if (hourRef.current) {
                    const index = HOURS.indexOf(selectedHour);
                    hourRef.current.scrollTop = index * ITEM_HEIGHT;
                }
                if (minuteRef.current) {
                    const index = MINUTES.indexOf(selectedMinute);
                    minuteRef.current.scrollTop = index * ITEM_HEIGHT;
                }
            }, 50);
        }
    }, [isOpen, selectedHour, selectedMinute]);

    const handleScroll = (type: 'hour' | 'minute', e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        const scrollTop = target.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);

        if (type === 'hour') {
            const hour = HOURS[index] || HOURS[0];
            setSelectedHour(hour);
        } else {
            const minute = MINUTES[index] || MINUTES[0];
            setSelectedMinute(minute);
        }
    };

    const confirmSelection = () => {
        onChange(`${selectedHour}:${selectedMinute}`);
        setIsOpen(false);
    };

    return (
        <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
            <div onClick={() => setIsOpen(true)}>
                {label && (
                    <label className="text-sm font-medium text-muted-foreground mb-2 block pointer-events-none">
                        {label}
                    </label>
                )}
                <button
                    type="button"
                    className="w-full p-4 rounded-xl border-2 border-border bg-background hover:border-primary/50 focus:border-primary transition-colors text-left flex items-center justify-between"
                >
                    <span className={value ? "text-foreground" : "text-muted-foreground"}>
                        {value || "--:--"}
                    </span>
                    <Clock className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
                <Drawer.Content
                    className="fixed bottom-0 left-0 right-0 z-[61] flex flex-col rounded-t-3xl bg-background max-h-[90vh] outline-none"
                    style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold">Seleziona Ora</h3>
                        <button
                            onClick={confirmSelection}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm"
                        >
                            Fatto
                        </button>
                    </div>

                    {/* Wheel Picker */}
                    <div className="relative h-64 flex justify-center items-center bg-background/50">
                        {/* Highlight Bar */}
                        <div className="absolute left-0 right-0 h-10 bg-muted/50 rounded-lg mx-4 pointer-events-none z-0" />

                        <div className="flex w-full px-8 gap-4 h-full relative z-10">
                            {/* Hours Column */}
                            <div className="flex-1 text-center relative">
                                <span className="text-xs font-semibold text-muted-foreground absolute -top-6 left-0 right-0">Ore</span>
                                <div
                                    ref={hourRef}
                                    onScroll={(e) => handleScroll('hour', e)}
                                    className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
                                    style={{ scrollBehavior: 'smooth' }}
                                >
                                    <div style={{ height: ITEM_HEIGHT * 2.5 }} /> {/* Spacer */}
                                    {HOURS.map(h => (
                                        <div
                                            key={h}
                                            className={cn(
                                                "h-10 flex items-center justify-center snap-center text-xl transition-all font-medium cursor-pointer",
                                                selectedHour === h ? "text-foreground scale-110 font-bold" : "text-muted-foreground/60"
                                            )}
                                            onClick={() => {
                                                if (hourRef.current) {
                                                    hourRef.current.scrollTop = HOURS.indexOf(h) * ITEM_HEIGHT;
                                                }
                                            }}
                                        >
                                            {h}
                                        </div>
                                    ))}
                                    <div style={{ height: ITEM_HEIGHT * 2.5 }} /> {/* Spacer */}
                                </div>
                            </div>

                            <div className="flex items-center font-bold text-xl pb-1">:</div>

                            {/* Minutes Column */}
                            <div className="flex-1 text-center relative">
                                <span className="text-xs font-semibold text-muted-foreground absolute -top-6 left-0 right-0">Minuti</span>
                                <div
                                    ref={minuteRef}
                                    onScroll={(e) => handleScroll('minute', e)}
                                    className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
                                    style={{ scrollBehavior: 'smooth' }}
                                >
                                    <div style={{ height: ITEM_HEIGHT * 2.5 }} /> {/* Spacer */}
                                    {MINUTES.map(m => (
                                        <div
                                            key={m}
                                            className={cn(
                                                "h-10 flex items-center justify-center snap-center text-xl transition-all font-medium cursor-pointer",
                                                selectedMinute === m ? "text-foreground scale-110 font-bold" : "text-muted-foreground/60"
                                            )}
                                            onClick={() => {
                                                if (minuteRef.current) {
                                                    minuteRef.current.scrollTop = MINUTES.indexOf(m) * ITEM_HEIGHT;
                                                }
                                            }}
                                        >
                                            {m}
                                        </div>
                                    ))}
                                    <div style={{ height: ITEM_HEIGHT * 2.5 }} /> {/* Spacer */}
                                </div>
                            </div>
                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
