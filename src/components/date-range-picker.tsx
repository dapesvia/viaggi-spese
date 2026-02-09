import { X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileDatePicker } from "./mobile-date-picker";

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
    onClear: () => void;
    className?: string;
}

export function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    onClear,
    className
}: DateRangePickerProps) {
    const hasFilters = startDate || endDate;

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Filtra per periodo</span>
                </div>
                {hasFilters && (
                    <button
                        onClick={onClear}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Reset
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Da</label>
                    <MobileDatePicker
                        value={startDate}
                        onChange={onStartDateChange}
                        placeholder="Inizio"
                    />
                </div>
                <div>
                    <label className="text-xs text-muted-foreground mb-1 block">A</label>
                    <MobileDatePicker
                        value={endDate}
                        onChange={onEndDateChange}
                        placeholder="Fine"
                    />
                </div>
            </div>
        </div>
    );
}
