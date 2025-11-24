import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { RecommendationEngineProvider, useRecommendationEngine } from './context/RecommendationEngineContext';
import { Toaster } from 'sonner';
import HomePage from './pages/HomePage';
import PlaylistView from './pages/PlaylistView';
import TuningView from './pages/TuningView';
import SkipFeedbackDialog from './components/SkipFeedbackDialog';
import { AnimatePresence } from 'framer-motion';

function FeedbackManager() {
  const { consecutiveSkips, logFeedback, setConsecutiveSkips } = useRecommendationEngine();

  const handleSkipFeedback = (reason) => {
    logFeedback({
      type: "skip_feedback",
      details: { reason },
      impact: "Adjusting recommendations based on feedback"
    });
    setConsecutiveSkips(0);
  };

  const handleDismiss = () => {
    setConsecutiveSkips(0);
  };

  return (
    <SkipFeedbackDialog 
      isOpen={consecutiveSkips >= 3}
      onClose={handleDismiss}
      onSubmit={handleSkipFeedback}
    />
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/playlist/:id" element={<PlaylistView />} />
        <Route path="/tuning" element={<TuningView />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <RecommendationEngineProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-purple-500/30">
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black pointer-events-none" />
          
          <div className="relative z-10">
            <AnimatedRoutes />
          </div>
          
          <FeedbackManager />
          <Toaster theme="dark" position="top-center" />
        </div>
      </BrowserRouter>
    </RecommendationEngineProvider>
  );
}

export default App;
