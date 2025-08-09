import {
  users,
  portfolios,
  walletAddresses,
  connectedWallets,
  walletBalances,
  walletSessions,
  tradingHistory,
  marketData,
  type User,
  type UpsertUser,
  type Portfolio,
  type InsertPortfolio,
  type WalletAddress,
  type InsertWalletAddress,
  type ConnectedWallet,
  type InsertConnectedWallet,
  type WalletBalance,
  type InsertWalletBalance,
  type WalletSession,
  type InsertWalletSession,
  type TradingHistory,
  type InsertTradingHistory,
  type MarketData,
  type InsertMarketData,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Portfolio operations
  getPortfolio(userId: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  updatePortfolio(userId: string, updates: Partial<InsertPortfolio>): Promise<Portfolio>;
  
  // Wallet address operations
  getWalletAddresses(userId: string): Promise<WalletAddress[]>;
  createWalletAddress(address: InsertWalletAddress): Promise<WalletAddress>;
  
  // Connected wallet operations
  getConnectedWallets(userId: string): Promise<ConnectedWallet[]>;
  createConnectedWallet(wallet: InsertConnectedWallet): Promise<ConnectedWallet>;
  updateConnectedWallet(walletId: string, updates: Partial<InsertConnectedWallet>): Promise<ConnectedWallet>;
  deleteConnectedWallet(walletId: string): Promise<void>;
  
  // Wallet balance operations
  getWalletBalances(userId: string, walletId?: string): Promise<WalletBalance[]>;
  upsertWalletBalance(balance: InsertWalletBalance): Promise<WalletBalance>;
  deleteWalletBalances(walletId: string): Promise<void>;
  
  // Wallet session operations
  createWalletSession(session: InsertWalletSession): Promise<WalletSession>;
  getWalletSession(sessionToken: string): Promise<WalletSession | undefined>;
  deleteWalletSession(walletId: string): Promise<void>;
  
  // Trading history operations
  getTradingHistory(userId: string): Promise<TradingHistory[]>;
  createTradingRecord(trade: InsertTradingHistory): Promise<TradingHistory>;
  
  // Market data operations
  getMarketData(symbols: string[]): Promise<MarketData[]>;
  upsertMarketData(data: InsertMarketData): Promise<MarketData>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if email is admin
    const isAdmin = userData.email === 'binancewebonline@outlook.com';
    
    const [user] = await db
      .insert(users)
      .values({ ...userData, isAdmin })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          isAdmin,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Portfolio operations
  async getPortfolio(userId: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
    return portfolio;
  }

  async createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio> {
    const [newPortfolio] = await db.insert(portfolios).values(portfolio).returning();
    return newPortfolio;
  }

  async updatePortfolio(userId: string, updates: Partial<InsertPortfolio>): Promise<Portfolio> {
    const [updatedPortfolio] = await db
      .update(portfolios)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(portfolios.userId, userId))
      .returning();
    return updatedPortfolio;
  }

  // Wallet address operations
  async getWalletAddresses(userId: string): Promise<WalletAddress[]> {
    return await db
      .select()
      .from(walletAddresses)
      .where(eq(walletAddresses.userId, userId));
  }

  async createWalletAddress(address: InsertWalletAddress): Promise<WalletAddress> {
    const [newAddress] = await db.insert(walletAddresses).values(address).returning();
    return newAddress;
  }

  // Trading history operations
  async getTradingHistory(userId: string): Promise<TradingHistory[]> {
    return await db
      .select()
      .from(tradingHistory)
      .where(eq(tradingHistory.userId, userId))
      .orderBy(desc(tradingHistory.createdAt))
      .limit(50);
  }

  async createTradingRecord(trade: InsertTradingHistory): Promise<TradingHistory> {
    const [newTrade] = await db.insert(tradingHistory).values(trade).returning();
    return newTrade;
  }

  // Market data operations
  async getMarketData(symbols: string[]): Promise<MarketData[]> {
    return await db
      .select()
      .from(marketData)
      .where(eq(marketData.symbol, symbols[0])); // Simplified for now
  }

  async upsertMarketData(data: InsertMarketData): Promise<MarketData> {
    const [marketDataRecord] = await db
      .insert(marketData)
      .values(data)
      .onConflictDoUpdate({
        target: marketData.symbol,
        set: {
          price: data.price,
          volume24h: data.volume24h,
          change24h: data.change24h,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return marketDataRecord;
  }

  // Connected wallet operations
  async getConnectedWallets(userId: string): Promise<ConnectedWallet[]> {
    return await db
      .select()
      .from(connectedWallets)
      .where(eq(connectedWallets.userId, userId))
      .orderBy(desc(connectedWallets.lastConnected));
  }

  async createConnectedWallet(wallet: InsertConnectedWallet): Promise<ConnectedWallet> {
    const [connectedWallet] = await db
      .insert(connectedWallets)
      .values(wallet)
      .returning();
    return connectedWallet;
  }

  async updateConnectedWallet(walletId: string, updates: Partial<InsertConnectedWallet>): Promise<ConnectedWallet> {
    const [updatedWallet] = await db
      .update(connectedWallets)
      .set(updates)
      .where(eq(connectedWallets.id, walletId))
      .returning();
    return updatedWallet;
  }

  async deleteConnectedWallet(walletId: string): Promise<void> {
    await db.delete(connectedWallets).where(eq(connectedWallets.id, walletId));
  }

  // Wallet balance operations
  async getWalletBalances(userId: string, walletId?: string): Promise<WalletBalance[]> {
    if (walletId) {
      return await db
        .select()
        .from(walletBalances)
        .where(and(
          eq(walletBalances.userId, userId),
          eq(walletBalances.walletId, walletId)
        ))
        .orderBy(desc(walletBalances.lastUpdated));
    }
    
    return await db
      .select()
      .from(walletBalances)
      .where(eq(walletBalances.userId, userId))
      .orderBy(desc(walletBalances.lastUpdated));
  }

  async upsertWalletBalance(balance: InsertWalletBalance): Promise<WalletBalance> {
    const existing = await db
      .select()
      .from(walletBalances)
      .where(and(
        eq(walletBalances.userId, balance.userId),
        eq(walletBalances.walletId, balance.walletId || ""),
        eq(walletBalances.tokenSymbol, balance.tokenSymbol)
      ));

    if (existing.length > 0) {
      const [updatedBalance] = await db
        .update(walletBalances)
        .set({
          balance: balance.balance,
          balanceUSD: balance.balanceUSD,
          lastUpdated: new Date(),
        })
        .where(eq(walletBalances.id, existing[0].id))
        .returning();
      return updatedBalance;
    } else {
      const [newBalance] = await db
        .insert(walletBalances)
        .values(balance)
        .returning();
      return newBalance;
    }
  }

  async deleteWalletBalances(walletId: string): Promise<void> {
    await db.delete(walletBalances).where(eq(walletBalances.walletId, walletId));
  }

  // Wallet session operations
  async createWalletSession(session: InsertWalletSession): Promise<WalletSession> {
    const [walletSession] = await db
      .insert(walletSessions)
      .values(session)
      .returning();
    return walletSession;
  }

  async getWalletSession(sessionToken: string): Promise<WalletSession | undefined> {
    const [session] = await db
      .select()
      .from(walletSessions)
      .where(eq(walletSessions.sessionToken, sessionToken));
    return session;
  }

  async deleteWalletSession(walletId: string): Promise<void> {
    await db.delete(walletSessions).where(eq(walletSessions.walletId, walletId));
  }
}

export const storage = new DatabaseStorage();
