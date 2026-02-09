import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Providers } from './components/providers'
import { TripProvider } from './lib/trip-context'
import { BottomNav } from './components/bottom-nav'
import HomePage from './pages/home'
import WalletPage from './pages/wallet'
import ItineraryPage from './pages/itinerary'
import DocsPage from './pages/docs'

function App() {
  return (
    <Providers>
      <TripProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen pb-20">
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/itinerary" element={<ItineraryPage />} />
                <Route path="/docs" element={<DocsPage />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        </BrowserRouter>
      </TripProvider>
    </Providers>
  )
}

export default App
