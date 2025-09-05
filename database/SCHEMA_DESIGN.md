# EXTCRM Database Schema Design

## Overview

This document describes the multi-tenant database schema design for the Exterior Finishing CRM system. The schema is designed specifically for exterior finishing contractors and supports the complete business workflow from lead generation to job completion.

## Design Principles

### 1. Multi-Tenant Architecture
- **Organization Isolation**: Every table includes `organization_id` for complete tenant isolation
- **Row Level Security (RLS)**: Comprehensive RLS policies ensure data security at the database level
- **Scalable Design**: Schema supports hundreds of contractor organizations

### 2. Role-Based Access Control
- **6 User Roles**: Owner, Operations Manager, Sales Manager, Estimating Manager, Estimator, Field Management
- **Granular Permissions**: Role-based permissions with optional custom overrides
- **Resource-Action Matrix**: Permissions defined by resource (leads, jobs) and action (create, read, update, delete)

### 3. Workflow Support
- **Lead Lifecycle**: New → Contacted → Qualified → Estimating → Won/Lost
- **Job Lifecycle**: Pending → Scheduled → In Progress → Completed
- **Business Divisions**: Multi-family, Single-family, R&R (Repair & Remodel)
- **Service Tracking**: Siding, windows, painting, gutters, framing, decking

### 4. Audit and Compliance
- **Comprehensive Audit Trail**: All changes tracked with user, timestamp, and change details
- **Communication Logging**: All customer interactions recorded
- **Activity Timeline**: Complete timeline for leads and jobs

## Core Tables

### Organizations (`organizations`)
**Purpose**: Root table for multi-tenant architecture

**Key Features**:
- Unique slug for URL-friendly identification
- Business settings (divisions, services offered)
- Subscription and billing information
- Timezone and currency settings

**Relationships**: Referenced by all other tables via `organization_id`

### Users (`users`)
**Purpose**: User management with role-based permissions

**Key Features**:
- Extends Supabase auth.users
- 6 distinct user roles with defined permissions
- Notification preferences
- Login tracking and session management

**Relationships**:
- Belongs to `organizations`
- Referenced by many tables for assignment and ownership

### Contacts (`contacts`)
**Purpose**: Universal contact management

**Key Features**:
- Multiple contact types: customer, vendor, crew, internal, referral
- Multiple addresses per contact
- Communication preferences and history
- Full-text search capabilities
- Relationship modeling between contacts

**Related Tables**:
- `contact_addresses`: Multiple addresses per contact
- `contact_communications`: Communication log
- `contact_relationships`: Complex relationship modeling

### Leads (`leads`)
**Purpose**: Lead management with division tracking

**Key Features**:
- Business division classification (Multi-family, Single-family, R&R)
- Lead scoring and qualification tracking
- Competition and decision maker information
- Comprehensive workflow status tracking
- Automatic lead numbering (L-YYYY-0001)

**Related Tables**:
- `lead_activities`: Complete activity timeline
- `lead_attachments`: Files and documents
- `lead_follow_ups`: Scheduled reminders and tasks

### Jobs (`jobs`)
**Purpose**: Job execution and project management

**Key Features**:
- Created from approved estimates
- Progress tracking with milestone status
- Financial tracking (contract value, actual costs, margins)
- Weather delay tracking
- Quality and safety management
- Automatic job numbering (J-YYYY-0001)

**Related Tables**:
- `job_activities`: Progress updates and timeline
- `job_attachments`: Photos and documents with GPS data

### Estimates (`estimates`)
**Purpose**: Detailed estimate creation and tracking

**Key Features**:
- Financial breakdown (labor, materials, equipment, subcontractor)
- Automatic overhead and profit calculations
- Line-item detail support
- Customer interaction tracking (sent, viewed, approved)
- Automatic estimate numbering (E-YYYY-0001)

**Related Tables**:
- `estimate_line_items`: Detailed cost breakdown

## Supporting Tables

### Role Permissions (`role_permissions`)
**Purpose**: Define what actions each role can perform

**Structure**: Maps roles to resources and actions with optional conditions

### Audit Logs (`audit_logs`)
**Purpose**: Comprehensive audit trail

**Features**:
- Tracks all INSERT, UPDATE, DELETE operations
- Stores old and new values
- User and session context
- IP address and user agent tracking

