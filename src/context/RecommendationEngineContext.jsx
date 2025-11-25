import { createContext, useContext, useState, useEffect } from 'react';
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

function scoreTrack(track, userProfile) {
  let score = 0;
  
  // 1. Genre match (40% weight)
  track.genres.forEach(g => {
    score += (userProfile.genreWeights[g] || 0) * 0.4;
  });
  
  // 2. Exploration/Familiarity (30% weight)
  const explorationLevel = userProfile.explorationLevel;
  if (explorationLevel < 0.5) {
    // User wants familiar -> boost high-familiarity tracks
    score += track.familiarity * 0.3;
  } else {
    // User wants adventurous -> boost low-familiarity tracks
    score += (1 - track.familiarity) * 0.3;
  }
  
  // 3. Activity match (20% weight)
  if (userProfile.currentActivity) {
    const activityMatch = track.contexts.includes(userProfile.currentActivity);
    score += activityMatch ? 0.2 : 0;
  }
  
  // 4. Mood match (10% weight)
  if (userProfile.currentMoods.length > 0) {
    const moodOverlap = userProfile.currentMoods.filter(m => 
      track.moods.includes(m)
    ).length;
    score += (moodOverlap / Math.max(userProfile.currentMoods.length, 1)) * 0.1;
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

// Helper: Count how many times a track has been skipped
function getSkipCountForTrack(trackId, feedbackTimeline) {
  return feedbackTimeline.filter(e => 
    e.type === 'skip' && e.trackId === trackId
  ).length;
}

// Helper: Calculate skip penalty multiplier based on skip count
function calculateSkipPenalty(skipCount) {
  // Progressive penalty: 0 skips = 1.0x, 1 skip = 0.75x, 2 skips = 0.50x, 3 skips = 0.30x, 4+ skips = 0.15x
  return Math.max(0.15, 1 - (skipCount * 0.25));
}

function generatePlaylist(context, tracks, userProfile, feedbackTimeline = [], limit = 20) {
  const scored = tracks
    .map(t => {
      // Calculate base score from user preferences
      const baseScore = scoreTrack(t, userProfile);
      
      // Apply skip penalty if track has been skipped before
      const skipCount = getSkipCountForTrack(t.id, feedbackTimeline);
      const skipPenalty = calculateSkipPenalty(skipCount);
      const finalScore = baseScore * skipPenalty;
      
      return {
        ...t,
        score: finalScore,
        confidence: finalScore,
        baseScore,  // Keep base score for debugging
        skipCount,  // Track skip count for transparency
        skipPenalty, // Track penalty applied
        reasoning: generateReasoning(t, userProfile, finalScore)
      };
    });

  // Sort by final score and slice to get top tracks
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
    context: "Favorites"
  },
  {
    id: "workout",
    title: "Workout Energy",
    description: "High-energy tracks for exercise",
    context: "Workout"
  },
  {
    id: "chill",
    title: "Chill Evening",
    description: "Relaxing vibes for unwinding",
    context: "Chill"
  }
];

const initialUserProfile = {
  genreWeights: {
    rock: 0.7,
    pop: 0.6,
    hiphop: 0.5,
    jazz: 0.3,
    electronic: 0.4,
    classical: 0.2,
    country: 0.3,
    indie: 0.6
  },
  explorationLevel: 0.5,  // 0=familiar, 1=adventurous
  currentActivity: null,
  currentMoods: []
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

  // Save to localStorage whenever userProfile or feedbackTimeline changes
  useEffect(() => {
    localStorage.setItem('musicRecc_userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('musicRecc_feedbackTimeline', JSON.stringify(feedbackTimeline));
  }, [feedbackTimeline]);

  // Enrich tracks with preview data on mount
  useEffect(() => {
    async function loadPreviews() {
      setIsLoadingPreviews(true);
      const enriched = await enrichTracksWithPreviews(tracksData, 150);
      setEnrichedTracks(enriched);
      setIsLoadingPreviews(false);
      
      const previewCount = enriched.filter(t => t.hasRealPreview).length;
    }
    loadPreviews();
  }, []);

  // Generate playlists on mount and when user profile or timeline changes
  useEffect(() => {
    if (enrichedTracks.length > 0) {
      regeneratePlaylists();
    }
  }, [userProfile, feedbackTimeline, enrichedTracks]);

  const regeneratePlaylists = () => {
    const tracksToUse = enrichedTracks.length > 0 ? enrichedTracks : tracksData;
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

  const updateGenreWeight = (genre, newWeight) => {
    setUserProfile(prev => {
      const oldWeight = prev.genreWeights[genre];
      // Only log if significant change
      if (Math.abs(oldWeight - newWeight) > 0.1) {
        logFeedback({
          type: "tuning_change",
          details: { genre, from: oldWeight, to: newWeight },
          impact: `${newWeight > oldWeight ? '+' : ''}${Math.round((newWeight - oldWeight) * 100)}% ${genre} tracks`
        });
      }
      
      return {
        ...prev,
        genreWeights: { ...prev.genreWeights, [genre]: newWeight }
      };
    });
  };

  const updateGenreWeights = (newWeights) => {
    setUserProfile(prev => ({
      ...prev,
      genreWeights: { ...prev.genreWeights, ...newWeights }
    }));
    
    logFeedback({
      type: "tuning_change",
      details: { type: "batch_update" },
      impact: "Updated multiple genre preferences"
    });
  };

  const setExplorationLevel = (level) => {
    const oldLevel = userProfile.explorationLevel;
    setUserProfile(prev => ({ ...prev, explorationLevel: level }));
    
    logFeedback({
      type: "tuning_change",
      details: { setting: "exploration", from: oldLevel, to: level },
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
    
    // Auto-tune: Slightly boost genres of liked track
    const track = tracksData.find(t => t.id === trackId);
    if (track) {
      setUserProfile(prev => {
        const newWeights = { ...prev.genreWeights };
        track.genres.forEach(g => {
          if (newWeights[g] !== undefined) {
            newWeights[g] = Math.min(newWeights[g] + 0.05, 1);
          }
        });
        return { ...prev, genreWeights: newWeights };
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
    
    // Auto-tune: Slightly reduce genres of disliked track
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

  const playPlaylist = (playlistId) => {
    setCurrentPlaylistId(playlistId);
    setCurrentTrackIndex(0);
  };

  const playPreviousSong = () => {
    setCurrentTrackIndex(prev => Math.max(0, prev - 1));
  };

  const playTrackAtIndex = (index) => {
    const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
    
    if (currentPlaylist && index >= 0 && index < currentPlaylist.tracks.length) {
      setCurrentTrackIndex(index);
    } else {
      console.error('playTrackAtIndex: Invalid index or playlist missing', { index, playlistId: currentPlaylistId, hasPlaylist: !!currentPlaylist, trackCount: currentPlaylist?.tracks?.length });
    }
  };

  const value = {
    userProfile,
    playlists,
    currentPlaylistId,
    currentTrackIndex,
    feedbackTimeline,
    consecutiveSkips,
    isLoadingPreviews,
    updateGenreWeight,
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
    setConsecutiveSkips
  };

  return (
    <RecommendationEngineContext.Provider value={value}>
      {children}
    </RecommendationEngineContext.Provider>
  );
}
