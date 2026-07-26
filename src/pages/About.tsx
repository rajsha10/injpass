import React from 'react';

export const About: React.FC = () => {
  return (
    <div id="about-section" style={{ flex: 1, paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(24, 104, 255, 0.25)', background: 'rgba(24, 104, 255, 0.07)',
            color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.25rem',
          }}>
            How It Works
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '1rem' }}>
            InjPass Architecture
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', fontFamily: 'var(--font-family-body)', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
            A Web3 stadium ticketing platform powered by NFT minting, x402 micropayments, and autonomous AI agents on Injective Protocol.
          </p>
        </div>

        {/* Flow steps */}
        {[
          {
            step: '01',
            icon: '🎫',
            title: 'Ticket NFT Minting',
            color: '#1868FF',
            description: 'Fans call purchaseTicket() on the InjPassCollectible smart contract. The NFT is minted with seat number, event ID, and base metadata recorded immutably on Injective.',
          },
          {
            step: '02',
            icon: '🔐',
            title: 'x402 Gate Entry (QR Code)',
            color: '#7C3AED',
            description: 'At the stadium gate, the frontend requests a secure proof from /api/ticket/secure-proof. The endpoint is protected by x402 middleware ($0.01 USDC). A rotating HMAC-SHA256 token is returned and rendered as a QR code — valid for 15 seconds.',
          },
          {
            step: '03',
            icon: '🤖',
            title: 'AI Turnstile Agent',
            color: '#059669',
            description: 'The AI Fan Engagement Agent monitors gate entry requests and calls validateGateEntry() on-chain via the Injective MCP server bridge. The turnstile opens and the fan\'s ticket status updates to "Checked In".',
          },
          {
            step: '04',
            icon: '🏆',
            title: 'Victory NFT Upgrade',
            color: '#D97706',
            description: 'The agent continuously polls /api/events/live-feed. When MATCH_END_WIN is detected, it calls upgradeToVictoryMetadata() on-chain. The fan\'s NFT transforms into a Gold Victory Edition collectible — fully autonomously.',
          },
        ].map((item) => (
          <div key={item.step} className="glass-panel" style={{ padding: '2rem', marginBottom: '1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
              background: `${item.color}15`, border: `2px solid ${item.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem',
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: item.color, marginBottom: '0.35rem', fontFamily: 'var(--font-family-body)' }}>
                Step {item.step}
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.6rem', color: 'var(--color-text-primary)' }}>
                {item.title}
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-body)', lineHeight: 1.7, fontSize: '0.92rem', margin: 0 }}>
                {item.description}
              </p>
            </div>
          </div>
        ))}

        {/* Tech stack */}
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.15rem' }}>Tech Stack</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Blockchain Network', value: 'Injective inEVM', icon: '⛓' },
              { label: 'Payment Gate', value: 'x402 Middleware', icon: '💳' },
              { label: 'Agent Framework', value: 'AI Fan Manager + MCP', icon: '🤖' },
              { label: 'Token Standard', value: 'Dynamic ERC-721 NFT', icon: '🎟' },
              { label: 'Currency', value: 'Bridged USDC', icon: '💵' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                padding: '0.875rem 1rem', borderRadius: '12px',
                background: 'rgba(24,104,255,0.04)', border: '1px solid rgba(24,104,255,0.1)',
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>{icon}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: '0.2rem', fontFamily: 'var(--font-family-body)' }}>{label}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-body)' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};