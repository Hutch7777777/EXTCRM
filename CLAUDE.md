# Exterior Finishes CRM - Claude Code Memory

## Project Overview
Building a multi-tenant SaaS CRM specifically for exterior finishing contractors. This will replace JobTread and eventually be sold as a product to other contractors.

## Business Context
- **Primary Company**: Exterior Finishes (first customer/testing ground)
- **Target Market**: Exterior finishing contractors (siding, windows, gutters, etc.)
- **Team Size**: 12-16 users per organization across 6 roles
- **Divisions**: Multi-family, Single-family, R&R (Repair & Remodel)
- **Timeline**: 6 weeks to first paying customer
- **Business Model**: SaaS subscription + potential white-labeling

## Technical Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Deployment**: Vercel
- **Payments**: Stripe (Week 5)
- **Integrations**: Outlook (priority), QuickBooks (later)

## Architecture Requirements
- **Multi-tenant from Day 1**: Every table includes organization_id
- **Role-based permissions**: Owner, Operations Manager, Sales Manager, Estimating Manager, Estimator, Field Management
- **Mobile-first**: Field management needs mobile access for job updates
- **Real-time updates**: Job progress, communication, status changes
- **Scalable**: Designed to handle hundreds of contractor organizations

## Development Approach
- **Speed over perfection**: 6-week timeline is aggressive
- **MVP focus**: Core CRM functionality first, polish later
- **Sub-agent coordination**: Specialized agents for different domains
- **Iterative development**: Build, test with real users, improve

## Sub-Agents Available
- **crm-database-architect**: Database design and Supabase architecture
- **saas-ui-architect**: UI/UX design with Shadcn/ui and Tailwind
- **nextjs-saas-developer**: API routes, business logic, full-stack development
- **integration-specialist**: Third-party service integrations

## Key Features Priority
### Week 1-2: Foundation
- Multi-tenant authentication and organization management
- Contact management (customers, vendors, crews, internal team)
- Lead management with division tracking
- Basic job and estimate tracking

### Week 3-4: Core Business Logic
- Estimating system with calculations
- Job workflow management
- Mobile interface for field management
- Communication tracking

### Week 5-6: Revenue Features
- Subscription billing with Stripe
- Outlook integration
- Basic reporting
- Customer onboarding flow

## Industry-Specific Context
- **Services**: Primarily siding, also windows, painting, gutters, framing, decking
- **Workflow**: Lead → Reach Out → Bid → Review → Propose → Contract → Schedule → Execute
- **Users**: Mix of office and field workers, varying tech comfort levels
- **Communication**: Heavy email, phone, photos from job sites
- **Seasonal**: Weather affects scheduling and job completion

## Success Metrics
- **Technical**: Working CRM deployed and used by Exterior Finishes team
- **Business**: First external customer signed within 6 weeks
- **Product**: Core workflows faster than JobTread
- **Revenue**: Foundation for recurring subscription business

## Current Phase
Foundation setup - creating the multi-tenant architecture and core CRM functionality that will serve as the base for the SaaS product.