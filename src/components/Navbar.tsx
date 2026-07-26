import React from 'react';
import { Button } from './Button';
import { useWeb3 } from '../context/Web3Context';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

const TABS = [
  { id: 'home',      label: 'Home',           icon: '🏟' },
  { id: 'events',    label: 'Events',         icon: '⚽' },
  { id: 'ticket',    label: 'My Ticket',      icon: '🎫' },
  { id: 'validator', label: 'Turnstile Gate', icon: '🚧' },
];

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { walletAddress, isConnecting, connectWallet, disconnectWallet, truncatedAddress } = useWeb3();

  return (
    <div className="pill-nav-container" style={{ padding: '1rem' }}>
      <nav
        className="pill-nav"
        style={{
          background: 'rgba(2, 11, 45, 0.92)',
          backdropFilter: 'blur(24px)',
          border: '2px solid rgba(27, 170, 255, 0.3)',
          borderRadius: '9999px',
          padding: '0.55rem 1.5rem',
          maxWidth: '70%',
          width: '70%',
          boxShadow: '0 4px 32px rgba(2,11,45,0.8), 0 0 0 1px rgba(27,170,255,0.08)',
        }}
      >
        {/* ── Logo ────────────────────────────────── */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => setCurrentTab('home')}
        >
          <img
            src="/injpass_logo.png"
            alt="InjPass Logo"
            style={{
              height: '36px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 10px rgba(27,170,255,0.5))'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div>
              <span style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#ffffff',
                userSelect: 'none',
                textTransform: 'uppercase',
              }}>
                InjPass
              </span>
              <span style={{
                display: 'block',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#1BAAFF',
                textTransform: 'uppercase',
                marginTop: '-2px',
                fontFamily: 'var(--font-family-body)',
              }}>
                WC2026 Finals
              </span>
            </div>
            {/* DEMO badge */}
            <span style={{
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              background: 'rgba(255,107,0,0.15)',
              border: '1.5px solid rgba(255,107,0,0.6)',
              color: '#FF6B00',
              fontSize: '0.6rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-family-body)',
              alignSelf: 'center',
            }}>
              Demo
            </span>
          </div>
        </div>

        {/* ── Navigation Tabs ───────────────────────── */}
        <div style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
          {TABS.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-${tab.id}`}
                onClick={() => setCurrentTab(tab.id)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '9999px',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-family-body)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isActive
                    ? 'linear-gradient(135deg, #1BAAFF 0%, #0051D9 100%)'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : '#6A8DB5',
                  boxShadow: isActive
                    ? '0 2px 12px rgba(27,170,255,0.45)'
                    : 'none',
                  border: isActive ? 'none' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.backgroundColor = 'rgba(27,170,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(27,170,255,0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#6A8DB5';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '0.85rem' }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Wallet Section ────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {walletAddress ? (
            /* When connected: show only the truncated address. Hover turns red to hint disconnect. */
            <button
              onClick={disconnectWallet}
              style={{
                padding: '0.42rem 1.1rem',
                borderRadius: '9999px',
                border: '1.5px solid rgba(27,170,255,0.45)',
                background: 'rgba(27,170,255,0.08)',
                fontSize: '0.78rem',
                fontWeight: 700,
                fontFamily: 'ui-monospace, monospace',
                color: '#1BAAFF',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                letterSpacing: '0.03em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)';
                e.currentTarget.style.color = '#EF4444';
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(27,170,255,0.45)';
                e.currentTarget.style.color = '#1BAAFF';
                e.currentTarget.style.background = 'rgba(27,170,255,0.08)';
              }}
              title="Click to disconnect"
            >
              {truncatedAddress}
            </button>
          ) : (
            <Button
              id="connect-wallet-btn"
              variant="primary"
              size="sm"
              onClick={connectWallet}
              icon={
                isConnecting ? (
                  <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                  </svg>
                )
              }
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
};