import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import tracksData from '../data/tracks.json';
import { toast } from 'sonner';

// Custom hook to sync state to refs (consolidates 8 separate useEffects)
function useSyncedRef(value) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

// Updates genre weights for a track (handles both global and per-playlist learning)
function updateGenreWeightsForTrack(track, weights, delta, playlistContext, perPlaylistLearning, contextGenreWeights, currentGenreWeights) {
  if (perPlaylistLearning && playlistContext) {
    // Initialize new context weights from current preferences
    const contextWeights = contextGenreWeights[playlistContext] 
      ? { ...contextGenreWeights[playlistContext] }
      : { ...currentGenreWeights };  // Use current weights, not defaults!
    
    track.genres.forEach(g => {
      if (contextWeights[g] !== undefined) {
        contextWeights[g] = delta > 0 
          ? Math.min(contextWeights[g] + delta, 1)
          : Math.max(contextWeights[g] + delta, 0);
      }
    });
    
    return {
      contextGenreWeights: {
        ...contextGenreWeights,
        [playlistContext]: contextWeights
      }
    };
  }
  
  // Global learning
  const newWeights = { ...weights };
  track.genres.forEach(g => {
    if (newWeights[g] !== undefined) {
      newWeights[g] = delta > 0 
        ? Math.min(newWeights[g] + delta, 1)
        : Math.max(newWeights[g] + delta, 0);
    }
  });
  return { genreWeights: newWeights };
}

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

function scoreTrack(track, userProfile, playlistContext = null, debug = false) {
  let score = 0;
  const breakdown = {};
  
  // Use context-specific weights if per-playlist learning is enabled and context exists
  const weightsToUse = (userProfile.perPlaylistLearning && playlistContext && userProfile.contextGenreWeights[playlistContext])
    ? userProfile.contextGenreWeights[playlistContext]
    : userProfile.genreWeights;
  
  // 1. Genre Score (35%)
  const genreCount = track.genres.length || 1;
  const genreScore = track.genres.reduce((sum, g) => {
    return sum + (weightsToUse[g] || 0.5);
  }, 0) / genreCount;
  const genreContrib = genreScore * 0.35;
  score += genreContrib;
  breakdown.genre = genreContrib;
  
  // 2. Familiarity/Exploration Match (25%)
  const exploration = userProfile.explorationLevel;
  const targetFamiliarity = 1 - exploration;
  const familiarityMatch = 1 - Math.abs(track.familiarity - targetFamiliarity);
  const famContrib = familiarityMatch * 0.25;
  score += famContrib;
  breakdown.familiarity = famContrib;
  
  // 3. Activity Context Match (20%)
  const activityToMatch = playlistContext || userProfile.currentActivity;
  let activityContrib = 0;
  if (activityToMatch) {
    const activityMatch = track.contexts.includes(activityToMatch);
    activityContrib = activityMatch ? 0.2 : 0;
  } else {
    activityContrib = 0.1;
  }
  score += activityContrib;
  breakdown.activity = activityContrib;
  
  // 4. Mood Match (10%)
  let moodContrib = 0;
  if (userProfile.currentMoods.length > 0) {
    const moodOverlap = userProfile.currentMoods.filter(m => 
      track.moods.includes(m)
    ).length;
    moodContrib = (moodOverlap / userProfile.currentMoods.length) * 0.1;
  } else {
    moodContrib = 0.05;
  }
  score += moodContrib;
  breakdown.mood = moodContrib;

  // 5. Energy Match (5%)
  let energyContrib = 0;
  const contextForEnergy = playlistContext || userProfile.currentActivity;
  if (contextForEnergy && energyRanges[contextForEnergy]) {
    const { min, max } = energyRanges[contextForEnergy];
    const trackEnergy = track.energy || 0.5;
    if (trackEnergy >= min && trackEnergy <= max) {
      energyContrib = 0.05;
    }
  }
  score += energyContrib;
  breakdown.energy = energyContrib;

  // 6. Recent Like Context Match (5%)
  let likeContextContrib = 0;
  const recentLikeContexts = userProfile.recentLikeContexts || [];
  if (recentLikeContexts.length > 0) {
    const mappedContexts = recentLikeContexts
      .map(c => contextMapping[c])
      .filter(Boolean);
    const hasMatchingContext = track.contexts.some(c => mappedContexts.includes(c));
    if (hasMatchingContext) {
      likeContextContrib = 0.05;
    }
  }
  score += likeContextContrib;
  breakdown.likeContext = likeContextContrib;
  
  // Debug mode available for detailed breakdown
  if (debug) {
    console.log(`   \ud83d\udd0d Score breakdown for "${track.title}":`);
    console.log(`      Genre (35%): ${breakdown.genre.toFixed(3)} | Familiarity (25%): ${breakdown.familiarity.toFixed(3)}`);
    console.log(`      Activity (20%): ${breakdown.activity.toFixed(3)} | Mood (10%): ${breakdown.mood.toFixed(3)}`);
    console.log(`      Energy (5%): ${breakdown.energy.toFixed(3)} | LikeContext (5%): ${breakdown.likeContext.toFixed(3)}`);
    console.log(`      TOTAL: ${score.toFixed(3)}`);
  }
  
  return Math.min(score, 1);
}

