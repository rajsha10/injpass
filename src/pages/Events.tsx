import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../components/Button';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';

interface EventsProps {
  setCurrentTab: (tab: string) => void;
}

interface EventItem {
  id: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  scoreHome: number;
  scoreAway: number;
  status: 'scheduled' | 'live' | 'finished';
  minute: number;
  recentEvent: string;
  winnerTeam?: string;
  scheduledAt?: string;
  ticketTiers?: SeatTier[];
}

interface SeatTier {
  id: string;
  name: string;
  price: number;
  description: string;
  seats: number[];
  color: string;
}

const SEAT_TIERS: SeatTier[] = [
  {
    id: 'vip',
    name: 'VIP Platinum',
    price: 50,
    description: 'Pitchside access · Priority entry · Gold NFT eligibility',
    seats: [101, 102, 103, 104, 105],
    color: '#F59E0B',
  },
  {
    id: 'cat1',
    name: 'Category 1',
    price: 20,
    description: 'Lower tier · Central view · Standard NFT ticket',
    seats: [201, 202, 203, 204, 205, 206, 207],
    color: '#1BAAFF',
  },
];

// Unique gradient backgrounds per carousel slide index (matching the gaming aesthetic of the image)
const SLIDE_GRADIENTS = [
  // Cyan/Gold glow (League of Legends vibe)
  'linear-gradient(135deg, #091726 0%, #005a82 40%, #00a8cc 80%, #00ffcc 100%)',
  // Cyberpunk Yellow (vibrant contrast)
  'linear-gradient(135deg, #151500 0%, #3a3300 40%, #8b7d00 80%, #fcee0a 100%)',
  // Control Crimson Red (rich, atmospheric)
  'linear-gradient(135deg, #100202 0%, #440404 40%, #8c0c0c 80%, #ff1c1c 100%)',
  // Nature Aqua/Teal (Horizon vibe)
  'linear-gradient(135deg, #041a1b 0%, #063c3e 40%, #008f95 80%, #00ffcc 100%)',
  // Sunset Orange (Red Dead vibe)
  'linear-gradient(135deg, #120400 0%, #4a1200 40%, #a82c00 80%, #ff5200 100%)',
];

// Accent colors matched to each gradient
const SLIDE_ACCENTS = ['#00ffcc', '#fcee0a', '#ff1c1c', '#00ffcc', '#ff5200'];

type PurchaseStep = 'idle' | 'select-tier' | 'select-seat' | 'choose-team' | 'confirm' | 'minting' | 'minted';

/** Compute lowest ticket price from tiers */
function getLowestPrice(event: EventItem): number {
  const tiers = event.ticketTiers && event.ticketTiers.length > 0 ? event.ticketTiers : SEAT_TIERS;
  return Math.min(...tiers.map((t) => t.price));
}

/** Team flag emoji helper */
function teamFlag(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('argentina')) return '🇦🇷';
  if (lower.includes('france')) return '🇫🇷';
  if (lower.includes('brazil')) return '🇧🇷';
  if (lower.includes('germany')) return '🇩🇪';
  if (lower.includes('spain')) return '🇪🇸';
  if (lower.includes('england')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if (lower.includes('portugal')) return '🇵🇹';
  if (lower.includes('italy')) return '🇮🇹';
  return '⚽';
}

