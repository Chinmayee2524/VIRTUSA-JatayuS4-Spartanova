# Eco-Friendly Product Recommendation System

## Overview

This is a full-stack eco-friendly product recommendation system built as a monorepo with a React frontend and Node.js/Express backend. The application uses PostgreSQL with Drizzle ORM for data persistence and provides personalized product recommendations based on user demographics and activity tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with session-based authentication
- **Database**: PostgreSQL with Neon serverless adapter
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Store**: PostgreSQL session store using connect-pg-simple
- **Password Hashing**: bcryptjs for secure password storage

### Database Schema
The system uses five main tables:
- **users**: Stores user profile data (name, email, age, gender, password)
- **products**: Contains product information with eco-scores and targeting data
- **cart**: User shopping cart items with quantities
- **wishlist**: User saved products for later
- **viewed_products**: Tracks user product viewing history for recommendations

## Key Components

### Authentication System
- Session-based authentication using Express sessions
- PostgreSQL session persistence for scalability
- Secure password hashing with bcryptjs
- Middleware-based route protection

### Product Recommendation Engine
- Cold start recommendations based on user demographics (age, gender)
- Personalized recommendations incorporating user activity:
  - Product views tracking
  - Cart additions
  - Wishlist items
- Hybrid scoring system mentioned in specs (Mistral-7B + LLaMA-2)

### User Interface Components
- **ProductCard**: Displays product information with eco-score badges
- **SearchBar**: Debounced search with real-time filtering
- **UserProfile**: Dropdown menu with cart/wishlist counts and logout
- Comprehensive UI component library from Shadcn/ui

### Activity Tracking
- Real-time tracking of user interactions:
  - Product views (automatically logged)
  - Cart additions/removals
  - Wishlist management
- All activity stored in PostgreSQL for recommendation algorithms

## Data Flow

1. **User Registration/Login**: Users authenticate via email/password
2. **Product Discovery**: 
   - New users see demographic-based recommendations
   - Returning users get personalized recommendations
   - Search functionality with text-based filtering
3. **Activity Tracking**: All user interactions are logged to the database
4. **Recommendation Updates**: User activity influences future recommendations
5. **Cart/Wishlist Management**: Persistent storage across sessions

## External Dependencies

### Production Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **drizzle-orm**: Type-safe database operations
- **express-session**: Session management
- **bcryptjs**: Password security
- **react-hook-form**: Form validation and handling

### Development Tools
- **drizzle-kit**: Database migrations and schema management
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling for server code
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- tsx for backend development with auto-restart
- Replit-specific plugins for enhanced development experience

### Production Build
- Frontend: Vite builds React app to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single production command serves both frontend and API

### Database Management
- Drizzle migrations stored in `./migrations`
- Schema defined in `shared/schema.ts` for type sharing
- `db:push` command for schema synchronization

### Environment Configuration
- `DATABASE_URL` required for PostgreSQL connection
- `SESSION_SECRET` for secure session management
- `NODE_ENV` for environment-specific behavior

The application follows a monorepo structure with shared TypeScript types between client and server, ensuring type safety across the full stack. The modular architecture supports the MVP requirements while being extensible for the full recommendation system implementation.