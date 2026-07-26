import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseKey);

let supabase: any = null;
if (isConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("🟢 Connected to Supabase DB");
  } catch (err) {
    console.error("❌ Failed to initialize Supabase client:", err);
  }
} else {
  console.warn("⚠️ SUPABASE_URL or SUPABASE_KEY is missing. Running in fallback/in-memory mode.");
}

// ── Models & TypeScript Interfaces ──────────────────────────────────────────

export interface SeatTier {
  id: string;
  name: string;
  price: number;
  description: string;
  seats: number[];
  color: string;
}

export interface User {
  walletAddress: string;
  username?: string;
  email?: string;
  selectedTeam?: string;
  createdAt?: string;
}

export interface Event {
  id: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  scoreHome?: number;
  scoreAway?: number;
  status?: 'scheduled' | 'live' | 'finished';
  minute?: number;
  recentEvent?: string;
  winnerTeam?: string;
  scheduledAt?: string;
  ticketTiers?: SeatTier[];
}

export interface TicketState {
  tokenId: string;
  ownerAddress?: string;
  seat: number;
  isCheckedIn: boolean;
  isVictoryEdition: boolean;
  eventId?: string;
  nftHash?: string;
  goldenNftHash?: string;
  selectedTeam?: string;
  txHash?: string;
  createdAt?: string;
}

export interface MatchState {
  eventId: string;
  minute: number;
  score: string;
  recentEvent: string;
}

// ── Fallback In-Memory Stores ──────────────────────────────────────────────

let fallbackUsers: Record<string, User> = {};

let fallbackEvents: Record<string, Event> = {
  'WC2026-FIN': {
    id: 'WC2026-FIN',
    name: 'World Cup Final 2026',
    homeTeam: 'Argentina',
    awayTeam: 'France',
    scoreHome: 2,
    scoreAway: 1,
    status: 'live',
    minute: 72,
    recentEvent: 'NONE',
    scheduledAt: '2026-07-26T20:00:00-04:00'
  },
  'SC24-GP-A1': {
    id: 'SC24-GP-A1',
    name: 'Seattle Reign FC vs Utah Royals FC',
    homeTeam: 'Seattle Reign FC',
    awayTeam: 'Utah Royals FC',
    scoreHome: 0,
    scoreAway: 0,
    status: 'scheduled',
    minute: 0,
    recentEvent: 'NONE',
    scheduledAt: '2024-07-19T21:00:00-04:00'
  },
  'SC24-GP-E1': {
    id: 'SC24-GP-E1',
    name: 'Racing Louisville FC vs Rayadas de Monterrey',
    homeTeam: 'Racing Louisville FC',
    awayTeam: 'Rayadas de Monterrey',
    scoreHome: 0,
    scoreAway: 0,
    status: 'scheduled',
    minute: 0,
    recentEvent: 'NONE',
    scheduledAt: '2024-07-20T20:00:00-04:00'
  },
  'SC24-GP-C1': {
    id: 'SC24-GP-C1',
    name: 'Tigres UANL vs Pachuca',
    homeTeam: 'Tigres UANL',
    awayTeam: 'Pachuca',
    scoreHome: 0,
    scoreAway: 0,
    status: 'scheduled',
    minute: 0,
    recentEvent: 'NONE',
    scheduledAt: '2024-07-19T22:00:00-04:00'
  },
  'SC24-GP-B1': {
    id: 'SC24-GP-B1',
    name: 'San Diego Wave FC vs Bay FC',
    homeTeam: 'San Diego Wave FC',
    awayTeam: 'Bay FC',
    scoreHome: 0,
    scoreAway: 0,
    status: 'scheduled',
    minute: 0,
    recentEvent: 'NONE',
    scheduledAt: '2024-07-20T22:00:00-04:00'
  },
  'SC24-GP-D1': {
    id: 'SC24-GP-D1',
    name: 'Chicago Red Stars vs NJ/NY Gotham FC',
    homeTeam: 'Chicago Red Stars',
    awayTeam: 'NJ/NY Gotham FC',
    scoreHome: 0,
    scoreAway: 0,
    status: 'scheduled',
    minute: 0,
    recentEvent: 'NONE',
    scheduledAt: '2024-07-20T17:00:00-04:00'
  },
  'SC24-GP-B2': {
    id: 'SC24-GP-B2',
    name: 'Angel City FC vs Club América',
    homeTeam: 'Angel City FC',
    awayTeam: 'Club América',
    scoreHome: 0,
    scoreAway: 0,
    status: 'scheduled',
    minute: 0,
    recentEvent: 'NONE',
    scheduledAt: '2024-07-20T22:00:00-04:00'
  },
  'SC24-GP-E2': {
    id: 'SC24-GP-E2',
    name: 'North Carolina Courage vs Orlando Pride',
    homeTeam: 'North Carolina Courage',
    awayTeam: 'Orlando Pride',
    scoreHome: 0,
    scoreAway: 0,
    status: 'scheduled',
    minute: 0,
    recentEvent: 'NONE',
    scheduledAt: '2024-07-20T19:30:00-04:00'
  },
  'SC24-GP-D2': {
    id: 'SC24-GP-D2',
    name: 'Washington Spirit vs Chivas de Guadalajara',
    homeTeam: 'Washington Spirit',
    awayTeam: 'Chivas de Guadalajara',
    scoreHome: 0,
    scoreAway: 0,
    status: 'scheduled',
    minute: 0,
    recentEvent: 'NONE',
    scheduledAt: '2024-07-21T16:30:00-04:00'
  },
  'SC24-GP-C2': {
    id: 'SC24-GP-C2',
    name: 'Kansas City Current vs Houston Dash',
    homeTeam: 'Kansas City Current',
    awayTeam: 'Houston Dash',
    scoreHome: 0,
    scoreAway: 0,
    status: 'scheduled',
    minute: 0,
    recentEvent: 'NONE',
    scheduledAt: '2024-07-20T20:00:00-04:00'
  },
  'SC24-GP-A2': {
    id: 'SC24-GP-A2',
    name: 'Portland Thorns FC vs Club Tijuana',
    homeTeam: 'Portland Thorns FC',
    awayTeam: 'Club Tijuana',
    scoreHome: 0,
    scoreAway: 0,
    status: 'scheduled',
    minute: 0,
    recentEvent: 'NONE',
    scheduledAt: '2024-07-21T19:00:00-04:00'
  }
};