const TEAM_THEMES: Record<string, { gradient: string; initials: string; emoji?: string; border: string }> = {
  'seattle reign fc': { gradient: 'linear-gradient(135deg, #0A2240 0%, #1d3d63 50%, #C5B059 100%)', initials: 'SR', emoji: '👑', border: '#C5B059' },
  'reign fc': { gradient: 'linear-gradient(135deg, #0A2240 0%, #1d3d63 50%, #C5B059 100%)', initials: 'SR', emoji: '👑', border: '#C5B059' },
  'utah royals fc': { gradient: 'linear-gradient(135deg, #4A204B 0%, #703373 50%, #F5A623 100%)', initials: 'UR', emoji: '🦁', border: '#F5A623' },
  'utah royals': { gradient: 'linear-gradient(135deg, #4A204B 0%, #703373 50%, #F5A623 100%)', initials: 'UR', emoji: '🦁', border: '#F5A623' },
  'racing louisville fc': { gradient: 'linear-gradient(135deg, #7C5B9B 0%, #a282c0 50%, #5d3a7d 100%)', initials: 'RL', emoji: '⚜️', border: '#D8B4FE' },
  'racing louisville': { gradient: 'linear-gradient(135deg, #7C5B9B 0%, #a282c0 50%, #5d3a7d 100%)', initials: 'RL', emoji: '⚜️', border: '#D8B4FE' },
  'rayadas de monterrey': { gradient: 'linear-gradient(135deg, #002D62 0%, #00479E 50%, #FFFFFF 100%)', initials: 'MTY', emoji: 'Ⓜ️', border: '#002D62' },
  'monterrey': { gradient: 'linear-gradient(135deg, #002D62 0%, #00479E 50%, #FFFFFF 100%)', initials: 'MTY', emoji: 'Ⓜ️', border: '#002D62' },
  'tigres uanl': { gradient: 'linear-gradient(135deg, #FDB913 0%, #FFCC00 50%, #005A9C 100%)', initials: 'TIG', emoji: '🐯', border: '#005A9C' },
  'pachuca': { gradient: 'linear-gradient(135deg, #004D98 0%, #0066CC 50%, #FFFFFF 100%)', initials: 'PAC', emoji: '⚽', border: '#004D98' },
  'san diego wave fc': { gradient: 'linear-gradient(135deg, #00A3E0 0%, #FF6C37 50%, #D81B60 100%)', initials: 'SDW', emoji: '🌊', border: '#FF6C37' },
  'san diego wave': { gradient: 'linear-gradient(135deg, #00A3E0 0%, #FF6C37 50%, #D81B60 100%)', initials: 'SDW', emoji: '🌊', border: '#FF6C37' },
  'bay fc': { gradient: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #FC4C02 100%)', initials: 'BAY', emoji: '🌉', border: '#FC4C02' },
  'chicago red stars': { gradient: 'linear-gradient(135deg, #41B6E6 0%, #82D1F3 50%, #E4002B 100%)', initials: 'CRS', emoji: '⭐', border: '#E4002B' },
  'red stars': { gradient: 'linear-gradient(135deg, #41B6E6 0%, #82D1F3 50%, #E4002B 100%)', initials: 'CRS', emoji: '⭐', border: '#E4002B' },
  'nj/ny gotham fc': { gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #00FFCC 100%)', initials: 'GFC', emoji: '🦇', border: '#00FFCC' },
  'gotham fc': { gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #00FFCC 100%)', initials: 'GFC', emoji: '🦇', border: '#00FFCC' },
  'angel city fc': { gradient: 'linear-gradient(135deg, #0F172A 0%, #1C1917 50%, #FF9E9E 100%)', initials: 'AC', emoji: '👼', border: '#FF9E9E' },
  'angel city': { gradient: 'linear-gradient(135deg, #0F172A 0%, #1C1917 50%, #FF9E9E 100%)', initials: 'AC', emoji: '👼', border: '#FF9E9E' },
  'club américa': { gradient: 'linear-gradient(135deg, #FFF0A5 0%, #FFF5C2 50%, #0C2340 100%)', initials: 'AME', emoji: '🦅', border: '#0C2340' },
  'club america': { gradient: 'linear-gradient(135deg, #FFF0A5 0%, #FFF5C2 50%, #0C2340 100%)', initials: 'AME', emoji: '🦅', border: '#0C2340' },
  'north carolina courage': { gradient: 'linear-gradient(135deg, #002D62 0%, #0D47A1 50%, #C8102E 100%)', initials: 'NCC', emoji: '🦁', border: '#FDB913' },
  'nc courage': { gradient: 'linear-gradient(135deg, #002D62 0%, #0D47A1 50%, #C8102E 100%)', initials: 'NCC', emoji: '🦁', border: '#FDB913' },
  'orlando pride': { gradient: 'linear-gradient(135deg, #612B88 0%, #884CB2 50%, #00A3E0 100%)', initials: 'OP', emoji: '👑', border: '#00A3E0' },
  'washington spirit': { gradient: 'linear-gradient(135deg, #002868 0%, #113C88 50%, #BF0A30 100%)', initials: 'WAS', emoji: '🦅', border: '#BF0A30' },
  'chivas de guadalajara': { gradient: 'linear-gradient(135deg, #C8102E 0%, #E63946 50%, #FFFFFF 100%)', initials: 'GDL', emoji: '🐐', border: '#C8102E' },
  'chivas': { gradient: 'linear-gradient(135deg, #C8102E 0%, #E63946 50%, #FFFFFF 100%)', initials: 'GDL', emoji: '🐐', border: '#C8102E' },
  'kansas city current': { gradient: 'linear-gradient(135deg, #00A896 0%, #028090 50%, #DD1C1A 100%)', initials: 'KCC', emoji: '🌊', border: '#DD1C1A' },
  'kc current': { gradient: 'linear-gradient(135deg, #00A896 0%, #028090 50%, #DD1C1A 100%)', initials: 'KCC', emoji: '🌊', border: '#DD1C1A' },
  'houston dash': { gradient: 'linear-gradient(135deg, #FF6F00 0%, #FF9100 50%, #111111 100%)', initials: 'HD', emoji: '⚡', border: '#FF6F00' },
  'portland thorns fc': { gradient: 'linear-gradient(135deg, #A6192E 0%, #B81D24 50%, #000000 100%)', initials: 'PT', emoji: '🌹', border: '#C5B059' },
  'portland thorns': { gradient: 'linear-gradient(135deg, #A6192E 0%, #B81D24 50%, #000000 100%)', initials: 'PT', emoji: '🌹', border: '#C5B059' },
  'club tijuana': { gradient: 'linear-gradient(135deg, #C8102E 0%, #D90429 50%, #111111 100%)', initials: 'XOL', emoji: '🐕', border: '#C8102E' },
  'argentina': { gradient: 'linear-gradient(135deg, #74C0FC 0%, #A5D8FF 50%, #FFFFFF 100%)', initials: 'ARG', emoji: '🇦🇷', border: '#74C0FC' },
  'france': { gradient: 'linear-gradient(135deg, #002395 0%, #1C358D 50%, #ED2939 100%)', initials: 'FRA', emoji: '🇫🇷', border: '#002395' },
};

const TeamCrest: React.FC<{ name: string; size?: number }> = ({ name, size = 52 }) => {
  const clean = name.toLowerCase().trim();
  const theme = TEAM_THEMES[clean] || {
    gradient: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
    initials: name.substring(0, 3).toUpperCase(),
    emoji: '⚽',
    border: '#94a3b8'
  };

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: theme.gradient,
      border: `2.5px solid ${theme.border}`,
      boxShadow: '0 4px 10px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      flexShrink: 0
    }} title={name}>
      <span style={{ fontSize: `${size * 0.38}px`, userSelect: 'none' }}>{theme.emoji}</span>
      <div style={{
        position: 'absolute',
        bottom: '-4px',
        background: '#0a0f24',
        border: `1px solid ${theme.border}`,
        borderRadius: '4px',
        padding: '1px 4px',
        fontSize: '0.55rem',
        fontWeight: 800,
        color: '#ffffff',
        fontFamily: 'var(--font-family-display)',
        letterSpacing: '0.05em',
        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
      }}>
        {theme.initials}
      </div>
    </div>
  );
};

