import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { validateGateEntryOnChain } from './agent/validator.js';
import {
  getLiveMatchState,
  updateLiveMatchState,
  getTicketByOwner,
  saveTicket,
  updateTicketCheckIn,
  upgradeTicketToVictory,
  upgradeAllTicketsToVictory,
  checkDbConnection,
  getUserByWallet,
  saveUser,
  getEvents,
  getEventById,
  saveEvent,
  upgradeWinningTicketsToVictory,
  setEventTiers
} from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

export interface x402ExpressOptions {
  amount?: number | string;
  receivingAddress?: string;
  network?: string;
}

// x402 middleware wrapper: Configures dynamic entry ticket paywall
export function x402Express(options: x402ExpressOptions = {}) {
  const receivingAddress = options.receivingAddress || process.env.WALLET_ADDRESS || "0x0000000000000000000000000000000000000000";
  const network = (options.network || "eip155:84532") as "eip155:84532";

  const facilitatorClient = new HTTPFacilitatorClient({
    url: "https://x402.org/facilitator"
  });

  const resourceServer = new x402ResourceServer(facilitatorClient);
  resourceServer.register(network, new ExactEvmScheme());

  const routes = {
    "GET /api/ticket/secure-proof": {
      accepts: {
        scheme: "exact",
        price: "$0.01",
        network: network,
        payTo: receivingAddress,
        maxTimeoutSeconds: 60,
      },
      description: "Dynamic Secure Gate Entry Proof Token Generation",
    },
    "GET /api/ticket/generate-proof": {
      accepts: {
        scheme: "exact",
        price: "$0.01",
        network: network,
        payTo: receivingAddress,
        maxTimeoutSeconds: 60,
      },
      description: "Dynamic Secure Gate Entry Proof Token Generation",
    },
  };

  return paymentMiddleware(routes, resourceServer);
}

// x402 Middleware: Charging $0.01 USDC per dynamic gate-pass validation look up
const gatePaywall = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization === 'Bearer MOCK_x402_PAYMENT_TOKEN') {
    return next();
  }
  return x402Express({
    amount: "$0.01", 
    receivingAddress: process.env.WALLET_ADDRESS
  })(req, res, next);
};

/**
 * 1. x402 Gated Gate Pass Generation
 * Front-end requests this to refresh the turnstile QR code every 15 seconds
 */