let fallbackTickets: Record<string, TicketState> = {};

// ── DB Mapping Helpers ──────────────────────────────────────────────────────

function mapUserFromDb(row: any): User {
  return {
    walletAddress: row.wallet_address,
    username: row.username,
    email: row.email,
    selectedTeam: row.selected_team,
    createdAt: row.created_at
  };
}

function mapUserToDb(user: User): any {
  return {
    wallet_address: user.walletAddress.toLowerCase(),
    username: user.username,
    email: user.email,
    selected_team: user.selectedTeam
  };
}

function mapEventFromDb(row: any): Event {
  return {
    id: row.id,
    name: row.name,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    scoreHome: row.score_home,
    scoreAway: row.score_away,
    status: row.status,
    minute: row.minute,
    recentEvent: row.recent_event,
    winnerTeam: row.winner_team,
    scheduledAt: row.scheduled_at
  };
}

function mapEventToDb(event: Partial<Event>): any {
  const row: any = {};
  if (event.id !== undefined) row.id = event.id;
  if (event.name !== undefined) row.name = event.name;
  if (event.homeTeam !== undefined) row.home_team = event.homeTeam;
  if (event.awayTeam !== undefined) row.away_team = event.awayTeam;
  if (event.scoreHome !== undefined) row.score_home = event.scoreHome;
  if (event.scoreAway !== undefined) row.score_away = event.scoreAway;
  if (event.status !== undefined) row.status = event.status;
  if (event.minute !== undefined) row.minute = event.minute;
  if (event.recentEvent !== undefined) row.recent_event = event.recentEvent;
  if (event.winnerTeam !== undefined) row.winner_team = event.winnerTeam;
  if (event.scheduledAt !== undefined) row.scheduled_at = event.scheduledAt;
  return row;
}

function mapTicketFromDb(row: any): TicketState {
  return {
    tokenId: row.token_id,
    ownerAddress: row.owner_address,
    seat: row.seat,
    isCheckedIn: row.is_checked_in,
    isVictoryEdition: row.is_victory_edition,
    eventId: row.event_id,
    nftHash: row.nft_hash,
    goldenNftHash: row.golden_nft_hash,
    selectedTeam: row.selected_team,
    txHash: row.tx_hash,
    createdAt: row.created_at
  };
}

