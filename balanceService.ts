// External API service for fetching real wallet balances
import { storage } from "./storage";
import type { ConnectedWallet, InsertWalletBalance } from "@shared/schema";

// API endpoints for different networks
const API_ENDPOINTS = {
  ethereum: {
    etherscan: "https://api.etherscan.io/api",
    moralis: "https://deep-index.moralis.io/api/v2",
  },
  bsc: {
    bscscan: "https://api.bscscan.com/api",
    moralis: "https://deep-index.moralis.io/api/v2",
  },
  polygon: {
    polygonscan: "https://api.polygonscan.com/api",
    moralis: "https://deep-index.moralis.io/api/v2",
  },
  tron: {
    trongrid: "https://api.trongrid.io",
  }
};

// Token contract addresses for different networks
const TOKEN_CONTRACTS = {
  ethereum: {
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    USDC: "0xA0b86a33E6417C5BB1d1e91a064B1B8a9166B1b8",
    BNB: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
  },
  bsc: {
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    ETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
  },
  polygon: {
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    ETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
  }
};

// CoinGecko price API
const COINGECKO_API = "https://api.coingecko.com/api/v3";

// Get current token prices from CoinGecko
export async function getTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${symbols.join(',')}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const prices: Record<string, number> = {};
    
    // Map symbol IDs to prices
    const symbolMapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'MATIC': 'matic-network',
      'TRX': 'tron'
    };
    
    for (const [symbol, id] of Object.entries(symbolMapping)) {
      if (data[id] && data[id].usd) {
        prices[symbol] = data[id].usd;
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Failed to fetch token prices:', error);
    return {};
  }
}

// Fetch Ethereum/BSC/Polygon balance using public APIs
export async function fetchEVMBalance(address: string, network: string): Promise<any[]> {
  const balances: any[] = [];
  
  try {
    // Get native token balance (ETH, BNB, MATIC)
    const nativeBalance = await fetchNativeBalance(address, network);
    if (nativeBalance) {
      balances.push(nativeBalance);
    }
    
    // Get token balances
    const tokenBalances = await fetchTokenBalances(address, network);
    balances.push(...tokenBalances);
    
    return balances;
  } catch (error) {
    console.error(`Failed to fetch ${network} balances:`, error);
    return [];
  }
}

// Fetch native token balance (ETH, BNB, MATIC)
async function fetchNativeBalance(address: string, network: string): Promise<any | null> {
  const endpoints = API_ENDPOINTS[network as keyof typeof API_ENDPOINTS] as any;
  if (!endpoints) return null;
  
  try {
    // Using public RPC endpoints for native balance
    let apiUrl = '';
    let nativeSymbol = '';
    
    switch (network) {
      case 'ethereum':
        apiUrl = `${endpoints.etherscan}?module=account&action=balance&address=${address}&tag=latest`;
        nativeSymbol = 'ETH';
        break;
      case 'bsc':
        apiUrl = `${endpoints.bscscan}?module=account&action=balance&address=${address}&tag=latest`;
        nativeSymbol = 'BNB';
        break;
      case 'polygon':
        apiUrl = `${endpoints.polygonscan}?module=account&action=balance&address=${address}&tag=latest`;
        nativeSymbol = 'MATIC';
        break;
      default:
        return null;
    }
    
    const response = await fetch(apiUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.status === '1' && data.result) {
      const balance = (parseInt(data.result) / Math.pow(10, 18)).toString();
      return {
        tokenSymbol: nativeSymbol,
        balance: balance,
        tokenAddress: null
      };
    }
  } catch (error) {
    console.error(`Failed to fetch native balance for ${network}:`, error);
  }
  
  return null;
}

// Fetch ERC-20/BEP-20 token balances
async function fetchTokenBalances(address: string, network: string): Promise<any[]> {
  const balances: any[] = [];
  const tokens = TOKEN_CONTRACTS[network as keyof typeof TOKEN_CONTRACTS];
  
  if (!tokens) return balances;
  
  const endpoints = API_ENDPOINTS[network as keyof typeof API_ENDPOINTS] as any;
  if (!endpoints) return balances;
  
  try {
    for (const [symbol, contractAddress] of Object.entries(tokens)) {
      let apiUrl = '';
      
      switch (network) {
        case 'ethereum':
          apiUrl = `${endpoints.etherscan}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest`;
          break;
        case 'bsc':
          apiUrl = `${endpoints.bscscan}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest`;
          break;
        case 'polygon':
          apiUrl = `${endpoints.polygonscan}?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest`;
          break;
        default:
          continue;
      }
      
      const response = await fetch(apiUrl);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (data.status === '1' && data.result && data.result !== '0') {
        // Most tokens use 18 decimals, USDT/USDC use 6
        const decimals = (symbol === 'USDT' || symbol === 'USDC') ? 6 : 18;
        const balance = (parseInt(data.result) / Math.pow(10, decimals)).toString();
        
        balances.push({
          tokenSymbol: symbol,
          balance: balance,
          tokenAddress: contractAddress as string
        });
      }
    }
  } catch (error) {
    console.error(`Failed to fetch token balances for ${network}:`, error);
  }
  
  return balances;
}