const BroadcasterLogo: React.FC<{ type: 'cbs' | 'paramount' | 'golazo' }> = ({ type }) => {
  if (type === 'cbs') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fff', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          <svg width="18" height="12" viewBox="0 0 24 16" fill="currentColor">
            <path d="M12 0C6 0 1.2 5 0 8c1.2 3 6 8 12 8s10.8-5 12-8c-1.2-3-6-8-12-8zm0 13c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
          </svg>
          <span style={{ fontFamily: 'sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: '0.75rem', letterSpacing: '-0.02em', color: '#fff' }}>
            CBS SPORTS
          </span>
        </div>
        <span style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginTop: '-2px' }}>
          NETWORK
        </span>
      </div>
    );
  }
  if (type === 'paramount') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', color: '#fff', fontStyle: 'italic', fontFamily: 'Georgia, serif', fontWeight: 'bold' }}>
        <span style={{ fontSize: '0.9rem', letterSpacing: '-0.03em' }}>Paramount</span>
        <span style={{ fontSize: '1rem', color: '#00a3e0', fontWeight: 'normal', marginLeft: '1px' }}>+</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'scale(0.9)' }}>
      <div style={{
        background: 'linear-gradient(to right, #e21b23, #fbb03b)',
        padding: '2px 8px',
        borderRadius: '4px',
        display: 'inline-block',
        transform: 'skewX(-10deg)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}>
        <span style={{
          color: '#fff',
          fontFamily: 'var(--font-family-display)',
          fontWeight: 900,
          fontSize: '0.78rem',
          letterSpacing: '0.04em',
          fontStyle: 'italic'
        }}>
          GOLAZO!
        </span>
      </div>
      <span style={{
        fontSize: '0.5rem',
        fontWeight: 800,
        letterSpacing: '0.14em',
        color: '#e21b23',
        textTransform: 'uppercase',
        marginTop: '1px'
      }}>
        NETWORK
      </span>
    </div>
  );
};

function getBroadcasters(eventId: string): ('cbs' | 'paramount' | 'golazo')[] {
  if (eventId.includes('GP-A1') || eventId.includes('GP-B1') || eventId.includes('GP-D1') || eventId.includes('WC2026')) {
    return ['cbs', 'paramount'];
  }
  if (eventId.includes('GP-C1') || eventId.includes('GP-D2') || eventId.includes('GP-C2') || eventId.includes('GP-A2')) {
    return ['paramount', 'golazo'];
  }
  return ['paramount'];
}

function getGroupInfo(eventId: string, _homeTeam: string): { label: string; color: string; textColor: string } {
  if (eventId.includes('WC2026')) {
    return { label: 'FINALS', color: '#F59E0B', textColor: '#020B2D' };
  }
  const match = eventId.match(/-GP-([A-E])/);
  const letter = match ? match[1] : 'A';
  
  switch (letter) {
    case 'A':
      return { label: 'GROUP A', color: '#E28A18', textColor: '#020B2D' };
    case 'B':
      return { label: 'GROUP B', color: '#D6005D', textColor: '#FFFFFF' };
    case 'C':
      return { label: 'GROUP C', color: '#E31B23', textColor: '#FFFFFF' };
    case 'D':
      return { label: 'GROUP D', color: '#00B2A9', textColor: '#020B2D' };
    case 'E':
      return { label: 'GROUP E', color: '#0056B3', textColor: '#FFFFFF' };
    default:
      return { label: `GROUP ${letter}`, color: '#0056B3', textColor: '#FFFFFF' };
  }
}

function formatMatchDate(dateStr?: string): { day: string; date: string; time: string } {
  if (!dateStr) {
    return { day: 'SCHEDULED', date: 'TBD', time: 'TBD' };
  }
  try {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' }).toUpperCase();
    const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' }).toUpperCase();
    const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/New_York' });
    const date = `${month} ${dateNum}`;
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
    return { day, date, time };
  } catch (err) {
    return { day: 'SCHEDULED', date: 'TBD', time: 'TBD' };
  }
}

/* ────────────────────────────────────────────────────────────
   HERO CAROUSEL COMPONENT
──────────────────────────────────────────────────────────── */
interface CarouselProps {
  events: EventItem[];
  onBook: (event: EventItem) => void;
}

