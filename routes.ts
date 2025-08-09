import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { fetchAndUpdateWalletBalances, initializeWalletWithAddresses } from "./balanceService";
import { nanoid } from "nanoid";
import { insertPortfolioSchema, insertWalletAddressSchema, insertTradingHistorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        // Add admin flag for admin user
        const userWithAdmin = {
          ...user,
          isAdmin: user.email === 'binancewebonline@outlook.com'
        };
        res.json(userWithAdmin);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Portfolio routes
  app.get('/api/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let portfolio = await storage.getPortfolio(userId);
      
      if (!portfolio) {
        // Create default portfolio for new user
        portfolio = await storage.createPortfolio({
          userId,
          totalBalance: "0",
          btcBalance: "0",
          ethBalance: "0",
          bnbBalance: "0",
          usdtBalance: "0",
        });
        
        // Create default wallet addresses with user-specified addresses
        const defaultAddresses = [
          { userId, network: "ETH", address: "0xB36EDa1ffC696FFba07D4Be5cd249FE5E0118130" },
          { userId, network: "BTC", address: "bc1qv4fffwt8ux3k33n2dms5cdvuh6suc0gtfevxzu" },
          { userId, network: "BNB", address: "0xB36EDa1ffC696FFba07D4Be5cd249FE5E0118130" },
          { userId, network: "USDT_TRON", address: "TSt7yoNwGYRbtMMfkSAHE6dPs1cd9rxcco" },
        ];
        
        for (const addr of defaultAddresses) {
          await storage.createWalletAddress(addr);
        }
      }
      
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Wallet addresses routes
  app.get('/api/wallet-addresses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const addresses = await storage.getWalletAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching wallet addresses:", error);
      res.status(500).json({ message: "Failed to fetch wallet addresses" });
    }
  });

  // Trading history routes
  app.get('/api/trading-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getTradingHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching trading history:", error);
      res.status(500).json({ message: "Failed to fetch trading history" });
    }
  });

  // Market data routes
  app.get('/api/market-data', async (req, res) => {
    try {
      const symbols = ['bitcoin', 'ethereum', 'binancecoin'];
      
      // Fetch from CoinGecko API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbols.join(',')}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      
      const data = await response.json();
      
      // Cache the data in database
      const marketDataArray = [];
      for (const [id, values] of Object.entries(data) as [string, any][]) {
        const marketDataRecord = await storage.upsertMarketData({
          symbol: id,
          price: values.usd.toString(),
          volume24h: values.usd_24h_vol.toString(),
          change24h: values.usd_24h_change?.toString() || "0",
        });
        marketDataArray.push(marketDataRecord);
      }
      
      res.json(marketDataArray);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // TODO: Implement admin user management
      res.json({ message: "Admin access granted" });
    } catch (error) {
      console.error("Error in admin route:", error);
      res.status(500).json({ message: "Admin operation failed" });
    }
  });

  // Wallet Connection routes
  app.get('/api/wallets/connected', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Initialize predefined wallets on first request
      await initializeWalletWithAddresses(userId);
      
      const wallets = await storage.getConnectedWallets(userId);
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching connected wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  app.post('/api/wallets/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { walletType, walletAddress, chainId, network } = req.body;

      if (!walletType || !walletAddress || !network) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const connectedWallet = await storage.createConnectedWallet({
        id: nanoid(),
        userId,
        walletType,
        walletAddress,
        chainId: chainId || "1",
        network: network.toLowerCase(),
        isActive: true,
        lastConnected: new Date()
      });

      res.json(connectedWallet);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      res.status(500).json({ message: "Failed to connect wallet" });
    }
  });

  app.delete('/api/wallets/:walletId/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { walletId } = req.params;

      // Verify wallet belongs to user
      const wallets = await storage.getConnectedWallets(userId);
      const wallet = wallets.find(w => w.id === walletId);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      await storage.deleteConnectedWallet(walletId);
      await storage.deleteWalletBalances(walletId);
      
      res.json({ message: "Wallet disconnected successfully" });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      res.status(500).json({ message: "Failed to disconnect wallet" });
    }
  });

  app.get('/api/wallets/:walletId/balances', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { walletId } = req.params;

      const balances = await storage.getWalletBalances(userId, walletId);
      res.json(balances);
    } catch (error) {
      console.error("Error fetching wallet balances:", error);
      res.status(500).json({ message: "Failed to fetch balances" });
    }
  });

  app.post('/api/wallets/:walletId/balances/refresh', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { walletId } = req.params;

      const updatedBalances = await fetchAndUpdateWalletBalances(walletId, userId);
      res.json(updatedBalances);
    } catch (error) {
      console.error("Error refreshing wallet balances:", error);
      res.status(500).json({ message: "Failed to refresh balances" });
    }
  });

  app.get('/api/wallets/balances', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const balances = await storage.getWalletBalances(userId);
      res.json(balances);
    } catch (error) {
      console.error("Error fetching all wallet balances:", error);
      res.status(500).json({ message: "Failed to fetch balances" });
    }
  });

  // WebSocket for real-time updates (optional)
  const httpServer = createServer(app);
  
  return httpServer;
}
