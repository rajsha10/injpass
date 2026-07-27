import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useWeb3 } from '../context/Web3Context';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { useTicketProof } from '../hooks/useTicketProof';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface DashboardProps {
  activePane?: 'ticket' | 'arena';
  setCurrentTab: (tab: string) => void;
}



const QRCanvasCompact: React.FC<{ value: string }> = ({ value }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: 70,
      margin: 1,
      color: { dark: '#0A0A0F', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    }).catch(console.error);
  }, [value]);

  return (
    <canvas
      ref={canvasRef}
      style={{ borderRadius: '6px', boxShadow: '0 2px 10px rgba(15,15,17,0.1)', display: 'block' }}
    />
  );
};

const CountdownRingCompact: React.FC<{ seconds: number; total: number }> = ({ seconds, total }) => {
  const radius = 37;
  const circumference = 2 * Math.PI * radius;
  const progress = (seconds / total) * circumference;

  return (
    <svg width="84" height="84" style={{ position: 'absolute', top: -7, left: -7, zIndex: 2, pointerEvents: 'none' }}>
      <circle
        cx="42" cy="42" r={radius}
        fill="none"
        stroke="rgba(24,104,255,0.1)"
        strokeWidth="3"
      />
      <circle
        cx="42" cy="42" r={radius}
        fill="none"
        stroke="url(#ring-gradient-compact)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${progress} ${circumference}`}
        transform="rotate(-90 42 42)"
        style={{ transition: 'stroke-dasharray 0.95s linear' }}
      />
      <defs>
        <linearGradient id="ring-gradient-compact" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1868FF" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      <text x="42" y="42" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-family-display)', fill: 'var(--color-primary)' }}>
        {seconds}s
      </text>
    </svg>
  );
};



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

