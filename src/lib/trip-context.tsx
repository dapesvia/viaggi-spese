import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
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

            const tripsData = data || [];
            setTrips(tripsData);

            // Restore previously selected trip from localStorage
            const savedTripId = localStorage.getItem('currentTripId');
            if (savedTripId && !currentTrip) {
                const savedTrip = tripsData.find(t => t.id === savedTripId);
                if (savedTrip) {
                    setCurrentTrip(savedTrip);
                }
            }
        } catch (error) {
            console.error('Errore caricamento viaggi:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectTrip = useCallback((tripId: string) => {
        const trip = trips.find(t => t.id === tripId);
        if (trip) {
            setCurrentTrip(trip);
            localStorage.setItem('currentTripId', tripId);
        }
    }, [trips]);

    const createTrip = async (tripData: Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Trip> => {
        const { data, error } = await supabase
            .from('trips')
            .insert({
                ...tripData,
                created_by: null
            })
            .select()
            .single();

        if (error) throw error;

        await loadTrips();

        // Auto-select newly created trip for convenience
        setCurrentTrip(data);
        localStorage.setItem('currentTripId', data.id);

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
