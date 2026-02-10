import { useEffect, useState, useMemo, useRef } from "react";
import { Plus, Loader2, Trash2, MapPin, Clock, Tag, ChevronLeft, ChevronRight, Building2, Navigation, Route, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase, type ItineraryItem } from "@/lib/supabase";
import { useToast } from "@/components/toast";
import { useTrip } from "@/lib/trip-context";
import { AddItineraryDrawer } from "@/components/add-itinerary-drawer";
import { TripSelector } from "@/components/trip-selector";

const TYPE_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  flight: { emoji: "✈️", label: "Volo", color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
  stay: { emoji: "🏨", label: "Alloggio", color: "from-violet-500/20 to-violet-600/10 border-violet-500/30" },
  activity: { emoji: "🎭", label: "Attività", color: "from-amber-500/20 to-amber-600/10 border-amber-500/30" },
  transport: { emoji: "🚗", label: "Trasporto", color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30" },
  restaurant: { emoji: "🍽️", label: "Ristorante", color: "from-rose-500/20 to-rose-600/10 border-rose-500/30" },
};

const ACCOMMODATION_LABELS: Record<string, string> = {
  hotel: "🏨 Hotel",
  airbnb: "🏠 Airbnb",
  bnb: "🛏️ B&B",
  apartment: "🏢 Appartamento",
  hostel: "🏕️ Ostello",
  friends: "👥 Amici",
  other: "📍 Altro",
};

export default function ItineraryPage() {
  const { currentTrip } = useTrip();
  const { toast } = useToast();
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  // Generate array of days from trip
  const tripDays = useMemo(() => {
    if (!currentTrip) return [];
    const days: { date: Date; label: string; dateStr: string }[] = [];
    const start = new Date(currentTrip.start_date + "T00:00:00");
    const end = new Date(currentTrip.end_date + "T00:00:00");
    const current = new Date(start);
    let dayNum = 1;
    while (current <= end) {
      days.push({
        date: new Date(current),
        label: `Giorno ${dayNum}`,
        dateStr: current.toISOString().slice(0, 10),
      });
      current.setDate(current.getDate() + 1);
      dayNum++;
    }
    return days;
  }, [currentTrip]);

  // Auto select today's day if trip is active
  useEffect(() => {
    if (!currentTrip || tripDays.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const todayIndex = tripDays.findIndex(d => d.dateStr === today);
    if (todayIndex >= 0) {
      setSelectedDayIndex(todayIndex);
    } else {
      setSelectedDayIndex(0);
    }
  }, [currentTrip?.id, tripDays]);

  useEffect(() => {
    if (currentTrip) {
      loadItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [currentTrip]);

  const loadItems = async () => {
    if (!currentTrip) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('itinerary_items')
        .select('*')
        .eq('trip_id', currentTrip.id)
        .order('datetime', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Errore caricamento itinerario:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('itinerary_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast("Elemento eliminato", "success");
      loadItems();
    } catch (error) {
      console.error('Errore eliminazione:', error);
      toast("Errore nell'eliminazione", "error");
    }
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDateFull = (date: Date) => {
    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  };

  // Items for the selected day
  const selectedDay = tripDays[selectedDayIndex];
  const dayItems = useMemo(() => {
    if (!selectedDay) return [];
    return items.filter(item => {
      const itemDate = new Date(item.datetime).toISOString().slice(0, 10);
      return itemDate === selectedDay.dateStr;
    });
  }, [items, selectedDay]);

  // Count items per day for badge
  const itemCountByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const d = new Date(item.datetime).toISOString().slice(0, 10);
      counts[d] = (counts[d] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Build multi-stop route URLs
  const buildGoogleMapsRouteUrl = (stops: { lat?: number; lng?: number; name: string }[]) => {
    if (stops.length === 0) return null;

    const formatPoint = (s: { lat?: number; lng?: number; name: string }) => {
      if (s.lat && s.lng) return `${s.lat},${s.lng}`;
      return encodeURIComponent(s.name);
    };

    if (stops.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&destination=${formatPoint(stops[0])}`;
    }

    // Google Maps: origin + destination + waypoints
    const origin = formatPoint(stops[0]);
    const destination = formatPoint(stops[stops.length - 1]);
    const waypoints = stops.slice(1, -1).map(s => formatPoint(s)).join('|');

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) url += `&waypoints=${waypoints}`;
    return url;
  };

  const buildAppleMapsRouteUrl = (stops: { lat?: number; lng?: number; name: string }[]) => {
    if (stops.length === 0) return null;

    const formatPoint = (s: { lat?: number; lng?: number; name: string }) => {
      if (s.lat && s.lng) return `${s.lat},${s.lng}`;
      return encodeURIComponent(s.name);
    };

    if (stops.length === 1) {
      return `https://maps.apple.com/?daddr=${formatPoint(stops[0])}`;
    }

    const saddr = formatPoint(stops[0]);
    const daddrs = stops.slice(1).map(s => formatPoint(s)).join('+to:');
    return `https://maps.apple.com/?saddr=${saddr}&daddr=${daddrs}`;
  };

  const buildWazeRouteUrl = (stops: { lat?: number; lng?: number; name: string }[]) => {
    // Waze only supports a single destination
    if (stops.length === 0) return null;
    const dest = stops[stops.length - 1];
    if (dest.lat && dest.lng) {
      return `https://waze.com/ul?ll=${dest.lat},${dest.lng}&navigate=yes`;
    }
    return `https://waze.com/ul?q=${encodeURIComponent(dest.name)}&navigate=yes`;
  };

  // Navigable stops for current day
  const dayNavigableStops = useMemo(() => {
    return dayItems
      .filter(item => (item.location_lat && item.location_lng) || item.location_name)
      .map(item => ({
        lat: item.location_lat || undefined,
        lng: item.location_lng || undefined,
        name: item.location_name || item.title,
      }));
  }, [dayItems]);

  // Navigable stops for entire trip (all days, in order)
  const allNavigableStops = useMemo(() => {
    return items
      .filter(item => (item.location_lat && item.location_lng) || item.location_name)
      .map(item => ({
        lat: item.location_lat || undefined,
        lng: item.location_lng || undefined,
        name: item.location_name || item.title,
      }));
  }, [items]);

  // Scroll selected day pill into view
  useEffect(() => {
    if (dayScrollRef.current) {
      const active = dayScrollRef.current.querySelector('[data-active="true"]');
      if (active) {
        active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selectedDayIndex]);

  if (!currentTrip) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Itinerario</h1>
            <TripSelector />
          </div>
          <p className="text-muted-foreground text-xs">Il vostro programma di viaggio ✈️</p>
        </header>
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
            <span className="text-4xl">🗺️</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Seleziona un viaggio</h3>
          <p className="text-muted-foreground">
            Scegli un viaggio per vedere e gestire il tuo itinerario giorno per giorno
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-32">
      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Itinerario</h1>
          <TripSelector />
        </div>
      </header>

      {/* Trip Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 mb-5"
      >
        <h2 className="text-lg font-bold mb-1">{currentTrip.name}</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>
            📅 {new Date(currentTrip.start_date + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
            {" → "}
            {new Date(currentTrip.end_date + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span className="text-xs text-muted-foreground/50">•</span>
          <span>{tripDays.length} {tripDays.length === 1 ? "giorno" : "giorni"}</span>
        </div>

        {/* Trip details: address & accommodation */}
        {(currentTrip.destination_address || currentTrip.accommodation_name) && (
          <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-primary/10">
            {currentTrip.destination_address && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Navigation className="w-3.5 h-3.5 text-primary" />
                {currentTrip.destination_address}
              </span>
            )}
            {currentTrip.accommodation_name && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                {currentTrip.accommodation_name}
                {currentTrip.accommodation_type && (
                  <span className="text-xs opacity-70">
                    ({ACCOMMODATION_LABELS[currentTrip.accommodation_type] || currentTrip.accommodation_type})
                  </span>
                )}
              </span>
            )}
          </div>
        )}
      </motion.div>

      {/* Day Selector Pills */}
      {tripDays.length > 0 && (
        <div className="relative mb-5">
          <div
            ref={dayScrollRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {tripDays.map((day, idx) => {
              const count = itemCountByDay[day.dateStr] || 0;
              const isActive = idx === selectedDayIndex;
              const isToday = day.dateStr === new Date().toISOString().slice(0, 10);
              return (
                <button
                  key={day.dateStr}
                  data-active={isActive}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={cn(
                    "relative flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl transition-all border-2 min-w-[72px]",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105"
                      : "bg-muted/40 hover:bg-muted border-transparent"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {day.date.toLocaleDateString("it-IT", { weekday: "short" })}
                  </span>
                  <span className={cn(
                    "text-lg font-bold leading-tight",
                    isActive ? "" : "text-foreground"
                  )}>
                    {day.date.getDate()}
                  </span>
                  <span className={cn(
                    "text-[10px]",
                    isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {day.date.toLocaleDateString("it-IT", { month: "short" })}
                  </span>

                  {/* Item count badge */}
                  {count > 0 && (
                    <span className={cn(
                      "absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                      isActive
                        ? "bg-white text-primary"
                        : "bg-primary text-primary-foreground"
                    )}>
                      {count}
                    </span>
                  )}

                  {/* Today indicator */}
                  {isToday && (
                    <div className={cn(
                      "absolute -bottom-0.5 w-1.5 h-1.5 rounded-full",
                      isActive ? "bg-white" : "bg-primary"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Header */}
      {selectedDay && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedDayIndex(Math.max(0, selectedDayIndex - 1))}
              disabled={selectedDayIndex === 0}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-bold text-lg">{selectedDay.label}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {formatDateFull(selectedDay.date)}
              </p>
            </div>

            <button
              onClick={() => setSelectedDayIndex(Math.min(tripDays.length - 1, selectedDayIndex + 1))}
              disabled={selectedDayIndex === tripDays.length - 1}
              className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setShowAddDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Aggiungi
          </button>
        </div>
      )}

      {/* Day Route Navigation */}
      {dayNavigableStops.length >= 1 && selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-green-500/10 border border-blue-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-muted-foreground">
                Percorso del giorno ({dayNavigableStops.length} {dayNavigableStops.length === 1 ? 'tappa' : 'tappe'})
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {buildGoogleMapsRouteUrl(dayNavigableStops) && (
              <a
                href={buildGoogleMapsRouteUrl(dayNavigableStops)!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors font-semibold active:scale-95"
              >
                <ExternalLink className="w-3 h-3" />
                Google Maps
              </a>
            )}
            {buildWazeRouteUrl(dayNavigableStops) && (
              <a
                href={buildWazeRouteUrl(dayNavigableStops)!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition-colors font-semibold active:scale-95"
              >
                <ExternalLink className="w-3 h-3" />
                Waze
              </a>
            )}
            {buildAppleMapsRouteUrl(dayNavigableStops) && (
              <a
                href={buildAppleMapsRouteUrl(dayNavigableStops)!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors font-semibold active:scale-95"
              >
                <ExternalLink className="w-3 h-3" />
                Apple Maps
              </a>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/70 mt-1.5">
            {dayNavigableStops.length >= 2
              ? `Da ${dayNavigableStops[0].name} a ${dayNavigableStops[dayNavigableStops.length - 1].name}`
              : `Naviga verso ${dayNavigableStops[0].name}`
            }
          </p>
        </motion.div>
      )}

      {/* Day Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay?.dateStr || "empty"}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {dayItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <span className="text-3xl">📝</span>
                </div>
                <h4 className="font-semibold text-lg mb-1">Nessuna attività</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Aggiungi voli, alloggi, ristoranti o attività per questo giorno
                </p>
                <button
                  onClick={() => setShowAddDrawer(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-lg shadow-primary/25"
                >
                  <Plus className="w-4 h-4" />
                  Aggiungi elemento
                </button>
              </div>
            ) : (
              /* Timeline */
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary/30 via-primary/15 to-transparent" />

                <div className="space-y-3">
                  {dayItems.map((item, index) => {
                    const typeInfo = TYPE_INFO[item.type] || { emoji: "📍", label: "Altro", color: "from-muted to-muted border-border" };
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06 }}
                        className="relative flex gap-3 group"
                      >
                        {/* Timeline dot */}
                        <div className="flex-shrink-0 w-10 flex flex-col items-center pt-4 z-10">
                          <div className="w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                          <span className="text-[10px] text-muted-foreground mt-1 font-medium">
                            {formatTime(item.datetime)}
                          </span>
                        </div>

                        {/* Card */}
                        <div className={cn(
                          "flex-1 p-4 rounded-xl border bg-gradient-to-br transition-all",
                          typeInfo.color,
                          "hover:shadow-md"
                        )}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{typeInfo.emoji}</span>
                                <h4 className="font-semibold">{item.title}</h4>
                              </div>

                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(item.datetime)}
                                </span>
                                {item.location_name && (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground">
                                      <MapPin className="w-3 h-3" />
                                      {item.location_name}
                                    </span>
                                    {/* Navigation Buttons */}
                                    {(item.location_lat && item.location_lng) ? (
                                      <>
                                        <a
                                          href={`https://www.google.com/maps/dir/?api=1&destination=${item.location_lat},${item.location_lng}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors font-medium"
                                          title="Apri in Google Maps"
                                        >
                                          🗺️ Maps
                                        </a>
                                        <a
                                          href={`https://waze.com/ul?ll=${item.location_lat},${item.location_lng}&navigate=yes`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition-colors font-medium"
                                          title="Apri in Waze"
                                        >
                                          🚗 Waze
                                        </a>
                                        <a
                                          href={`https://maps.apple.com/?daddr=${item.location_lat},${item.location_lng}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors font-medium"
                                          title="Apri in Apple Maps"
                                        >
                                          🍎 Apple
                                        </a>
                                      </>
                                    ) : item.location_name && (
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location_name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors font-medium"
                                        title="Cerca in Google Maps"
                                      >
                                        🗺️ Naviga
                                      </a>
                                    )}
                                  </div>
                                )}
                                {item.booking_reference && (
                                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground">
                                    <Tag className="w-3 h-3" />
                                    {item.booking_reference}
                                  </span>
                                )}
                              </div>

                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Overview: all days summary */}
      {items.length > 0 && tripDays.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-4 rounded-2xl bg-muted/30 border border-border/50"
        >
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Riepilogo viaggio
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-xl bg-background/50">
              <p className="text-2xl font-bold text-primary">{items.length}</p>
              <p className="text-xs text-muted-foreground">Attività totali</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-background/50">
              <p className="text-2xl font-bold text-primary">{tripDays.length}</p>
              <p className="text-xs text-muted-foreground">Giorni</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-background/50">
              <p className="text-2xl font-bold text-primary">
                {Object.keys(itemCountByDay).length}
              </p>
              <p className="text-xs text-muted-foreground">Giorni pianificati</p>
            </div>
          </div>

          {/* Full Trip Route Navigation */}
          {allNavigableStops.length >= 2 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Route className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">
                  Percorso completo ({allNavigableStops.length} tappe)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {buildGoogleMapsRouteUrl(allNavigableStops) && (
                  <a
                    href={buildGoogleMapsRouteUrl(allNavigableStops)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors font-semibold active:scale-95"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Google Maps
                  </a>
                )}
                {buildWazeRouteUrl(allNavigableStops) && (
                  <a
                    href={buildWazeRouteUrl(allNavigableStops)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition-colors font-semibold active:scale-95"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Waze
                  </a>
                )}
                {buildAppleMapsRouteUrl(allNavigableStops) && (
                  <a
                    href={buildAppleMapsRouteUrl(allNavigableStops)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors font-semibold active:scale-95"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Apple Maps
                  </a>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                Da {allNavigableStops[0].name} a {allNavigableStops[allNavigableStops.length - 1].name}
              </p>
            </div>
          )}
        </motion.div>
      )}

      <AddItineraryDrawer
        open={showAddDrawer}
        onOpenChange={setShowAddDrawer}
        onSaved={loadItems}
        defaultDate={selectedDay?.dateStr}
      />
    </div>
  );
}
