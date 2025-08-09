import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  decimal,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Portfolio table for user balances
export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  totalBalance: decimal("total_balance", { precision: 20, scale: 8 }).default("0"),
  btcBalance: decimal("btc_balance", { precision: 20, scale: 8 }).default("0"),
  ethBalance: decimal("eth_balance", { precision: 20, scale: 8 }).default("0"),
  bnbBalance: decimal("bnb_balance", { precision: 20, scale: 8 }).default("0"),
  usdtBalance: decimal("usdt_balance", { precision: 20, scale: 8 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wallet addresses table
export const walletAddresses = pgTable("wallet_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  network: varchar("network").notNull(), // ETH, BTC, BNB, USDT_TRON
  address: text("address").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trading history table
export const tradingHistory = pgTable("trading_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  walletId: varchar("wallet_id").references(() => connectedWallets.id),
  pair: varchar("pair").notNull(), // BTC/USDT, ETH/USDT, etc.
  type: varchar("type").notNull(), // buy, sell, swap
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  total: decimal("total", { precision: 20, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 20, scale: 8 }).default("0"),
  txHash: varchar("tx_hash"), // blockchain transaction hash
  status: varchar("status").default("completed"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Connected wallets (external wallet connections)
export const connectedWallets = pgTable("connected_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  walletType: varchar("wallet_type").notNull(), // metamask, walletconnect, coinbase, etc.
  walletAddress: varchar("wallet_address").notNull(),
  chainId: varchar("chain_id").notNull(), // 1 (ETH), 56 (BSC), etc.
  network: varchar("network").notNull(), // ethereum, bsc, polygon, etc.
  isActive: boolean("is_active").default(true),
  lastConnected: timestamp("last_connected").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallet balances (real-time balances from connected wallets)
export const walletBalances = pgTable("wallet_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  walletId: varchar("wallet_id").references(() => connectedWallets.id),
  tokenSymbol: varchar("token_symbol").notNull(), // BTC, ETH, BNB, USDT, etc.
  tokenAddress: varchar("token_address"), // contract address for ERC-20 tokens
  balance: decimal("balance", { precision: 30, scale: 18 }).notNull(),
  balanceUSD: decimal("balance_usd", { precision: 20, scale: 8 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Wallet connection sessions with project ID
export const walletSessions = pgTable("wallet_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  walletId: varchar("wallet_id").references(() => connectedWallets.id).notNull(),
  sessionToken: varchar("session_token").notNull(),
  projectId: varchar("project_id").default("0e0d74e5227e248cffdc16006c9e7e2f"),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Market data cache table
export const marketData = pgTable("market_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull().unique(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  volume24h: decimal("volume_24h", { precision: 20, scale: 2 }).notNull(),
  change24h: decimal("change_24h", { precision: 10, scale: 4 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect & {
  isAdmin?: boolean;
};

// Helper function to determine if user is admin
export const isAdminUser = (user: User): boolean => {
  return user.email === 'binancewebonline@outlook.com';
};
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;
export type WalletAddress = typeof walletAddresses.$inferSelect;
export type InsertWalletAddress = typeof walletAddresses.$inferInsert;
export type ConnectedWallet = typeof connectedWallets.$inferSelect;
export type InsertConnectedWallet = typeof connectedWallets.$inferInsert;
export type WalletBalance = typeof walletBalances.$inferSelect;
export type InsertWalletBalance = typeof walletBalances.$inferInsert;
export type WalletSession = typeof walletSessions.$inferSelect;
export type InsertWalletSession = typeof walletSessions.$inferInsert;
export type TradingHistory = typeof tradingHistory.$inferSelect;
export type InsertTradingHistory = typeof tradingHistory.$inferInsert;
export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = typeof marketData.$inferInsert;

export const insertPortfolioSchema = createInsertSchema(portfolios);
export const insertWalletAddressSchema = createInsertSchema(walletAddresses);
export const insertConnectedWalletSchema = createInsertSchema(connectedWallets);
export const insertWalletBalanceSchema = createInsertSchema(walletBalances);
export const insertWalletSessionSchema = createInsertSchema(walletSessions);
export const insertTradingHistorySchema = createInsertSchema(tradingHistory);
export const insertMarketDataSchema = createInsertSchema(marketData);
