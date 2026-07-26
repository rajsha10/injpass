import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

interface ValidatorDemoProps {
  setCurrentTab: (tab: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ValidatorDemo: React.FC<ValidatorDemoProps> = ({ setCurrentTab }) => {
  const { walletAddress, ticketTokenId, isCheckedIn, setCheckedIn } = useWeb3();

  const [scannedToken, setScannedToken] = useState<string>('MC0xWDU1ZGM9O...==');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [gateStatus, setGateStatus] = useState<'IDLE' | 'SCANNING' | 'AUTHENTICATED' | 'FAILED'>(
    isCheckedIn ? 'AUTHENTICATED' : 'IDLE'
  );
  
  const [consoleLogs, setConsoleLogs] = useState<Array<{ time: string; msg: string; type: 'info' | 'success' | 'warn'; txHash?: string }>>([
    { time: new Date().toLocaleTimeString(), msg: '🎟️ InjPass Stadium Gate Validator Agent Operational', type: 'info' },
    { time: new Date().toLocaleTimeString(), msg: '🔗 Connected to Injective EVM Testnet Bridge', type: 'info' },
    { time: new Date().toLocaleTimeString(), msg: '🔍 Turnstile Sensor #04 scanning for incoming 15s dynamic proofs...', type: 'info' }
  ]);

  const runSimulatedScan = async () => {
    setIsScanning(true);
    setGateStatus('SCANNING');
    const activeTokenId = ticketTokenId || '1';

    const newLogs = [
      { time: new Date().toLocaleTimeString(), msg: `📱 Turnstile scanned live proof token for Ticket #${activeTokenId}`, type: 'info' as const },
      { time: new Date().toLocaleTimeString(), msg: `⚡ Verifying x402 15s HMAC signature & dispatching on-chain validateGateEntry(${activeTokenId})...`, type: 'info' as const },
    ];

    setConsoleLogs((prev) => [...newLogs, ...prev]);

    try {
      const res = await fetch(`${API_URL}/api/validator/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: activeTokenId }),
      });

      const data = await res.json();

      if (data.success && data.txHash) {
        const authLog = {
          time: new Date().toLocaleTimeString(),
          msg: `🔗 On-chain Tx Confirmed: contract.validateGateEntry(${activeTokenId})`,
          txHash: data.txHash,
          type: 'info' as const,
        };
        const successLog = {
          time: new Date().toLocaleTimeString(),
          msg: `✅ Ticket #${activeTokenId} authenticated & checked in on-chain! Gate UNLOCKED 🟢`,
          type: 'success' as const,
        };

        setConsoleLogs((prev) => [successLog, authLog, ...prev]);
        setGateStatus('AUTHENTICATED');
        setCheckedIn();
      } else {
        throw new Error(data.error || data.details || 'Validation execution failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution notice';
      const errorLog = {
        time: new Date().toLocaleTimeString(),
        msg: `⚠️ On-chain gate validation notice: ${msg}`,
        type: 'warn' as const,
      };
      setConsoleLogs((prev) => [errorLog, ...prev]);
      setGateStatus('FAILED');
    } finally {
      setIsScanning(false);
    }
  };

  const resetGate = () => {
    setGateStatus('IDLE');
    setConsoleLogs((prev) => [
      { time: new Date().toLocaleTimeString(), msg: '🔄 Gate reset for next attendee scan.', type: 'info' },
      ...prev,
    ]);
  };

  return (
    <div style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1300px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.35rem 1rem', borderRadius: 'var(--radius-pill)',
          background: 'rgba(24,104,255,0.08)', border: '1px solid rgba(24,104,255,0.2)',
          color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem',
        }}>
          🚧 Stadium Turnstile Gate Validator Demo
        </div>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          Physical Venue Gate Authentication
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-body)', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
          Simulate the AI Agent inspecting 15-second dynamic x402 gate pass signatures and triggering on-chain entry check-ins via the Injective MCP bridge.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>
        
        {/* LEFT COLUMN: Turnstile Hardware Mock */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>🏟 Turnstile Gate #04</h3>
            <span style={{
              padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-pill)',
              fontSize: '0.8rem', fontWeight: 700,
              background: gateStatus === 'AUTHENTICATED' ? 'var(--color-success-bg)' : gateStatus === 'SCANNING' ? 'rgba(245,158,11,0.1)' : 'rgba(15,15,17,0.05)',
              color: gateStatus === 'AUTHENTICATED' ? 'var(--color-success)' : gateStatus === 'SCANNING' ? '#D97706' : 'var(--color-text-secondary)',
              border: `1px solid ${gateStatus === 'AUTHENTICATED' ? 'rgba(16,185,129,0.3)' : gateStatus === 'SCANNING' ? 'rgba(245,158,11,0.3)' : 'var(--color-border)'}`,
            }}>
              {gateStatus === 'AUTHENTICATED' ? '🟢 GATE UNLOCKED' : gateStatus === 'SCANNING' ? '🟡 SCANNING...' : '🔴 GATE LOCKED'}
            </span>
          </div>

          {/* Gate Visual Animation Box */}
          <div style={{
            height: '220px', borderRadius: '16px',
            background: gateStatus === 'AUTHENTICATED'
              ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(52,211,153,0.08))'
              : 'linear-gradient(135deg, rgba(15,15,17,0.03), rgba(24,104,255,0.04))',
            border: gateStatus === 'AUTHENTICATED' ? '2px solid rgba(16,185,129,0.4)' : '1px solid var(--color-border)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', transition: 'all 0.5s ease',
          }}>
            {/* Gate Barrier Graphic */}
            <div style={{
              fontSize: '4.5rem', marginBottom: '0.5rem',
              transform: gateStatus === 'AUTHENTICATED' ? 'rotate(-60deg) translateY(-20px)' : 'rotate(0deg)',
              transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              {gateStatus === 'AUTHENTICATED' ? '🟢' : '🛑'}
            </div>
            
            <div style={{
              fontSize: '1.2rem', fontWeight: 700,
              color: gateStatus === 'AUTHENTICATED' ? 'var(--color-success)' : 'var(--color-text-primary)',
              fontFamily: 'var(--font-family-display)', letterSpacing: '0.04em',
            }}>
              {gateStatus === 'AUTHENTICATED' ? 'PASS PROCEED · ACCESS GRANTED' : 'SCAN PHONE TICKET QR'}
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', marginTop: '0.25rem' }}>
              {gateStatus === 'AUTHENTICATED' ? 'On-Chain Check-In Confirmed ✓' : 'Awaiting 15s Dynamic Signature Scan'}
            </div>
          </div>

          {/* Token input simulation */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
              Scanned Phone Passcode Proof:
            </label>
            <input
              type="text"
              value={scannedToken}
              onChange={(e) => setScannedToken(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem 1rem', borderRadius: '12px',
                border: '1px solid var(--color-border)', background: '#fff',
                fontSize: '0.9rem', fontFamily: 'ui-monospace, monospace',
                color: 'var(--color-text-primary)', marginBottom: '1rem',
              }}
            />

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={runSimulatedScan}
                disabled={isScanning}
                style={{
                  flex: 1, padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-pill)',
                  background: 'linear-gradient(135deg, #1868FF 0%, #3B82F6 100%)',
                  color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                  fontFamily: 'var(--font-family-display)', cursor: 'pointer',
                  border: 'none', boxShadow: '0 4px 16px rgba(24,104,255,0.3)',
                  opacity: isScanning ? 0.7 : 1, transition: 'all var(--transition-fast)',
                }}
              >
                {isScanning ? '🔍 Validating Proof...' : '📲 Simulate Turnstile Scan'}
              </button>

              <button
                onClick={resetGate}
                style={{
                  padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-pill)',
                  background: 'rgba(15,15,17,0.05)', border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.88rem',
                  cursor: 'pointer', fontFamily: 'var(--font-family-body)',
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* On-Chain Ticket Details */}
          <div style={{
            padding: '1rem 1.25rem', borderRadius: '14px',
            background: 'rgba(24,104,255,0.04)', border: '1px solid rgba(24,104,255,0.1)',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Ticket Token ID</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>#{ticketTokenId || '1'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Event ID</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>WC2026-FIN</div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Owner Wallet</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'ui-monospace, monospace', color: 'var(--color-text-secondary)' }}>
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '0x742d...44e'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>On-Chain Status</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isCheckedIn ? 'var(--color-success)' : '#F59E0B' }}>
                {isCheckedIn ? 'Checked-In ✓' : 'Unvalidated'}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Agent Live Terminal Output */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>🤖 AI Validator Agent Telemetry</h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'ui-monospace, monospace' }}>
              src/agent/validator.ts
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', margin: 0 }}>
            Live console output from the autonomous gate validator agent connected via Injective MCP.
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
              --- InjPass Gate Validator Terminal Output ---
            </div>

            {consoleLogs.map((log, idx) => (
              <div key={idx} style={{
                color: log.type === 'success' ? '#4ADE80' : log.type === 'warn' ? '#FBBF24' : '#94A3B8',
                lineHeight: 1.4,
              }}>
                <span style={{ color: '#475569', marginRight: '0.5rem' }}>[{log.time}]</span>
                {log.msg}
                {log.txHash && (
                  <>
                    {' | '}
                    <a
                      href={`https://testnet.blockscout.injective.network/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#38BDF8', textDecoration: 'underline' }}
                    >
                      Tx: {log.txHash.slice(0, 6)}...{log.txHash.slice(-4)} 🔗
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>

          <div style={{
            padding: '0.875rem 1rem', borderRadius: '12px',
            background: 'rgba(15,15,17,0.03)', border: '1px solid var(--color-border)',
            fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-body)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>Smart Contract: <strong>InjPassCollectible.sol</strong></span>
            <button
              onClick={() => setCurrentTab('ticket')}
              style={{
                background: 'none', border: 'none', color: 'var(--color-primary)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem',
              }}
            >
              View Ticket Status →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
