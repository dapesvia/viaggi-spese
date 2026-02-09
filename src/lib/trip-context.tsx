import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, type Trip } from "./supabase";

interface TripContextType {
    trips: Trip[];
    currentTrip: Trip | null;
    loading: boolean;
    selectTrip: (tripId: string) => void;
    refreshTrips: () => Promise<void>;
    createTrip: (trip: Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<Trip>;
    updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
    deleteTrip: (id: string) => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            const { data, error } = await supabase
                .from('trips')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) throw error;

            setTrips(data || []);

            // Do NOT auto-select first trip anymore based on user request.
            // Only restore if explicitly saved in localStorage? 
            // User asked: "non fare subito selezionare in automatico". 
            // Safest: don't select anything.
            setCurrentTrip(null);
        } catch (error) {
            console.error('Errore caricamento viaggi:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectTrip = (tripId: string) => {
        const trip = trips.find(t => t.id === tripId);
        if (trip) {
            setCurrentTrip(trip);
            localStorage.setItem('currentTripId', tripId);
        }
    };

    const createTrip = async (tripData: Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Trip> => {
        const { data, error } = await supabase
            .from('trips')
            .insert({
                ...tripData,
                created_by: null // No auth, no user
            })
            .select()
            .single();

        if (error) throw error;

        await loadTrips();
        // Do NOT auto-select the new trip? User wants manual selection.
        // But for creation it might be nice. Let's stick to manual to be consistent.
        // setCurrentTrip(data); 
        // localStorage.setItem('currentTripId', data.id);

        return data;
    };

    const updateTrip = async (id: string, updates: Partial<Trip>) => {
        const { error } = await supabase
            .from('trips')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        await loadTrips();

        // If updating current trip, update local state
        if (currentTrip?.id === id) {
            setCurrentTrip(prev => prev ? { ...prev, ...updates } : null);
        }
    };

    const deleteTrip = async (id: string) => {
        const { error } = await supabase
            .from('trips')
            .delete()
            .eq('id', id);

        if (error) throw error;

        if (currentTrip?.id === id) {
            setCurrentTrip(null);
            localStorage.removeItem('currentTripId');
        }
        await loadTrips();
    };

    return (
        <TripContext.Provider value={{
            trips,
            currentTrip,
            loading,
            selectTrip,
            refreshTrips: loadTrips,
            createTrip,
            updateTrip,
            deleteTrip
        }}>
            {children}
        </TripContext.Provider>
    );
}

export function useTrip() {
    const context = useContext(TripContext);
    if (context === undefined) {
        throw new Error('useTrip must be used within a TripProvider');
    }
    return context;
}
