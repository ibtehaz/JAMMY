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

const contextMapping = {
  "Great for workouts": "Workout",
  "Good focus music": "Study",
  "Chill/relaxing vibes": "Chill",
  "Just love this song": null
};

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
  
  const genreCount = track.genres.length || 1;
  const genreScore = track.genres.reduce((sum, g) => {
    return sum + (userProfile.genreWeights[g] || 0);
  }, 0) / genreCount;
  score += genreScore * 0.35;
  
  const exploration = userProfile.explorationLevel;
  const targetFamiliarity = 1 - exploration;
  const familiarityMatch = 1 - Math.abs(track.familiarity - targetFamiliarity);
  score += familiarityMatch * 0.25;
  
  const activityToMatch = playlistContext || userProfile.currentActivity;
  if (activityToMatch) {
    const activityMatch = track.contexts.includes(activityToMatch);
    score += activityMatch ? 0.2 : 0;
  } else {
    score += 0.1;
  }
  
  if (userProfile.currentMoods.length > 0) {
    const moodOverlap = userProfile.currentMoods.filter(m => 
      track.moods.includes(m)
    ).length;
    score += (moodOverlap / userProfile.currentMoods.length) * 0.1;
  } else {
    score += 0.05;
  }

  const contextForEnergy = playlistContext || userProfile.currentActivity;
  if (contextForEnergy && energyRanges[contextForEnergy]) {
    const { min, max } = energyRanges[contextForEnergy];
    const trackEnergy = track.energy || 0.5;
    if (trackEnergy >= min && trackEnergy <= max) {
      score += 0.05;
    }
  }

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
  
  track.genres.forEach(g => {
    if (userProfile.genreWeights[g] > 0.5) {
      reasons.push(`Matches your ${g} tuning (+${Math.round(userProfile.genreWeights[g] * 100)}%)`);
    }
  });
  
  if (userProfile.currentActivity && track.contexts.includes(userProfile.currentActivity)) {
    reasons.push(`Great for ${userProfile.currentActivity.toLowerCase()} context`);
  }
  
  if (track.familiarity > 0.7 && userProfile.explorationLevel < 0.5) {
    reasons.push("One of your favorites");
  } else if (track.familiarity < 0.3 && userProfile.explorationLevel > 0.5) {
    reasons.push("New discovery matching your taste");
  }
  
  if (track.similarTo && track.similarTo.length > 0) {
    reasons.push(`Similar to ${track.similarTo.length} songs you liked`);
  }
  
  return reasons.slice(0, 3);
}

function getSkipCountForTrack(trackId, feedbackTimeline) {
  return feedbackTimeline.filter(e => 
    (e.type === 'skip' || e.type === 'dislike') && e.trackId === trackId
  ).length;
}

function calculateSkipPenalty(skipCount) {
  return Math.max(0.15, 1 - (skipCount * 0.25));
}

