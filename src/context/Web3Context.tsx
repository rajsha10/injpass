import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

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
  ticketEventId: string;
  isCheckedIn: boolean;
  isVictoryEdition: boolean;
  setTicketPurchased: (tokenId: string, seat: number) => void;
  setCheckedIn: () => void;
  setVictoryEdition: () => void;
  refreshBalances: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const Web3Context = createContext<Web3ContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [injBalance, setInjBalance] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Ticket NFT state (loaded dynamically from database)
  const [ticketTokenId, setTicketTokenId] = useState<string | null>(null);
  const [ticketSeat, setTicketSeat] = useState<number | null>(null);
  const [isCheckedIn, setIsCheckedInState] = useState<boolean>(false);
  const [isVictoryEdition, setIsVictoryEditionState] = useState<boolean>(false);
  const ticketEventId = 'WC2026-FIN';

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
        fetch('http://localhost:3000/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: userAddress,
            username: `fan_${userAddress.slice(2, 8)}`,
            selectedTeam: 'Argentina'
          })
        }).catch(err => console.error("Failed to register user profile:", err));

        // Fetch ticket from Supabase via backend API
        try {
          const res = await fetch(`http://localhost:3000/api/tickets?ownerAddress=${userAddress}`);
          const data = await res.json();
          if (data.success && data.ticket) {
            setTicketTokenId(data.ticket.tokenId);
            setTicketSeat(data.ticket.seat);
            setIsCheckedInState(data.ticket.isCheckedIn);
            setIsVictoryEditionState(data.ticket.isVictoryEdition);
          } else {
            setTicketTokenId(null);
            setTicketSeat(null);
            setIsCheckedInState(false);
            setIsVictoryEditionState(false);
          }
        } catch (dbErr) {
          console.warn('DB ticket fetch error, defaulting:', dbErr);
          setTicketTokenId(null);
          setTicketSeat(null);
        }
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
    setTicketTokenId(null);
    setTicketSeat(null);
    setIsCheckedInState(false);
    setIsVictoryEditionState(false);
  }, []);

  const setTicketPurchased = useCallback((tokenId: string, seat: number) => {
    setTicketTokenId(tokenId);
    setTicketSeat(seat);
    refreshBalances();
  }, [refreshBalances]);

  const setCheckedIn = useCallback(() => {
    setIsCheckedInState(true);
    // Synced upon scan on the backend `/api/validator/scan`
  }, []);

  const setVictoryEdition = useCallback(() => {
    setIsVictoryEditionState(true);
    if (ticketTokenId) {
      fetch('http://localhost:3000/api/tickets/sync-victory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: ticketTokenId })
      }).catch(err => console.error("Failed to sync victory ticket state to DB:", err));
    }
  }, [ticketTokenId]);

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