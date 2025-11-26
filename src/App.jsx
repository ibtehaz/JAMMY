import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { RecommendationEngineProvider, useRecommendationEngine } from './context/RecommendationEngineContext';
import HomePage from './pages/HomePage';
import PlaylistView from './pages/PlaylistView';
import SkipFeedbackDialog from './components/SkipFeedbackDialog';
import ActivitySelectorModal from './components/ActivitySelectorModal';
import TuningDeckModal from './components/TuningDeckModal';
import PhoneFrame from './components/PhoneFrame';
import { AnimatePresence, LayoutGroup } from 'framer-motion';

function ActivityModalManager() {
  const { userProfile, setActivity, setMoods, isActivityModalOpen, setIsActivityModalOpen } = useRecommendationEngine();
  
  const handleApplyContext = (activity, moods) => {
    setActivity(activity);
    setMoods(moods);
  };

  return (
    <ActivitySelectorModal 
      isOpen={isActivityModalOpen}
      onClose={() => setIsActivityModalOpen(false)}
      currentActivity={userProfile.currentActivity}
      currentMoods={userProfile.currentMoods}
      onApply={handleApplyContext}
    />
  );
}

function TuningModalManager() {
  const { 
    userProfile, 
    updateGenreWeights, 
    setExplorationLevel, 
    resetAlgorithm,
    togglePerPlaylistLearning,
    isTuningModalOpen, 
    setIsTuningModalOpen 
  } = useRecommendationEngine();

  return (
    <TuningDeckModal 
      isOpen={isTuningModalOpen}
      onClose={() => setIsTuningModalOpen(false)}
      userProfile={userProfile}
      updateGenreWeights={updateGenreWeights}
      setExplorationLevel={setExplorationLevel}
      resetAlgorithm={resetAlgorithm}
      togglePerPlaylistLearning={togglePerPlaylistLearning}
    />
  );
}

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
    <LayoutGroup>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/playlist/:id" element={<PlaylistView />} />
        </Routes>
      </AnimatePresence>
    </LayoutGroup>
  );
}

function App() {
  return (
    <RecommendationEngineProvider>
      <BrowserRouter>
        <PhoneFrame>
          <div className="relative min-h-full bg-black text-white selection:bg-white/20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900/30 via-black to-black pointer-events-none" />
            
            <div className="relative z-10 min-h-full">
              <AnimatedRoutes />
            </div>
          </div>
          
          <div className="absolute inset-0 pointer-events-none z-40">
            <FeedbackManager />
            <ActivityModalManager />
            <TuningModalManager />
          </div>
        </PhoneFrame>
      </BrowserRouter>
    </RecommendationEngineProvider>
  );
}

export default App;