function mapTicketToDb(ticket: Partial<TicketState>): any {
  const row: any = {};
  if (ticket.tokenId !== undefined) row.token_id = ticket.tokenId;
  if (ticket.ownerAddress !== undefined) row.owner_address = ticket.ownerAddress.toLowerCase();
  if (ticket.seat !== undefined) row.seat = ticket.seat;
  if (ticket.isCheckedIn !== undefined) row.is_checked_in = ticket.isCheckedIn;
  if (ticket.isVictoryEdition !== undefined) row.is_victory_edition = ticket.isVictoryEdition;
  if (ticket.eventId !== undefined) row.event_id = ticket.eventId;
  if (ticket.nftHash !== undefined) row.nft_hash = ticket.nftHash;
  if (ticket.goldenNftHash !== undefined) row.golden_nft_hash = ticket.goldenNftHash;
  if (ticket.selectedTeam !== undefined) row.selected_team = ticket.selectedTeam;
  if (ticket.txHash !== undefined) row.tx_hash = ticket.txHash;
  return row;
}

// ── Connection Checker ──────────────────────────────────────────────────────

export async function checkDbConnection(): Promise<{ connected: boolean; mode: 'supabase' | 'fallback'; message: string }> {
  if (!isConfigured || !supabase) {
    return {
      connected: false,
      mode: 'fallback',
      message: 'SUPABASE_URL or SUPABASE_KEY is missing. Operating in in-memory fallback mode.'
    };
  }
  try {
    const { error } = await supabase.from('events').select('id', { count: 'exact', head: true });
    if (error) {
      return { connected: false, mode: 'supabase', message: error.message };
    }
    return { connected: true, mode: 'supabase', message: '🟢 Connected to Supabase DB successfully' };
  } catch (err: any) {
    return { connected: false, mode: 'supabase', message: err.message || String(err) };
  }
}

// ── User Functions ──────────────────────────────────────────────────────────

export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  const key = walletAddress.toLowerCase();
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', key)
        .maybeSingle();

      if (error) throw error;
      return data ? mapUserFromDb(data) : null;
    } catch (err) {
      console.error("❌ Supabase getUserByWallet error, using fallback:", err);
    }
  }
  return fallbackUsers[key] || null;
}

export async function saveUser(user: User): Promise<User> {
  const key = user.walletAddress.toLowerCase();
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert(mapUserToDb(user))
        .select()
        .single();

      if (error) throw error;
      return mapUserFromDb(data);
    } catch (err) {
      console.error("❌ Supabase saveUser error, saving to fallback:", err);
    }
  }
  fallbackUsers[key] = { ...user, walletAddress: key };
  return fallbackUsers[key];
}

// ── Event Functions ─────────────────────────────────────────────────────────

export async function getEvents(): Promise<Event[]> {
  let eventsList: Event[] = [];
  if (isConfigured && supabase) {
    try {
      let { data, error } = await supabase
        .from('events')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.log("⚠️ Supabase events table is empty. Seeding default events...");
        for (const event of Object.values(fallbackEvents)) {
          await supabase.from('events').upsert(mapEventToDb(event));
        }
        const { data: refetched, error: refetchError } = await supabase
          .from('events')
          .select('*')
          .order('scheduled_at', { ascending: true });
        if (refetchError) throw refetchError;
        data = refetched;
      }

      eventsList = (data || []).map(mapEventFromDb);
    } catch (err) {
      console.error("❌ Supabase getEvents error, using fallback:", err);
      eventsList = Object.values(fallbackEvents);
    }
  } else {
    eventsList = Object.values(fallbackEvents);
  }
  return eventsList.map(e => ({
    ...e,
    ticketTiers: eventTiersStore[e.id] || undefined
  }));
}

export async function getEventById(id: string): Promise<Event | null> {
  let event: Event | null = null;
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      event = data ? mapEventFromDb(data) : null;
    } catch (err) {
      console.error("❌ Supabase getEventById error, using fallback:", err);
      event = fallbackEvents[id] || null;
    }
  } else {
    event = fallbackEvents[id] || null;
  }
  if (event) {
    event.ticketTiers = eventTiersStore[event.id] || undefined;
  }
  return event;
}

