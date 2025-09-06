import { NextResponse } from 'next/server'

/**
 * Standard API error responses with consistent formatting
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Create standardized error responses
 */
export function createErrorResponse(
  message: string, 
  statusCode: number = 500, 
  details?: any
) {
  const response: any = { error: message }
  
  if (details) {
    response.details = details
  }
  
  return NextResponse.json(response, { status: statusCode })
}

/**
 * Create standardized success responses
 */
export function createSuccessResponse(
  data: any, 
  statusCode: number = 200,
  message?: string
) {
  const response: any = data
  
  if (message) {
    response.message = message
  }
  
  return NextResponse.json(response, { status: statusCode })
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>, 
  requiredFields: string[]
): string[] {
  return requiredFields.filter(field => 
    !body[field] || 
    (typeof body[field] === 'string' && body[field].trim() === '')
  )
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Validate organization slug format
 */
export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/
  return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 50
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null
  return input.trim() || null
}

/**
 * Extract allowed fields from request body
 */
export function extractAllowedFields<T extends Record<string, any>>(
  body: Record<string, any>,
  allowedFields: (keyof T)[]
): Partial<T> {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key as keyof T))
  ) as Partial<T>
}

/**
 * Handle common API errors with consistent responses
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)
  
  // Handle known ApiError instances
  if (error instanceof ApiError) {
    return createErrorResponse(error.message, error.statusCode)
  }
  
  // Handle authentication errors
  if (error instanceof Error && error.message.includes('Authentication required')) {
    return createErrorResponse('Authentication required', 401)
  }
  
  // Handle authorization errors
  if (error instanceof Error && error.message.includes('Required role')) {
    return createErrorResponse('Insufficient permissions', 403)
  }
  
  // Handle JSON parsing errors
  if (error instanceof SyntaxError) {
    return createErrorResponse('Invalid JSON in request body', 400)
  }
  
  // Handle database constraint errors
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as { code: string; message?: string }
    
    if (dbError.code === '23505') {
      return createErrorResponse('Duplicate entry - resource already exists', 409)
    }
    
    if (dbError.code === '23503') {
      return createErrorResponse('Referenced resource not found', 400)
    }
    
    if (dbError.code === 'PGRST116') {
      return createErrorResponse('Resource not found or access denied', 404)
    }
  }
  
  // Default server error
  return createErrorResponse('Internal server error', 500)
}

/**
 * Validate request methods
 */
export function validateMethod(
  request: Request, 
  allowedMethods: string[]
): NextResponse | null {
  if (!allowedMethods.includes(request.method)) {
    return createErrorResponse('Method not allowed', 405)
  }
  return null
}

/**
 * Extract request metadata for logging/analytics
 */
export function getRequestMetadata(request: Request) {
  const userAgent = request.headers.get('user-agent') || null
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwarded?.split(',')[0] || realIp || null
  
  return {
    userAgent,
    ipAddress,
    timestamp: new Date().toISOString(),
    url: request.url,
    method: request.method
  }
}

/**
 * Rate limiting helpers (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const current = requestCounts.get(identifier)
  
  if (!current || now > current.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimitData() {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitData, 5 * 60 * 1000)
}