function generatePlaylist(playlistConfig, tracks, userProfile, feedbackTimeline = [], likedIds = new Set(), dislikedIds = new Set(), limit = 20) {
  const playlistContext = playlistConfig?.context || null;
  
  const scored = tracks
    .filter(t => !dislikedIds.has(t.id)) // Filter out disliked tracks entirely
    .map(t => {
      const baseScore = scoreTrack(t, userProfile, playlistContext);
      const skipCount = getSkipCountForTrack(t.id, feedbackTimeline);
      const isLiked = likedIds.has(t.id);
      
      // Liked tracks: boost score and reduce skip penalty impact
      const skipPenalty = isLiked 
        ? Math.max(0.9, calculateSkipPenalty(skipCount)) // Liked tracks have max 10% skip penalty
        : calculateSkipPenalty(skipCount);
      
      const likeBoost = isLiked ? 1.1 : 1.0; // 10% boost for liked tracks
      const finalScore = baseScore * skipPenalty * likeBoost;
      
      return {
        ...t,
        score: finalScore,
        confidence: finalScore,
        baseScore,
        skipCount,
        skipPenalty,
        isLiked,
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
    context: null
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
  },
  {
    id: "sleep",
    title: "Sleep Sounds",
    description: "Gentle tracks to drift off to",
    context: "Sleep"
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
  explorationLevel: 0.5,
  currentActivity: null,
  currentMoods: [],
  recentLikeContexts: []
};

export function RecommendationEngineProvider({ children }) {
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

  const [likedTrackIds, setLikedTrackIds] = useState(() => {
    const saved = localStorage.getItem('musicRecc_likedTracks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [dislikedTrackIds, setDislikedTrackIds] = useState(() => {
    const saved = localStorage.getItem('musicRecc_dislikedTracks');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [consecutiveSkips, setConsecutiveSkips] = useState(0);
  const [enrichedTracks, setEnrichedTracks] = useState([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isTuningModalOpen, setIsTuningModalOpen] = useState(false);
  
  const debounceTimerRef = useRef(null);
  const enrichedTracksRef = useRef([]);
  const userProfileRef = useRef(userProfile);
  const feedbackTimelineRef = useRef(feedbackTimeline);
  const currentPlaylistIdRef = useRef(currentPlaylistId);
  const currentTrackIndexRef = useRef(currentTrackIndex);
  const playlistsRef = useRef(playlists);
  const likedTrackIdsRef = useRef(likedTrackIds);
  const dislikedTrackIdsRef = useRef(dislikedTrackIds);

  useEffect(() => {
    localStorage.setItem('musicRecc_userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('musicRecc_feedbackTimeline', JSON.stringify(feedbackTimeline));
  }, [feedbackTimeline]);

  useEffect(() => {
    localStorage.setItem('musicRecc_likedTracks', JSON.stringify([...likedTrackIds]));
  }, [likedTrackIds]);

  useEffect(() => {
    localStorage.setItem('musicRecc_dislikedTracks', JSON.stringify([...dislikedTrackIds]));
  }, [dislikedTrackIds]);

  useEffect(() => {
    async function loadPreviews() {
      setIsLoadingPreviews(true);
      const enriched = await enrichTracksWithPreviews(tracksData);
      enrichedTracksRef.current = enriched;
      setEnrichedTracks(enriched);
      setIsLoadingPreviews(false);
    }
    loadPreviews();
  }, []);
  
  useEffect(() => {
    enrichedTracksRef.current = enrichedTracks;
  }, [enrichedTracks]);

  useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  useEffect(() => {
    feedbackTimelineRef.current = feedbackTimeline;
  }, [feedbackTimeline]);

  useEffect(() => {
    currentPlaylistIdRef.current = currentPlaylistId;
  }, [currentPlaylistId]);

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  useEffect(() => {
    playlistsRef.current = playlists;
  }, [playlists]);

  useEffect(() => {
    likedTrackIdsRef.current = likedTrackIds;
  }, [likedTrackIds]);

  useEffect(() => {
    dislikedTrackIdsRef.current = dislikedTrackIds;
  }, [dislikedTrackIds]);

  const debouncedRegenerate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      regeneratePlaylists();
    }, 300);
  }, []);

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
    const currentProfile = userProfileRef.current;
    const currentFeedback = feedbackTimelineRef.current;
    
    // Use refs to get fresh values (avoid stale closure)
    const freshPlaylistId = currentPlaylistIdRef.current;
    const freshPlaylists = playlistsRef.current;
    const freshTrackIndex = currentTrackIndexRef.current;
    
    const newPlaylists = playlistContexts.map(ctx => {
      const tracks = generatePlaylist(ctx, tracksToUse, currentProfile, currentFeedback, likedTrackIdsRef.current, dislikedTrackIdsRef.current);
      const avgConfidence = tracks.reduce((sum, t) => sum + t.confidence, 0) / (tracks.length || 1);
      
      return {
        ...ctx,
        tracks,
        confidence: avgConfidence,
        generatedAt: Date.now()
      };
    });
    
    // Preserve current track position when playlists regenerate
    if (freshPlaylistId) {
      const currentPlaylist = freshPlaylists.find(p => p.id === freshPlaylistId);
      const currentTrack = currentPlaylist?.tracks[freshTrackIndex];
      
      if (currentTrack) {
        const newCurrentPlaylist = newPlaylists.find(p => p.id === freshPlaylistId);
        if (newCurrentPlaylist) {
          const newIndex = newCurrentPlaylist.tracks.findIndex(t => t.id === currentTrack.id);
          if (newIndex !== -1 && newIndex !== freshTrackIndex) {
            setCurrentTrackIndex(newIndex);
          }
        }
      }
    }
    
    setPlaylists(newPlaylists);
  };

  const updateGenreWeights = (newWeights) => {
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
      restoreState: { genreWeights: oldWeights },
      impact: "Updated multiple genre preferences"
    });
  };

  const setExplorationLevel = (level) => {
    const oldLevel = userProfile.explorationLevel;
    setUserProfile(prev => ({ ...prev, explorationLevel: level }));
    
    logFeedback({
      type: "tuning_change",
      details: { setting: "exploration", from: oldLevel, to: level },
      restoreState: { explorationLevel: oldLevel },
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
        : [...currentMoods, mood].slice(0, 3);
      
      return { ...prev, currentMoods: newMoods };
    });
  };

  const likeSong = (trackId, context = null) => {
    setConsecutiveSkips(0);
    
    // Add to liked, remove from disliked
    setLikedTrackIds(prev => new Set([...prev, trackId]));
    setDislikedTrackIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(trackId);
      return newSet;
    });
    
    const track = tracksData.find(t => t.id === trackId);
    if (track) {
      setUserProfile(prev => {
        const newWeights = { ...prev.genreWeights };
        track.genres.forEach(g => {
          if (newWeights[g] !== undefined) {
            newWeights[g] = Math.min(newWeights[g] + 0.05, 1);
          }
        });
        
        const newLikeContexts = context 
          ? [context, ...(prev.recentLikeContexts || [])].slice(0, 5)
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
    
    const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
    if (currentPlaylist && currentTrackIndex < currentPlaylist.tracks.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    }
  };

  const dislikeSong = (trackId) => {
    setConsecutiveSkips(0);
    
    // Add to disliked, remove from liked
    setDislikedTrackIds(prev => new Set([...prev, trackId]));
    setLikedTrackIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(trackId);
      return newSet;
    });
    
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
    
    setFeedbackTimeline(prev => [newEvent, ...prev].slice(0, 20));
  };

  const undoFeedbackEvent = (eventId) => {
    const eventToUndo = feedbackTimeline.find(e => e.id === eventId);
    
    if (eventToUndo && eventToUndo.restoreState) {
      setUserProfile(prev => {
        const newState = { ...prev };
        
        if (eventToUndo.restoreState.genreWeights) {
          newState.genreWeights = { 
            ...newState.genreWeights, 
            ...eventToUndo.restoreState.genreWeights 
          };
        }
        
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
    localStorage.removeItem('musicRecc_likedTracks');
    localStorage.removeItem('musicRecc_dislikedTracks');
    setUserProfile(initialUserProfile);
    setFeedbackTimeline([]);
    setLikedTrackIds(new Set());
    setDislikedTrackIds(new Set());
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
    likedTrackIds,
    dislikedTrackIds,
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
