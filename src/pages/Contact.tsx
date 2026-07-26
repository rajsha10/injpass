import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Button } from '../components/Button';

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
  ticketTiers?: any[];
}

/* ── Shared input style matching the dark design system ── */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.9rem',
  borderRadius: '10px',
  border: '1.5px solid rgba(27,170,255,0.25)',
  background: 'rgba(2, 11, 45, 0.6)',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  fontFamily: 'var(--font-family-body)',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.4rem',
  fontFamily: 'var(--font-family-body)',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

/* ── Small themed input (for price fields) ── */
const smallInputStyle: React.CSSProperties = {
  ...inputStyle,
  width: '90px',
  padding: '0.5rem 0.65rem',
  fontSize: '0.82rem',
};

export const Contact: React.FC = () => {
  const { setVictoryEdition } = useWeb3();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Event Creation Form state
  const [createId, setCreateId] = useState<string>('WC2026-FIN');
  const [createName, setCreateName] = useState<string>('FIFA World Cup Final 2026');
  const [createHomeTeam, setCreateHomeTeam] = useState<string>('Argentina');
  const [createAwayTeam, setCreateAwayTeam] = useState<string>('France');
  const [createHomeScore, setCreateHomeScore] = useState<number>(2);
  const [createAwayScore, setCreateAwayScore] = useState<number>(1);
  const [createStatus, setCreateStatus] = useState<'scheduled' | 'live' | 'finished'>('live');

  // Ticket Planner states
  const [platinumPrice, setPlatinumPrice] = useState<number>(50);
  const [goldPrice, setGoldPrice] = useState<number>(35);
  const [basicPrice, setBasicPrice] = useState<number>(20);
  const [fanclubPrice, setFanclubPrice] = useState<number>(10);

  const [hasPlatinum, setHasPlatinum] = useState<boolean>(true);
  const [hasGold, setHasGold] = useState<boolean>(true);
  const [hasBasic, setHasBasic] = useState<boolean>(true);
  const [hasFanclub, setHasFanclub] = useState<boolean>(true);

  const [platinumDesc, setPlatinumDesc] = useState<string>('Pitchside access · VIP entrance · Gold NFT eligibility');
  const [goldDesc, setGoldDesc] = useState<string>('Lower tier central seating · Premium NFT ticket');
  const [basicDesc, setBasicDesc] = useState<string>('Standard seating · Central view · Standard NFT ticket');
  const [fanclubDesc, setFanclubDesc] = useState<string>('Supporters club zone · Budget pricing · Fanclub NFT ticket');

  // Match Simulation state
  const [simScore, setSimScore] = useState<string>('Argentina 2 - 1 France');
  const [simMinute, setSimMinute] = useState<number>(72);
  const [simType, setSimType] = useState<string>('NONE');
  const [simWinner, setSimWinner] = useState<string>('Argentina');

  const [deploying, setDeploying] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [consoleLogs, setConsoleLogs] = useState<Array<{ time: string; msg: string; type: 'info' | 'success' | 'warn' | 'alert' }>>([
    { time: new Date().toLocaleTimeString(), msg: '⚙️ Admin Simulation Center Loaded', type: 'info' }
  ]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/events');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.events) {
        setEvents(data.events);
        if (data.events.length > 0 && !selectedEventId) {
          setSelectedEventId(data.events[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load events:', err);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const active = events.find(e => e.id === selectedEventId);
    if (active) {
      setSimScore(`${active.homeTeam} ${active.scoreHome} - ${active.scoreAway} ${active.awayTeam}`);
      setSimMinute(active.minute || 0);
      setSimWinner(active.homeTeam);

      if (active.ticketTiers && active.ticketTiers.length > 0) {
        const plat = active.ticketTiers.find((t: any) => t.id === 'platinum');
        const gld = active.ticketTiers.find((t: any) => t.id === 'gold');
        const bsc = active.ticketTiers.find((t: any) => t.id === 'basic');
        const fan = active.ticketTiers.find((t: any) => t.id === 'fanclub');

        setHasPlatinum(!!plat);
        if (plat) { setPlatinumPrice(plat.price); setPlatinumDesc(plat.description); }

        setHasGold(!!gld);
        if (gld) { setGoldPrice(gld.price); setGoldDesc(gld.description); }

        setHasBasic(!!bsc);
        if (bsc) { setBasicPrice(bsc.price); setBasicDesc(bsc.description); }

        setHasFanclub(!!fan);
        if (fan) { setFanclubPrice(fan.price); setFanclubDesc(fan.description); }
      } else {
        setHasPlatinum(true); setPlatinumPrice(50); setPlatinumDesc('Pitchside access · VIP entrance · Gold NFT eligibility');
        setHasGold(true);     setGoldPrice(35);     setGoldDesc('Lower tier central seating · Premium NFT ticket');
        setHasBasic(true);    setBasicPrice(20);    setBasicDesc('Standard seating · Central view · Standard NFT ticket');
        setHasFanclub(true);  setFanclubPrice(10);  setFanclubDesc('Supporters club zone · Budget pricing · Fanclub NFT ticket');
      }
    }
  }, [selectedEventId, events]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeploying(true);
    setStatusMsg(null);
    try {
      const res = await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: createId, name: createName, homeTeam: createHomeTeam, awayTeam: createAwayTeam, scoreHome: createHomeScore, scoreAway: createAwayScore, status: createStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ text: `🟢 Event "${createName}" successfully registered in database!`, type: 'success' });
        setConsoleLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: `⚽ Registered event: ${createName} (ID: ${createId})`, type: 'success' }, ...prev]);
        await fetchEvents();
      } else {
        throw new Error(data.error || 'Failed to create event');
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ Failed: ${err.message}`, type: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  const handleSimulateTrigger = async () => {
    if (!selectedEventId) return;
    setDeploying(true);
    setStatusMsg(null);
    try {
      setConsoleLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: `⚡ Simulating: "${simScore}" | Min: ${simMinute}' | Trigger: ${simType}`, type: 'info' }, ...prev]);
      const res = await fetch('http://localhost:3000/api/admin/simulate-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEventId, score: simScore, minute: simMinute, eventType: simType, winnerTeam: simType === 'MATCH_END_WIN' ? simWinner : undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ text: `🟢 Simulation Event "${simType}" deployed successfully!`, type: 'success' });
        if (simType === 'MATCH_END_WIN') {
          setConsoleLogs(prev => [
            { time: new Date().toLocaleTimeString(), msg: `🚨 MATCH END WIN! Winner: ${simWinner}`, type: 'alert' },
            { time: new Date().toLocaleTimeString(), msg: `🏆 Upgraded NFT tickets for ${simWinner} supporters to Gold Victory passes`, type: 'success' },
            ...prev,
          ]);
          setVictoryEdition();
        } else if (simType === 'GOAL') {
          setConsoleLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: `⚽ GOAL SCORED! Score updated to ${simScore}`, type: 'alert' }, ...prev]);
        }
        await fetchEvents();
      } else {
        throw new Error(data.error || 'Failed to deploy simulation');
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ Simulation error: ${err.message}`, type: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  const handleSaveTiers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) { alert('Please select or create an event first!'); return; }
    setDeploying(true);
    setStatusMsg(null);

    const configuredTiers = [];
    if (hasPlatinum) configuredTiers.push({ id: 'platinum', name: 'Platinum Premium', price: Number(platinumPrice), description: platinumDesc, seats: [101, 102, 103, 104, 105], color: '#F59E0B' });
    if (hasGold)     configuredTiers.push({ id: 'gold',     name: 'Gold Executive',   price: Number(goldPrice),     description: goldDesc,     seats: [151, 152, 153, 154, 155], color: '#FBBF24' });
    if (hasBasic)    configuredTiers.push({ id: 'basic',    name: 'Basic Standard',   price: Number(basicPrice),    description: basicDesc,    seats: [201, 202, 203, 204, 205, 206, 207], color: '#1BAAFF' });
    if (hasFanclub)  configuredTiers.push({ id: 'fanclub',  name: 'Fanclub Supporters', price: Number(fanclubPrice), description: fanclubDesc, seats: [301, 302, 303, 304, 305], color: '#10B981' });

    try {
      const res = await fetch('http://localhost:3000/api/events/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: selectedEventId, tiers: configuredTiers }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ text: `🟢 Ticket tiers updated for event ${selectedEventId}!`, type: 'success' });
        setConsoleLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: `🎫 Configured ${configuredTiers.length} ticket tiers for event ID: ${selectedEventId}`, type: 'success' }, ...prev]);
        await fetchEvents();
      } else {
        throw new Error(data.error || 'Failed to configure tiers');
      }
    } catch (err: any) {
      setStatusMsg({ text: `❌ Failed to save tiers: ${err.message}`, type: 'error' });
    } finally {
      setDeploying(false);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  /* ── Tier toggle row component ── */
  const TierRow = ({
    enabled, onToggle, color, label, price, onPriceChange, desc, onDescChange,
  }: {
    enabled: boolean; onToggle: (v: boolean) => void; color: string; label: string;
    price: number; onPriceChange: (v: number) => void;
    desc: string;   onDescChange: (v: string) => void;
  }) => (
    <div style={{
      borderRadius: '14px',
      border: `1.5px solid ${enabled ? color + '44' : 'rgba(27,170,255,0.1)'}`,
      background: enabled ? `${color}08` : 'rgba(27,170,255,0.03)',
      padding: '1rem 1.25rem',
      transition: 'all 0.2s ease',
    }}>
      {/* Header row */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: enabled ? '0.85rem' : 0 }}>
        {/* Custom checkbox */}
        <div
          onClick={() => onToggle(!enabled)}
          style={{
            width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
            border: `2px solid ${enabled ? color : 'rgba(27,170,255,0.3)'}`,
            background: enabled ? color : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
        >
          {enabled && <span style={{ color: '#000', fontSize: '0.7rem', fontWeight: 900, lineHeight: 1 }}>✓</span>}
        </div>
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: enabled ? color : 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', transition: 'color 0.15s ease' }}>
          {label}
        </span>
        {enabled && (
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: color, fontWeight: 700, background: `${color}15`, padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
            ${price} USDC
          </span>
        )}
      </label>

      {/* Expanded inputs */}
      {enabled && (
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '0.75rem' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => onPriceChange(Number(e.target.value))}
              style={smallInputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 0 3px ${color}22`; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(27,170,255,0.25)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Description</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => onDescChange(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 0 3px ${color}22`; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(27,170,255,0.25)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'var(--color-cyan)';
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,170,255,0.18)';
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'rgba(27,170,255,0.25)';
      e.currentTarget.style.boxShadow = 'none';
    },
  };

  return (
    <div style={{ flex: 1, paddingBottom: '5rem' }}>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.35rem 0.9rem', borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
            color: '#FC8181', fontSize: '0.75rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem',
            fontFamily: 'var(--font-family-body)',
          }}>
            ⚙️ Testing Access — Hidden Route
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3rem)', marginBottom: '0.75rem', fontWeight: 800 }}>
            Admin Command Center
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-body)', fontSize: '0.95rem', lineHeight: 1.65 }}>
            Create events, simulate live scores, update matches, and trigger dynamic ticket upgrades.
          </p>
        </div>

        {/* ── Status Alert ── */}
        {statusMsg && (
          <div style={{
            marginBottom: '2rem', padding: '1rem 1.25rem', borderRadius: '14px',
            fontSize: '0.88rem', fontWeight: 600, fontFamily: 'var(--font-family-body)',
            background: statusMsg.type === 'success' ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
            color: statusMsg.type === 'success' ? '#4ADE80' : '#F87171',
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
          }}>
            {statusMsg.text}
          </div>
        )}

        <div className="dashboard-grid" style={{ padding: 0, gap: '2rem' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Schedule New Event */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(27,170,255,0.15)', border: '1.5px solid rgba(27,170,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  📅
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)', margin: 0 }}>Schedule New Event</h3>
              </div>

              <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Event ID / Match Key</label>
                  <input type="text" value={createId} onChange={(e) => setCreateId(e.target.value)} style={inputStyle} required {...focusHandlers} />
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Event Description / Name</label>
                  <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} style={inputStyle} required {...focusHandlers} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Home Team</label>
                    <input type="text" value={createHomeTeam} onChange={(e) => setCreateHomeTeam(e.target.value)} style={inputStyle} required {...focusHandlers} />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Away Team</label>
                    <input type="text" value={createAwayTeam} onChange={(e) => setCreateAwayTeam(e.target.value)} style={inputStyle} required {...focusHandlers} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Home Score</label>
                    <input type="number" value={createHomeScore} onChange={(e) => setCreateHomeScore(Number(e.target.value))} style={inputStyle} {...focusHandlers} />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Away Score</label>
                    <input type="number" value={createAwayScore} onChange={(e) => setCreateAwayScore(Number(e.target.value))} style={inputStyle} {...focusHandlers} />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Status</label>
                    <select
                      value={createStatus}
                      onChange={(e) => setCreateStatus(e.target.value as any)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      {...focusHandlers}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>
                </div>

                <Button variant="primary" size="md" type="submit" disabled={deploying} style={{ width: '100%', marginTop: '0.25rem' }}>
                  {deploying ? '⏳ Saving...' : '⚡ Create & Save Event'}
                </Button>
              </form>
            </div>

            {/* Ticket Pricing & Tiers */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  🎫
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)', margin: 0 }}>Configure Ticket Tiers</h3>
              </div>

              {events.length === 0 ? (
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)', padding: '1.5rem', textAlign: 'center', background: 'rgba(27,170,255,0.04)', borderRadius: '12px', border: '1px dashed rgba(27,170,255,0.2)' }}>
                  No active events. Schedule an event first!
                </div>
              ) : (
                <form onSubmit={handleSaveTiers} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Select Event to Configure</label>
                    <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} {...focusHandlers}>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.name} ({ev.id})</option>
                      ))}
                    </select>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: 'rgba(27,170,255,0.12)', margin: '0.25rem 0' }} />

                  <TierRow enabled={hasPlatinum} onToggle={setHasPlatinum} color="#F59E0B" label="Platinum Premium" price={platinumPrice} onPriceChange={setPlatinumPrice} desc={platinumDesc} onDescChange={setPlatinumDesc} />
                  <TierRow enabled={hasGold}     onToggle={setHasGold}     color="#FBBF24" label="Gold Executive"   price={goldPrice}     onPriceChange={setGoldPrice}     desc={goldDesc}     onDescChange={setGoldDesc}     />
                  <TierRow enabled={hasBasic}    onToggle={setHasBasic}    color="#1BAAFF" label="Basic Standard"   price={basicPrice}    onPriceChange={setBasicPrice}    desc={basicDesc}    onDescChange={setBasicDesc}    />
                  <TierRow enabled={hasFanclub}  onToggle={setHasFanclub}  color="#10B981" label="Fanclub Supporters" price={fanclubPrice} onPriceChange={setFanclubPrice} desc={fanclubDesc}  onDescChange={setFanclubDesc}  />

                  <Button variant="primary" size="md" type="submit" disabled={deploying} style={{ width: '100%', marginTop: '0.5rem' }}>
                    {deploying ? '⏳ Saving...' : '💾 Save Ticket Tiers & Prices'}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Simulate Active Match */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,107,0,0.15)', border: '1.5px solid rgba(255,107,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  ⚡
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)', margin: 0 }}>Simulate Active Match</h3>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Select Event to Simulate</label>
                {events.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-error)', fontStyle: 'italic', fontFamily: 'var(--font-family-body)' }}>
                    No events available. Create one first.
                  </div>
                ) : (
                  <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} {...focusHandlers}>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.name} ({ev.homeTeam} vs {ev.awayTeam})</option>
                    ))}
                  </select>
                )}
              </div>

              {selectedEvent && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Simulated Score Line</label>
                      <input type="text" value={simScore} onChange={(e) => setSimScore(e.target.value)} style={inputStyle} {...focusHandlers} />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Simulated Minute</label>
                      <input type="number" value={simMinute} onChange={(e) => setSimMinute(Number(e.target.value))} style={inputStyle} {...focusHandlers} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Event Trigger</label>
                      <select value={simType} onChange={(e) => setSimType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} {...focusHandlers}>
                        <option value="NONE">NONE — Normal Update</option>
                        <option value="GOAL">GOAL — Goal Scored</option>
                        <option value="MATCH_END_WIN">MATCH_END_WIN — Final Whistle</option>
                      </select>
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Winning Team</label>
                      <select value={simWinner} onChange={(e) => setSimWinner(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} {...focusHandlers}>
                        <option value={selectedEvent.homeTeam}>{selectedEvent.homeTeam} (Home)</option>
                        <option value={selectedEvent.awayTeam}>{selectedEvent.awayTeam} (Away)</option>
                      </select>
                    </div>
                  </div>

                  {/* Match preview pill */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: 'rgba(27,170,255,0.06)',
                    border: '1px solid rgba(27,170,255,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    fontFamily: 'var(--font-family-display)',
                  }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>{selectedEvent.homeTeam}</span>
                    <span style={{ fontSize: '1.1rem', color: 'var(--color-cyan)', fontWeight: 800 }}>{simScore.match(/\d+ - \d+/)?.[0] ?? 'vs'}</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>{selectedEvent.awayTeam}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-family-body)' }}>{simMinute}'</span>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSimulateTrigger}
                    disabled={deploying}
                    style={{ width: '100%' }}
                  >
                    {deploying ? '⏳ Deploying...' : '🚀 Deploy Simulation Event'}
                  </Button>
                </>
              )}
            </div>

            {/* Telemetry Console */}
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1.5px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                  🤖
                </div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)', margin: 0 }}>AI Fan Telemetry</h3>
                <span style={{
                  marginLeft: 'auto', fontSize: '0.68rem', fontWeight: 700, color: '#4ADE80',
                  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
                  padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-family-body)',
                }}>
                  LIVE
                </span>
              </div>

              <div className="terminal-block" style={{ flex: 1 }}>
                <div className="terminal-header">
                  <div className="terminal-dot" style={{ background: '#FF5F57' }} />
                  <div className="terminal-dot" style={{ background: '#FEBC2E' }} />
                  <div className="terminal-dot" style={{ background: '#28C840' }} />
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'ui-monospace, monospace' }}>
                    admin_telemetry.log
                  </span>
                </div>
                <div className="terminal-body" style={{ height: '220px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {consoleLogs.map((log, idx) => (
                    <div key={idx} style={{
                      color: log.type === 'alert' ? '#F59E0B' : log.type === 'success' ? '#4ADE80' : log.type === 'warn' ? '#FBBF24' : '#94A3B8',
                      lineHeight: 1.5, marginBottom: '0.35rem',
                    }}>
                      <span style={{ color: '#374151' }}>[{log.time}] </span>
                      {log.msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Global select/input dark override for this page */}
      <style>{`
        .admin-panel-scope option {
          background: #020B2D;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};