export async function saveEvent(event: Event): Promise<Event> {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('events')
        .upsert(mapEventToDb(event))
        .select()
        .single();

      if (error) throw error;
      return mapEventFromDb(data);
    } catch (err) {
      console.error("❌ Supabase saveEvent error, saving to fallback:", err);
    }
  }
  fallbackEvents[event.id] = { ...event };
  return fallbackEvents[event.id];
}

// ── Ticket Functions ────────────────────────────────────────────────────────

export async function getTicketByOwner(ownerAddress: string): Promise<TicketState | null> {
  const sanitizedAddr = ownerAddress.toLowerCase();
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('owner_address', sanitizedAddr)
        .maybeSingle();

      if (error) throw error;
      return data ? mapTicketFromDb(data) : null;
    } catch (err) {
      console.error("❌ Supabase getTicketByOwner error, using fallback:", err);
    }
  }

  const match = Object.values(fallbackTickets).find(
    (t) => t.ownerAddress?.toLowerCase() === sanitizedAddr
  );
  return match || null;
}

export async function getTickets(): Promise<TicketState[]> {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*');

      if (error) throw error;
      return (data || []).map(mapTicketFromDb);
    } catch (err) {
      console.error("❌ Supabase getTickets error, using fallback:", err);
    }
  }
  return Object.values(fallbackTickets);
}

export async function saveTicket(
  tokenId: string,
  seat: number,
  ownerAddress: string,
  eventId?: string,
  selectedTeam?: string,
  nftHash?: string,
  txHash?: string
): Promise<TicketState> {
  const sanitizedAddr = ownerAddress.toLowerCase();
  const ticket: TicketState = {
    tokenId,
    seat,
    ownerAddress: sanitizedAddr,
    isCheckedIn: false,
    isVictoryEdition: false,
    eventId: eventId || 'WC2026-FIN',
    selectedTeam: selectedTeam || 'Argentina',
    nftHash: nftHash || 'ipfs://standard-ticket-hash',
    txHash: txHash || ''
  };

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .upsert(mapTicketToDb(ticket))
        .select()
        .single();

      if (error) throw error;
      return mapTicketFromDb(data);
    } catch (err) {
      console.error("❌ Supabase saveTicket error, saving to fallback:", err);
    }
  }

  fallbackTickets[tokenId] = ticket;
  return ticket;
}

export async function updateTicketCheckIn(tokenId: string, isCheckedIn: boolean): Promise<TicketState | null> {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ is_checked_in: isCheckedIn })
        .eq('token_id', tokenId)
        .select()
        .single();

      if (error) throw error;
      return mapTicketFromDb(data);
    } catch (err) {
      console.error("❌ Supabase updateTicketCheckIn error, updating fallback:", err);
    }
  }

  const t = fallbackTickets[tokenId];
  if (t) {
    t.isCheckedIn = isCheckedIn;
    return t;
  }
  return null;
}

export async function upgradeTicketToVictory(tokenId: string, goldenNftHash?: string): Promise<TicketState | null> {
  const updates: any = { is_victory_edition: true };
  if (goldenNftHash) updates.golden_nft_hash = goldenNftHash;

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('token_id', tokenId)
        .select()
        .single();

      if (error) throw error;
      return mapTicketFromDb(data);
    } catch (err) {
      console.error("❌ Supabase upgradeTicketToVictory error, updating fallback:", err);
    }
  }

  const t = fallbackTickets[tokenId];
  if (t) {
    t.isVictoryEdition = true;
    if (goldenNftHash) t.goldenNftHash = goldenNftHash;
    return t;
  }
  return null;
}

export async function upgradeAllTicketsToVictory(eventId: string): Promise<number> {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ is_victory_edition: true })
        .eq('event_id', eventId)
        .select('*');

      if (error) throw error;
      return data ? data.length : 0;
    } catch (err) {
      console.error("❌ Supabase upgradeAllTicketsToVictory error, updating fallback:", err);
    }
  }

  let count = 0;
  for (const t of Object.values(fallbackTickets)) {
    if (t.eventId === eventId) {
      t.isVictoryEdition = true;
      count++;
    }
  }
  return count;
}