function getGroupInfo(eventId: string, isVictory: boolean, isChecked: boolean): { label: string; color: string; textColor: string } {
  if (isVictory) {
    return { label: 'GOLD PASS', color: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', textColor: '#020B2D' };
  }
  if (isChecked) {
    return { label: 'VALIDATED', color: '#10B981', textColor: '#FFFFFF' };
  }
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

// ─────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────
export const Dashboard: React.FC<DashboardProps> = ({ activePane = 'ticket', setCurrentTab }) => {
  const {
    walletAddress, isConnected, connectWallet,
    ticketTokenId, ticketEventId,
    isCheckedIn, isVictoryEdition,
    setCheckedIn, setVictoryEdition,
    tickets = [], selectTicket = () => {},
    activeTicket = null,
  } = useWeb3();

  const { feed, loading: feedLoading, error: feedError } = useLiveFeed(ticketTokenId ? ticketEventId : null);
  const { proof, secondsRemaining, loading: proofLoading, isActive: qrActive, requestProof, stopProof } = useTicketProof(ticketTokenId, walletAddress);

  const [activeTab, setActiveTab] = useState<'ticket' | 'arena'>(activePane);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [goalFlash, setGoalFlash] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDetailsTicket, setSelectedDetailsTicket] = useState<any | null>(null);
  const prevRecentEvent = useRef<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/api/events`);
        const data = await res.json();
        if (data.success) {
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error('Error loading events in Dashboard:', err);
      }
    };
    loadEvents();
  }, []);

  // Watch for live feed events
  useEffect(() => {
    if (!feed) return;
    const prev = prevRecentEvent.current;
    const curr = feed.recentEvent;

    if (curr !== prev) {
      if (curr === 'GOAL') {
        setGoalFlash(true);
        setTimeout(() => setGoalFlash(false), 2200);
      }
      if (curr === 'MATCH_END_WIN') {
        setVictoryEdition();
        setTimeout(() => setShowVictoryModal(true), 400);
      }
      prevRecentEvent.current = curr;
    }
  }, [feed?.recentEvent, setVictoryEdition]);

  // Tab sync with prop
  useEffect(() => {
    setActiveTab(activePane);
  }, [activePane]);

  const hasTicket = !!ticketTokenId;

  const ticketEvent = events.find(e => e.id === ticketEventId) || (ticketEventId === 'WC2026-FIN' ? {
    id: 'WC2026-FIN',
    name: 'World Cup Final 2026',
    homeTeam: 'Argentina',
    awayTeam: 'France',
    scheduledAt: '2026-07-26T20:00:00-04:00'
  } : null);

  const homeTeam = ticketEvent?.homeTeam || (activeTicket?.selectedTeam === 'France' ? 'Argentina' : activeTicket?.selectedTeam || 'Argentina');
  const awayTeam = ticketEvent?.awayTeam || (activeTicket?.selectedTeam === 'France' ? 'France' : 'France');



  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, paddingBottom: '3rem' }}>

      {/* ── Goal Flash Overlay ── */}
      {goalFlash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.25) 0%, transparent 70%)',
          animation: 'goal-flash 2.2s ease-out forwards',
        }} />
      )}

      {/* ── Victory Modal ── */}
      {showVictoryModal && (
        <div
          onClick={() => setShowVictoryModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1500,
            background: 'rgba(10,10,15,0.7)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div className="glass-panel" style={{
            maxWidth: '440px', width: '100%', padding: '2.5rem', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(254,252,232,0.98) 100%)',
            border: '2px solid rgba(245,158,11,0.35)',
            boxShadow: '0 0 0 1px rgba(245,158,11,0.2), 0 24px 64px rgba(245,158,11,0.2), var(--shadow-lg)',
            animation: 'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'float 3s ease-in-out infinite' }}>🏆</div>
            <h2 style={{ fontSize: '1.75rem', color: '#92400E', marginBottom: '0.5rem' }}>VICTORY DETECTED!</h2>
            <p style={{ color: '#A16207', fontFamily: 'var(--font-family-body)', fontSize: '1rem', marginBottom: '0.5rem' }}>
              Argentina Won! Your Fan Pass has upgraded!
            </p>
            <p style={{ color: '#B45309', fontFamily: 'var(--font-family-body)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
              Your NFT ticket has transformed into a<br />
              <strong>Gold Victory Edition</strong> collectible. 🎉
            </p>
            <button
              onClick={() => setShowVictoryModal(false)}
              style={{
                padding: '0.75rem 2rem', borderRadius: 'var(--radius-pill)',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#fff', fontWeight: 700, fontSize: '1rem',
                fontFamily: 'var(--font-family-display)', cursor: 'pointer',
                border: 'none', boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
                letterSpacing: '0.05em',
              }}
            >
              VIEW MY GOLD TICKET ✨
            </button>
          </div>
        </div>
      )}

      {/* ── Header / Status Bar ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', marginTop: '1rem' }}>
        <div className="glass-panel" style={{
          padding: '0.875rem 1.5rem',
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
          borderRadius: '16px',
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="status-indicator" style={{ color: feedError ? 'var(--color-warning)' : 'var(--color-success)', background: feedError ? 'var(--color-warning-bg)' : 'var(--color-success-bg)' }}>
              <span className="status-dot active" />
              Arena Feed: {feedError ? 'Demo Mode' : 'Live'}
            </div>
            <div className="status-indicator" style={{ color: 'var(--color-success)', background: 'var(--color-success-bg)' }}>
              <span className="status-dot active" />
              AI Agent: Active
            </div>
            <div className="status-indicator" style={{ color: 'var(--color-success)', background: 'var(--color-success-bg)' }}>
              <span className="status-dot active" />
              Contract Sync: Online
            </div>
          </div>
          {/* Pane tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['ticket', 'arena'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.4rem 1rem', borderRadius: 'var(--radius-pill)',
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.82rem', fontFamily: 'var(--font-family-body)',
                  transition: 'all var(--transition-fast)',
                  background: activeTab === tab
                    ? 'linear-gradient(135deg, #1868FF, #3B82F6)'
                    : 'rgba(15,15,17,0.05)',
                  color: activeTab === tab ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {tab === 'ticket' ? '🎫 My Ticket' : '📡 Arena Feed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-Pane Dashboard Grid ── */}
      <div className="dashboard-grid" style={{ marginTop: '1.25rem' }}>

        {/* ════════════════════════════════════
            LEFT PANE — Digital Pass / NFT Ticket
        ════════════════════════════════════ */}
        <div className={`dashboard-left-pane ${activeTab === 'ticket' ? 'active' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px', width: '100%', margin: '0 auto' }}>

          {/* Not connected */}
          {!isConnected && (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.35rem' }}>Connect Your Wallet</h3>
              <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Connect your wallet to view and manage your InjPass NFT ticket.
              </p>
              <button
                onClick={connectWallet}
                style={{
                  padding: '0.75rem 2rem', borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-primary-gradient)', color: '#fff',
                  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  border: 'none', boxShadow: '0 4px 16px rgba(24,104,255,0.3)',
                }}
              >
                Connect Wallet
              </button>
            </div>
          )}

          {/* No ticket purchased yet */}
          {isConnected && !hasTicket && (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎫</div>
              <h3 style={{ marginBottom: '0.75rem', fontSize: '1.35rem' }}>No Ticket Found</h3>
              <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                You haven't purchased an InjPass ticket yet. Head to the marketplace to mint yours!
              </p>
              <button
                onClick={() => setCurrentTab('home')}
                style={{
                  padding: '0.75rem 2rem', borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-primary-gradient)', color: '#fff',
                  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  border: 'none', boxShadow: '0 4px 16px rgba(24,104,255,0.3)',
                }}
              >
                Buy a Ticket →
              </button>
            </div>
          )}

          {/* Ticket Cards Wallet List */}
          {isConnected && hasTicket && (() => {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-family-display)' }}>
                    🎟️ Your Wallet Passes ({tickets.length})
                  </span>
                </div>

                {tickets.map((t) => {
                  const isActive = t.tokenId === ticketTokenId;
                  const tEvent = events.find(e => e.id === t.eventId) || (t.eventId === 'WC2026-FIN' ? {
                    id: 'WC2026-FIN',
                    name: 'World Cup Final 2026',
                    homeTeam: 'Argentina',
                    awayTeam: 'France',
                    scheduledAt: '2026-07-26T20:00:00-04:00'
                  } : null);

                  const hTeam = tEvent?.homeTeam || (t.selectedTeam === 'France' ? 'Argentina' : t.selectedTeam || 'Argentina');
                  const aTeam = tEvent?.awayTeam || (t.selectedTeam === 'France' ? 'France' : 'France');
                  const { day, date, time } = formatMatchDate(tEvent?.scheduledAt);
                  const grp = getGroupInfo(t.eventId || '', t.isVictoryEdition, t.isCheckedIn);

                  return (
                    <div
                      key={t.tokenId}
                      onClick={() => {
                        selectTicket(t.tokenId);
                        setSelectedDetailsTicket(t);
                      }}
                      className={`ticket-card ${t.isVictoryEdition ? 'victory-edition' : ''}`}
                      style={{
                        display: 'flex',
                        height: '115px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: isActive 
                          ? '3px solid #1BAAFF' 
                          : t.isVictoryEdition ? '3px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        position: 'relative',
                        boxShadow: isActive
                          ? '0 0 25px rgba(27,170,255,0.35), 0 8px 30px rgba(0,0,0,0.5)'
                          : t.isVictoryEdition 
                            ? '0 0 20px rgba(245,158,11,0.25), 0 8px 30px rgba(0,0,0,0.5)'
                            : '0 8px 30px rgba(0,0,0,0.5)',
                        cursor: 'pointer',
                        transform: isActive ? 'scale(1.01)' : 'scale(1)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.transform = 'translateY(-2px) scale(1.005)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.borderColor = t.isVictoryEdition ? '#F59E0B' : 'rgba(255,255,255,0.1)';
                        }
                      }}
                    >
                      {/* Active indicator overlay badge */}
                      {isActive && (
                        <div style={{
                          position: 'absolute',
                          top: '6px',
                          right: '150px',
                          background: 'rgba(27,170,255,0.15)',
                          border: '1px solid #1BAAFF',
                          color: '#1BAAFF',
                          fontSize: '0.55rem',
                          fontWeight: 900,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          letterSpacing: '0.08em',
                          fontFamily: 'var(--font-family-display)',
                          zIndex: 5
                        }}>
                          ACTIVE PASS
                        </div>
                      )}

                      {/* Group vertical label tag */}
                      <div style={{
                        width: '38px',
                        background: grp.color,
                        color: grp.textColor,
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
                          {grp.label}
                        </span>
                      </div>

                      {/* Middle Block */}
                      <div style={{
                        flex: 1,
                        background: t.isVictoryEdition 
                          ? 'linear-gradient(135deg, #FFFDF0 0%, #FEF3C7 50%, #FFFDF0 100%)' 
                          : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 1.25rem',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center' }}>
                            <TeamCrest name={hTeam} size={50} />
                            <span style={{
                              fontFamily: 'var(--font-family-display)',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              color: '#6A8DB5',
                              textTransform: 'uppercase'
                            }}>
                              vs
                            </span>
                            <TeamCrest name={aTeam} size={50} />
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: '0.58rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                              SEAT {t.seat}
                            </span>
                            <span style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontSize: '0.58rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                              TOKEN #{t.tokenId}
                            </span>
                            {t.isVictoryEdition && (
                              <span style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#B45309', fontSize: '0.58rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                GOLD 🏆
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          justifyContent: 'center',
                          borderLeft: t.isVictoryEdition ? '2px solid #FCD34D' : '2px solid #E2E8F0',
                          paddingLeft: '1.25rem',
                          minWidth: '120px'
                        }}>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            color: t.isVictoryEdition ? '#B45309' : '#64748B',
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

                      {/* Right Gate Action Block */}
                      {t.isCheckedIn ? (
                        <div style={{
                          width: '140px',
                          background: '#10B981',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0
                        }}>
                          <span style={{ fontSize: '1.5rem', marginBottom: '2px' }}>✓</span>
                          <span style={{ fontFamily: 'var(--font-family-display)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em' }}>VALIDATED</span>
                          <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>ACCESS GRANTED</span>
                        </div>
                      ) : (
                        <div style={{
                          width: '140px',
                          background: isActive ? 'linear-gradient(135deg, #1868FF 0%, #0051D9 100%)' : 'rgba(255,255,255,0.03)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isActive ? '#ffffff' : 'var(--color-text-muted)',
                          flexShrink: 0,
                          borderLeft: '1px dashed rgba(255,255,255,0.1)'
                        }}>
                          <span style={{ fontSize: '1.3rem', marginBottom: '2px' }}>{isActive ? '🔓' : '🔒'}</span>
                          <span style={{ fontFamily: 'var(--font-family-display)', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {isActive ? 'ACTIVE' : 'SELECT'}
                          </span>
                          <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>{isActive ? 'GATE READY' : 'CLICK TO LOAD'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Gate scan controls below for the active ticket */}
                {activeTicket && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-family-display)' }}>
                        🎟️ Gate Controls: Ticket #{ticketTokenId}
                      </span>
                    </div>

                    {!isCheckedIn && !qrActive && (
                      <button
                        id="get-turnstile-btn"
                        onClick={requestProof}
                        disabled={proofLoading}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, #1868FF 0%, #0051D9 100%)',
                          padding: '1rem',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          cursor: 'pointer',
                          border: 'none',
                          boxShadow: '0 4px 16px rgba(24,104,255,0.3)',
                          transition: 'all 0.2s ease',
                          opacity: proofLoading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                      >
                        <span style={{ fontSize: '1.3rem', marginRight: '0.5rem' }}>🔐</span>
                        <span style={{ fontFamily: 'var(--font-family-display)', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          {proofLoading ? 'GENERATING SECURE PROOF...' : 'ACTIVATE GATE PASS'}
                        </span>
                      </button>
                    )}

                    {qrActive && (
                      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '100px' }}>
                          <CountdownRingCompact seconds={secondsRemaining} total={15} />
                          <div style={{ padding: '4px', background: '#fff', borderRadius: '10px', zIndex: 1, display: 'inline-block' }}>
                            {proof ? (
                              <QRCanvasCompact value={`injpass://proof/${proof.proofToken}`} />
                            ) : (
                              <div style={{ fontSize: '0.48rem', color: '#6A8DB5', fontWeight: 600 }}>LOADING...</div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>
                            Turnstile QR Code active · Rotate in {secondsRemaining}s
                          </div>
                          {proof?.matchContext && (
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                              🏟 {proof.matchContext}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', width: '100%' }}>
                          {!isCheckedIn && (
                            <button
                              onClick={() => { setCheckedIn(); stopProof(); }}
                              style={{
                                flex: 1,
                                padding: '0.75rem 1.5rem',
                                borderRadius: 'var(--radius-pill)',
                                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                                color: 'var(--color-success)', fontWeight: 700, fontSize: '0.82rem',
                                cursor: 'pointer', fontFamily: 'var(--font-family-body)',
                                transition: 'all var(--transition-fast)',
                              }}
                            >
                              ✅ Turnstile Scan Simulate
                            </button>
                          )}
                          <button
                            onClick={stopProof}
                            style={{
                              flex: 1,
                              padding: '0.75rem 1.5rem',
                              borderRadius: 'var(--radius-pill)',
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                              color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.82rem',
                              cursor: 'pointer', fontFamily: 'var(--font-family-body)',
                            }}
                          >
                            ✕ Close Pass
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Victory details extra section */}
                {isVictoryEdition && (
                  <div style={{
                    padding: '0.875rem 1.25rem', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))',
                    border: '1px solid rgba(245,158,11,0.3)',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A16207', marginBottom: '0.3rem' }}>
                      Final Score · Locked On-Chain
                    </div>
                    <div className="data-value" style={{ fontSize: '1.5rem', color: '#D97706' }}>
                      {feed?.score || 'Argentina 3 - 1 France'}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ════════════════════════════════════
            RIGHT PANE — Live Arena Feed
        ════════════════════════════════════ */}
        <div className={`dashboard-right-pane ${activeTab === 'arena' ? 'active' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '640px', width: '100%', margin: '0 auto' }}>

          {/* Live Scorecard */}
          {!hasTicket ? (
            <div className="glass-panel" style={{ 
              padding: '2.5rem 1.75rem', 
              textAlign: 'center', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '1rem',
              minHeight: '260px',
              border: '1px dashed rgba(27,170,255,0.2)'
            }}>
              <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 10px rgba(27,170,255,0.3))' }}>🎫</div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)', margin: 0, fontFamily: 'var(--font-family-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Scorecard</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', maxWidth: '280px', lineHeight: 1.6, margin: 0 }}>
                Please book your ticket to unlock the real-time stadium feed and AI agent scorecard tracker!
              </p>
              <button 
                onClick={() => setCurrentTab('events')}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.6rem 1.5rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'linear-gradient(135deg, #1868FF 0%, #3B82F6 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(24,104,255,0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'brightness(1)'; }}
              >
                Book Your Ticket
              </button>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom: '0.15rem' }}>Live Scorecard</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)' }}>
                    {feed?.eventId || ticketEventId} · Polling every 8s
                  </p>
                </div>
                <span className="badge-live">LIVE</span>
              </div>

              {/* Score display */}
              <div style={{
                padding: '1.5rem 1rem', borderRadius: '16px',
                background: isVictoryEdition
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.05))'
                  : 'linear-gradient(135deg, rgba(24,104,255,0.05), rgba(59,130,246,0.03))',
                border: isVictoryEdition ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(24,104,255,0.1)',
                textAlign: 'center', marginBottom: '1.25rem',
              }}>
                {feedLoading ? (
                  <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', fontSize: '0.9rem' }}>Loading...</div>
                ) : (
                  <>
                    <div className="data-value" style={{
                      fontSize: '1.6rem', marginBottom: '0.5rem',
                      color: isVictoryEdition ? '#D97706' : 'var(--color-text-primary)',
                    }}>
                      {feed?.score || 'Argentina 0 - 0 France'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'var(--font-family-body)' }}>
                        ⏱ {feed?.minute ?? 0}'
                      </span>
                      <span style={{
                        fontSize: '0.78rem', fontWeight: 700, padding: '0.2rem 0.65rem',
                        borderRadius: 'var(--radius-pill)',
                        color: feed?.recentEvent === 'MATCH_END_WIN' ? '#D97706' : feed?.recentEvent === 'GOAL' ? '#F59E0B' : 'var(--color-success)',
                        background: feed?.recentEvent === 'MATCH_END_WIN' ? 'rgba(245,158,11,0.1)' : feed?.recentEvent === 'GOAL' ? 'rgba(245,158,11,0.08)' : 'var(--color-success-bg)',
                        border: `1px solid ${feed?.recentEvent === 'MATCH_END_WIN' ? 'rgba(245,158,11,0.3)' : feed?.recentEvent === 'GOAL' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                        fontFamily: 'var(--font-family-body)',
                      }}>
                        {feed?.recentEvent === 'MATCH_END_WIN' ? '🏆 Match End · WIN' : feed?.recentEvent === 'GOAL' ? '⚽ GOAL!' : '● Match Active'}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Team mini cards */}
              {(() => {
                const ticketEvent = events.find(e => e.id === ticketEventId) || (ticketEventId === 'WC2026-FIN' ? {
                  homeTeam: 'Argentina',
                  awayTeam: 'France'
                } : null);
                const homeTeam = ticketEvent?.homeTeam || 'Argentina';
                const awayTeam = ticketEvent?.awayTeam || 'France';
                
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {[
                      { flag: teamFlag(homeTeam), name: homeTeam },
                      { flag: teamFlag(awayTeam), name: awayTeam },
                    ].map((team) => (
                      <div key={team.name} style={{
                        padding: '0.875rem', borderRadius: '12px',
                        background: 'rgba(15,15,17,0.02)', border: '1px solid var(--color-border)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>{team.flag}</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-display)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {team.name}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Arena Info Card */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              📋 Match Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Fixture', value: `${homeTeam} vs ${awayTeam}` },
                { label: 'Competition', value: ticketEvent?.name || 'World Cup Match' },
                { label: 'Venue', value: ticketEventId === 'WC2026-FIN' ? 'MetLife Stadium, NJ' : 'World Cup Venue' },
                { label: 'Event ID', value: ticketEventId || 'TBD' },
                { label: 'Agent Status', value: '🤖 Active · Monitoring' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0', borderBottom: '1px solid rgba(15,15,17,0.04)',
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-body)', fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Ticket Details Popup — Compact Ticket Shape ── */}
      {selectedDetailsTicket && (() => {
        const t = selectedDetailsTicket;
        const isGolden = t.isVictoryEdition;
        const tEvent = events.find((e: any) => e.id === t.eventId) || (t.eventId === 'WC2026-FIN' ? {
          id: 'WC2026-FIN', name: 'World Cup Final 2026',
          homeTeam: 'Argentina', awayTeam: 'France',
          scheduledAt: '2026-07-26T20:00:00-04:00'
        } : null);

        const hTeam = tEvent?.homeTeam || t.selectedTeam || 'Argentina';
        const aTeam = tEvent?.awayTeam || 'France';
        const { day, date, time } = formatMatchDate(tEvent?.scheduledAt);
        const grp = getGroupInfo(t.eventId || '', t.isVictoryEdition, t.isCheckedIn);
        const accent = isGolden ? '#F59E0B' : '#1BAAFF';
        const accentFaint = isGolden ? 'rgba(245,158,11,' : 'rgba(27,170,255,';
        const entranceClass = isGolden ? 'golden-modal-active' : 'normal-modal-active';

        return (
          <div
            onClick={() => setSelectedDetailsTicket(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 1600,
              background: 'rgba(2,2,6,0.85)',
              backdropFilter: 'blur(14px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={entranceClass}
              style={{
                maxWidth: '728px', width: '100%',
                borderRadius: '26px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'row',
                background: isGolden
                  ? 'linear-gradient(135deg, #1a1408 0%, #12100a 100%)'
                  : 'linear-gradient(135deg, #0a0e1f 0%, #080c1a 100%)',
                border: `1.5px solid ${accentFaint}0.25)`,
                color: '#fff',
                fontFamily: 'var(--font-family-body)',
              }}
            >
              {/* Shimmer sweep */}
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '26px', pointerEvents: 'none', zIndex: 1 }}>
                <div style={{
                  position: 'absolute', top: '-50%', left: '-50%', width: '50%', height: '200%',
                  background: isGolden
                    ? 'linear-gradient(90deg, transparent, rgba(255,215,0,0.08) 45%, rgba(255,215,0,0.18) 50%, rgba(255,215,0,0.08) 55%, transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(100,180,255,0.06) 45%, rgba(100,180,255,0.14) 50%, rgba(100,180,255,0.06) 55%, transparent)',
                  animation: 'holo-shimmer 4s ease-in-out infinite', animationDelay: '0.7s',
                }} />
              </div>

              {/* Golden sparkles */}
              {isGolden && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden', borderRadius: '26px' }}>
                  {['✦','✧','⭑'].map((c, i) => (
                    <span key={i} style={{
                      position: 'absolute', left: `${20 + i * 30}%`, top: `${70 + (i % 2) * 15}%`,
                      fontSize: '0.45rem', color: 'rgba(255,215,0,0.35)',
                      animation: `sparkle-float ${2.5 + i * 0.5}s ease-in-out infinite`,
                      animationDelay: `${i * 0.8}s`,
                    }}>{c}</span>
                  ))}
                </div>
              )}

              {/* ─── LEFT STRIP — Group Color ─── */}
              <div style={{
                width: '57px', flexShrink: 0,
                background: grp.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 3,
              }}>
                <span style={{
                  transform: 'rotate(-90deg)', whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-family-display)',
                  fontWeight: 900, fontSize: '0.85rem',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: grp.textColor,
                }}>{grp.label}</span>
              </div>

              {/* ─── MAIN BODY — Match Info ─── */}
              <div style={{
                flex: 1, padding: '1.6rem 2rem',
                position: 'relative', zIndex: 3,
                display: 'flex', flexDirection: 'column', gap: '1rem',
                background: isGolden
                  ? 'radial-gradient(ellipse at 30% 20%, rgba(245,158,11,0.06) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at 30% 20%, rgba(27,170,255,0.04) 0%, transparent 70%)',
              }}>
                {/* Close */}
                <button
                  onClick={() => setSelectedDetailsTicket(null)}
                  style={{
                    position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                    background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
                    fontSize: '1.3rem', lineHeight: 1, padding: '5px',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >✕</button>

                {/* Row 1: Badge + Teams */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.3rem' }}>
                  {/* Tier pill */}
                  <span style={{
                    background: `${accentFaint}0.12)`, border: `1px solid ${accent}`,
                    color: accent, fontSize: '0.72rem', fontWeight: 900,
                    padding: '4px 11px', borderRadius: '100px',
                    letterSpacing: '0.1em', fontFamily: 'var(--font-family-display)',
                    textTransform: 'uppercase', flexShrink: 0,
                    animation: isGolden ? 'badge-pulse 2s infinite' : 'badge-pulse-blue 2.5s infinite',
                  }}>
                    {isGolden ? '🏆 VICTORY' : '🎫 PASS'}
                  </span>
                  <span style={{
                    fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)',
                    fontWeight: 600, letterSpacing: '0.04em',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{tEvent?.name || 'World Cup Match'}</span>
                </div>

                {/* Row 2: Team face-off — compact horizontal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <TeamCrest name={hTeam} size={57} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{
                      fontFamily: 'var(--font-family-display)', fontWeight: 800,
                      fontSize: '1.25rem', color: '#fff', lineHeight: 1.15,
                    }}>{hTeam} <span style={{ color: isGolden ? '#FCD34D' : '#60A5FA', fontSize: '1rem' }}>vs</span> {aTeam}</span>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: '2px' }}>
                      {day} · {date} · {time}
                    </span>
                  </div>
                  <TeamCrest name={aTeam} size={57} />
                </div>

                {/* Row 3: Detail chips — 2-col compact grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem 1rem' }}>
                  {[
                    { label: 'Venue', value: t.eventId === 'WC2026-FIN' ? 'MetLife Stadium' : 'World Cup Venue' },
                    { label: 'Fan', value: t.selectedTeam ? `${teamFlag(t.selectedTeam)} ${t.selectedTeam}` : '—' },
                    { label: 'Gate', value: t.isCheckedIn ? '✅ Checked In' : '⏳ Pending' },
                    { label: 'Chain', value: t.txHash ? `${t.txHash.slice(0, 10)}…` : 'Pending' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0' }}>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── PERFORATED VERTICAL DIVIDER ─── */}
              <div style={{ width: '0px', position: 'relative', zIndex: 3, flexShrink: 0 }}>
                {/* Top notch */}
                <div style={{
                  position: 'absolute', top: '-17px', left: '-17px',
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'rgba(2,2,6,0.85)',
                }} />
                {/* Bottom notch */}
                <div style={{
                  position: 'absolute', bottom: '-17px', left: '-17px',
                  width: '34px', height: '34px', borderRadius: '50%',
                  background: 'rgba(2,2,6,0.85)',
                }} />
                {/* Dashed vertical line */}
                <div style={{
                  position: 'absolute', top: '24px', bottom: '24px', left: '-1px',
                  borderLeft: `2px dashed ${accentFaint}0.15)`,
                }} />
              </div>

              {/* ─── RIGHT STUB — Seat / Token ─── */}
              <div style={{
                width: '156px', flexShrink: 0,
                padding: '1.6rem 1rem',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.65rem',
                position: 'relative', zIndex: 3,
                background: isGolden
                  ? 'radial-gradient(ellipse at 70% 50%, rgba(245,158,11,0.06) 0%, transparent 80%)'
                  : 'radial-gradient(ellipse at 70% 50%, rgba(27,170,255,0.04) 0%, transparent 80%)',
              }}>
                {/* Seat number large */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-family-display)', fontWeight: 900,
                    fontSize: '2.35rem', lineHeight: 1, color: accent,
                    textShadow: `0 0 20px ${accentFaint}0.3)`,
                  }}>{t.seat}</div>
                  <div style={{
                    fontSize: '0.72rem', fontWeight: 800,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.12em', marginTop: '2px',
                  }}>SEAT</div>
                </div>

                {/* Divider line */}
                <div style={{ width: '70%', borderTop: `1px solid ${accentFaint}0.12)` }} />

                {/* Token # */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: 'var(--font-family-display)', fontWeight: 800,
                    fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)',
                  }}>#{t.tokenId}</div>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 800,
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.1em', marginTop: '1px',
                  }}>TOKEN</div>
                </div>

                {/* Status dot */}
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: t.isCheckedIn ? '#34D399' : accent,
                  boxShadow: t.isCheckedIn ? '0 0 10px rgba(52,211,153,0.6)' : `0 0 10px ${accentFaint}0.4)`,
                  animation: isGolden ? 'badge-pulse 2s infinite' : 'badge-pulse-blue 2.5s infinite',
                }} />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};