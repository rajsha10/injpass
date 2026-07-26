import React, { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { useWeb3 } from '../context/Web3Context';

interface HomeProps {
  setCurrentTab: (tab: string) => void;
}

const FEATURES = [
  {
    icon: '🎟️',
    accent: 'cyan',
    label: 'Dynamic NFT Tickets',
    description:
      'Mint stadium seats as live NFTs on Injective inEVM. Tickets upgrade to a rare Gold Victory Edition automatically when your team wins.',
  },
  {
    icon: '⚡',
    accent: 'orange',
    label: 'x402 AI Oracle',
    description:
      'AI agents pay $0.01 USDC per API call via the x402 Micropayment Protocol to access live expected-goals (xG) telemetry — no subscriptions needed.',
  },
  {
    icon: '🤖',
    accent: 'gold',
    label: 'AI Hedging Agent',
    description:
      'Autonomous Poisson-model agent reads xG data, calculates real-time win probability and executes leveraged perpetual hedges on Injective perps via MCP.',
  },
];

// No mock ticker data — events are fetched from the backend only

export const Home: React.FC<HomeProps> = ({ setCurrentTab }) => {
  const { isConnected, connectWallet, walletAddress, usdcBalance } = useWeb3();

  // Real event from backend — no mock fallback
  const [liveEvent, setLiveEvent] = useState<{
    matchLabel: string;
    minute: number;
    score: string;
    homeTeam: string;
    awayTeam: string;
    matchId: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/events`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.events || data.events.length === 0) return;
        // Prefer a live event; fall back to first event
        const live = data.events.find((e: any) => e.status === 'live') || data.events[0];
        setLiveEvent({
          matchLabel: `${live.homeTeam} vs ${live.awayTeam}`,
          minute: live.minute || 0,
          score: `${live.scoreHome} – ${live.scoreAway}`,
          homeTeam: live.homeTeam,
          awayTeam: live.awayTeam,
          matchId: live.id,
          status: live.status,
        });
      } catch {
        // Backend offline — ticker stays hidden
      }
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ─── Full-page background image + overlay ─── */}
      <div className="hero-stadium-bg" />
      <div className="hero-stadium-overlay" />

      {/* ─── Content ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '4rem 1.5rem 5rem',
          gap: '2.5rem',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* ── EYEBROW BADGE ── */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.45rem 1.25rem',
            borderRadius: '9999px',
            border: '2px solid rgba(255,107,0,0.6)',
            background: 'rgba(255,107,0,0.1)',
            color: '#FF6B00',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#FF6B00',
              display: 'inline-block',
              animation: 'pulse-glow 1.4s infinite alternate',
              flexShrink: 0,
            }}
          />
          World Cup 2026 &nbsp;·&nbsp; Injective EVM Ticketing &nbsp;·&nbsp; Live
        </div>

        {/* ── HERO HEADING ── */}
        <h1
          style={{
            fontSize: 'clamp(3rem, 7vw, 6.5rem)',
            lineHeight: 0.95,
            fontFamily: 'var(--font-family-display)',
            fontWeight: 900,
            margin: 0,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: '#ffffff',
            textShadow: '0 4px 40px rgba(27,170,255,0.3)',
          }}
        >
          YOUR TICKET TO
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #1BAAFF 0%, #FF6B00 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            WEB3 SPORTS
          </span>
          <br />
          HISTORY
        </h1>

        {/* ── SUBTITLE ── */}
        <p
          style={{
            fontSize: '1.25rem',
            color: '#B8D4F0',
            maxWidth: '580px',
            lineHeight: 2,
            margin: 0,
            fontFamily: 'var(--font-family-body)',
            fontWeight: 400,
          }}
        >
          Your seat. Your NFT. Your legacy. 🏟️
          <br />
          <span style={{ color: '#1BAAFF', fontWeight: 600 }}>Fraud-proof entry.</span>{' '}
          <span style={{ color: '#ffffff' }}>Real-time upgrades.</span>{' '}
          <span style={{ color: '#FFD700', fontWeight: 600 }}>Gold when you win.</span>
        </p>

        {/* ── LIVE MATCH TICKER — only shown when backend has real events ── */}
        {liveEvent && (
          <div className="match-ticker" style={{ width: '100%', maxWidth: '820px' }}>
            {/* Left: LIVE dot */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
              <span
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: liveEvent.status === 'live' ? '#FF6B00' : '#6A8DB5',
                  animation: liveEvent.status === 'live' ? 'pulse-glow 1.2s infinite alternate' : 'none',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-family-display)', fontWeight: 800,
                  fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: liveEvent.status === 'live' ? '#FF6B00' : '#6A8DB5',
                }}
              >
                {liveEvent.status === 'live' ? 'LIVE' : liveEvent.status.toUpperCase()}
              </span>
            </div>

            {/* Center: stats */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '1.5rem',
                flexWrap: 'wrap', justifyContent: 'center', flex: 1,
              }}
            >
              {[
                { label: 'MATCH',  value: liveEvent.matchLabel },
                { label: 'MINUTE', value: liveEvent.status === 'live' ? `${liveEvent.minute}'` : '—' },
                { label: 'SCORE',  value: liveEvent.score },
              ].map((item) => (
                <div key={item.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', color: '#6A8DB5', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-display)', fontWeight: 900, fontSize: '1.1rem', color: '#ffffff', letterSpacing: '0.02em' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: match ID badge */}
            <div
              style={{
                padding: '0.35rem 0.85rem', borderRadius: '9999px',
                background: 'rgba(255,107,0,0.15)', border: '1.5px solid rgba(255,107,0,0.5)',
                color: '#FF6B00', fontSize: '0.72rem', fontWeight: 800,
                letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
              }}
            >
              {liveEvent.matchId}
            </div>
          </div>
        )}

        {/* ── WALLET / DASHBOARD PANEL ── */}
        {!isConnected ? (
          <div
            className="dark-container"
            style={{
              padding: '2.5rem',
              maxWidth: '520px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              animation: 'cyan-glow-pulse 3s ease-in-out infinite',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(27,170,255,0.12)',
                border: '3px solid rgba(27,170,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
              }}
            >
              🔐
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.4rem',
                  color: '#ffffff',
                  fontFamily: 'var(--font-family-display)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                Wallet Connection Required
              </h3>
              <p
                style={{
                  margin: '0.6rem 0 0',
                  fontSize: '0.9rem',
                  color: '#B8D4F0',
                  lineHeight: 1.65,
                  textAlign: 'center',
                }}
              >
                Connect your Web3 wallet (MetaMask or simulated) to browse fixtures, register your fan profile, and
                purchase NFT ticket passes.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={connectWallet}
              style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            >
              Connect Wallet to Begin
            </Button>
          </div>
        ) : (
          <div
            className="dark-container"
            style={{
              padding: '2rem 2.5rem',
              maxWidth: '620px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              textAlign: 'left',
              animation: 'cyan-glow-pulse 4s ease-in-out infinite',
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                borderBottom: '2px solid rgba(27,170,255,0.2)',
                paddingBottom: '1.25rem',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(27,170,255,0.15)',
                  border: '2px solid rgba(27,170,255,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  flexShrink: 0,
                }}
              >
                👋
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    color: '#ffffff',
                    fontFamily: 'var(--font-family-display)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Welcome back, Fan!
                </h3>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#6A8DB5',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {walletAddress}
                </span>
              </div>
              {/* Live indicator */}
              <div
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '9999px',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1.5px solid rgba(16,185,129,0.4)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#10B981',
                    animation: 'pulse-glow 1.5s infinite alternate',
                  }}
                />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981', letterSpacing: '0.1em' }}>
                  CONNECTED
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div
                style={{
                  background: 'rgba(27,170,255,0.07)',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  border: '2px solid rgba(27,170,255,0.25)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    color: '#6A8DB5',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                    fontWeight: 700,
                  }}
                >
                  Supported Team
                </span>
                <strong style={{ fontSize: '1.1rem', color: '#1BAAFF' }}>🇦🇷 Argentina</strong>
              </div>
              <div
                style={{
                  background: 'rgba(255,215,0,0.07)',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  border: '2px solid rgba(255,215,0,0.25)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    color: '#6A8DB5',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                    fontWeight: 700,
                  }}
                >
                  Available Funds
                </span>
                <strong style={{ fontSize: '1.1rem', color: '#FFD700' }}>{usdcBalance.toFixed(2)} USDC</strong>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setCurrentTab('events')}
              style={{ width: '100%', padding: '1rem', fontSize: '1rem', marginTop: '0.25rem' }}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              }
              iconPosition="right"
            >
              Go to Events &amp; Purchase Tickets
            </Button>
          </div>
        )}

        {/* ── FEATURE CARDS ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            width: '100%',
            maxWidth: '1000px',
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.label} className={`feature-card-dark ${f.accent}`}>
              {/* Icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  background:
                    f.accent === 'cyan'
                      ? 'rgba(27,170,255,0.12)'
                      : f.accent === 'orange'
                      ? 'rgba(255,107,0,0.12)'
                      : 'rgba(255,215,0,0.12)',
                  border: `2px solid ${
                    f.accent === 'cyan'
                      ? 'rgba(27,170,255,0.35)'
                      : f.accent === 'orange'
                      ? 'rgba(255,107,0,0.35)'
                      : 'rgba(255,215,0,0.35)'
                  }`,
                }}
              >
                {f.icon}
              </div>

              {/* Label */}
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-display)',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color:
                      f.accent === 'cyan' ? '#1BAAFF' : f.accent === 'orange' ? '#FF6B00' : '#FFD700',
                    marginBottom: '0.5rem',
                  }}
                >
                  {f.label}
                </div>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: '#B8D4F0',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── BOTTOM CTA STRIP ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: '1rem',
          }}
        >
          {[
            { label: '🎟️ Browse Events', tab: 'events', color: '#1BAAFF', border: 'rgba(27,170,255,0.5)' },
            { label: '🚧 Gate Demo', tab: 'validator', color: '#FF6B00', border: 'rgba(255,107,0,0.5)' },
            { label: '🤖 AI Agent Demo', tab: 'ticket', color: '#FFD700', border: 'rgba(255,215,0,0.5)' },
          ].map((btn) => (
            <button
              key={btn.tab}
              onClick={() => setCurrentTab(btn.tab)}
              style={{
                padding: '0.75rem 1.75rem',
                borderRadius: '12px',
                border: `2px solid ${btn.border}`,
                background: 'rgba(2,11,45,0.7)',
                color: btn.color,
                fontFamily: 'var(--font-family-display)',
                fontSize: '0.9rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${btn.color === '#1BAAFF' ? '27,170,255' : btn.color === '#FF6B00' ? '255,107,0' : '255,215,0'},0.15)`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(2,11,45,0.7)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};