# Binance Wallet Web3 Application

## Overview

This is a full-stack web3 cryptocurrency wallet application inspired by Binance. It provides users with portfolio management, trading functionality, and real-time market data. The application features a dark-themed UI with modern design patterns and includes both web and PWA (Progressive Web App) capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/build tooling
- **UI Library**: Shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with custom Binance-themed color palette and dark mode support
- **State Management**: React Query (@tanstack/react-query) for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture  
- **Runtime**: Node.js with Express.js server
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless connection
- **Authentication**: Replit Auth integration with OpenID Connect
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple

### PWA Features
- **Service Worker**: Offline caching and background sync capabilities
- **Manifest**: Full PWA configuration with install prompts and shortcuts
- **Mobile Optimization**: Responsive design with mobile-first approach

### Database Schema Design
The application uses a relational schema with the following key entities:
- **Users**: Authentication and profile data (required for Replit Auth)
- **Sessions**: Session storage for authentication (required for Replit Auth)  
- **Portfolios**: User balance tracking across multiple cryptocurrencies
- **Wallet Addresses**: Multi-chain wallet address management
- **Trading History**: Transaction and trade record keeping
- **Market Data**: Real-time cryptocurrency price and volume data

### Key Features
- **Portfolio Management**: Multi-cryptocurrency balance tracking (BTC, ETH, BNB, USDT)
- **Trading Dashboard**: Buy/sell interface with trading history and advanced charting
- **TradingView Integration**: Live performance charts, market analysis, and technical indicators
- **Market Data**: Real-time price feeds and market statistics via CoinGecko API
- **Wallet Integration**: Support for multiple blockchain networks with specific deposit addresses
- **Web3 Wallet Connections**: MetaMask, WalletConnect, Coinbase Wallet, and manual address support
- **Real Balance Fetching**: Live balance updates from Ethereum, BSC, Polygon, and TRON networks
- **Admin Panel**: Administrative interface with user management
- **Real-time Updates**: Automatic data refresh and live price updates
- **Live Chat Support**: Integrated Smartsupp chat system for customer support

## External Dependencies

### Authentication & Infrastructure
- **Replit Auth**: Primary authentication provider using OpenID Connect
- **Neon Database**: Serverless PostgreSQL database hosting
- **Smartsupp**: Live chat support integration

### Frontend Libraries
- **Radix UI**: Headless UI component library for accessibility
- **Lucide React**: Icon library for consistent iconography
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Type-safe CSS class composition

### Development Tools
- **Vite**: Fast development server and build tool with HMR
- **ESBuild**: Fast JavaScript bundler for production builds
- **TypeScript**: Type safety and developer experience
- **Drizzle Kit**: Database migration and schema management tools

### Third-party Services
- **TradingView Public API**: Live performance charts, technical analysis, and market visualization
- **CoinGecko API**: Real-time cryptocurrency market data and price feeds
- **Smartsupp Chat**: Live customer support integration with key 3ab3e4c3fcd21f84344cc872db2a35d9e40245a6
- **WebSocket Connections**: Real-time data streaming capability
- **PWA Services**: Service worker with offline caching and background sync

### TradingView Integration
- **Advanced Charts**: Full-featured trading charts with technical indicators and drawing tools
- **Mini Charts**: Performance visualization for individual cryptocurrencies
- **Market Overview**: Comprehensive market analysis with multiple trading pairs
- **Ticker Tape**: Real-time price ticker for major cryptocurrencies
- **Symbol Support**: Binance trading pairs (BTCUSDT, ETHUSDT, BNBUSDT, etc.)
- **Customizable Timeframes**: 1D, 7D, 1M, 3M, 12M chart intervals

### Wallet Configuration
- **ETH Address**: 0xB36EDa1ffC696FFba07D4Be5cd249FE5E0118130
- **BTC Address**: bc1qv4fffwt8ux3k33n2dms5cdvuh6suc0gtfevxzu
- **BNB Address**: 0xB36EDa1ffC696FFba07D4Be5cd249FE5E0118130
- **USDT_TRON Address**: TSt7yoNwGYRbtMMfkSAHE6dPs1cd9rxcco