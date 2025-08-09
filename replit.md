# Overview

This is a Binance Wallet landing page application built with a modern full-stack architecture. The project features a React-based frontend showcasing Binance Wallet's features including multi-party computation (MPC) security, cross-chain trading, DeFi integration, and developer tools. The backend is set up with Express.js and configured for PostgreSQL database integration using Drizzle ORM, though it currently implements a basic user management system with in-memory storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with custom design tokens for Binance branding (yellow/gold theme)
- **Forms**: React Hook Form with Zod validation via Hookform Resolvers
- **Icons**: Font Awesome icons integrated throughout the UI

## Backend Architecture
- **Runtime**: Node.js with TypeScript using ESM modules
- **Framework**: Express.js with custom middleware for request logging and error handling
- **Database ORM**: Drizzle ORM configured for PostgreSQL with schema-first approach
- **Storage Pattern**: Interface-based storage abstraction with both in-memory and database implementations
- **Development**: Hot reloading with tsx and Vite integration in development mode

## Data Storage Solutions
- **Database**: PostgreSQL configured via Drizzle ORM with migrations support
- **Connection**: Neon Database serverless driver for cloud PostgreSQL
- **Schema Management**: Centralized schema definitions in shared directory with Zod validation
- **Current Storage**: In-memory storage implementation for development with user management (ID, username, password)

## Authentication and Authorization
- **Session Management**: PostgreSQL session store (connect-pg-simple) configured but not actively implemented
- **User Model**: Basic user schema with UUID primary keys and unique username constraints
- **Security**: Prepared for self-custody wallet integration following MPC security principles

## Component Architecture
- **Design System**: Comprehensive UI component library with consistent theming
- **Layout Components**: Modular sections (Hero, Features, Security, FAQ, etc.) for landing page
- **Interactive Elements**: Modal dialogs, accordions, and responsive navigation
- **Accessibility**: Built-in accessibility features through Radix UI primitives

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migrations and schema management

## UI and Styling
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Embla Carousel**: Carousel/slider functionality for interactive components
- **Lucide React**: Icon library for modern, customizable SVG icons

## Development Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **TypeScript**: Type safety across frontend and backend with shared types
- **ESBuild**: Fast JavaScript bundler for server-side code

## Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Schema validation library integrated with form handling and database models
- **Date-fns**: Date manipulation and formatting utilities

## State Management
- **TanStack Query**: Powerful data synchronization for server state with caching and background updates
- **Wouter**: Minimalist routing library for single-page application navigation

## Utility Libraries
- **clsx & class-variance-authority**: Dynamic CSS class composition and variant management
- **cmdk**: Command palette and search functionality
- **nanoid**: Secure, URL-safe unique ID generation