# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Sui blockchain multisig wallet toolkit consisting of a Next.js web application (main focus in `/sui-multisig-wallet`), a CLI tool (`/cli`), and legacy UI components. The project emphasizes security through a local-first approach with optional cloud features via Supabase.

## Development Commands

### Web Application (sui-multisig-wallet)
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production server
npm run start

# Run linter
npm run lint
```

### CLI Tool
```bash
cd cli
npm run dev    # Development with TypeScript
npm run build  # Compile to JavaScript
```

## Architecture

### Technology Stack
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript with strict mode
- **UI**: Radix UI primitives + shadcn/ui components
- **Styling**: Tailwind CSS with SuiMultisig brand colors (orchid, mint, dark-slate)
- **Blockchain**: @mysten/dapp-kit for wallet integration, @mysten/sui SDK
- **Backend**: Supabase for real-time features and storage
- **State**: React Query for server state management

### Key Architectural Patterns

1. **Component Organization**
   - UI primitives in `/components/ui/` (shadcn/ui pattern)
   - Feature components organized by function (e.g., `connect-wallet.tsx`, `vault-sidebar.tsx`)
   - Extensive use of Radix UI for accessibility

2. **Routing Structure**
   - `/create` - Multisig wallet creation flow
   - `/wallet/[id]` - Individual wallet dashboard
   - Dynamic routes using Next.js App Router

3. **State Management**
   - React Query for async data fetching and caching
   - Custom hooks in `/hooks/` for business logic
   - Supabase subscriptions for real-time updates

4. **Database Integration**
   - Supabase tables for wallet metadata, proposals, and signatures
   - Real-time collaboration features
   - Database policies in `supabase-policies.sql`

### Path Aliases
- `@/*` resolves to the root directory

## Important Notes

1. **Security Focus**: The project prioritizes local-first operation with no mandatory external dependencies. Cloud features via Supabase are optional.

2. **Custom Sui CLI**: Users need a custom fork of the Sui CLI for proper multisig support (see main README).

3. **Brand Colors**: Use SuiMultisig colors (orchid, mint, dark-slate) defined in Tailwind config for consistency.

4. **Component Patterns**: Follow existing patterns using Radix UI primitives wrapped with custom styling via shadcn/ui approach.

5. **Form Handling**: Use react-hook-form with zod validation for all forms.

## Environment Configuration

Create `.env.local` with Supabase credentials if using cloud features:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```