import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import tracksData from '../data/tracks.json';
import { enrichTracksWithPreviews } from '../utils/musicApi';
import { toast } from 'sonner';

const RecommendationEngineContext = createContext(null);

export function useRecommendationEngine() {
  const context = useContext(RecommendationEngineContext);
  if (!context) {
    throw new Error('useRecommendationEngine must be used within RecommendationEngineProvider');
  }
  return context;
}

// Map user context strings to track context values
const contextMapping = {
  "Great for workouts": "Workout",
  "Good focus music": "Study",
  "Chill/relaxing vibes": "Chill",
  "Just love this song": null
};

// Energy ranges for different contexts
const energyRanges = {
  "Workout": { min: 0.7, max: 1.0 },
  "Study": { min: 0.2, max: 0.5 },
  "Chill": { min: 0.0, max: 0.4 },
  "Commute": { min: 0.5, max: 0.8 },
  "Party": { min: 0.7, max: 1.0 },
  "Sleep": { min: 0.0, max: 0.3 }
};

function scoreTrack(track, userProfile, playlistContext = null) {
  let score = 0;
  
  // Genre match (35%)
  const genreCount = track.genres.length || 1;
  const genreScore = track.genres.reduce((sum, g) => {
    return sum + (userProfile.genreWeights[g] || 0);
  }, 0) / genreCount;
  score += genreScore * 0.35;
  
  // Familiarity vs discovery (25%)
  // At exploration=0: prefer high familiarity
  // At exploration=1: prefer low familiarity (new discoveries)
  const exploration = userProfile.explorationLevel;
  const targetFamiliarity = 1 - exploration;
  const familiarityMatch = 1 - Math.abs(track.familiarity - targetFamiliarity);
  score += familiarityMatch * 0.25;
  
  // Activity match (20%)
  const activityToMatch = playlistContext || userProfile.currentActivity;
  if (activityToMatch) {
    const activityMatch = track.contexts.includes(activityToMatch);
    score += activityMatch ? 0.2 : 0;
  } else {
    score += 0.1;
  }
  
  // Mood match (10%)
  if (userProfile.currentMoods.length > 0) {
    const moodOverlap = userProfile.currentMoods.filter(m => 
      track.moods.includes(m)
    ).length;
    score += (moodOverlap / userProfile.currentMoods.length) * 0.1;
  } else {
    score += 0.05;
  }

  // Energy match (5%)
  const contextForEnergy = playlistContext || userProfile.currentActivity;
  if (contextForEnergy && energyRanges[contextForEnergy]) {
    const { min, max } = energyRanges[contextForEnergy];
    const trackEnergy = track.energy || 0.5;
    if (trackEnergy >= min && trackEnergy <= max) {
      score += 0.05;
    }
  }

  // Recent like context bonus (5%)
  const recentLikeContexts = userProfile.recentLikeContexts || [];
  if (recentLikeContexts.length > 0) {
    const mappedContexts = recentLikeContexts
      .map(c => contextMapping[c])
      .filter(Boolean);
    const hasMatchingContext = track.contexts.some(c => mappedContexts.includes(c));
    if (hasMatchingContext) {
      score += 0.05;
    }
  }
  
  return Math.min(score, 1);
}

function generateReasoning(track, userProfile, score) {
  const reasons = [];
  
  // Genre match
  track.genres.forEach(g => {
    if (userProfile.genreWeights[g] > 0.5) {
      reasons.push(`Matches your ${g} tuning (+${Math.round(userProfile.genreWeights[g] * 100)}%)`);
    }
  });
  
  // Activity/context
  if (userProfile.currentActivity && track.contexts.includes(userProfile.currentActivity)) {
    reasons.push(`Great for ${userProfile.currentActivity.toLowerCase()} context`);
  }
  
  // Familiarity
  if (track.familiarity > 0.7 && userProfile.explorationLevel < 0.5) {
    reasons.push("One of your favorites");
  } else if (track.familiarity < 0.3 && userProfile.explorationLevel > 0.5) {
    reasons.push("New discovery matching your taste");
  }
  
  // Similar to liked songs
  if (track.similarTo && track.similarTo.length > 0) {
    reasons.push(`Similar to ${track.similarTo.length} songs you liked`);
  }
  
  return reasons.slice(0, 3);  // Max 3 reasons
}

