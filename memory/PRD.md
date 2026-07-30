# PRD — Acharya Akash Vedic Astrology App

## Original problem statement
Build astrology app. Name- Acharya Akash. Gold medalist from KN Rao's institute of Astrology, Bhartiya Vidya Bhavan, New Delhi. Specialization Vedic Astrology. Include payment option.

## User personas
- Seeker: wants daily horoscopes and quick guidance
- Believer: wants a full birth chart Kundali analysis
- Couple: wants compatibility check
- Committed follower: buys consultations / subscribes to premium

## Core requirements
- Daily/Weekly/Monthly horoscopes per zodiac sign (AI-generated, cached)
- Vedic birth chart (Kundali) generation from birth date/time/place
- Compatibility between two signs
- AI astrologer chat (Claude Sonnet 4.5 via Emergent LLM Key)
- Email+password auth (JWT, bcrypt)
- Stripe payments (one-time consultations + monthly subscription)
- Personal dashboard with saved charts and chat history
- Mystical cosmic dark theme (gold accents, Cormorant Garamond + Manrope)

## Implemented (2026-02)
- Backend FastAPI with /api prefix
  - Auth: signup, login, /me
  - Horoscopes: sign list + daily/weekly/monthly with LLM + cache
  - Birth chart: create + history (LLM Vedic analysis, sun sign auto-detect)
  - Compatibility: analyse two signs (LLM Vedic Guna Milan style)
  - Chat: sessioned messages persisted; sessions list
  - Payments: packages list, checkout (Stripe emergentintegrations Flow B), status poll, webhook
- Frontend React
  - Landing (hero with portrait + nebula, marquee, features, about, CTA)
  - Auth (login/signup)
  - Horoscopes (sign chips + tab periods)
  - Birth Chart (form + AI reading + history)
  - Compatibility (dual sign select)
  - AI Chat (sessions sidebar + message stream)
  - Pricing (4 one-time packages + premium subscription)
  - Payment Success/Cancel pages
  - Dashboard (bento layout with today's reading, counts, upgrade)
  - Global Starfield background, glass-morphism, gold accents

## Stripe Setup
- Country IN not supported by claimable sandbox → using Flow B (BYOK) with shared `sk_test_emergent` pre-injected key.
- Webhook path `/api/webhook/stripe`.

## Prioritized backlog
- P1: Streaming SSE for AI chat replies (better UX)
- P1: Email delivery of reading PDF after purchase
- P2: Muhurta / auspicious timings for a specific date
- P2: Add Razorpay as alternate payment provider for India
- P2: WhatsApp booking after payment (Twilio)
- P3: Tarot / oracle daily card
