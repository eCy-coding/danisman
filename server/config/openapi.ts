/**
 * EcyPro — OpenAPI 3.0 Specification
 *
 * Machine-readable API documentation for the EcyPro backend.
 * Serves at /api/docs endpoint.
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'EcyPro Premium Consulting API',
    version: '1.0.0',
    description:
      'RESTful API for the EcyPro Premium Consulting SAAS platform. Provides authentication, booking management, analytics tracking, and real-time dashboard streaming.',
    contact: {
      name: 'EcyPro Support',
      email: 'support@ecypro.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001/api',
      description: 'Development',
    },
    {
      url: 'https://api.ecypro.com/api',
      description: 'Production',
    },
  ],
  tags: [
    { name: 'Health', description: 'Service health monitoring' },
    { name: 'Auth', description: 'Authentication & authorization' },
    { name: 'Bookings', description: 'Consultation booking management' },
    { name: 'Analytics', description: 'User analytics & tracking' },
    { name: 'SSE', description: 'Real-time Server-Sent Events' },
    { name: 'Newsletter', description: 'Newsletter subscription management' },
    { name: 'Observability', description: 'Readiness + metrics probes' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health check',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string', example: 'ecypro-api' },
                    version: { type: 'string', example: '1.0.0' },
                    uptime: { type: 'number', example: 3600 },
                    timestamp: { type: 'string', format: 'date-time' },
                    environment: { type: 'string', example: 'production' },
                    memory: {
                      type: 'object',
                      properties: {
                        heapUsed: { type: 'number' },
                        heapTotal: { type: 'number' },
                        rss: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        operationId: 'login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@ecypro.com' },
                  password: { type: 'string', minLength: 6, example: 'securePassword123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string' },
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid credentials' },
          '429': { description: 'Too many login attempts' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user',
        operationId: 'register',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string', minLength: 2 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Registration successful' },
          '400': { description: 'Validation error' },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        operationId: 'getMe',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'User profile' },
          '401': { description: 'Not authenticated' },
        },
      },
    },
    '/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'List bookings (paginated)',
        operationId: 'listBookings',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': { description: 'Paginated bookings list' },
          '401': { description: 'Not authenticated' },
        },
      },
      post: {
        tags: ['Bookings'],
        summary: 'Create a booking',
        operationId: 'createBooking',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BookingInput' },
            },
          },
        },
        responses: {
          '201': { description: 'Booking created' },
          '400': { description: 'Validation error' },
        },
      },
    },
    '/analytics/pageview': {
      post: {
        tags: ['Analytics'],
        summary: 'Track a page view (fire-and-forget)',
        operationId: 'trackPageView',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string' },
                  page: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Tracked' },
        },
      },
    },
    '/analytics/contact': {
      post: {
        tags: ['Analytics'],
        summary: 'Submit contact form',
        operationId: 'submitContact',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'message'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  company: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Contact submitted' },
          '429': { description: 'Rate limit exceeded (5/hour)' },
        },
      },
    },
    '/ready': {
      get: {
        tags: ['Observability'],
        summary: 'Deep readiness probe (DB + Redis)',
        operationId: 'getReady',
        responses: {
          '200': { description: 'Service is ready' },
          '503': { description: 'Service not ready (DB unreachable)' },
        },
      },
    },
    '/metrics': {
      get: {
        tags: ['Observability'],
        summary: 'Prometheus-compatible metrics (text/plain)',
        operationId: 'getMetrics',
        responses: {
          '200': {
            description: 'Metrics in exposition format',
            content: { 'text/plain': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/newsletter/subscribe': {
      post: {
        tags: ['Newsletter'],
        summary: 'Subscribe an email to the newsletter (idempotent)',
        operationId: 'subscribeNewsletter',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'consent'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  consent: { type: 'boolean', description: 'Must be true (GDPR/KVKK)' },
                  source: { type: 'string', example: 'footer' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Subscription confirmed' },
          '200': { description: 'Already subscribed (idempotent)' },
          '400': { description: 'Validation error' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/sse/dashboard': {
      get: {
        tags: ['SSE'],
        summary: 'Real-time dashboard event stream',
        operationId: 'sseDashboard',
        responses: {
          '200': {
            description: 'SSE stream established',
            content: {
              'text/event-stream': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'ADMIN', 'CONSULTANT'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      BookingInput: {
        type: 'object',
        required: ['serviceType', 'date'],
        properties: {
          serviceType: {
            type: 'string',
            enum: ['STRATEGY', 'TECHNOLOGY', 'OPERATIONS', 'FINANCE', 'HR'],
          },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
        },
      },
      PublicBookingInput: {
        type: 'object',
        required: ['name', 'email', 'scheduledAt'],
        properties: {
          name: { type: 'string', example: 'Ahmet Yılmaz' },
          email: { type: 'string', format: 'email', example: 'ahmet@company.com' },
          company: { type: 'string', example: 'ACME Corp' },
          notes: { type: 'string', maxLength: 1000 },
          scheduledAt: { type: 'string', format: 'date-time', example: '2026-06-15T10:00:00Z' },
          durationMin: { type: 'integer', minimum: 15, maximum: 120, default: 30 },
        },
      },
      SlotDay: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date', example: '2026-06-10' },
          slots: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                start: {
                  type: 'string',
                  format: 'date-time',
                  description: 'UTC ISO-8601 slot start',
                },
                end: { type: 'string', format: 'date-time', description: 'UTC ISO-8601 slot end' },
              },
            },
          },
        },
      },
      FeedbackSubmission: {
        type: 'object',
        required: ['token', 'score'],
        properties: {
          token: { type: 'string', description: 'HMAC-signed feedback token from email link' },
          score: {
            type: 'integer',
            minimum: 0,
            maximum: 10,
            description: 'NPS score (0=Detractor, 9-10=Promoter)',
          },
          comment: { type: 'string', maxLength: 1000, description: 'Optional qualitative comment' },
        },
      },
      NpsSummary: {
        type: 'object',
        properties: {
          nps: {
            type: 'integer',
            nullable: true,
            description: 'Net Promoter Score = Promoters% - Detractors%',
          },
          total: { type: 'integer' },
          promoters: { type: 'integer' },
          passives: { type: 'integer' },
          detractors: { type: 'integer' },
          promoterPct: { type: 'number' },
          detractorPct: { type: 'number' },
          avgScore: { type: 'number' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          jti: { type: 'string', description: 'JWT ID' },
          userAgent: { type: 'string', nullable: true },
          ip: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          lastSeenAt: { type: 'string', format: 'date-time' },
          isCurrent: { type: 'boolean', description: 'True if this is the calling session' },
        },
      },
      TotpSetup: {
        type: 'object',
        properties: {
          secret: { type: 'string', description: 'Base32 TOTP secret (store securely)' },
          otpauthUrl: { type: 'string', description: 'otpauth:// URI for QR code' },
          qrCodeDataUrl: { type: 'string', description: 'data:image/png;base64,... QR code image' },
        },
      },
    },
  },
  // ─── Phase 35-37 New Endpoints ────────────────────────────────────
  // Appended to openApiSpec.paths via Object.assign at serve time.
  // These endpoints were added in Phase 35 (Auth), Phase 36 (Admin), Phase 37 (Booking).
  newPaths: {
    '/auth/verify-email': {
      get: {
        tags: ['Auth'],
        summary: 'P35-T03: Verify email token',
        description:
          'Validates a 256-bit hex email verification token. Marks emailVerified=true on success.',
        parameters: [{ in: 'query', name: 'token', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Email verified successfully' },
          '400': { description: 'INVALID_TOKEN | TOKEN_EXPIRED | TOKEN_USED | MISSING_TOKEN' },
        },
      },
    },
    '/auth/send-verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'P35-T03: Resend email verification',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Verification email sent' },
          '409': { description: 'ALREADY_VERIFIED' },
        },
      },
    },
    '/auth/2fa/setup': {
      post: {
        tags: ['Auth'],
        summary: 'P35-T04: Generate new TOTP secret + QR code',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'TOTP setup data',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TotpSetup' } } },
          },
        },
      },
    },
    '/auth/2fa/verify-setup': {
      post: {
        tags: ['Auth'],
        summary: 'P35-T04: Confirm TOTP code and enable 2FA',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code'],
                properties: { code: { type: 'string', pattern: '^[0-9]{6}$' } },
              },
            },
          },
        },
        responses: {
          '200': { description: '2FA enabled' },
          '401': { description: 'Invalid TOTP code' },
        },
      },
    },
    '/sessions': {
      get: {
        tags: ['Auth'],
        summary: 'P35-T09: List own active sessions',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Session list',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Session' } },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Auth'],
        summary: 'P35-T09: Revoke all sessions except current',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'All other sessions revoked' } },
      },
    },
    '/sessions/{id}': {
      delete: {
        tags: ['Auth'],
        summary: 'P35-T09: Revoke a specific session',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Session revoked' },
          '404': { description: 'SESSION_NOT_FOUND' },
        },
      },
    },
    '/bookings/slots': {
      get: {
        tags: ['Bookings'],
        summary: 'P37-T01: Get available booking slots (Cal.com proxy)',
        description:
          'Returns available 30-min slots. Proxies Cal.com API; falls back to static business-hours slots if Cal.com is unavailable.',
        parameters: [
          {
            in: 'query',
            name: 'startDate',
            schema: { type: 'string', format: 'date' },
            example: '2026-06-01',
          },
          {
            in: 'query',
            name: 'endDate',
            schema: { type: 'string', format: 'date' },
            example: '2026-06-14',
          },
        ],
        responses: {
          '200': {
            description: 'Slots by day',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/SlotDay' } },
              },
            },
          },
          '400': { description: 'Date range >60 days or invalid' },
        },
      },
    },
    '/bookings/public': {
      post: {
        tags: ['Bookings'],
        summary: 'P37-T01: Create booking (no login required)',
        description:
          'Guest booking flow. Finds or creates user by email, sends ICS + confirmation email.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PublicBookingInput' } },
          },
        },
        responses: {
          '201': { description: 'Booking created' },
          '400': { description: 'Validation error or past date' },
          '429': { description: 'Rate limit exceeded (10 bookings/24h per IP)' },
        },
      },
    },
    '/bookings/analytics': {
      get: {
        tags: ['Bookings'],
        summary: 'P37-T09: Booking analytics (ADMIN)',
        security: [{ BearerAuth: [] }],
        description:
          'Returns aggregate booking metrics: total, by status, 90-day trend, by service.',
        responses: { '200': { description: 'Booking analytics' } },
      },
    },
    '/feedback/{bookingId}': {
      get: {
        tags: ['Bookings'],
        summary: 'P37-T10: Validate feedback token + get booking info',
        parameters: [
          {
            in: 'path',
            name: 'bookingId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          { in: 'query', name: 'token', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Token valid — booking info returned' },
          '400': { description: 'Invalid/expired token' },
          '409': { description: 'Feedback already submitted' },
        },
      },
      post: {
        tags: ['Bookings'],
        summary: 'P37-T10: Submit NPS feedback score',
        description: 'Rate limited: 3 submissions per 24h per IP.',
        parameters: [
          {
            in: 'path',
            name: 'bookingId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/FeedbackSubmission' } },
          },
        },
        responses: {
          '200': { description: 'Feedback recorded' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/feedback/nps-summary': {
      get: {
        tags: ['Bookings'],
        summary: 'P37-T10: Aggregate NPS score (ADMIN)',
        security: [{ BearerAuth: [] }],
        description: 'Computes NPS = Promoters(≥9)% - Detractors(≤6)% over all submitted feedback.',
        responses: {
          '200': {
            description: 'NPS summary',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/NpsSummary' } },
            },
          },
        },
      },
    },
    '/admin/audit-log': {
      get: {
        tags: ['Admin'],
        summary: 'P36-T07: Paginated audit log (ADMIN)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 50 } },
          { in: 'query', name: 'action', schema: { type: 'string', example: 'USER_ROLE_CHANGE' } },
        ],
        responses: { '200': { description: 'Audit log entries with pagination' } },
      },
    },
  },
} as const;
