import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ─── Injective EVM Testnet Network Configuration (Chain ID 1439) ───────────────
const INJECTIVE_INEVM_TESTNET = {
  chainId: '0x59F', // 1439 in hex
  chainName: 'Injective EVM Testnet',
  nativeCurrency: { name: 'Injective', symbol: 'INJ', decimals: 18 },
  rpcUrls: ['https://1439.rpc.thirdweb.com'],
  blockExplorerUrls: ['https://testnet.blockscout.injective.network/'],
};

async function switchToInjectiveNetwork(provider: any) {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: INJECTIVE_INEVM_TESTNET.chainId }],
    });
  } catch (switchError: any) {
    // Unrecognized chain (4902) -> add network to wallet
    if (switchError.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [INJECTIVE_INEVM_TESTNET],
      });
    }
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Ticket {
  tokenId: string;
  ownerAddress: string;
  seat: number;
  isCheckedIn: boolean;
  isVictoryEdition: boolean;
  eventId: string;
  nftHash?: string;
  goldenNftHash?: string;
  selectedTeam?: string;
  txHash?: string;
  createdAt?: string;
}

export interface Web3ContextValue {
  walletAddress: string | null;
  usdcBalance: number;
  injBalance: number;
  isConnecting: boolean;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  truncatedAddress: string;
  // Ticket state (set after purchase)
  ticketTokenId: string | null;
  ticketSeat: number | null;
  ticketEventId: string | null;
  isCheckedIn: boolean;
  isVictoryEdition: boolean;
  setTicketPurchased: (tokenId: string, seat: number, eventId: string) => void;
  setCheckedIn: () => void;
  setVictoryEdition: () => void;
  refreshBalances: () => Promise<void>;
  
  // Multiple tickets support
  tickets: Ticket[];
  activeTicket: Ticket | null;
  selectTicket: (tokenId: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const Web3Context = createContext<Web3ContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [injBalance, setInjBalance] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Multiple Ticket NFT state (loaded dynamically from database)
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  // Derived state for the active ticket
  const activeTicket = tickets.find(t => t.tokenId === activeTicketId) || null;

  const ticketTokenId = activeTicket ? activeTicket.tokenId : null;
  const ticketSeat = activeTicket ? activeTicket.seat : null;
  const ticketEventId = activeTicket ? activeTicket.eventId : null;
  const isCheckedIn = activeTicket ? activeTicket.isCheckedIn : false;
  const isVictoryEdition = activeTicket ? activeTicket.isVictoryEdition : false;

  const selectTicket = useCallback((tokenId: string) => {
    setActiveTicketId(tokenId);
  }, []);

  // Helper to fetch real balances from the chain
  const fetchBalances = useCallback(async (address: string) => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(ethereum);
      
      // Get Native INJ Balance
      const balance = await provider.getBalance(address);
      setInjBalance(parseFloat(ethers.formatEther(balance)));

      // Get USDC balance from the Injective Testnet USDC contract
      const usdcAbi = ["function balanceOf(address) view returns (uint256)"];
      const usdcContract = new ethers.Contract("0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d", usdcAbi, provider);
      try {
        const usdcBal = await usdcContract.balanceOf(address);
        setUsdcBalance(parseFloat(ethers.formatUnits(usdcBal, 6)));
      } catch (usdcErr) {
        console.warn("Failed to fetch real USDC balance, defaulting to 0:", usdcErr);
        setUsdcBalance(0);
      }
    } catch (err) {
      console.warn("Error fetching balances:", err);
    }
  }, []);

  const refreshBalances = useCallback(async () => {
    if (walletAddress) {
      await fetchBalances(walletAddress);
    }
  }, [walletAddress, fetchBalances]);

  // Real Web3 Wallet Connection (MetaMask / EIP-1193)
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);

    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        alert("MetaMask or another Web3 provider was not detected. Please install a Web3 wallet extension!");
        setIsConnecting(false);
        return;
      }

      // Request MetaMask account connection
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        // Automatically switch/add Injective inEVM Testnet
        try {
          await switchToInjectiveNetwork(ethereum);
        } catch (netErr) {
          console.warn('Network switch warning:', netErr);
        }

        const userAddress = accounts[0];
        setWalletAddress(userAddress);
        await fetchBalances(userAddress);

        // Register User profile in DB
        fetch(`${API_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: userAddress,
            username: `fan_${userAddress.slice(2, 8)}`,
            selectedTeam: 'Argentina'
          })
        }).catch(err => console.error("Failed to register user profile:", err));

        // Fetch tickets from Supabase via backend API
        try {
          const res = await fetch(`${API_URL}/api/tickets?ownerAddress=${userAddress}`);
          const data = await res.json();
          if (data.success && data.tickets && data.tickets.length > 0) {
            setTickets(data.tickets);
            setActiveTicketId(data.tickets[0].tokenId);
          } else if (data.success && data.ticket) {
            setTickets([data.ticket]);
            setActiveTicketId(data.ticket.tokenId);
          } else {
            setTickets([]);
            setActiveTicketId(null);
          }
        } catch (dbErr) {
          console.warn('DB ticket fetch error, defaulting:', dbErr);
          setTickets([]);
          setActiveTicketId(null);
        }
        localStorage.setItem('injpass_connected', 'true');
      }
    } catch (err: any) {
      console.error('MetaMask connection failed:', err);
      alert(`Connection failed: ${err.message || String(err)}`);
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalances]);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setUsdcBalance(0);
    setInjBalance(0);
    setTickets([]);
    setActiveTicketId(null);
    localStorage.removeItem('injpass_connected');
  }, []);

  const setTicketPurchased = useCallback((tokenId: string, seat: number, eventId: string) => {
    const newTicket: Ticket = {
      tokenId,
      seat,
      ownerAddress: walletAddress || '',
      eventId,
      isCheckedIn: false,
      isVictoryEdition: false,
    };
    setTickets(prev => [newTicket, ...prev]);
    setActiveTicketId(tokenId);
    refreshBalances();
  }, [walletAddress, refreshBalances]);

  const setCheckedIn = useCallback(() => {
    if (activeTicketId) {
      setTickets(prev => prev.map(t => t.tokenId === activeTicketId ? { ...t, isCheckedIn: true } : t));
    }
  }, [activeTicketId]);

  const setVictoryEdition = useCallback(() => {
    if (activeTicketId) {
      setTickets(prev => prev.map(t => t.tokenId === activeTicketId ? { ...t, isVictoryEdition: true } : t));
      fetch(`${API_URL}/api/tickets/sync-victory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: activeTicketId })
      }).catch(err => console.error("Failed to sync victory ticket state to DB:", err));
    }
  }, [activeTicketId]);

  // Handle wallet account switching automatically
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (ethereum && ethereum.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          disconnectWallet();
        }
      };
      ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [disconnectWallet]);

  useEffect(() => {
    const wasConnected = localStorage.getItem('injpass_connected');
    if (wasConnected === 'true') {
      connectWallet();
    }
  }, [connectWallet]);

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <Web3Context.Provider value={{
      walletAddress,
      usdcBalance,
      injBalance,
      isConnecting,
      isConnected: !!walletAddress,
      connectWallet,
      disconnectWallet,
      truncatedAddress,
      ticketTokenId,
      ticketSeat,
      ticketEventId,
      isCheckedIn,
      isVictoryEdition,
      setTicketPurchased,
      setCheckedIn,
      setVictoryEdition,
      refreshBalances,
      tickets,
      activeTicket,
      selectTicket,
    }}>
      {children}
    </Web3Context.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useWeb3(): Web3ContextValue {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 must be used inside <Web3Provider>');
  return ctx;
}