export async function upgradeWinningTicketsToVictory(
  eventId: string,
  winningTeam: string,
  goldenNftHash?: string
): Promise<number> {
  console.log(`🏆 Upgrading ticket NFTs for fans supporting winning team: ${winningTeam}`);
  
  if (isConfigured && supabase) {
    try {
      const updates: any = { is_victory_edition: true };
      if (goldenNftHash) updates.golden_nft_hash = goldenNftHash;

      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('event_id', eventId)
        .eq('selected_team', winningTeam)
        .select('*');

      if (error) throw error;
      return data ? data.length : 0;
    } catch (err) {
      console.error("❌ Supabase upgradeWinningTicketsToVictory error, updating fallback:", err);
    }
  }

  let count = 0;
  for (const t of Object.values(fallbackTickets)) {
    if (t.eventId === eventId && t.selectedTeam?.toLowerCase() === winningTeam.toLowerCase()) {
      t.isVictoryEdition = true;
      if (goldenNftHash) t.goldenNftHash = goldenNftHash;
      count++;
    }
  }
  return count;
}

// ── Legacy Match Compatibility Functions ────────────────────────────────────

export async function getLiveMatchState(): Promise<MatchState> {
  const event = await getEventById('WC2026-FIN');
  if (event) {
    return {
      eventId: event.id,
      score: `${event.homeTeam} ${event.scoreHome || 0} - ${event.scoreAway || 0} ${event.awayTeam}`,
      minute: event.minute || 0,
      recentEvent: event.recentEvent || 'NONE'
    };
  }
  return {
    eventId: "WC2026-FIN",
    score: "Argentina 2 - 1 France",
    minute: 72,
    recentEvent: "NONE"
  };
}

export async function updateLiveMatchState(
  eventId: string,
  score: string | undefined,
  minute: number | undefined,
  recentEvent: string | undefined
): Promise<MatchState> {
  const existing = await getEventById(eventId) || {
    id: eventId,
    name: 'World Cup Match',
    homeTeam: 'Argentina',
    awayTeam: 'France',
    scoreHome: 2,
    scoreAway: 1,
    status: 'live' as const,
    minute: 72,
    recentEvent: 'NONE'
  };

  const updates: Partial<Event> = { id: eventId };
  if (minute !== undefined) updates.minute = minute;
  if (recentEvent !== undefined) updates.recentEvent = recentEvent;
  if (score !== undefined) {
    const match = score.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      updates.scoreHome = parseInt(match[1]);
      updates.scoreAway = parseInt(match[2]);
    }
  }

  const saved = await saveEvent({ ...existing, ...updates });

  return {
    eventId: saved.id,
    score: `${saved.homeTeam} ${saved.scoreHome || 0} - ${saved.scoreAway || 0} ${saved.awayTeam}`,
    minute: saved.minute || 0,
    recentEvent: saved.recentEvent || 'NONE'
  };
}

// ── Ticket Tiers Store ──────────────────────────────────────────────────────

const TIERS_FILE = path.join(process.cwd(), 'ticket_tiers.json');

let eventTiersStore: Record<string, SeatTier[]> = {};

// Initialize eventTiersStore from local persistent file
try {
  if (fs.existsSync(TIERS_FILE)) {
    const fileData = fs.readFileSync(TIERS_FILE, 'utf8');
    eventTiersStore = JSON.parse(fileData);
    console.log("💾 Loaded ticket tiers from local persistent storage");
  }
} catch (err) {
  console.warn("⚠️ Failed to load ticket tiers from local persistent storage:", err);
}

export function setEventTiers(eventId: string, tiers: SeatTier[]) {
  eventTiersStore[eventId] = tiers;
  console.log(`🎫 Saved ${tiers.length} custom ticket tiers for event ${eventId}`);
  try {
    fs.writeFileSync(TIERS_FILE, JSON.stringify(eventTiersStore, null, 2), 'utf8');
    console.log("💾 Persisted ticket tiers to local storage");
  } catch (err) {
    console.error("❌ Failed to persist ticket tiers to local storage:", err);
  }
}

export function getEventTiers(eventId: string): SeatTier[] | undefined {
  return eventTiersStore[eventId];
}
