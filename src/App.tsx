import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Providers } from './components/providers'
import { BottomNav } from './components/bottom-nav'
import { UserSelector } from './components/user-selector'
import HomePage from './pages/home'
import WalletPage from './pages/wallet'
import ItineraryPage from './pages/itinerary'
import DocsPage from './pages/docs'

export type User = "alex" | "valentina";

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('travelmate-user') as User | null;
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('travelmate-user', user);
  };

  if (!currentUser) {
    return (
      <Providers>
        <UserSelector onSelectUser={handleSelectUser} />
      </Providers>
    );
  }

  return (
    <Providers>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen pb-20">
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/wallet" element={<WalletPage currentUser={currentUser} />} />
              <Route path="/itinerary" element={<ItineraryPage />} />
              <Route path="/docs" element={<DocsPage />} />
            </Routes>
          </main>
          <BottomNav currentUser={currentUser} />
        </div>
      </BrowserRouter>
    </Providers>
  )
}

export default App