// Fetch TRON balance using TronGrid API
export async function fetchTronBalance(address: string): Promise<any[]> {
  const balances: any[] = [];
  
  try {
    // Get TRX balance
    const accountResponse = await fetch(`${API_ENDPOINTS.tron.trongrid}/v1/accounts/${address}`);
    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      if (accountData.data && accountData.data.length > 0) {
        const account = accountData.data[0];
        const trxBalance = (account.balance || 0) / 1000000; // TRX has 6 decimals
        
        if (trxBalance > 0) {
          balances.push({
            tokenSymbol: 'TRX',
            balance: trxBalance.toString(),
            tokenAddress: null
          });
        }
      }
    }
    
    // Get USDT-TRC20 balance
    const usdtTrc20Address = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    const tokenResponse = await fetch(
      `${API_ENDPOINTS.tron.trongrid}/v1/accounts/${address}/tokens?type=trc20`
    );
    
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      if (tokenData.data) {
        for (const token of tokenData.data) {
          if (token.token_address === usdtTrc20Address) {
            const usdtBalance = parseInt(token.balance) / Math.pow(10, token.token_decimal);
            balances.push({
              tokenSymbol: 'USDT',
              balance: usdtBalance.toString(),
              tokenAddress: usdtTrc20Address
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch TRON balances:', error);
  }
  
  return balances;
}

// Main function to fetch and update wallet balances
export async function fetchAndUpdateWalletBalances(walletId: string, userId: string): Promise<any[]> {
  try {
    // Get wallet connection details
    const wallets = await storage.getConnectedWallets(userId);
    const wallet = wallets.find(w => w.id === walletId);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    
    let balances: any[] = [];
    
    // Fetch balances based on network
    switch (wallet.network) {
      case 'ethereum':
      case 'bsc':
      case 'polygon':
        balances = await fetchEVMBalance(wallet.walletAddress, wallet.network);
        break;
      case 'tron':
        balances = await fetchTronBalance(wallet.walletAddress);
        break;
      default:
        throw new Error(`Unsupported network: ${wallet.network}`);
    }
    
    // Get current token prices
    const symbols = balances.map(b => b.tokenSymbol).filter(Boolean);
    const prices = await getTokenPrices(symbols);
    
    // Save balances to database
    const savedBalances: any[] = [];
    for (const balance of balances) {
      const balanceUSD = prices[balance.tokenSymbol] 
        ? (parseFloat(balance.balance) * prices[balance.tokenSymbol]).toString()
        : undefined;
      
      const balanceData: InsertWalletBalance = {
        userId: userId,
        walletId: walletId,
        tokenSymbol: balance.tokenSymbol,
        tokenAddress: balance.tokenAddress,
        balance: balance.balance,
        balanceUSD: balanceUSD,
      };
      
      const savedBalance = await storage.upsertWalletBalance(balanceData);
      savedBalances.push(savedBalance);
    }
    
    return savedBalances;
  } catch (error) {
    console.error('Failed to fetch and update wallet balances:', error);
    throw error;
  }
}

// Initialize wallet with predefined addresses
export async function initializeWalletWithAddresses(userId: string): Promise<void> {
  try {
    // Predefined wallet addresses from user request
    const predefinedWallets = [
      {
        address: "0xB36EDa1ffC696FFba07D4Be5cd249FE5E0118130",
        network: "ethereum",
        walletType: "manual" as const,
        description: "ETH Wallet"
      },
      {
        address: "bc1qv4fffwt8ux3k33n2dms5cdvuh6suc0gtfevxzu",
        network: "bitcoin",
        walletType: "manual" as const,
        description: "BTC Wallet"
      },
      {
        address: "0xB36EDa1ffC696FFba07D4Be5cd249FE5E0118130",
        network: "bsc",
        walletType: "manual" as const,
        description: "BNB Wallet"
      },
      {
        address: "TSt7yoNwGYRbtMMfkSAHE6dPs1cd9rxcco",
        network: "tron",
        walletType: "manual" as const,
        description: "USDT-TRON Wallet"
      }
    ];
    
    // Check if user already has wallets connected
    const existingWallets = await storage.getConnectedWallets(userId);
    
    if (existingWallets.length === 0) {
      for (const wallet of predefinedWallets) {
        try {
          const connectedWallet = await storage.createConnectedWallet({
            userId: userId,
            walletType: wallet.walletType,
            walletAddress: wallet.address,
            chainId: "1", // Default chain ID
            network: wallet.network,
            isActive: true,
            lastConnected: new Date()
          });
          
          // Fetch initial balances for supported networks
          if (['ethereum', 'bsc', 'polygon', 'tron'].includes(wallet.network)) {
            await fetchAndUpdateWalletBalances(connectedWallet.id, userId);
          }
        } catch (error) {
          console.error(`Failed to initialize wallet ${wallet.address}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize predefined wallets:', error);
  }
}