const EventsCarousel: React.FC<CarouselProps> = ({ events, onBook }) => {
  const slides = events.slice(0, 5);
  const [active, setActive] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPaused = useRef(false);

  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      if (!isPaused.current) {
        setActive((prev) => (prev + 1) % slides.length);
      }
    }, 4000);
  }, [slides.length]);

  useEffect(() => {
    startAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [startAuto]);

  const goTo = (idx: number) => {
    setActive((idx + slides.length) % slides.length);
    startAuto(); // reset timer on manual nav
  };

  /** Determine CSS class for a given slide index */
  const slideClass = (idx: number): string => {
    if (idx === active) return 'carousel-slide active';
    const diff = (idx - active + slides.length) % slides.length;
    if (diff === 1) return 'carousel-slide peek-right';
    if (diff === slides.length - 1) return 'carousel-slide peek-left';
    return 'carousel-slide hidden';
  };

  if (slides.length === 0) return null;

  return (
    <div
      className="events-carousel-section"
      onMouseEnter={() => { isPaused.current = true; }}
      onMouseLeave={() => { isPaused.current = false; }}
    >
      <div className="events-carousel-inner">
        {slides.map((event, idx) => {
          const isLive = event.status === 'live';
          const isFinished = event.status === 'finished';
          const lowestPrice = getLowestPrice(event);
          const accentColor = SLIDE_ACCENTS[idx % SLIDE_ACCENTS.length];
          const gradient = SLIDE_GRADIENTS[idx % SLIDE_GRADIENTS.length];

          return (
            <div
              key={event.id}
              className={slideClass(idx)}
              onClick={() => idx !== active ? goTo(idx) : undefined}
              style={{ background: gradient }}
            >
              {/* Decorative background glow orb */}
              <div style={{
                position: 'absolute',
                top: '-30%',
                right: '-10%',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
                pointerEvents: 'none',
                zIndex: 0,
              }} />

              {/* Gradient overlay for legibility */}
              <div className="carousel-slide-overlay" />

              {/* Slide content — only fully visible on active */}
              <div className="carousel-slide-content">
                {/* Status + Event ID row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  {isLive ? (
                    <span className="badge-live">LIVE</span>
                  ) : isFinished ? (
                    <span style={{
                      background: 'rgba(71,85,105,0.6)', color: '#94a3b8',
                      fontSize: '0.68rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 700,
                      backdropFilter: 'blur(8px)',
                    }}>FINISHED</span>
                  ) : (
                    <span style={{
                      background: `${accentColor}22`, color: accentColor,
                      fontSize: '0.68rem', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 700,
                      border: `1px solid ${accentColor}44`, backdropFilter: 'blur(8px)',
                    }}>SCHEDULED</span>
                  )}
                  <span style={{
                    fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)',
                    fontFamily: 'ui-monospace, monospace',
                  }}>
                    ID: {event.id}
                  </span>
                </div>

                {/* Team matchup */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{teamFlag(event.homeTeam)}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '28%' }}>
                    {event.homeTeam}
                  </span>
                  <span style={{
                    fontSize: isLive || isFinished ? '1.3rem' : '0.9rem',
                    fontWeight: 800,
                    color: isLive ? accentColor : 'rgba(255,255,255,0.5)',
                    fontFamily: 'var(--font-family-display)',
                    minWidth: '60px', textAlign: 'center',
                  }}>
                    {isLive || isFinished ? `${event.scoreHome} – ${event.scoreAway}` : 'VS'}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '28%' }}>
                    {event.awayTeam}
                  </span>
                  <span style={{ fontSize: '1.5rem' }}>{teamFlag(event.awayTeam)}</span>
                </div>

                {/* Event name */}
                <h2 style={{
                  fontSize: 'clamp(1.3rem, 3vw, 1.9rem)',
                  fontFamily: 'var(--font-family-display)',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  textTransform: 'uppercase',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  marginBottom: '1rem',
                  textShadow: `0 2px 16px ${accentColor}50`,
                }}>
                  {event.name}
                </h2>

                {/* CTA row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    disabled={isFinished}
                    onClick={(e) => { e.stopPropagation(); onBook(event); }}
                    style={{
                      padding: '0.6rem 1.4rem',
                      borderRadius: 'var(--radius-button)',
                      background: isFinished ? 'rgba(71,85,105,0.4)' : `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}bb 100%)`,
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: isFinished ? 'not-allowed' : 'pointer',
                      transition: 'all var(--transition-fast)',
                      boxShadow: isFinished ? 'none' : `0 4px 16px ${accentColor}55`,
                      fontFamily: 'var(--font-family-body)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isFinished) e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {isFinished ? 'Booking Closed' : '🎫 Book Ticket'}
                  </button>

                  {/* Price badge */}
                  {!isFinished && (
                    <span className="price-from-badge" style={{
                      background: `${accentColor}18`,
                      borderColor: `${accentColor}44`,
                      color: accentColor,
                    }}>
                      🎟 Tickets from ${lowestPrice} USDC
                    </span>
                  )}

                  {isLive && (
                    <span style={{ fontSize: '0.78rem', color: `${accentColor}cc`, fontWeight: 600 }}>
                      {event.minute}'
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="carousel-dots">
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`carousel-dot${idx === active ? ' active' : ''}`}
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   MAIN EVENTS PAGE
──────────────────────────────────────────────────────────── */
export const Events: React.FC<EventsProps> = ({ setCurrentTab }) => {
  const { isConnected, connectWallet, walletAddress, setTicketPurchased, usdcBalance } = useWeb3();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Booking states
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>('idle');
  const [selectedTier, setSelectedTier] = useState<SeatTier | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [selectedTeamSupport, setSelectedTeamSupport] = useState<string>('');
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>('');

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/events');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      } else {
        throw new Error(data.error || 'Failed to fetch events');
      }
    } catch (err: any) {
      console.error('Error loading events:', err);
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 4000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleBookClick = (event: EventItem) => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    setActiveEvent(event);
    setSelectedTier(null);
    setSelectedSeat(null);
    setSelectedTeamSupport(event.homeTeam);
    setPurchaseStep('select-tier');
  };

  const handleSelectTier = (tier: SeatTier) => {
    setSelectedTier(tier);
    setPurchaseStep('select-seat');
  };

  const handleSelectSeat = (seat: number) => {
    setSelectedSeat(seat);
    setPurchaseStep('choose-team');
  };

  const handleConfirmTeam = (team: string) => {
    setSelectedTeamSupport(team);
    setPurchaseStep('confirm');
  };

  const handleConfirmPurchase = async () => {
    if (!activeEvent || !selectedTier || !selectedSeat || !walletAddress) return;
    setPurchaseStep('minting');

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error('No EIP-1193 Web3 provider found. Install MetaMask!');

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      const network = await provider.getNetwork();
      if (network.chainId !== 1439n) {
        throw new Error('Your wallet is on the wrong network. Please switch to Injective EVM Testnet (Chain ID 1439) in MetaMask.');
      }

      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0xAE22B3831448eE38e6f6A4A6D8b51B75405384e1';
      const contractAbi = [
        'function purchaseTicket(string memory _eventId, uint256 _seatNumber, uint256 _price, string memory _initialUri) public',
        'function nextTokenId() view returns (uint256)',
        'event TicketPurchased(uint256 indexed tokenId, address indexed buyer, string eventId)',
      ];

      const contract = new ethers.Contract(contractAddress, contractAbi, signer);
      const initialUri = `ipfs://standard-ticket-nft-${activeEvent.id}-${selectedSeat}`;

      console.log(`⚡ Sending purchaseTicket transaction to contract at ${contractAddress}...`);
      const tx = await contract.purchaseTicket(activeEvent.id, selectedSeat, 0, initialUri);

      console.log(`⏳ Tx Submitted! Hash: ${tx.hash}`);
      setTxHash(tx.hash);

      console.log('⏳ Waiting for transaction confirmation on-chain...');
      let receipt: any = null;
      try {
        const getReceiptWithPolling = async (transaction: any, browserProvider: any) => {
          const waitPromise = transaction.wait();
          const pollPromise = new Promise(async (resolve, reject) => {
            const startTime = Date.now();
            const timeout = 45000;
            const fallbackRpc = 'https://1439.rpc.thirdweb.com';
            let pollProvider = browserProvider;
            try {
              pollProvider = new ethers.JsonRpcProvider(fallbackRpc);
            } catch (err) {
              console.warn('Failed to instantiate fallback JSON-RPC provider:', err);
            }
            while (Date.now() - startTime < timeout) {
              try {
                const rx = await pollProvider.getTransactionReceipt(transaction.hash);
                if (rx) { resolve(rx); return; }
              } catch (err) {
                console.warn('Direct receipt polling warning:', err);
              }
              await new Promise((r) => setTimeout(r, 1500));
            }
            reject(new Error('Transaction receipt polling timed out after 45 seconds'));
          });
          return Promise.race([waitPromise, pollPromise]);
        };
        receipt = await getReceiptWithPolling(tx, provider);
      } catch (waitErr: any) {
        console.warn('Standard transaction wait failed. Attempting one last direct check...', waitErr);
        try {
          const directProvider = new ethers.JsonRpcProvider('https://1439.rpc.thirdweb.com');
          receipt = await directProvider.getTransactionReceipt(tx.hash);
        } catch (directErr) {
          console.error('Direct final receipt check failed:', directErr);
        }
        if (!receipt) throw new Error(`Transaction confirmation failed: ${waitErr.message || String(waitErr)}`);
      }

      if (!receipt) throw new Error('Transaction receipt not found');
      if (receipt.status === 0) throw new Error('Transaction was reverted on-chain.');

      console.log('✅ Transaction confirmed! Parsing receipt logs for tokenId...');

      let tokenId = '';
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === 'TicketPurchased') {
            tokenId = parsed.args.tokenId.toString();
            console.log(`🎟️ Extracted Token ID from logs: ${tokenId}`);
            break;
          }
        } catch (e) { /* ignore non-matching logs */ }
      }

      if (!tokenId) {
        console.warn('Could not parse TicketPurchased event. Querying nextTokenId as fallback...');
        const nextId = await contract.nextTokenId();
        tokenId = (nextId - 1n).toString();
        console.log(`🎟️ Fallback Token ID: ${tokenId}`);
      }

      setMintedTokenId(tokenId);

      const res = await fetch('http://localhost:3000/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          seat: selectedSeat,
          ownerAddress: walletAddress,
          eventId: activeEvent.id,
          selectedTeam: selectedTeamSupport,
          nftHash: initialUri,
          txHash: tx.hash,
        }),
      });

      if (!res.ok) throw new Error('Backend purchase sync failed');

      setTicketPurchased(tokenId, selectedSeat);
      setPurchaseStep('minted');
    } catch (err: any) {
      console.error('NFT Minting failed:', err);
      setPurchaseStep('confirm');
      alert(`Minting failed: ${err.message || String(err)}`);
    }
  };

  const closeModal = () => {
    setPurchaseStep('idle');
    setActiveEvent(null);
    setSelectedTier(null);
    setSelectedSeat(null);
  };

  return (
    <div style={{ flex: 1, paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '1600px', width: '90%', margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* ── Loading / Error ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}>🔄</span>
            Fetching scheduled matches...
          </div>
        ) : error ? (
          <div style={{
            padding: '2rem', borderRadius: '16px', background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-error)',
            fontFamily: 'var(--font-family-body)', textAlign: 'center',
          }}>
            <h3>Failed to load events</h3>
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchEvents()} style={{ marginTop: '1rem' }}>Try Again</Button>
          </div>
        ) : events.length === 0 ? (
          /* ── Empty State ── */
          <div className="glass-panel" style={{
            padding: '4rem 2rem', borderRadius: '24px', textAlign: 'center',
            border: '1px solid rgba(27,170,255,0.15)',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>📅</div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              No Events Scheduled Yet
            </h3>
            <p style={{ maxWidth: '460px', margin: '0 auto 1.5rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              The stadium scheduler is currently empty. Events will appear here once the administrator schedules match fixtures.
            </p>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', background: 'rgba(27,170,255,0.06)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>
              Access the hidden Admin Panel to create testing fixtures
            </span>
          </div>
        ) : (
          <>
            {/* ── Hero Carousel (top 5 events) ── */}
            <EventsCarousel events={events} onBook={handleBookClick} />

            {/* ── Featured / Live Matches (e.g. World Cup Final) ── */}
            {events.filter(e => !e.id.startsWith('SC24-GP')).length > 0 && (
              <div style={{ marginBottom: '2.5rem' }}>
                <div className="events-section-label" style={{ marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-family-display)', color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                    Featured Events
                  </h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '1.5rem' }}>
                  {events.filter(e => !e.id.startsWith('SC24-GP')).map((event) => {
                    const isFinished = event.status === 'finished';
                    const { day, date, time } = formatMatchDate(event.scheduledAt);
                    const broadcasters = getBroadcasters(event.id);
                    return (
                      <div
                        key={event.id}
                        onClick={isFinished ? undefined : () => handleBookClick(event)}
                        style={{
                          display: 'flex',
                          height: '115px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: '1px solid rgba(27,170,255,0.3)',
                          background: 'transparent',
                          cursor: isFinished ? 'not-allowed' : 'pointer',
                          position: 'relative',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        }}
                        className="ticket-list-card"
                      >
                        {/* Vertical Left Tag */}
                        <div style={{
                          width: '38px',
                          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', // Gold gradient
                          color: '#020B2D',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <span style={{
                            transform: 'rotate(-90deg)',
                            whiteSpace: 'nowrap',
                            fontFamily: 'var(--font-family-display)',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            display: 'block'
                          }}>
                            {event.status === 'live' ? 'LIVE' : 'FEATURED'}
                          </span>
                        </div>
                        {/* Middle White Card */}
                        <div style={{
                          flex: 1,
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 1.25rem',
                          justifyContent: 'space-between',
                          gap: '1rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, justifyContent: 'center' }}>
                            <TeamCrest name={event.homeTeam} size={52} />
                            <span style={{
                              fontFamily: 'var(--font-family-display)',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: '#6A8DB5',
                              textTransform: 'uppercase',
                              margin: '0 0.2rem'
                            }}>
                              {event.status === 'live' || event.status === 'finished' ? `${event.scoreHome} - ${event.scoreAway}` : 'vs'}
                            </span>
                            <TeamCrest name={event.awayTeam} size={52} />
                          </div>

                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            borderLeft: '2px solid #E2E8F0',
                            paddingLeft: '1.25rem',
                            minWidth: '120px'
                          }}>
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              color: event.status === 'live' ? 'var(--color-orange)' : '#64748B',
                              letterSpacing: '0.06em',
                              marginBottom: '1px'
                            }}>
                              {event.status === 'live' ? `LIVE - ${event.minute}'` : day}
                            </span>
                            <span style={{
                              fontFamily: 'var(--font-family-display)',
                              fontSize: '1.4rem',
                              fontWeight: 900,
                              color: '#0A2260',
                              lineHeight: 1.0,
                              margin: '2px 0'
                            }}>
                              {date}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#0A2260',
                              letterSpacing: '0.02em'
                            }}>
                              {time}
                            </span>
                          </div>
                        </div>
                        {/* Right broadcaster / book ticket section */}
                        <div
                          className="broadcaster-pane"
                          style={{
                            width: '125px',
                            background: '#020B2D',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            flexShrink: 0,
                            position: 'relative',
                            borderLeft: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          <div className="broadcaster-logos" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            alignItems: 'center',
                            transition: 'opacity 0.2s ease, transform 0.2s ease'
                          }}>
                            {broadcasters.map((b) => (
                              <BroadcasterLogo key={b} type={b} />
                            ))}
                          </div>
                          <div className="booking-hover-text" style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #1BAAFF 0%, #0051D9 100%)',
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            color: '#fff'
                          }}>
                            <span style={{ fontSize: '1.25rem', marginBottom: '2px' }}>🎫</span>
                            <span style={{
                              fontFamily: 'var(--font-family-display)',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              letterSpacing: '0.05em'
                            }}>
                              {isFinished ? 'CLOSED' : 'MINT TICKET'}
                            </span>
                            {!isFinished && (
                              <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                                From ${getLowestPrice(event)} USDC
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Summer Cup 2024 Grid (Redesigned Tickets) ── */}
            {events.filter(e => e.id.startsWith('SC24-GP')).length > 0 && (
              <div style={{
                background: 'radial-gradient(circle at top, #001f5c 0%, #000B26 100%)',
                borderRadius: '24px',
                border: '2px solid rgba(27,170,255,0.25)',
                padding: '3rem 2rem',
                marginTop: '1rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
              }}>
                {/* Decorative graphics pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: 0.05,
                  pointerEvents: 'none',
                  backgroundImage: `radial-gradient(circle, transparent 20%, #1BAAFF 20%, #1BAAFF 21%, transparent 21%),
                                    radial-gradient(circle, transparent 40%, #1BAAFF 40%, #1BAAFF 41%, transparent 41%)`,
                  backgroundSize: '300px 300px',
                  backgroundPosition: 'center'
                }} />

                {/* Header branding */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  marginBottom: '2.5rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {/* Soccer ball sunset arch */}
                  <div style={{
                    width: '100px',
                    height: '50px',
                    borderTopLeftRadius: '100px',
                    borderTopRightRadius: '100px',
                    background: 'linear-gradient(to right, #F5A623, #D6005D, #E31B23)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      width: '60px',
                      height: '30px',
                      borderTopLeftRadius: '60px',
                      borderTopRightRadius: '60px',
                      background: '#000B26',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '1.2rem', marginBottom: '-5px' }}>⚽</span>
                    </div>
                  </div>

                  <h1 style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: '2.8rem',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    margin: '0.5rem 0 0',
                    lineHeight: 0.9,
                    textAlign: 'center'
                  }}>
                    SUMMER
                  </h1>
                  <h2 style={{
                    fontFamily: 'var(--font-family-display)',
                    fontSize: '2rem',
                    fontWeight: 800,
                    background: 'linear-gradient(to right, #1BAAFF, #00FFCC)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.08em',
                    margin: '0 0 0.5rem',
                    textAlign: 'center'
                  }}>
                    CUP 2024
                  </h2>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.2)',
                    paddingTop: '0.5rem',
                    marginTop: '0.25rem'
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.12em' }}>NWSL</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>|</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.12em' }}>LIGA MX FEMENIL</span>
                  </div>
                </div>

                {/* 2-column Grid of Tickets */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
                  gap: '1.5rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {events.filter(e => e.id.startsWith('SC24-GP')).map((event) => {
                    const isFinished = event.status === 'finished';
                    const group = getGroupInfo(event.id, event.homeTeam);
                    const { day, date, time } = formatMatchDate(event.scheduledAt);
                    const broadcasters = getBroadcasters(event.id);

                    return (
                      <div
                        key={event.id}
                        onClick={isFinished ? undefined : () => handleBookClick(event)}
                        style={{
                          display: 'flex',
                          height: '115px',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'transparent',
                          cursor: isFinished ? 'not-allowed' : 'pointer',
                          position: 'relative',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        }}
                        className="ticket-list-card"
                      >
                        {/* Group vertical label tag */}
                        <div style={{
                          width: '38px',
                          background: group.color,
                          color: group.textColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <span style={{
                            transform: 'rotate(-90deg)',
                            whiteSpace: 'nowrap',
                            fontFamily: 'var(--font-family-display)',
                            fontWeight: 800,
                            fontSize: '0.8rem',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            display: 'block'
                          }}>
                            {group.label}
                          </span>
                        </div>

                        {/* Middle White Block */}
                        <div style={{
                          flex: 1,
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 1.25rem',
                          justifyContent: 'space-between',
                          gap: '1.25rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, justifyContent: 'center' }}>
                            <TeamCrest name={event.homeTeam} size={52} />
                            <span style={{
                              fontFamily: 'var(--font-family-display)',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: '#6A8DB5',
                              textTransform: 'uppercase',
                              margin: '0 0.2rem'
                            }}>
                              vs
                            </span>
                            <TeamCrest name={event.awayTeam} size={52} />
                          </div>

                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            borderLeft: '2px solid #E2E8F0',
                            paddingLeft: '1.25rem',
                            minWidth: '120px'
                          }}>
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              color: '#64748B',
                              letterSpacing: '0.06em',
                              marginBottom: '1px'
                            }}>
                              {day}
                            </span>
                            <span style={{
                              fontFamily: 'var(--font-family-display)',
                              fontSize: '1.4rem',
                              fontWeight: 900,
                              color: '#0A2260',
                              lineHeight: 1.0,
                              margin: '2px 0'
                            }}>
                              {date}
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#0A2260',
                              letterSpacing: '0.02em'
                            }}>
                              {time}
                            </span>
                          </div>
                        </div>

                        {/* Right dark blue broadcaster/booking block */}
                        <div
                          className="broadcaster-pane"
                          style={{
                            width: '125px',
                            background: '#020B2D',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            flexShrink: 0,
                            position: 'relative',
                            borderLeft: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          <div className="broadcaster-logos" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            alignItems: 'center',
                            transition: 'opacity 0.2s ease, transform 0.2s ease'
                          }}>
                            {broadcasters.map((b) => (
                              <BroadcasterLogo key={b} type={b} />
                            ))}
                          </div>

                          <div className="booking-hover-text" style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #1BAAFF 0%, #0051D9 100%)',
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            color: '#fff'
                          }}>
                            <span style={{ fontSize: '1.25rem', marginBottom: '2px' }}>🎫</span>
                            <span style={{
                              fontFamily: 'var(--font-family-display)',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              letterSpacing: '0.05em'
                            }}>
                              {isFinished ? 'CLOSED' : 'MINT TICKET'}
                            </span>
                            {!isFinished && (
                              <span style={{ fontSize: '0.6rem', opacity: 0.8 }}>
                                From ${getLowestPrice(event)} USDC
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer text */}
                <div style={{
                  textAlign: 'center',
                  marginTop: '2.5rem',
                  fontFamily: 'var(--font-family-display)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  letterSpacing: '0.15em',
                  color: '#6A8DB5',
                  position: 'relative',
                  zIndex: 1
                }}>
                  ALL TIMES ARE ET
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          BOOKING MODAL DIALOG
      ══════════════════════════════════════════════════ */}
      {purchaseStep !== 'idle' && activeEvent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          zIndex: 999, background: 'rgba(2, 11, 45, 0.7)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '1.5rem',
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '480px', padding: '2.5rem',
            animation: 'modal-in 0.28s cubic-bezier(0.16,1,0.3,1)',
          }}>

            {/* Step: Select Tier */}
            {purchaseStep === 'select-tier' && (
              <>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Choose Your Tier</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', marginBottom: '1.75rem' }}>
                  {activeEvent.name}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {(activeEvent.ticketTiers && activeEvent.ticketTiers.length > 0 ? activeEvent.ticketTiers : SEAT_TIERS).map((tier) => (
                    <button
                      key={tier.id}
                      onClick={() => handleSelectTier(tier)}
                      style={{
                        padding: '1.25rem 1.5rem', borderRadius: '16px', textAlign: 'left',
                        border: `2px solid ${tier.color}30`, background: `${tier.color}08`, cursor: 'pointer',
                        transition: 'all var(--transition-fast)', display: 'block', width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = tier.color;
                        e.currentTarget.style.background = `${tier.color}12`;
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${tier.color}30`;
                        e.currentTarget.style.background = `${tier.color}08`;
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.1rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>
                          {tier.name}
                        </span>
                        <span className="data-value" style={{ fontSize: '1.4rem', color: tier.color }}>
                          ${tier.price} USDC
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)' }}>
                        {tier.description}
                      </div>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button variant="outline" size="sm" onClick={closeModal} style={{ flex: 1 }}>Cancel</Button>
                </div>
              </>
            )}

            {/* Step: Select Seat */}
            {purchaseStep === 'select-seat' && selectedTier && (
              <>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Select Your Seat</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', marginBottom: '1.75rem' }}>
                  {selectedTier.name} — ${selectedTier.price} USDC per seat
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {selectedTier.seats.map((seat) => (
                    <button
                      key={seat}
                      onClick={() => handleSelectSeat(seat)}
                      style={{
                        padding: '0.875rem 0.5rem', borderRadius: '12px', textAlign: 'center',
                        border: '2px solid var(--color-border)', background: 'rgba(27,170,255,0.03)', cursor: 'pointer',
                        fontFamily: 'var(--font-family-display)', fontSize: '1rem', color: 'var(--color-text-primary)',
                        fontWeight: 700, transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.background = 'var(--color-primary-light)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.background = 'rgba(27,170,255,0.03)';
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                      }}
                    >
                      {seat}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button variant="outline" size="sm" onClick={() => setPurchaseStep('select-tier')} style={{ flex: 1 }}>← Back</Button>
                </div>
              </>
            )}

            {/* Step: Choose Team */}
            {purchaseStep === 'choose-team' && selectedSeat && (
              <>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Select Team Support</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', marginBottom: '1.75rem' }}>
                  Choose which team you are backing. If they win, your NFT upgrades to a Gold Victory pass!
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem' }}>
                  <button
                    onClick={() => handleConfirmTeam(activeEvent.homeTeam)}
                    style={{
                      flex: 1, padding: '1.5rem 1rem', borderRadius: '16px', cursor: 'pointer',
                      border: '2px solid rgba(27,170,255,0.2)', background: 'rgba(27,170,255,0.05)',
                      textAlign: 'center', transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(27,170,255,0.2)'}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{teamFlag(activeEvent.homeTeam)}</div>
                    <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--color-text-primary)' }}>
                      {activeEvent.homeTeam}
                    </strong>
                  </button>
                  <button
                    onClick={() => handleConfirmTeam(activeEvent.awayTeam)}
                    style={{
                      flex: 1, padding: '1.5rem 1rem', borderRadius: '16px', cursor: 'pointer',
                      border: '2px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)',
                      textAlign: 'center', transition: 'all var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-success)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{teamFlag(activeEvent.awayTeam)}</div>
                    <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--color-text-primary)' }}>
                      {activeEvent.awayTeam}
                    </strong>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button variant="outline" size="sm" onClick={() => setPurchaseStep('select-seat')} style={{ flex: 1 }}>← Back</Button>
                </div>
              </>
            )}

            {/* Step: Confirm */}
            {purchaseStep === 'confirm' && selectedTier && selectedSeat && (
              <>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Confirm Purchase</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', marginBottom: '1.75rem' }}>
                  Review your order before minting
                </p>
                <div style={{
                  padding: '1.25rem', borderRadius: '14px',
                  background: 'rgba(27,170,255,0.05)', border: '1px solid rgba(27,170,255,0.15)',
                  marginBottom: '1.5rem',
                }}>
                  {[
                    ['Event', activeEvent.name],
                    ['Tier', selectedTier.name],
                    ['Seat Number', `#${selectedSeat}`],
                    ['Supported Team', selectedTeamSupport],
                    ['Price', `${selectedTier.price} USDC`],
                    ['Your Balance', `${usdcBalance.toFixed(2)} USDC`],
                    ['Wallet', walletAddress ? `${walletAddress.slice(0, 10)}...` : '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(27,170,255,0.08)' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)' }}>{label}</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-body)' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button variant="outline" size="sm" onClick={() => setPurchaseStep('choose-team')} style={{ flex: '0 0 auto' }}>← Back</Button>
                  <Button variant="primary" size="sm" onClick={handleConfirmPurchase} style={{ flex: 1 }}>
                    ⚡ Confirm Payment & Mint NFT
                  </Button>
                </div>
              </>
            )}

            {/* Step: Minting */}
            {purchaseStep === 'minting' && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{
                  width: '80px', height: '80px', margin: '0 auto 1.5rem',
                  borderRadius: '50%', background: 'var(--color-primary-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2.5rem', animation: 'spin 1.2s linear infinite',
                  boxShadow: '0 4px 24px rgba(27,170,255,0.4)',
                }}>
                  ⚡
                </div>
                <h2 style={{ marginBottom: '0.75rem', fontSize: '1.5rem' }}>Minting Your NFT</h2>
                <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', fontSize: '0.9rem' }}>
                  Calling purchaseTicket() on Injective...<br />
                  Waiting for block confirmation
                </p>
              </div>
            )}

            {/* Step: Minted! */}
            {purchaseStep === 'minted' && mintedTokenId && selectedTier && selectedSeat && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '100px', height: '100px', margin: '0 auto 1.5rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #74C0FC 0%, #1BAAFF 50%, #60A5FA 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '3rem', boxShadow: '0 8px 32px rgba(27,170,255,0.45)',
                  animation: 'bounce-in 0.6s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  🎫
                </div>
                <h2 style={{ marginBottom: '0.5rem', fontSize: '1.6rem', color: 'var(--color-text-primary)' }}>
                  Ticket NFT Minted!
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-body)', marginBottom: '1.5rem' }}>
                  {activeEvent.name} · Seat #{selectedSeat}<br />
                  Backed: <strong style={{ color: 'var(--color-cyan)' }}>{selectedTeamSupport}</strong>
                </p>
                <div style={{
                  padding: '1rem', background: 'rgba(27,170,255,0.05)', borderRadius: '12px',
                  border: '1px solid rgba(27,170,255,0.15)', marginBottom: '1.5rem', textAlign: 'left',
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>Transaction Hash</div>
                  <a
                    href={`https://testnet.blockscout.injective.network/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.8rem', color: 'var(--color-primary)',
                      fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all',
                      textDecoration: 'underline', display: 'inline-block',
                    }}
                  >
                    {txHash} 🔗
                  </a>
                </div>
                <Button variant="primary" size="md" onClick={() => { closeModal(); setCurrentTab('ticket'); }} style={{ width: '100%' }}>
                  View My Ticket Wallet
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