// Generates human-readable reasons for why a track was recommended
function generateReasoning(track, userProfile, score, weightsToUse = null) {
  const reasons = [];
  
  // Use provided weights or fall back to global weights
  const weights = weightsToUse || userProfile.genreWeights;
  
  track.genres.forEach(g => {
    if (weights[g] > 0.5) {
      reasons.push(`Matches your ${g} tuning (+${Math.round(weights[g] * 100)}%)`);
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
    const similarCount = track.similarTo.length;
    reasons.push(`Similar to ${similarCount} ${similarCount === 1 ? 'song' : 'songs'} you liked`);
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
  
  // Use context-specific weights if available, otherwise fall back to global
  const weightsToUse = (userProfile.perPlaylistLearning && playlistContext && userProfile.contextGenreWeights[playlistContext])
    ? userProfile.contextGenreWeights[playlistContext]
    : userProfile.genreWeights;
  
  const scored = tracks
    .filter(t => !dislikedIds.has(t.id))
    .map(t => {
      const baseScore = scoreTrack(t, userProfile, playlistContext);
      const skipCount = getSkipCountForTrack(t.id, feedbackTimeline);
      const isLiked = likedIds.has(t.id);
      
      const skipPenalty = isLiked 
        ? Math.max(0.9, calculateSkipPenalty(skipCount))
        : calculateSkipPenalty(skipCount);
      
      const likeBoost = isLiked ? 1.1 : 1.0;
      const finalScore = baseScore * skipPenalty * likeBoost;
      
      return {
        ...t,
        score: finalScore,
        confidence: finalScore,
        baseScore,
        skipCount,
        skipPenalty,
        isLiked,
        reasoning: generateReasoning(t, userProfile, finalScore, weightsToUse)
      };
    });

  const sorted = scored.sort((a, b) => b.score - a.score).slice(0, limit);
  
  return sorted;
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
  contextGenreWeights: {},
  perPlaylistLearning: false,
  explorationLevel: 0.5,
  currentActivity: null,
  currentMoods: [],
  recentLikeContexts: []
};

const defaultGenreWeights = {
  pop: 0.5, rock: 0.5, indie: 0.5, hiphop: 0.5,
  edm: 0.5, rnb: 0.5, country: 0.5, jazz: 0.5
};

export function RecommendationEngineProvider({ children }) {
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('musicRecc_userProfile');
    return saved ? JSON.parse(saved) : initialUserProfile;
  });
  
  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  // Track current song by ID to handle playlist reordering correctly
  const [currentTrackId, setCurrentTrackId] = useState(null);
  // Track viewed songs in current session to avoid showing them again after "next"
  const [viewedTrackIds, setViewedTrackIds] = useState(new Set());
  
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
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  
  const debounceTimerRef = useRef(null);
  
  // Consolidated ref synchronization using custom hook
  const enrichedTracksRef = useSyncedRef(enrichedTracks);
  const userProfileRef = useSyncedRef(userProfile);
  const feedbackTimelineRef = useSyncedRef(feedbackTimeline);
  const currentPlaylistIdRef = useSyncedRef(currentPlaylistId);
  const currentTrackIndexRef = useSyncedRef(currentTrackIndex);
  const currentTrackIdRef = useSyncedRef(currentTrackId);
  const playlistsRef = useSyncedRef(playlists);
  const likedTrackIdsRef = useSyncedRef(likedTrackIds);
  const dislikedTrackIdsRef = useSyncedRef(dislikedTrackIds);
  const viewedTrackIdsRef = useSyncedRef(viewedTrackIds);

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

  // Initialize tracks - no async enrichment needed since tracks.json has all data
  useEffect(() => {
    setIsLoadingPreviews(true);
    // Add hasRealPreview flag inline (removes need for musicApi.js)
    const enriched = tracksData.map(track => ({
      ...track,
      hasRealPreview: !!track.previewUrl
    }));
    setEnrichedTracks(enriched);
    setIsLoadingPreviews(false);
  }, []);


  const debouncedRegenerate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      regeneratePlaylists();
    }, 150);
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
    
    // Use refs to get current values
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
    
    // Track by ID so we follow the song even if playlist reorders
    const freshTrackId = currentTrackIdRef.current;
    
    if (freshPlaylistId && freshTrackId) {
      const newPlaylistIndex = newPlaylists.findIndex(p => p.id === freshPlaylistId);
      if (newPlaylistIndex !== -1) {
        const newPlaylist = newPlaylists[newPlaylistIndex];
        const newIndex = newPlaylist.tracks.findIndex(t => t.id === freshTrackId);
        
        if (newIndex === -1) {
          // Track fell out of top 20 - find it from original data and insert at current position
          const oldPlaylist = freshPlaylists.find(p => p.id === freshPlaylistId);
          const trackFromOld = oldPlaylist?.tracks.find(t => t.id === freshTrackId);
          
          if (trackFromOld) {
            const trackWithScore = {
              ...trackFromOld,
              score: (trackFromOld.score || 0.5) * 0.95,
              confidence: (trackFromOld.confidence || 0.5) * 0.95
            };
            const insertIndex = Math.min(freshTrackIndex, newPlaylist.tracks.length);
            newPlaylists[newPlaylistIndex].tracks.splice(insertIndex, 0, trackWithScore);
            if (newPlaylists[newPlaylistIndex].tracks.length > 20) {
              newPlaylists[newPlaylistIndex].tracks = newPlaylists[newPlaylistIndex].tracks.slice(0, 20);
            }
          }
        } else if (newIndex !== freshTrackIndex) {
          // Track moved position - update index to follow it so user stays on same song
          setCurrentTrackIndex(newIndex);
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
    
    setUserProfile(prev => {
      // Also update context weights so slider changes apply everywhere
      const updatedProfile = {
        ...prev,
        genreWeights: { ...prev.genreWeights, ...newWeights }
      };
      
      if (prev.perPlaylistLearning && Object.keys(prev.contextGenreWeights).length > 0) {
        const updatedContextWeights = { ...prev.contextGenreWeights };
        
        // Apply the same changes to all existing context weights
        Object.keys(updatedContextWeights).forEach(context => {
          updatedContextWeights[context] = { ...updatedContextWeights[context] };
          Object.entries(newWeights).forEach(([genre, weight]) => {
            if (updatedContextWeights[context][genre] !== undefined) {
              updatedContextWeights[context][genre] = weight;
            }
          });
        });
        
        updatedProfile.contextGenreWeights = updatedContextWeights;
      }
      
      return updatedProfile;
    });
    
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
    const oldActivity = userProfileRef.current.currentActivity;
    setUserProfile(prev => ({ ...prev, currentActivity: activity }));
    
    // Log both setting and clearing activity
    if (activity) {
      logFeedback({
        type: "activity_change",
        details: { activity, from: oldActivity },
        impact: `Prioritizing ${activity.toLowerCase()} tracks`
      });
    } else if (oldActivity) {
      logFeedback({
        type: "activity_change",
        details: { activity: null, from: oldActivity },
        impact: "Cleared activity filter"
      });
    }
  };

  const setMoods = (moods) => {
    const oldMoods = userProfileRef.current.currentMoods;
    setUserProfile(prev => ({ ...prev, currentMoods: moods }));
    
    // Log mood changes
    if (moods.length > 0 || oldMoods.length > 0) {
      logFeedback({
        type: "mood_change",
        details: { moods, from: oldMoods },
        impact: moods.length > 0 
          ? `Set mood: ${moods.join(', ')}`
          : "Cleared mood filters"
      });
    }
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

  const togglePerPlaylistLearning = () => {
    const newValue = !userProfileRef.current.perPlaylistLearning;
    setUserProfile(prev => ({ ...prev, perPlaylistLearning: newValue }));
    
    logFeedback({
      type: "setting_change",
      details: { setting: "perPlaylistLearning", value: newValue },
      impact: newValue 
        ? "Learning separately for each activity" 
        : "Learning globally across all playlists"
    });
  };

  const likeSong = (trackId, context = null) => {
    const track = tracksData.find(t => t.id === trackId);
    const currentPlaylist = playlistsRef.current.find(p => p.id === currentPlaylistIdRef.current);
    const playlistContext = currentPlaylist?.context;
    
    // Save state for undo
    const wasDisliked = dislikedTrackIdsRef.current.has(trackId);
    const previousWeights = { ...userProfileRef.current.genreWeights };
    const previousContextWeights = playlistContext && userProfileRef.current.contextGenreWeights[playlistContext]
      ? { ...userProfileRef.current.contextGenreWeights[playlistContext] }
      : null;
    
    setConsecutiveSkips(0);
    
    setLikedTrackIds(prev => new Set([...prev, trackId]));
    setDislikedTrackIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(trackId);
      return newSet;
    });
    
    if (track) {
      setUserProfile(prev => {
        const newLikeContexts = context 
          ? [context, ...(prev.recentLikeContexts || [])].slice(0, 5)
          : prev.recentLikeContexts;
        
        // Use helper to update weights (handles both per-playlist and global learning)
        const weightUpdates = updateGenreWeightsForTrack(
          track, prev.genreWeights, 0.05, playlistContext,
          prev.perPlaylistLearning, prev.contextGenreWeights, prev.genreWeights
        );
        
        return { ...prev, ...weightUpdates, recentLikeContexts: newLikeContexts };
      });
    }

    const isPerPlaylist = userProfileRef.current.perPlaylistLearning && playlistContext;

    logFeedback({
      type: "like",
      trackId,
      trackTitle: track?.title,
      details: { context, perPlaylist: isPerPlaylist, playlistContext },
      restoreState: {
        undoType: 'like',
        trackId,
        wasDisliked,
        genreWeights: previousWeights,
        contextWeights: previousContextWeights,
        playlistContext
      },
      impact: isPerPlaylist 
        ? `Learning for ${playlistContext}` 
        : "More songs like this"
    });
  };

  const unlikeSong = (trackId) => {
    const track = tracksData.find(t => t.id === trackId);
    setLikedTrackIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(trackId);
      return newSet;
    });
    const currentPlaylist = playlistsRef.current.find(p => p.id === currentPlaylistIdRef.current);
    const playlistContext = currentPlaylist?.context;
    
    if (track) {
      setUserProfile(prev => {
        // Use helper to update weights (negative delta for unlike)
        const weightUpdates = updateGenreWeightsForTrack(
          track, prev.genreWeights, -0.05, playlistContext,
          prev.perPlaylistLearning, prev.contextGenreWeights, prev.genreWeights
        );
        return { ...prev, ...weightUpdates };
      });
    }

    logFeedback({
      type: "unlike",
      trackId,
      impact: "Removed from likes"
    });
  };

  const skipSong = (trackId, reason = null) => {
    setConsecutiveSkips(prev => prev + 1);
    
    // Mark current track as viewed
    setViewedTrackIds(prev => new Set([...prev, trackId]));
    
    logFeedback({
      type: "skip",
      trackId,
      details: { reason },
      impact: reason ? `Noted: ${reason}` : "Fewer songs like this"
    });
    
    // Find next unviewed track
    const currentPlaylist = playlistsRef.current.find(p => p.id === currentPlaylistIdRef.current);
    const idx = currentTrackIndexRef.current;
    const viewed = viewedTrackIdsRef.current;
    
    if (currentPlaylist) {
      // Find the next track that hasn't been viewed yet
      let nextIndex = -1;
      for (let i = idx + 1; i < currentPlaylist.tracks.length; i++) {
        if (!viewed.has(currentPlaylist.tracks[i].id)) {
          nextIndex = i;
          break;
        }
      }
      
      // If no unviewed tracks found after current position, just take the next one
      if (nextIndex === -1 && idx < currentPlaylist.tracks.length - 1) {
        nextIndex = idx + 1;
      }
      
      if (nextIndex !== -1) {
        const nextTrack = currentPlaylist.tracks[nextIndex];
        setCurrentTrackIndex(nextIndex);
        setCurrentTrackId(nextTrack.id);
        // Mark the new track as viewed
        setViewedTrackIds(prev => new Set([...prev, nextTrack.id]));
      }
    }
  };

  const dislikeSong = (trackId) => {
    const track = tracksData.find(t => t.id === trackId);
    const currentPlaylist = playlistsRef.current.find(p => p.id === currentPlaylistIdRef.current);
    const playlistContext = currentPlaylist?.context;
    
    // Save state for undo
    const wasLiked = likedTrackIdsRef.current.has(trackId);
    const previousWeights = { ...userProfileRef.current.genreWeights };
    const previousContextWeights = playlistContext && userProfileRef.current.contextGenreWeights[playlistContext]
      ? { ...userProfileRef.current.contextGenreWeights[playlistContext] }
      : null;
    
    setConsecutiveSkips(0);
    setDislikedTrackIds(prev => new Set([...prev, trackId]));
    setLikedTrackIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(trackId);
      return newSet;
    });
    
    if (track) {
      setUserProfile(prev => {
        // Use helper to update weights (negative delta for dislike)
        const weightUpdates = updateGenreWeightsForTrack(
          track, prev.genreWeights, -0.05, playlistContext,
          prev.perPlaylistLearning, prev.contextGenreWeights, prev.genreWeights
        );
        return { ...prev, ...weightUpdates };
      });
    }

    logFeedback({
      type: "dislike",
      trackId,
      trackTitle: track?.title,
      restoreState: {
        undoType: 'dislike',
        trackId,
        wasLiked,
        genreWeights: previousWeights,
        contextWeights: previousContextWeights,
        playlistContext
      },
      impact: "Less songs like this"
    });

    // Advance to next track
    const idx = currentTrackIndexRef.current;
    if (currentPlaylist && idx < currentPlaylist.tracks.length - 1) {
      const nextIndex = idx + 1;
      setCurrentTrackIndex(nextIndex);
      // Update track ID to the new track we're advancing to
      setCurrentTrackId(currentPlaylist.tracks[nextIndex].id);
    }
  };

  const undislikeSong = (trackId) => {
    const track = tracksData.find(t => t.id === trackId);
    setDislikedTrackIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(trackId);
      return newSet;
    });
    const currentPlaylist = playlistsRef.current.find(p => p.id === currentPlaylistIdRef.current);
    const playlistContext = currentPlaylist?.context;
    
    if (track) {
      setUserProfile(prev => {
        // Use helper to update weights (positive delta for undislike/restore)
        const weightUpdates = updateGenreWeightsForTrack(
          track, prev.genreWeights, 0.05, playlistContext,
          prev.perPlaylistLearning, prev.contextGenreWeights, prev.genreWeights
        );
        return { ...prev, ...weightUpdates };
      });
    }

    logFeedback({
      type: "undislike",
      trackId,
      impact: "Removed dislike"
    });
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
      const { restoreState } = eventToUndo;
      
      // Undo like
      if (restoreState.undoType === 'like') {
        setLikedTrackIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(restoreState.trackId);
          return newSet;
        });
        // Restore disliked status if it was previously disliked
        if (restoreState.wasDisliked) {
          setDislikedTrackIds(prev => new Set([...prev, restoreState.trackId]));
        }
      }
      
      // Undo dislike
      if (restoreState.undoType === 'dislike') {
        setDislikedTrackIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(restoreState.trackId);
          return newSet;
        });
        // Restore liked status if it was previously liked
        if (restoreState.wasLiked) {
          setLikedTrackIds(prev => new Set([...prev, restoreState.trackId]));
        }
      }
      
      // Restore weights
      setUserProfile(prev => {
        const newState = { ...prev };
        
        if (restoreState.genreWeights) {
          newState.genreWeights = { 
            ...newState.genreWeights, 
            ...restoreState.genreWeights 
          };
        }
        
        if (restoreState.contextWeights && restoreState.playlistContext) {
          newState.contextGenreWeights = {
            ...newState.contextGenreWeights,
            [restoreState.playlistContext]: restoreState.contextWeights
          };
        }
        
        if (restoreState.explorationLevel !== undefined) {
          newState.explorationLevel = restoreState.explorationLevel;
        }
        
        return newState;
      });
      
      // Show appropriate toast message
      const trackTitle = eventToUndo.trackTitle;
      if (restoreState.undoType === 'like') {
        toast.info("Undid Like", {
          description: trackTitle ? `"${trackTitle}" removed from likes` : "Song removed from likes",
          duration: 2000
        });
      } else if (restoreState.undoType === 'dislike') {
        toast.info("Undid Dislike", {
          description: trackTitle ? `"${trackTitle}" can appear again` : "Song can appear again",
          duration: 2000
        });
      } else {
        toast.info("Undid Changes", {
          description: "Your preferences have been restored.",
          duration: 2000
        });
      }
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
      description: "All preferences and history have been cleared.",
      duration: 2000
    });
  };

  const playPlaylist = useCallback((playlistId) => {
    setCurrentPlaylistId(playlistId);
    setCurrentTrackIndex(0);
    // Clear viewed tracks when entering a new playlist
    setViewedTrackIds(new Set());
    // Set track ID from the first track of this playlist
    const playlist = playlistsRef.current.find(p => p.id === playlistId);
    if (playlist?.tracks[0]) {
      setCurrentTrackId(playlist.tracks[0].id);
      // Mark first track as viewed
      setViewedTrackIds(new Set([playlist.tracks[0].id]));
    }
  }, []);

  const playTrackAtIndex = useCallback((index) => {
    setCurrentTrackIndex(index >= 0 ? index : 0);
    // Set track ID from the track at this index
    const playlist = playlistsRef.current.find(p => p.id === currentPlaylistIdRef.current);
    if (playlist?.tracks[index]) {
      setCurrentTrackId(playlist.tracks[index].id);
    }
  }, []);

  // Memoize expensive computations to prevent unnecessary re-renders
  const currentPlaylist = useMemo(
    () => playlists.find(p => p.id === currentPlaylistId),
    [playlists, currentPlaylistId]
  );
  const currentTrack = useMemo(
    () => currentPlaylist?.tracks[currentTrackIndex],
    [currentPlaylist, currentTrackIndex]
  );

  // Sync track ID when currentTrack changes
  useEffect(() => {
    if (currentTrack?.id && currentTrack.id !== currentTrackId) {
      setCurrentTrackId(currentTrack.id);
    }
  }, [currentTrack?.id, currentTrackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.previewUrl) {
      setIsPlaying(false);
      return;
    }

    if (audio.src !== currentTrack.previewUrl) {
      audio.src = currentTrack.previewUrl;
      audio.load();
      setCurrentTime(0);
      setDuration(0);
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentTrack?.id, currentTrack?.previewUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      const playlist = playlistsRef.current.find(p => p.id === currentPlaylistIdRef.current);
      const idx = currentTrackIndexRef.current;
      if (playlist && idx < playlist.tracks.length - 1) {
        const nextIndex = idx + 1;
        setCurrentTrackIndex(nextIndex);
        // Also update track ID for auto-advance
        setCurrentTrackId(playlist.tracks[nextIndex].id);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.previewUrl) {
      toast.error("No preview available for this track");
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      toast.error("Failed to play audio");
    }
  }, [isPlaying, currentTrack?.previewUrl]);

  const seekTo = useCallback((time) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
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
    togglePerPlaylistLearning,
    likeSong,
    unlikeSong,
    dislikeSong,
    undislikeSong,
    skipSong,
    undoFeedbackEvent,
    resetAlgorithm,
    playPlaylist,
    playTrackAtIndex,
    regeneratePlaylists,
    logFeedback,
    setConsecutiveSkips,
    isActivityModalOpen,
    setIsActivityModalOpen,
    isTuningModalOpen,
    setIsTuningModalOpen,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    seekTo,
    currentTrack
  };

  return (
    <RecommendationEngineContext.Provider value={value}>
      {children}
      <audio ref={audioRef} />
    </RecommendationEngineContext.Provider>
  );
}
