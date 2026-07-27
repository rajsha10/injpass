import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { EventControlPanel } from '../components/EventControlPanel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface FanAgentDemoProps {
  setCurrentTab: (tab: string) => void;
}

export const FanAgentDemo: React.FC<FanAgentDemoProps> = ({ setCurrentTab }) => {
  const { ticketTokenId, isVictoryEdition, setVictoryEdition } = useWeb3();
  const { feed } = useLiveFeed();

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentScore, setCurrentScore] = useState<string>(feed?.score || 'Argentina 2 - 1 France');
  const [currentMinute, setCurrentMinute] = useState<number>(feed?.minute || 72);

  const [consoleLogs, setConsoleLogs] = useState<Array<{ time: string; msg: string; type: 'info' | 'success' | 'warn' | 'alert' }>>([
    { time: new Date().toLocaleTimeString(), msg: '🤖 AI Fan Engagement Agent scanning match environment...', type: 'info' },
    { time: new Date().toLocaleTimeString(), msg: `📊 Currently at ${feed?.minute || 72}' | ${feed?.score || 'Argentina 2 - 1 France'}`, type: 'info' },
    { time: new Date().toLocaleTimeString(), msg: '📡 Autonomous polling active (every 8s) via /api/events/live-feed...', type: 'info' }
  ]);

  // Simulate Match End / Victory trigger
  const triggerVictory = async () => {
    setIsSimulating(true);
    setCurrentScore('Argentina 3 - 2 France');
    setCurrentMinute(90);

    const step1 = [
      { time: new Date().toLocaleTimeString(), msg: '🚨 MATCH WIN DETECTED! Match End Trigger: MATCH_END_WIN', type: 'alert' as const },
      { time: new Date().toLocaleTimeString(), msg: '📊 Final Score: Argentina 3 - 2 France (MetLife Stadium)', type: 'info' as const },
      { time: new Date().toLocaleTimeString(), msg: '⚡ Initializing Dynamic NFT upgrades for token holders...', type: 'info' as const },
    ];
    setConsoleLogs((prev) => [...step1, ...prev]);

    // Send HTTP POST to backend endpoint
    try {
      await fetch(`${API_URL}/api/admin/simulate-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'MATCH_END_WIN', score: 'Argentina 3 - 2 France' }),
      });
    } catch (err) {
      console.warn('Backend simulation call warning:', err);
    }

    await new Promise((res) => setTimeout(res, 1200));

    const step2 = {
      time: new Date().toLocaleTimeString(),
      msg: `🔗 Executing upgradeToVictoryMetadata(${ticketTokenId || '1'}, "ipfs://gold-victory-uri") via Injective MCP Bridge`,
      type: 'info' as const,
    };
    setConsoleLogs((prev) => [step2, ...prev]);

    await new Promise((res) => setTimeout(res, 1000));

    const step3 = {
      time: new Date().toLocaleTimeString(),
      msg: `🏆 Success: Fan Collectible upgraded to Gold/Victory Edition on-chain!`,
      type: 'success' as const,
    };
    setConsoleLogs((prev) => [step3, ...prev]);

    setVictoryEdition();
    setIsSimulating(false);
  };

  // Simulate Goal event
  const triggerGoal = async () => {
    setCurrentScore('Argentina 3 - 1 France');
    setCurrentMinute(78);

    const goalLogs = [
      { time: new Date().toLocaleTimeString(), msg: '⚽ GOAL SCORED! Event: GOAL | Argentina 3 - 1 France (78\')', type: 'alert' as const },
      { time: new Date().toLocaleTimeString(), msg: '📡 Broadcasting goal flash highlight to connected arena fans...', type: 'info' as const }
    ];
    setConsoleLogs((prev) => [...goalLogs, ...prev]);

    try {
      await fetch(`${API_URL}/api/admin/simulate-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'GOAL', score: 'Argentina 3 - 1 France' }),
      });
    } catch (err) {
      // Ignore
    }
  };

  const resetMatch = async () => {
    setCurrentScore('Argentina 2 - 1 France');
    setCurrentMinute(72);
    setConsoleLogs((prev) => [
      { time: new Date().toLocaleTimeString(), msg: '🔄 Match state reset to 72\' | Argentina 2 - 1 France', type: 'info' },
      ...prev,
    ]);

    try {
      await fetch(`${API_URL}/api/admin/simulate-trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'NONE', score: 'Argentina 2 - 1 France' }),
      });
    } catch (err) {
      // Ignore
    }
  };

  return (
    <div style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1300px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.35rem 1rem', borderRadius: 'var(--radius-pill)',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          color: '#D97706', fontSize: '0.8rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem',
        }}>
          🤖 AI Fan Engagement Agent Demo
        </div>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          Autonomous On-Chain NFT Upgrades
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-body)', maxWidth: '660px', margin: '0 auto', fontSize: '0.95rem' }}>
          Simulate match milestones (Goals, Match Victories) and watch the autonomous AI Agent trigger contract upgrades via the Injective MCP Bridge.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>
        
        {/* LEFT COLUMN: Match Event Trigger Panel */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>⚽ Match Event Simulator</h3>
            <span style={{
              padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-pill)',
              fontSize: '0.8rem', fontWeight: 700,
              background: isVictoryEdition ? 'rgba(245,158,11,0.12)' : 'rgba(24,104,255,0.08)',
              color: isVictoryEdition ? '#D97706' : 'var(--color-primary)',
              border: `1px solid ${isVictoryEdition ? 'rgba(245,158,11,0.3)' : 'rgba(24,104,255,0.2)'}`,
            }}>
              {isVictoryEdition ? '🏆 VICTORY UPGRADED' : '● MATCH IN PROGRESS'}
            </span>
          </div>

          {/* Scoreboard Card */}
          <div style={{
            padding: '1.75rem', borderRadius: '16px',
            background: isVictoryEdition
              ? 'linear-gradient(135deg, rgba(254,252,232,0.98) 0%, rgba(254,243,199,0.98) 100%)'
              : 'linear-gradient(135deg, rgba(24,104,255,0.06), rgba(59,130,246,0.03))',
            border: isVictoryEdition ? '2px solid rgba(245,158,11,0.4)' : '1px solid rgba(24,104,255,0.12)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: isVictoryEdition ? '#A16207' : 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
              FIFA World Cup 2026 Final · MetLife Stadium
            </div>
            <div className="data-value" style={{ fontSize: '2rem', color: isVictoryEdition ? '#D97706' : 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              {currentScore}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.85rem', borderRadius: 'var(--radius-pill)', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--color-border)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              ⏱ Minute {currentMinute}'
            </div>
          </div>

          {/* Interactive Trigger Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <button
              onClick={triggerVictory}
              disabled={isSimulating}
              style={{
                padding: '1rem 1.5rem', borderRadius: '14px',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: '#fff', fontWeight: 700, fontSize: '1rem',
                fontFamily: 'var(--font-family-display)', cursor: 'pointer',
                border: 'none', boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
                opacity: isSimulating ? 0.7 : 1, transition: 'all var(--transition-fast)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {isSimulating ? '⏳ Upgrading Fan NFTs...' : '🏆 Simulate Argentina Victory (MATCH_END_WIN)'}
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                onClick={triggerGoal}
                style={{
                  padding: '0.8rem 1rem', borderRadius: '12px',
                  background: 'rgba(24,104,255,0.08)', border: '1px solid rgba(24,104,255,0.25)',
                  color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.88rem',
                  cursor: 'pointer', fontFamily: 'var(--font-family-body)',
                }}
              >
                ⚽ Simulate Goal (GOAL)
              </button>

              <button
                onClick={resetMatch}
                style={{
                  padding: '0.8rem 1rem', borderRadius: '12px',
                  background: 'rgba(15,15,17,0.05)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.88rem',
                  cursor: 'pointer', fontFamily: 'var(--font-family-body)',
                }}
              >
                🔄 Reset State
              </button>
            </div>
          </div>

          {/* NFT Collectible Metadata Transformation Card */}
          <div style={{
            padding: '1.25rem', borderRadius: '14px',
            background: isVictoryEdition ? 'rgba(245,158,11,0.08)' : 'rgba(15,15,17,0.02)',
            border: isVictoryEdition ? '1px solid rgba(245,158,11,0.25)' : '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              On-Chain Metadata Status (Token #{ticketTokenId || '1'}):
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Edition Type:</span>
                <strong style={{ color: isVictoryEdition ? '#D97706' : 'var(--color-text-primary)' }}>
                  {isVictoryEdition ? '🏆 Gold Victory Edition' : '🎫 Regular Fan Edition'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Metadata URI:</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                  {isVictoryEdition ? 'ipfs://gold-victory-edition' : 'ipfs://regular-fan-pass'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Team Victory Condition:</span>
                <strong style={{ color: isVictoryEdition ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                  {isVictoryEdition ? 'true (teamWon)' : 'false'}
                </strong>
              </div>
            </div>

            {isVictoryEdition && (
              <button
                onClick={() => setCurrentTab('ticket')}
                style={{
                  width: '100%', marginTop: '1rem', padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-pill)',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                  fontFamily: 'var(--font-family-display)', cursor: 'pointer', border: 'none',
                }}
              >
                View Transformed Ticket Card ✨ →
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Terminal 3 AI Agent Logs */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>🤖 Terminal 3 Output (fanManager.ts)</h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', fontFamily: 'ui-monospace, monospace' }}>
              src/agent/fanManager.ts
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', margin: 0 }}>
            Real-time terminal output from the AI Fan Engagement Agent monitoring match events and updating smart contracts.
          </p>

          {/* Black Terminal Box */}
          <div style={{
            flex: 1, minHeight: '340px', background: '#0A0A0F', borderRadius: '14px',
            padding: '1.25rem', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.85rem', color: '#E2E8F0', overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
          }}>
            <div style={{ color: '#64748B', fontSize: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
              --- InjPass AI Fan Manager Terminal Output ---
            </div>

            {consoleLogs.map((log, idx) => (
              <div key={idx} style={{
                color: log.type === 'alert' ? '#F59E0B' : log.type === 'success' ? '#4ADE80' : log.type === 'warn' ? '#FBBF24' : '#94A3B8',
                lineHeight: 1.4,
              }}>
                <span style={{ color: '#475569', marginRight: '0.5rem' }}>[{log.time}]</span>
                {log.msg}
              </div>
            ))}
          </div>

          <div style={{
            padding: '0.875rem 1rem', borderRadius: '12px',
            background: 'rgba(15,15,17,0.03)', border: '1px solid var(--color-border)',
            fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-body)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>Contract Method: <strong>upgradeToVictoryMetadata</strong></span>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 700 }}>Injective MCP Connected ✓</span>
          </div>
        </div>

        {/* FULL WIDTH: Interactive Event Creation & Control Panel */}
        <div style={{ marginTop: '2.5rem' }}>
          <EventControlPanel />
        </div>
      </div>
    </div>
  );
};
