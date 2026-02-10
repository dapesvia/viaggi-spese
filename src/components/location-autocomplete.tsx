import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LocationResult {
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        road?: string;
        house_number?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
    };
}

interface LocationAutocompleteProps {
    value: string;
    onChange: (name: string, lat: number | null, lng: number | null) => void;
    placeholder?: string;
    label?: string;
}

export function LocationAutocomplete({
    value,
    onChange,
    placeholder = "Cerca un luogo...",
    label
}: LocationAutocompleteProps) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<LocationResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchLocation = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&accept-language=it`,
                {
                    headers: {
                        "Accept": "application/json",
                    }
                }
            );

            if (!response.ok) throw new Error("Search failed");

            const data: LocationResult[] = await response.json();
            setResults(data);
            setShowResults(true);
        } catch (error) {
            console.error("Errore ricerca luogo:", error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleInputChange = (text: string) => {
        setQuery(text);

        // Debounce the search
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchLocation(text);
        }, 400);
    };

    const selectResult = (result: LocationResult) => {
        // Format a short display name
        const addr = result.address;
        let shortName = "";
        if (addr) {
            const parts = [];
            if (addr.road) {
                parts.push(addr.house_number ? `${addr.road} ${addr.house_number}` : addr.road);
            }
            const city = addr.city || addr.town || addr.village;
            if (city) parts.push(city);
            if (addr.country && parts.length > 0) parts.push(addr.country);
            shortName = parts.join(", ");
        }

        const displayName = shortName || result.display_name;
        setQuery(displayName);
        setShowResults(false);
        onChange(displayName, parseFloat(result.lat), parseFloat(result.lon));
    };

    const clearInput = () => {
        setQuery("");
        setResults([]);
        setShowResults(false);
        onChange("", null, null);
    };

    const formatResultName = (result: LocationResult) => {
        const parts = result.display_name.split(", ");
        const main = parts[0];
        const secondary = parts.slice(1, 3).join(", ");
        return { main, secondary };
    };

    return (
        <div ref={containerRef} className="relative">
            {label && (
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {label}
                </label>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => results.length > 0 && setShowResults(true)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-10 p-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
                />
                {isSearching ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                ) : query ? (
                    <button
                        onClick={clearInput}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                ) : null}
            </div>

            {/* Autocomplete Results Dropdown */}
            <AnimatePresence>
                {showResults && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-50 left-0 right-0 mt-1 bg-background border-2 border-border rounded-xl shadow-2xl overflow-hidden max-h-[240px] overflow-y-auto"
                    >
                        {results.map((result, index) => {
                            const { main, secondary } = formatResultName(result);
                            return (
                                <button
                                    key={`${result.lat}-${result.lon}-${index}`}
                                    onClick={() => selectResult(result)}
                                    className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors flex items-start gap-3 border-b border-border/30 last:border-0"
                                >
                                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{main}</p>
                                        {secondary && (
                                            <p className="text-xs text-muted-foreground truncate">{secondary}</p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hint text */}
            {query.length > 0 && query.length < 3 && (
                <p className="text-xs text-muted-foreground mt-1">
                    Scrivi almeno 3 caratteri per cercare...
                </p>
            )}
        </div>
    );
}
