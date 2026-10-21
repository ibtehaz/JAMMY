# Jammy

A music recommender that explains its picks. Built for CS 6750 (Human-Computer Interaction) at Georgia Tech, Fall 2025.

**Live demo:** [tryjammy.netlify.app](https://tryjammy.netlify.app) · **Video:** [youtu.be/M7oTdFLv7G8](https://youtu.be/M7oTdFLv7G8)

## What it does

- Recommends songs from a 55-track catalog based on your mood, what you're doing, and how much you want to explore.
- Learns from likes, dislikes, and skips as you listen, and can keep separate preferences per playlist.
- Shows why each song was picked and how confident it is.

## How a song gets scored

Every track gets a weighted score:

| Signal | Weight |
|---|---|
| Genre match (learned from your feedback) | 35% |
| Familiarity vs. the exploration slider | 25% |
| Activity fit | 20% |
| Mood | 10% |
| Energy | 5% |
| Similar to songs you just liked | 5% |

Likes and dislikes move genre weights by 0.05. Each skip cuts a track's score by 25%, down to a floor of 15%. Liked tracks get a 10% boost. The scoring lives in `src/context/RecommendationEngineContext.jsx`.

## User study

Two rounds, 30 participants each (25 surveys and 5 think-aloud sessions):

- Round 1 compared three prototypes.
- Round 2 tested this app.

Satisfaction went from 5.4 for the best prototype to 6.0 out of 7 for the final app, and 92% of participants said they were satisfied.

## Stack

React 19, Vite 7, Tailwind CSS 4, Framer Motion. Song previews come from iTunes.

## Team

A 4-person team project. I built the app; the four of us designed and ran the study together.

## Run it locally

```bash
npm install
npm run dev
```