### Notifications (`notifications`)
**Purpose**: System notifications and alerts

**Features**:
- Multiple delivery methods (in-app, email, SMS, push)
- Delivery status tracking
- Read status and timestamps
- Automatic cleanup of old notifications

### Organization Settings (`organization_settings`)
**Purpose**: Organization-specific configuration

**Features**:
- Business hours configuration
- Default estimating parameters
- Integration settings
- Custom field definitions

### Document Templates (`document_templates`)
**Purpose**: Customizable document generation

**Features**:
- HTML/CSS templates for estimates, contracts
- Template variables and requirements
- Multiple templates per type

### File Storage (`file_storage`)
**Purpose**: File tracking and metadata

**Features**:
- Integrates with Supabase storage
- File categorization and tagging
- Access tracking and cleanup

### Weather Data (`weather_data`)
**Purpose**: Weather tracking for job planning

**Features**:
- Weather condition caching
- Work suitability scoring
- Weather delay documentation

## Key Relationships

```
organizations
├── users
├── contacts
│   ├── contact_addresses
│   ├── contact_communications
│   └── contact_relationships
├── leads
│   ├── lead_activities
│   ├── lead_attachments
│   └── lead_follow_ups
├── estimates
│   └── estimate_line_items
├── jobs
│   ├── job_activities
│   └── job_attachments
└── [all supporting tables]
```

## Security Model

### Row Level Security (RLS)
All tables implement RLS policies that enforce organization_id isolation:
```sql
CREATE POLICY table_tenant_isolation ON table_name
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);
```

### Role-Based Permissions
- **Owner**: Full access to everything
- **Operations Manager**: User management, all records read/update
- **Sales Manager**: Contact and lead management, job visibility
- **Estimating Manager**: Estimating oversight and management
- **Estimator**: Assigned leads and estimates only
- **Field Management**: Assigned jobs and progress updates only

## Indexing Strategy

### Performance Indexes
- Organization ID on all multi-tenant tables
- Foreign key relationships
- Status fields for filtering
- Date fields for chronological queries

### Search Indexes
- Full-text search on contacts (GIN index)
- Full-text search on leads (GIN index)
- Array indexes for tags and services (GIN indexes)

### Composite Indexes
- Location-based searches (city, state, zip)
- Time-based queries (created_at, updated_at)
- Status and assignment combinations

## Data Integrity

### Constraints
- Email format validation
- Positive values for financial fields
- Status transition logic
- Required field combinations

### Triggers
- Automatic updated_at timestamps
- Activity logging for status changes
- Automatic number generation
- Default record creation

### Functions
- Lead/job/estimate number generation
- Status change logging
- Job creation from estimates
- Notification management

## Migration Strategy

### Sequential Migrations
1. **001**: Organizations (foundation)
2. **002**: Users and roles (authentication)
3. **003**: Contacts (relationship management)
4. **004**: Leads (sales pipeline)
5. **005**: Jobs and estimates (project execution)
6. **006**: Supporting tables (system features)

### Migration Tracking
- `schema_migrations` table tracks applied migrations
- Version-based migration system
- Rollback capabilities
- Migration runner script

## Scalability Considerations

### Performance
- Efficient indexing for multi-tenant queries
- Partitioning strategies for large datasets
- Query optimization for common access patterns

### Growth
- UUID primary keys for distributed systems
- JSONB fields for flexible data storage
- Extensible custom field architecture

### Maintenance
- Automatic cleanup procedures
- Archive strategies for old data
- Performance monitoring hooks

## Integration Points

### Supabase Integration
- Auth integration with users table
- Storage integration with file tracking
- Real-time subscriptions on key tables
- API generation from schema

### External Systems
- Email/calendar integration support
- QuickBooks integration preparation
- Weather API integration
- File storage system integration

## Custom Field Architecture

### JSONB Storage
Custom fields stored as JSONB for flexibility:
```sql
custom_fields JSONB DEFAULT '{}'::jsonb
```

### Type Safety
Organization settings define custom field schemas:
```sql
{
  "lead_custom_fields": {
    "roof_material": {"type": "select", "options": ["shingle", "metal", "tile"]},
    "square_footage": {"type": "number", "min": 0}
  }
}
```

This schema provides a robust foundation for the exterior finishing CRM system, supporting the complete business workflow while maintaining security, scalability, and flexibility for customization.