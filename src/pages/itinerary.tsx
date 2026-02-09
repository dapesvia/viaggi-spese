import { useEffect, useState } from "react";
import { Plus, Loader2, Trash2, MapPin, Clock, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { supabase, type ItineraryItem } from "@/lib/supabase";
import { useTrip } from "@/lib/trip-context";
import { AddItineraryDrawer } from "@/components/add-itinerary-drawer";

const TYPE_INFO: Record<string, { emoji: string; label: string }> = {
  flight: { emoji: "✈️", label: "Volo" },
  stay: { emoji: "🏨", label: "Alloggio" },
  activity: { emoji: "🎭", label: "Attività" },
  transport: { emoji: "🚗", label: "Trasporto" },
  restaurant: { emoji: "🍽️", label: "Ristorante" },
};

export default function ItineraryPage() {
  const { currentTrip } = useTrip();
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  useEffect(() => {
    if (currentTrip) {
      loadItems();
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
    if (!confirm('Eliminare questo elemento?')) return;

    try {
      const { error } = await supabase
        .from('itinerary_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadItems();
    } catch (error) {
      console.error('Errore eliminazione:', error);
    }
  };

  const formatDate = (datetime: string) => {
    return new Date(datetime).toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Group items by date
  const groupedItems = items.reduce((acc, item) => {
    const date = new Date(item.datetime).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ItineraryItem[]>);

  if (!currentTrip) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Itinerario</h1>
          <p className="text-muted-foreground">Il vostro programma di viaggio</p>
        </header>
        <div className="text-center py-12 text-muted-foreground">
          <p>Seleziona un viaggio dalla home per vedere l'itinerario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Itinerario</h1>
        <p className="text-muted-foreground">{currentTrip.name}</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
            <span className="text-4xl">🗓️</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Itinerario vuoto</h3>
          <p className="text-muted-foreground mb-6">
            Aggiungi voli, alloggi e attività per organizzare il viaggio
          </p>
          <button
            onClick={() => setShowAddDrawer(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            <Plus className="w-5 h-5" />
            Aggiungi elemento
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([date, dayItems], groupIndex) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {new Date(date).getDate()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{formatDate(dayItems[0].datetime)}</p>
                  <p className="text-sm text-muted-foreground">
                    {dayItems.length} {dayItems.length === 1 ? "attività" : "attività"}
                  </p>
                </div>
              </div>

              {/* Day Items */}
              <div className="space-y-2 ml-6 pl-6 border-l-2 border-muted">
                {dayItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="p-4 rounded-xl glass border border-border/50 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{TYPE_INFO[item.type]?.emoji || "📍"}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{item.title}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {TYPE_INFO[item.type]?.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(item.datetime)}
                          </span>
                          {item.location_name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {item.location_name}
                            </span>
                          )}
                          {item.booking_reference && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5" />
                              {item.booking_reference}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                        )}
                      </div>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* FAB */}
      {items.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAddDrawer(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      <AddItineraryDrawer
        open={showAddDrawer}
        onOpenChange={setShowAddDrawer}
        onSaved={loadItems}
      />
    </div>
  );
}