function getSkipCountForTrack(trackId, feedbackTimeline) {
  return feedbackTimeline.filter(e => 
    (e.type === 'skip' || e.type === 'dislike') && e.trackId === trackId
  ).length;
}

function calculateSkipPenalty(skipCount) {
  return Math.max(0.15, 1 - (skipCount * 0.25));
}

function generatePlaylist(playlistConfig, tracks, userProfile, feedbackTimeline = [], limit = 20) {
  const playlistContext = playlistConfig?.context || null;
  
  const scored = tracks
    .map(t => {
      const baseScore = scoreTrack(t, userProfile, playlistContext);
      const skipCount = getSkipCountForTrack(t.id, feedbackTimeline);
      const skipPenalty = calculateSkipPenalty(skipCount);
      const finalScore = baseScore * skipPenalty;
      
      return {
        ...t,
        score: finalScore,
        confidence: finalScore,
        baseScore,
        skipCount,
        skipPenalty,
        reasoning: generateReasoning(t, userProfile, finalScore)
      };
    });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

const playlistContexts = [
  {
    id: "morning",
    title: "Morning Commute",
    description: "Upbeat tracks to start your day",
    context: "Commute"
  },
  {
    id: "favorites",
    title: "Favorites Mix",
    description: "Your most-loved songs",
    context: null // Special case: generated from high-score tracks regardless of context
  },
  {
    id: "workout",
    title: "Workout Energy",
    description: "Fast-beating tracks for exercise",
    context: "Workout"
  },
  {
    id: "study",
    title: "Deep Focus",
    description: "Calm tracks for concentration",
    context: "Study"
  },
  {
    id: "chill",
    title: "Chill Evening",
    description: "Relaxing vibes for unwinding",
    context: "Chill"
  },
  {
    id: "party",
    title: "Party Mode",
    description: "High-energy bangers for the night",
    context: "Party"
  }
];

const initialUserProfile = {
  genreWeights: {
    pop: 0.6,
    rock: 0.7,
    indie: 0.6,
    hiphop: 0.5,
    edm: 0.4,
    rnb: 0.5,
    country: 0.4,
    jazz: 0.3
  },
  explorationLevel: 0.5,  // 0=familiar, 1=adventurous
  currentActivity: null,
  currentMoods: [],
  recentLikeContexts: []
};

export function RecommendationEngineProvider({ children }) {
  // Initialize state from localStorage if available
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('musicRecc_userProfile');
    return saved ? JSON.parse(saved) : initialUserProfile;
  });
  
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  
  const [feedbackTimeline, setFeedbackTimeline] = useState(() => {
    const saved = localStorage.getItem('musicRecc_feedbackTimeline');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [consecutiveSkips, setConsecutiveSkips] = useState(0);
  const [enrichedTracks, setEnrichedTracks] = useState([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTuningModalOpen, setIsTuningModalOpen] = useState(false);
  
  const debounceTimerRef = useRef(null);
  const enrichedTracksRef = useRef([]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('musicRecc_userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('musicRecc_feedbackTimeline', JSON.stringify(feedbackTimeline));
  }, [feedbackTimeline]);

  // Load track previews from iTunes
  useEffect(() => {
    async function loadPreviews() {
      setIsLoadingPreviews(true);
      const enriched = await enrichTracksWithPreviews(tracksData, 150);
      enrichedTracksRef.current = enriched;
      setEnrichedTracks(enriched);
      setIsLoadingPreviews(false);
    }
    loadPreviews();
  }, []);
  
  // Keep ref in sync with state
  useEffect(() => {
    enrichedTracksRef.current = enrichedTracks;
  }, [enrichedTracks]);

  const debouncedRegenerate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      regeneratePlaylists();
    }, 300);
  }, []);

  // Regenerate playlists when preferences change
  useEffect(() => {
    if (enrichedTracks.length > 0) {
      debouncedRegenerate();
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [userProfile, feedbackTimeline, enrichedTracks, debouncedRegenerate]);

  const regeneratePlaylists = () => {
    const tracksToUse = enrichedTracksRef.current.length > 0 ? enrichedTracksRef.current : tracksData;
    const newPlaylists = playlistContexts.map(ctx => {
      const tracks = generatePlaylist(ctx, tracksToUse, userProfile, feedbackTimeline);
      const avgConfidence = tracks.reduce((sum, t) => sum + t.confidence, 0) / (tracks.length || 1);
      
      return {
        ...ctx,
        tracks,
        confidence: avgConfidence,
        generatedAt: Date.now()
      };
    });
    
    // Preserve current playing track position if rankings shifted
    if (currentPlaylistId) {
      const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
      const currentTrack = currentPlaylist?.tracks[currentTrackIndex];
      
      if (currentTrack) {
        const newCurrentPlaylist = newPlaylists.find(p => p.id === currentPlaylistId);
        if (newCurrentPlaylist) {
          const newIndex = newCurrentPlaylist.tracks.findIndex(t => t.id === currentTrack.id);
          if (newIndex !== -1 && newIndex !== currentTrackIndex) {
            // Update index to match where the song moved to
            setCurrentTrackIndex(newIndex);
          }
        }
      }
    }
    
    setPlaylists(newPlaylists);
  };

  const updateGenreWeights = (newWeights) => {
    // Capture old weights for undo
    const oldWeights = {};
    Object.keys(newWeights).forEach(k => {
      oldWeights[k] = userProfile.genreWeights[k];
    });

    setUserProfile(prev => ({
      ...prev,
      genreWeights: { ...prev.genreWeights, ...newWeights }
    }));
    
    logFeedback({
      type: "tuning_change",
      details: { type: "batch_update" },
      restoreState: { genreWeights: oldWeights }, // Save for undo
      impact: "Updated multiple genre preferences"
    });
  };

  const setExplorationLevel = (level) => {
    const oldLevel = userProfile.explorationLevel;
    setUserProfile(prev => ({ ...prev, explorationLevel: level }));
    
    logFeedback({
      type: "tuning_change",
      details: { setting: "exploration", from: oldLevel, to: level },
      restoreState: { explorationLevel: oldLevel }, // Save for undo
      impact: level > oldLevel ? "More adventurous recommendations" : "More familiar recommendations"
    });
  };

  const setActivity = (activity) => {
    setUserProfile(prev => ({ ...prev, currentActivity: activity }));
    
    if (activity) {
      logFeedback({
        type: "activity_change",
        details: { activity },
        impact: `Prioritizing ${activity.toLowerCase()} tracks`
      });
    }
  };

  const setMoods = (moods) => {
    setUserProfile(prev => ({ ...prev, currentMoods: moods }));
  };

  const toggleMood = (mood) => {
    setUserProfile(prev => {
      const currentMoods = prev.currentMoods;
      const newMoods = currentMoods.includes(mood)
        ? currentMoods.filter(m => m !== mood)
        : [...currentMoods, mood].slice(0, 3); // Max 3 moods
      
      return { ...prev, currentMoods: newMoods };
    });
  };

  const likeSong = (trackId, context = null) => {
    setConsecutiveSkips(0);
    
    // Boost liked genres
    const track = tracksData.find(t => t.id === trackId);
    if (track) {
      setUserProfile(prev => {
        const newWeights = { ...prev.genreWeights };
        track.genres.forEach(g => {
          if (newWeights[g] !== undefined) {
            newWeights[g] = Math.min(newWeights[g] + 0.05, 1);
          }
        });
        
        // Save context to profile if provided
        const newLikeContexts = context 
          ? [context, ...(prev.recentLikeContexts || [])].slice(0, 5) // Keep last 5 contexts
          : prev.recentLikeContexts;

        return { 
          ...prev, 
          genreWeights: newWeights,
          recentLikeContexts: newLikeContexts
        };
      });
    }

    logFeedback({
      type: "like",
      trackId,
      details: { context },
      impact: context ? `More songs like this for ${context.toLowerCase()}` : "More songs like this"
    });
  };

  const skipSong = (trackId, reason = null) => {
    setConsecutiveSkips(prev => prev + 1);
    
    logFeedback({
      type: "skip",
      trackId,
      details: { reason },
      impact: reason ? `Noted: ${reason}` : "Fewer songs like this"
    });
    
    // Move to next track
    const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
    if (currentPlaylist && currentTrackIndex < currentPlaylist.tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    }
  };

  const dislikeSong = (trackId) => {
    setConsecutiveSkips(0); // Reset skips because this is an explicit action
    
    // Reduce disliked genres
    const track = tracksData.find(t => t.id === trackId);
    if (track) {
      setUserProfile(prev => {
        const newWeights = { ...prev.genreWeights };
        track.genres.forEach(g => {
          if (newWeights[g] !== undefined) {
            newWeights[g] = Math.max(newWeights[g] - 0.05, 0);
          }
        });
        return { ...prev, genreWeights: newWeights };
      });
    }

    logFeedback({
      type: "dislike",
      trackId,
      impact: "Less songs like this"
    });

    // Move to next track
    const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
    if (currentPlaylist && currentTrackIndex < currentPlaylist.tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    }
  };

  const logFeedback = (event) => {
    const newEvent = {
      id: `evt_${Date.now()}`,
      timestamp: Date.now(),
      ...event
    };
    
    setFeedbackTimeline(prev => [newEvent, ...prev].slice(0, 20)); // Keep last 20
  };

  const undoFeedbackEvent = (eventId) => {
    const eventToUndo = feedbackTimeline.find(e => e.id === eventId);
    
    if (eventToUndo && eventToUndo.restoreState) {
      setUserProfile(prev => {
        const newState = { ...prev };
        
        // Restore genre weights
        if (eventToUndo.restoreState.genreWeights) {
          newState.genreWeights = { 
            ...newState.genreWeights, 
            ...eventToUndo.restoreState.genreWeights 
          };
        }
        
        // Restore exploration level
        if (eventToUndo.restoreState.explorationLevel !== undefined) {
          newState.explorationLevel = eventToUndo.restoreState.explorationLevel;
        }
        
        return newState;
      });
      
      toast.info("Undid Changes", {
        description: "Your preferences have been restored."
      });
    }

    setFeedbackTimeline(prev => prev.filter(e => e.id !== eventId));
  };

  const resetAlgorithm = () => {
    localStorage.removeItem('musicRecc_userProfile');
    localStorage.removeItem('musicRecc_feedbackTimeline');
    setUserProfile(initialUserProfile);
    setFeedbackTimeline([]);
    setConsecutiveSkips(0);
    toast.success("Algorithm Reset", {
      description: "All preferences and history have been cleared."
    });
  };

  const playPlaylist = useCallback((playlistId) => {
    setCurrentPlaylistId(playlistId);
    setCurrentTrackIndex(0);
  }, []);

  const playPreviousSong = () => {
    setCurrentTrackIndex(prev => Math.max(0, prev - 1));
  };

  const playTrackAtIndex = useCallback((index) => {
    setCurrentTrackIndex(prev => index >= 0 ? index : prev);
  }, []);

  const value = {
    userProfile,
    playlists,
    currentPlaylistId,
    currentTrackIndex,
    feedbackTimeline,
    consecutiveSkips,
    isLoadingPreviews,
    updateGenreWeights,
    setExplorationLevel,
    setActivity,
    setMoods,
    toggleMood,
    likeSong,
    dislikeSong,
    skipSong,
    undoFeedbackEvent,
    resetAlgorithm,
    playPlaylist,
    playPreviousSong,
    playTrackAtIndex,
    regeneratePlaylists,
    logFeedback,
    setConsecutiveSkips,
    isActivityModalOpen,
    setIsActivityModalOpen,
    isTuningModalOpen,
    setIsTuningModalOpen
  };

  return (
    <RecommendationEngineContext.Provider value={value}>
      {children}
    </RecommendationEngineContext.Provider>
  );
}
