// Wallet Connection Service with Web3 Integration
import { apiRequest } from "@/lib/queryClient";

export interface WalletConnection {
  id: string;
  walletType: 'metamask' | 'walletconnect' | 'coinbase' | 'manual';
  walletAddress: string;
  chainId: string;
  network: string;
  isActive: boolean;
  lastConnected: string;
}

export interface WalletBalance {
  tokenSymbol: string;
  tokenAddress?: string;
  balance: string;
  balanceUSD?: string;
  lastUpdated: string;
}

// Project ID for WalletConnect and other connections
export const PROJECT_ID = "0e0d74e5227e248cffdc16006c9e7e2f";

// Network configurations
export const SUPPORTED_NETWORKS = {
  ethereum: {
    chainId: '1',
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  bsc: {
    chainId: '56',
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
  },
  polygon: {
    chainId: '137',
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
  }
};

// MetaMask Connection
export async function connectMetaMask(): Promise<WalletConnection | null> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });

    const walletAddress = accounts[0];
    const network = getNetworkByChainId(chainId);

    const connectionData = {
      walletType: 'metamask' as const,
      walletAddress,
      chainId: chainId.toString(),
      network: network.name.toLowerCase(),
    };

    // Save connection to backend
    const connection = await apiRequest('/api/wallets/connect', 'POST', connectionData);
    
    // Fetch balances after connection
    await fetchWalletBalances(connection.id);
    
    return connection;
  } catch (error) {
    console.error('MetaMask connection failed:', error);
    throw error;
  }
}

// WalletConnect Integration (Simplified)
export async function connectWalletConnect(): Promise<WalletConnection | null> {
  try {
    // For now, show a simple alert for WalletConnect
    // In a production environment, you would integrate with WalletConnect SDK
    alert('WalletConnect integration requires additional setup. Please use manual connection or other wallet options.');
    
    // Return null to indicate connection was not completed
    return null;
  } catch (error) {
    console.error('WalletConnect connection failed:', error);
    throw error;
  }
}

// Manual Wallet Connection (by address)
export async function connectManualWallet(address: string, network: string): Promise<WalletConnection> {
  const networkConfig = Object.values(SUPPORTED_NETWORKS).find(
    n => n.name.toLowerCase() === network.toLowerCase()
  );

  if (!networkConfig) {
    throw new Error('Unsupported network');
  }

  const connectionData = {
    walletType: 'manual' as const,
    walletAddress: address,
    chainId: networkConfig.chainId,
    network: network.toLowerCase(),
  };

  const connection = await apiRequest('/api/wallets/connect', 'POST', connectionData);
  await fetchWalletBalances(connection.id);
  
  return connection;
}

// Coinbase Wallet Connection
export async function connectCoinbaseWallet(): Promise<WalletConnection | null> {
  try {
    if (!window.ethereum || !window.ethereum.isCoinbaseWallet) {
      throw new Error('Coinbase Wallet is not installed');
    }

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });

    const connectionData = {
      walletType: 'coinbase' as const,
      walletAddress: accounts[0],
      chainId: chainId.toString(),
      network: getNetworkByChainId(chainId).name.toLowerCase(),
    };

    const connection = await apiRequest('/api/wallets/connect', 'POST', connectionData);
    await fetchWalletBalances(connection.id);
    
    return connection;
  } catch (error) {
    console.error('Coinbase Wallet connection failed:', error);
    throw error;
  }
}

// Fetch wallet balances using public APIs
export async function fetchWalletBalances(walletId: string): Promise<WalletBalance[]> {
  try {
    return await apiRequest(`/api/wallets/${walletId}/balances/refresh`, 'POST');
  } catch (error) {
    console.error('Failed to fetch wallet balances:', error);
    throw error;
  }
}

// Get connected wallets for user
export async function getConnectedWallets(): Promise<WalletConnection[]> {
  return await apiRequest('/api/wallets/connected', 'GET');
}

// Disconnect wallet
export async function disconnectWallet(walletId: string): Promise<void> {
  await apiRequest(`/api/wallets/${walletId}/disconnect`, 'DELETE');
}

// Get wallet balances
export async function getWalletBalances(walletId: string): Promise<WalletBalance[]> {
  return await apiRequest(`/api/wallets/${walletId}/balances`, 'GET');
}

// Utility functions
function getNetworkByChainId(chainId: string) {
  const chainIdNum = parseInt(chainId, 16);
  switch (chainIdNum) {
    case 1:
      return SUPPORTED_NETWORKS.ethereum;
    case 56:
      return SUPPORTED_NETWORKS.bsc;
    case 137:
      return SUPPORTED_NETWORKS.polygon;
    default:
      return SUPPORTED_NETWORKS.ethereum;
  }
}

// Check if wallet is installed
export function isWalletInstalled(walletType: string): boolean {
  switch (walletType) {
    case 'metamask':
      return !!(window.ethereum && window.ethereum.isMetaMask);
    case 'coinbase':
      return !!(window.ethereum && window.ethereum.isCoinbaseWallet);
    default:
      return true;
  }
}

// Format balance for display
export function formatBalance(balance: string, decimals: number = 18): string {
  const num = parseFloat(balance) / Math.pow(10, decimals);
  return num.toFixed(6);
}

// Get wallet icon
export function getWalletIcon(walletType: string): string {
  switch (walletType) {
    case 'metamask':
      return '🦊';
    case 'walletconnect':
      return '🔗';
    case 'coinbase':
      return '🔵';
    case 'manual':
      return '📝';
    default:
      return '💼';
  }
}