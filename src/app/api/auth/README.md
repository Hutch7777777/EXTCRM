# Authentication API Endpoints

This directory contains the authentication bridge system that connects Supabase Auth with our multi-tenant CRM database architecture.

## Overview

The authentication system provides the following functionality:
- Organization registration for new contractors
- User invitation and onboarding system
- Session management and organization switching
- Multi-tenant security and access control

## Endpoints

### 1. Organization Registration
**POST `/api/auth/register-organization`**

Creates a new contractor organization and sets up the owner account.

#### Request Body
```json
{
  "organizationName": "Exterior Finishes LLC",
  "organizationSlug": "exterior-finishes-llc",
  "ownerFirstName": "John",
  "ownerLastName": "Doe",
  "ownerEmail": "john@exteriorfinishes.com",
  "phone": "+1-555-123-4567",
  "addressLine1": "123 Main St",
  "city": "Springfield",
  "state": "IL",
  "zipCode": "62701"
}
```

#### Validation
- `organizationName`: Required, 1-100 characters
- `organizationSlug`: Required, lowercase letters, numbers, and hyphens only
- `ownerFirstName`, `ownerLastName`: Required, 1-50 characters each
- `ownerEmail`: Required, valid email format, must match authenticated user's email
- Other fields: Optional

#### Response
```json
{
  "success": true,
  "organizationId": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Organization registration completed successfully"
}
```

#### Error Responses
- `400`: Missing required fields or validation errors
- `401`: Not authenticated
- `409`: Organization slug already exists
- `500`: Internal server error

---

### 2. User Invitation
**POST `/api/auth/invite-user`**

Invite team members to join an organization.

#### Required Permissions
- Owner: Can invite anyone
- Operations Manager: Can invite estimators and field management
- Sales Manager: Can invite estimators and field management

#### Request Body
```json
{
  "email": "employee@exteriorfinishes.com",
  "role": "estimator",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### Valid Roles
- `owner`: Organization owner
- `operations_manager`: Operations manager
- `sales_manager`: Sales manager  
- `estimating_manager`: Estimating manager
- `estimator`: Estimator
- `field_management`: Field management

#### Response
```json
{
  "success": true,
  "message": "User invitation sent successfully",
  "invitationToken": "abc123..." // Only in development
}
```

**GET `/api/auth/invite-user`**

Get pending invitations for the current organization.

#### Response
```json
{
  "invitations": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "employee@exteriorfinishes.com",
      "role": "estimator",
      "expires_at": "2024-01-15T10:00:00Z",
      "created_at": "2024-01-08T10:00:00Z",
      "inviter": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@exteriorfinishes.com"
      }
    }
  ]
}
```

---

### 3. Accept Invitation
**POST `/api/auth/accept-invitation`**

Accept a team invitation and complete user onboarding.

#### Request Body
```json
{
  "invitationToken": "abc123def456ghi789",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1-555-987-6543",
  "mobile": "+1-555-987-6543",
  "timezone": "America/Chicago"
}
```

#### Response
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "organization_id": "123e4567-e89b-12d3-a456-426614174001",
    "email": "employee@exteriorfinishes.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "estimator",
    "status": "active"
  },
  "organization": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Exterior Finishes LLC",
    "slug": "exterior-finishes-llc"
  }
}
```

**GET `/api/auth/accept-invitation?token=abc123`**

Get invitation details before accepting.

#### Response
```json
{
  "invitation": {
    "email": "employee@exteriorfinishes.com",
    "role": "estimator",
    "expiresAt": "2024-01-15T10:00:00Z",
    "organization": {
      "name": "Exterior Finishes LLC",
      "slug": "exterior-finishes-llc",
      "logo_url": null
    },
    "inviter": {
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

---

### 4. User Profile Management
**GET `/api/auth/user`**

Get current user information with organization details.

#### Response
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "organization_id": "123e4567-e89b-12d3-a456-426614174001",
    "email": "john@exteriorfinishes.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "owner",
    "status": "active",
    "organization": {
      "name": "Exterior Finishes LLC",
      "slug": "exterior-finishes-llc"
    }
  },
  "organizations": [
    {
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "organization_id": "123e4567-e89b-12d3-a456-426614174001",
      "organization_name": "Exterior Finishes LLC",
      "organization_slug": "exterior-finishes-llc",
      "user_role": "owner",
      "user_status": "active",
      "is_admin": true
    }
  ]
}
```

**PATCH `/api/auth/user`**

Update user profile information.

#### Request Body
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1-555-123-4567",
  "mobile": "+1-555-987-6543",
  "title": "Owner/Manager",
  "department": "Operations",
  "timezone": "America/Chicago",
  "notification_preferences": {
    "email": true,
    "browser": true,
    "mobile": false
  }
}
```

**POST `/api/auth/user`**

Track user activity and sessions.

#### Request Body
```json
{
  "action": "track-login",
  "deviceInfo": {
    "browser": "Chrome",
    "os": "macOS"
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

---

### 5. Organization Switching
**POST `/api/auth/switch-organization`**

Switch between organizations (for users who belong to multiple).

#### Request Body
```json
{
  "organizationId": "123e4567-e89b-12d3-a456-426614174002"
}
```

#### Response
```json
{
  "success": true,
  "message": "Organization switched successfully",
  "currentOrganization": {
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "organization_id": "123e4567-e89b-12d3-a456-426614174002",
    "organization_name": "Another Company LLC",
    "user_role": "estimator",
    "user_status": "active"
  },
  "allOrganizations": [...]
}
```

**GET `/api/auth/switch-organization`**

Get all organizations the current user has access to.

#### Response
```json
{
  "organizations": [...],
  "currentOrganization": {...}
}
```

---

## Database Functions Used

### `create_organization_registration`
Creates organization and owner user in a single transaction.

### `invite_user_to_organization`
Creates invitation record with secure token and expiration.

### `get_user_org_info`
Returns all organizations a user belongs to with roles and permissions.

### `switch_user_organization`
Safely switches user's active organization with access validation.

### `cleanup_expired_invitations`
Maintenance function to clean up expired invitations (called by cron).

### `get_organization_stats`
Returns analytics data for organization dashboard.

---

## Security Features

### Multi-tenant Isolation
- All database queries are scoped to organization_id
- Row Level Security (RLS) policies enforce tenant boundaries
- Admin client only used for cross-tenant operations

### Role-based Access Control
- Hierarchical permission system
- Function-level permission checks
- Resource-scoped operations

### Input Validation
- Server-side validation for all endpoints
- SQL injection prevention
- XSS protection through sanitization

### Rate Limiting
- Per-endpoint rate limiting
- IP-based and user-based limits
- Configurable thresholds

### Audit Logging
- All authentication events logged
- User session tracking
- Organization changes tracked

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Human-readable error message",
  "details": {
    "fields": ["field1", "field2"], // For validation errors
    "code": "ERROR_CODE" // For specific error types
  }
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `405`: Method Not Allowed
- `409`: Conflict (duplicate resources)
- `410`: Gone (expired resources)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

---

## Development Notes

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (admin)

### Testing
Use the provided test endpoints in development mode to verify functionality:
1. Create organization registration
2. Invite users
3. Accept invitations  
4. Test organization switching
5. Verify profile management

### Production Considerations
- Remove debug tokens from responses
- Configure proper CORS policies
- Set up monitoring and alerting
- Implement comprehensive logging
- Add performance monitoring