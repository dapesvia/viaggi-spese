-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  cover_image_url TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  budget DECIMAL(10, 2),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trip participants (for the couple)
CREATE TABLE trip_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  original_currency TEXT DEFAULT 'EUR' NOT NULL,
  amount_in_eur DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'transport', 'accommodation', 'activities', 'shopping', 'other')),
  description TEXT,
  paid_by_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'me', 'partner')),
  receipt_url TEXT,
  expense_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itinerary items table
CREATE TABLE itinerary_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flight', 'stay', 'activity', 'transport', 'restaurant')),
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  pdf_url TEXT,
  booking_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for trips
CREATE POLICY "Users can view trips they participate in" ON trips FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants 
      WHERE trip_participants.trip_id = trips.id 
      AND trip_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trips" ON trips FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Trip owners can update trips" ON trips FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants 
      WHERE trip_participants.trip_id = trips.id 
      AND trip_participants.user_id = auth.uid()
      AND trip_participants.role = 'owner'
    )
  );

CREATE POLICY "Trip owners can delete trips" ON trips FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants 
      WHERE trip_participants.trip_id = trips.id 
      AND trip_participants.user_id = auth.uid()
      AND trip_participants.role = 'owner'
    )
  );

-- RLS Policies for trip_participants
CREATE POLICY "Users can view participants of their trips" ON trip_participants FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants tp 
      WHERE tp.trip_id = trip_participants.trip_id 
      AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Trip owners can manage participants" ON trip_participants FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants tp 
      WHERE tp.trip_id = trip_participants.trip_id 
      AND tp.user_id = auth.uid()
      AND tp.role = 'owner'
    )
  );

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses of their trips" ON expenses FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants 
      WHERE trip_participants.trip_id = expenses.trip_id 
      AND trip_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses for their trips" ON expenses FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_participants 
      WHERE trip_participants.trip_id = expenses.trip_id 
      AND trip_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses they created" ON expenses FOR UPDATE 
  USING (paid_by_user_id = auth.uid());

CREATE POLICY "Users can delete expenses they created" ON expenses FOR DELETE 
  USING (paid_by_user_id = auth.uid());

-- RLS Policies for itinerary_items
CREATE POLICY "Users can view itinerary items of their trips" ON itinerary_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants 
      WHERE trip_participants.trip_id = itinerary_items.trip_id 
      AND trip_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create itinerary items for their trips" ON itinerary_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_participants 
      WHERE trip_participants.trip_id = itinerary_items.trip_id 
      AND trip_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update itinerary items of their trips" ON itinerary_items FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants 
      WHERE trip_participants.trip_id = itinerary_items.trip_id 
      AND trip_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete itinerary items of their trips" ON itinerary_items FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM trip_participants 
      WHERE trip_participants.trip_id = itinerary_items.trip_id 
      AND trip_participants.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_trip_participants_trip_id ON trip_participants(trip_id);
CREATE INDEX idx_trip_participants_user_id ON trip_participants(user_id);
CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by_user_id);
CREATE INDEX idx_itinerary_items_trip_id ON itinerary_items(trip_id);
CREATE INDEX idx_itinerary_items_datetime ON itinerary_items(datetime);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itinerary_items_updated_at BEFORE UPDATE ON itinerary_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