app.get('/api/ticket/secure-proof', gatePaywall, async (req: Request, res: Response) => {
  const { tokenId, ownerAddress, ticketId, userAddress } = req.query;

  const activeTokenId = tokenId || ticketId;
  const activeAddress = ownerAddress || userAddress;

  if (!activeTokenId || !activeAddress) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Generate an un-forgeable token containing an expiration window
  const timeWindow = Math.floor(Date.now() / 15000); // 15s rotating window
  const secret = process.env.JWT_SECRET || "inj-secret-key";
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(`${activeTokenId}-${activeAddress}-${timeWindow}`)
    .digest('hex');

  try {
    const matchState = await getLiveMatchState();
    res.json({
      success: true,
      tokenId: activeTokenId,
      proofToken: hash,
      expiresIn: 15,
      matchContext: matchState.score // Pass current live scores alongside proof metadata
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate proof", details: err.message || String(err) });
  }
});

/**
 * Legacy/alias endpoint for ticket generate proof
 */
app.get('/api/ticket/generate-proof', gatePaywall, (req: Request, res: Response) => {
  const { ticketId, userAddress, tokenId, ownerAddress } = req.query;
  const activeTokenId = ticketId || tokenId;
  const activeAddress = userAddress || ownerAddress;

  const dynamicTimestamp = Math.floor(Date.now() / 15000);
  const secureGateToken = Buffer.from(`${activeTokenId}-${activeAddress}-${dynamicTimestamp}`).toString('base64');

  res.json({
    success: true,
    ticketId: activeTokenId,
    gateToken: secureGateToken,
    expiresInSeconds: 15
  });
});

/**
 * 2. Fan Engagement Endpoint
 * Autonomous agent polls this to look for triggers (e.g., goals scored)
 */
app.get('/api/events/live-feed', async (req: Request, res: Response) => {
  try {
    const matchState = await getLiveMatchState();
    res.json(matchState);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch live feed", details: err.message || String(err) });
  }
});

// Admin endpoint to simulate match actions for your demo video / event panel
app.post('/api/admin/simulate-trigger', async (req: Request, res: Response) => {
  const { eventType, recentEvent, score, minute, eventId, winnerTeam } = req.body;
  const activeEventId = eventId || "WC2026-FIN";

  try {
    const updatedState = await updateLiveMatchState(
      activeEventId,
      score,
      minute !== undefined && !isNaN(Number(minute)) ? Number(minute) : undefined,
      eventType || recentEvent
    );

    if (winnerTeam) {
      const event = await getEventById(activeEventId);
      if (event) {
        event.winnerTeam = winnerTeam;
        await saveEvent(event);
      }
    }

    // If MATCH_END_WIN is triggered, bulk upgrade winning team's ticket NFTs to Golden/Victory edition
    if (updatedState.recentEvent === 'MATCH_END_WIN') {
      const activeWinner = winnerTeam || "Argentina";
      await upgradeWinningTicketsToVictory(updatedState.eventId, activeWinner);
    }
    
    res.json({
      success: true,
      message: `Simulated event: ${updatedState.recentEvent}`,
      state: updatedState
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to simulate trigger", details: err.message || String(err) });
  }
});

/**
 * 3. Turnstile Gate Agent Validation Endpoint
 * Receives live scanned tokenId from turnstiles/frontend and executes contract.validateGateEntry(tokenId) on-chain
 */
app.post('/api/validator/scan', async (req: Request, res: Response) => {
  const { tokenId } = req.body;
  if (!tokenId) {
    return res.status(400).json({ error: "Missing scanned tokenId parameter" });
  }

  try {
    const result = await validateGateEntryOnChain(tokenId);
    
    // Persist turnstile scanned state in Supabase DB
    await updateTicketCheckIn(tokenId.toString(), true);

    return res.json(result);
  } catch (err: any) {
    console.error("❌ On-chain turnstile gate validation failed:", err.message || err);
    return res.status(500).json({
      error: "On-chain gate validation failed",
      details: err.message || String(err),
    });
  }
});

// ── DB Connection / Health Check Endpoint ───────────────────────────────────

app.get('/api/db-check', async (req: Request, res: Response) => {
  try {
    const status = await checkDbConnection();
    if (!status.connected && status.mode === 'supabase') {
      return res.status(500).json({ success: false, ...status });
    }
    return res.json({ success: true, ...status });
  } catch (err: any) {
    return res.status(500).json({ success: false, connected: false, error: err.message || String(err) });
  }
});

// ── User Management Endpoints ───────────────────────────────────────────────

app.get('/api/users/:walletAddress', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;
  try {
    const user = await getUserByWallet(String(walletAddress));
    if (!user) {
      return res.status(404).json({ success: false, error: "User profile not found" });
    }
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.post('/api/users', async (req: Request, res: Response) => {
  const { walletAddress, username, email, selectedTeam } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ success: false, error: "Missing required walletAddress parameter" });
  }
  try {
    const saved = await saveUser({ walletAddress, username, email, selectedTeam });
    return res.json({ success: true, user: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// ── Event Management Endpoints ──────────────────────────────────────────────

app.get('/api/events', async (req: Request, res: Response) => {
  try {
    const events = await getEvents();
    return res.json({ success: true, events });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.post('/api/events', async (req: Request, res: Response) => {
  const { id, name, homeTeam, awayTeam, scoreHome, scoreAway, status, minute, recentEvent, winnerTeam, scheduledAt } = req.body;
  if (!id || !name || !homeTeam || !awayTeam) {
    return res.status(400).json({ success: false, error: "Missing required event fields (id, name, homeTeam, awayTeam)" });
  }
  try {
    const saved = await saveEvent({
      id,
      name,
      homeTeam,
      awayTeam,
      scoreHome: scoreHome !== undefined ? Number(scoreHome) : 0,
      scoreAway: scoreAway !== undefined ? Number(scoreAway) : 0,
      status: status || 'scheduled',
      minute: minute !== undefined ? Number(minute) : 0,
      recentEvent: recentEvent || 'NONE',
      winnerTeam,
      scheduledAt
    });
    return res.json({ success: true, event: saved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.post('/api/events/tiers', async (req: Request, res: Response) => {
  const { eventId, tiers } = req.body;
  if (!eventId || !tiers || !Array.isArray(tiers)) {
    return res.status(400).json({ success: false, error: "Missing required parameters (eventId, tiers as array)" });
  }

  try {
    setEventTiers(eventId, tiers);
    return res.json({ success: true, message: `Successfully saved ${tiers.length} ticket tiers for event ${eventId}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// ── Ticket / NFT Endpoints ──────────────────────────────────────────────────

app.get('/api/tickets', async (req: Request, res: Response) => {
  const { ownerAddress } = req.query;
  if (!ownerAddress) {
    return res.status(400).json({ error: "Missing ownerAddress parameter" });
  }

  try {
    const ticket = await getTicketByOwner(ownerAddress.toString());
    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch ticket", details: err.message || String(err) });
  }
});

app.post('/api/tickets/purchase', async (req: Request, res: Response) => {
  const { tokenId, seat, ownerAddress, eventId, selectedTeam, nftHash, txHash } = req.body;
  if (!tokenId || seat === undefined || !ownerAddress) {
    return res.status(400).json({ error: "Missing required parameters (tokenId, seat, ownerAddress)" });
  }

  try {
    const ticket = await saveTicket(
      tokenId.toString(),
      Number(seat),
      ownerAddress.toString(),
      eventId,
      selectedTeam,
      nftHash,
      txHash
    );
    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to purchase ticket", details: err.message || String(err) });
  }
});

app.post('/api/tickets/sync-victory', async (req: Request, res: Response) => {
  const { tokenId, goldenNftHash } = req.body;
  if (!tokenId) {
    return res.status(400).json({ error: "Missing tokenId parameter" });
  }

  try {
    const ticket = await upgradeTicketToVictory(tokenId.toString(), goldenNftHash);
    res.json({ success: true, ticket });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to sync victory ticket state", details: err.message || String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 InjPass Ticketing Backend Operational on Port ${PORT}`));
