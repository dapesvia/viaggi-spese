import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Providers } from './components/providers'
import { TripProvider } from './lib/trip-context'
import { ToastProvider } from './components/toast'
import { BottomNav } from './components/bottom-nav'
import { AnimatePresence, motion } from 'framer-motion'

// Lazy load pages for better initial load performance
const HomePage = lazy(() => import('./pages/home'))
const WalletPage = lazy(() => import('./pages/wallet'))
const ItineraryPage = lazy(() => import('./pages/itinerary'))
const StatsPage = lazy(() => import('./pages/stats'))

// Minimal page-level loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

// Animated route wrapper
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="flex-1"
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/itinerary" element={<ItineraryPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  return (
    <Providers>
      <TripProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen pb-20">
              <main className="flex-1 overflow-y-auto">
                <AnimatedRoutes />
              </main>
              <BottomNav />
            </div>
          </BrowserRouter>
        </ToastProvider>
      </TripProvider>
    </Providers>
  )
}

export default App
