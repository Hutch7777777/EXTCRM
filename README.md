# Exterior Finishes CRM

A multi-tenant SaaS CRM system built specifically for exterior finishing contractors. Built with Next.js 14, Supabase, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Multi-tenant Architecture**: Complete organization isolation from Day 1
- **Role-based Access Control**: 6 user roles with granular permissions
- **Mobile-first Design**: Optimized for field management on mobile devices
- **Real-time Updates**: Live job progress and communication tracking
- **Comprehensive CRM**: Contacts, leads, jobs, estimates, and communication

## 🏗️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Deployment**: Vercel
- **Authentication**: Supabase Auth with multi-tenant organization switching

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project

## 🛠️ Setup Instructions

### 1. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```

### 2. Database Setup

1. In your Supabase project dashboard, go to the SQL Editor
2. Run the migrations in order from `database/migrations/`:
   ```sql
   -- Run these files in order:
   001_create_organizations.sql
   002_create_users_and_roles.sql
   003_create_contacts.sql
   004_create_leads.sql
   005_create_jobs_and_estimates.sql
   006_create_support_tables.sql
   ```

3. Or use the migration runner:
   ```sql
   -- Copy and paste the contents of database/run_migrations.sql
   ```

### 3. Application Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 👥 User Roles

- **Owner**: Full system access, organization management
- **Operations Manager**: User management, operations oversight
- **Sales Manager**: Sales team and lead management
- **Estimating Manager**: Estimate and pricing management
- **Estimator**: Create and manage assigned estimates
- **Field Management**: Job updates and field operations

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── layout/           # Layout components
│   ├── auth/             # Authentication components
│   └── dashboard/        # Dashboard components
├── lib/                  # Utilities and configurations
│   ├── supabase/         # Supabase clients
│   └── auth/             # Authentication utilities
├── types/                # TypeScript type definitions
├── hooks/                # Custom React hooks
└── contexts/             # React contexts
```

## 🔧 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 📚 Documentation

- [Database Schema Design](./database/SCHEMA_DESIGN.md)
- [Authentication Integration](./AUTHENTICATION_INTEGRATION.md)
- [Product Requirements](./docs/PRD.md)
- [Project Memory](./CLAUDE.md)

## 🏭 Architecture

This CRM is built with a multi-tenant SaaS architecture:

- **Database**: Row Level Security (RLS) ensures complete tenant isolation
- **Authentication**: Supabase Auth with organization switching
- **Frontend**: Role-based UI with mobile-first responsive design
- **API**: Type-safe API routes with automatic tenant scoping

## 🚀 Deployment

The application is optimized for deployment on Vercel:

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 🔒 Security

- Row Level Security (RLS) on all database tables
- Role-based access control with granular permissions
- Secure session management with Supabase Auth
- Multi-tenant data isolation at the database level

## 🎯 Business Context

Built for exterior finishing contractors who need:
- Lead management with division tracking (Multi-family, Single-family, R&R)
- Mobile-friendly job updates from the field
- Estimate generation with material calculations
- Communication tracking and follow-up automation
- Real-time progress updates

## 🤝 Contributing

This is a proprietary SaaS application. Development is managed by the core team with specialized sub-agents for different domains.

## 📄 License

Proprietary - All rights reserved