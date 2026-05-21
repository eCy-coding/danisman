/**
 * eCyPro — OpenAPI 3.0 Specification
 *
 * Machine-readable API documentation for the eCyPro backend.
 * Serves at /api/docs endpoint.
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'eCyPro Premium Consulting API',
    version: '1.0.0',
    description:
      'RESTful API for the eCyPro Premium Consulting SAAS platform. Provides authentication, booking management, analytics tracking, and real-time dashboard streaming.',
    contact: {
      name: 'eCyPro Support',
      email: 'support@ecypro.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Development (v1 canonical)',
    },
    {
      url: 'https://api.ecypro.com/api/v1',
      description: 'Production (v1 canonical)',
    },
    {
      url: 'http://localhost:3001/api',
      description: 'Development (legacy alias, sunsets 2026-12-01)',
    },
    {
      url: 'https://api.ecypro.com/api',
      description: 'Production (legacy alias, sunsets 2026-12-01)',
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
    { name: 'Search', description: 'Full-text search (Postgres tsvector + GIN)' },
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
        description:
          'prom-client exposition. Custom metrics: http_requests_total, http_request_duration_seconds, cache_hits_total, cache_misses_total, bullmq_jobs_total, bullmq_jobs_pending, db_pool_active, db_pool_idle. Optional Bearer/Basic auth via METRICS_BEARER or METRICS_BASIC_USER/PASS env.',
        operationId: 'getMetrics',
        responses: {
          '200': {
            description: 'Metrics in exposition format',
            content: { 'text/plain': { schema: { type: 'string' } } },
          },
          '401': { description: 'Auth required (when METRICS_BEARER/BASIC is set)' },
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
      // ─── P23 BE Track 2 — Outbound Webhook subscriptions ─────────────
      // Yönetim arayüzünden oluşturulan, partner sistemlere event push
      // eden abonelikleri tanımlar. `secret` yalnızca create cevabında
      // döner — list / detail çağrılarında elide edilir.
      WebhookSubscriptionCreate: {
        type: 'object',
        required: ['url', 'events'],
        properties: {
          url: {
            type: 'string',
            format: 'uri',
            description: 'HTTPS callback URL (http allowed only in dev)',
            example: 'https://partner.example.com/hooks/ecypro',
          },
          events: {
            type: 'array',
            description: 'Event type filter (whitelist). Empty array = none.',
            items: { type: 'string' },
            example: ['booking.created', 'booking.cancelled'],
          },
          userId: {
            type: 'string',
            format: 'uuid',
            description:
              'Owner override — only honoured for ADMIN callers. Regular users always create under their own id.',
          },
        },
      },
      WebhookSubscriptionPatch: {
        type: 'object',
        description: 'En az bir alan zorunlu. Hepsi opsiyonel; verilen alanlar güncellenir.',
        properties: {
          url: { type: 'string', format: 'uri' },
          events: { type: 'array', items: { type: 'string' } },
          active: {
            type: 'boolean',
            description:
              'Re-enabling (false→true) failureCount sayacını sıfırlar; auto-deactivation breaker resetlenir.',
          },
        },
      },
      WebhookSubscription: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          url: { type: 'string', format: 'uri' },
          events: { type: 'array', items: { type: 'string' } },
          active: { type: 'boolean' },
          failureCount: { type: 'integer', minimum: 0 },
          lastSuccess: { type: 'string', format: 'date-time', nullable: true },
          lastFailure: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      WebhookSubscriptionCreateResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          subscription: { $ref: '#/components/schemas/WebhookSubscription' },
          secret: {
            type: 'string',
            description:
              'HMAC-SHA256 imzalama için 64-hex (256-bit) secret. **Bu değer yalnızca create cevabında döner**; istemci güvenli şekilde saklamalıdır.',
          },
        },
      },
      WebhookDeliveryItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          eventType: { type: 'string' },
          status: {
            type: 'string',
            enum: ['pending', 'success', 'failed', 'retrying'],
          },
          attemptCount: { type: 'integer', minimum: 0 },
          lastAttemptAt: { type: 'string', format: 'date-time', nullable: true },
          responseStatus: { type: 'integer', nullable: true },
          errorMessage: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      // ─── P23 BE Track 2 — SSE stream ─────────────────────────────────
      StreamPublishInput: {
        type: 'object',
        required: ['topic'],
        properties: {
          topic: {
            type: 'string',
            pattern: '^[a-z0-9:_-]{1,64}$',
            description: 'Topic identifier (1-64 chars, [a-z0-9:_-]).',
            example: 'system:notice',
          },
          type: {
            type: 'string',
            description: 'SSE event type name (becomes `event:` line). Optional.',
            example: 'banner.update',
          },
          data: {
            description: 'Arbitrary JSON-serialisable payload (`data:` line).',
          },
        },
      },
      StreamPublishResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          topic: { type: 'string' },
          fanout: {
            type: 'integer',
            minimum: 0,
            description: 'Anlık olarak event ulaştırılan abone sayısı.',
          },
        },
      },
      StreamStats: {
        type: 'object',
        description: 'In-process SSE manager telemetrisi (admin only).',
        properties: {
          status: { type: 'string', example: 'ok' },
          connections: { type: 'integer', minimum: 0 },
          topics: { type: 'integer', minimum: 0 },
          perTopic: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            description: 'topic → connection count map.',
          },
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

    // ─── P15-BE Aşama 2: Documentation backfill (formerly 58 undocumented) ──────
    // Each entry below carries: tag, summary, security (when auth required),
    // request/response shapes at the level needed for SDK gen + Swagger UI.
    // Internal admin/AI endpoints are documented at "minimal" level (path +
    // verb + responses + security) per the BE contract policy in
    // outputs/P15_BE_OPENAPI.md.

    // === Health / Docs / Status ===
    '/docs': {
      get: {
        tags: ['Health'],
        summary: 'Swagger UI for /docs.json (admin-gated in production)',
        operationId: 'getDocsUi',
        responses: {
          '200': { description: 'HTML page rendering Swagger UI' },
          '401': { description: 'Unauthenticated (production + DOCS_PUBLIC unset)' },
          '403': { description: 'Non-admin requesting docs in production' },
        },
      },
    },
    '/docs.json': {
      get: {
        tags: ['Health'],
        summary: 'Raw OpenAPI specification as JSON',
        operationId: 'getDocsJson',
        responses: {
          '200': {
            description: 'OpenAPI 3.0 spec',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/health/services': {
      get: {
        tags: ['Health'],
        summary: 'Deep external integration health check',
        description:
          'Pings DB, Redis, Cal.com, Telegram, Resend, Logtail, Gemini, Docker. Returns overall: ok | degraded | critical.',
        operationId: 'getHealthServices',
        responses: {
          '200': { description: 'All checks within tolerance' },
          '503': { description: 'One or more checks critical' },
        },
      },
    },
    '/status': {
      get: {
        tags: ['Health'],
        summary: 'Public status page payload (operational | degraded | critical)',
        operationId: 'getStatus',
        responses: {
          '200': { description: 'Status snapshot' },
          '503': { description: 'Major outage' },
        },
      },
    },

    // === Auth — logout / refresh / password change / 2FA management ===
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Sign out current session (revoke + blacklist jti)',
        operationId: 'logout',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Signed out' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token → issue new access + refresh pair',
        operationId: 'refreshToken',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'New token pair' },
          '401': { description: 'NOT_FOUND | REVOKED | EXPIRED | FAMILY_REVOKED' },
        },
      },
    },
    '/auth/password/change': {
      post: {
        tags: ['Auth'],
        summary: 'Change password (revokes all sessions on success)',
        description:
          'Verifies currentPassword, gates newPassword via HIBP, then signs out every device including this one.',
        operationId: 'changePassword',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', minLength: 8 },
                  newPassword: { type: 'string', minLength: 12 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password changed — all sessions revoked' },
          '400': { description: 'NO_PASSWORD_SET (OAuth-only account)' },
          '401': { description: 'INVALID_CREDENTIALS' },
          '422': { description: 'PASSWORD_UNCHANGED | PASSWORD_BREACHED' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/auth/2fa/disable': {
      post: {
        tags: ['Auth'],
        summary: 'Disable 2FA after verifying a valid TOTP code',
        operationId: 'disable2fa',
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
          '200': { description: '2FA disabled' },
          '401': { description: 'Invalid TOTP code' },
        },
      },
    },
    '/auth/2fa/validate': {
      post: {
        tags: ['Auth'],
        summary: 'Verify a TOTP code for a partially-authenticated session',
        operationId: 'validate2fa',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'code'],
                properties: {
                  userId: { type: 'string', format: 'uuid' },
                  code: { type: 'string', pattern: '^[0-9]{6}$' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '2FA validated — full session granted' },
          '401': { description: 'Invalid code or session' },
        },
      },
    },
    '/auth/2fa/backup-codes': {
      post: {
        tags: ['Auth'],
        summary: 'Regenerate backup codes (invalidates previous set)',
        operationId: 'regen2faBackupCodes',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'New backup codes (display once)' },
        },
      },
    },

    // === Bookings — owned-resource CRUD ===
    '/bookings/{id}': {
      get: {
        tags: ['Bookings'],
        summary: 'Fetch a single booking (must be owner or admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Booking detail' },
          '403': { description: 'Forbidden — not owner' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Bookings'],
        summary: 'Cancel a booking (owner) — soft delete',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Booking cancelled' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/bookings/{id}/status': {
      patch: {
        tags: ['Bookings'],
        summary: 'Update booking status (admin or consultant)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Status updated' },
          '403': { description: 'Forbidden' },
        },
      },
    },

    // === Webhooks ===
    '/webhooks/cal': {
      post: {
        tags: ['Webhooks'],
        summary: 'Cal.com booking lifecycle webhook receiver',
        description:
          'Verifies X-Cal-Signature (HMAC-SHA256 over raw body, shared secret CAL_WEBHOOK_SECRET). Rejects requests with missing or invalid signature.',
        operationId: 'webhookCal',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: {
          '200': { description: 'Webhook accepted + processed' },
          '401': { description: 'INVALID_SIGNATURE' },
          '400': { description: 'MALFORMED_PAYLOAD' },
        },
      },
    },

    // === Analytics ===
    '/analytics/interaction': {
      post: {
        tags: ['Analytics'],
        summary: 'Track user interaction (click, scroll, conversion)',
        operationId: 'trackInteraction',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string' },
                  type: { type: 'string', example: 'click' },
                  target: { type: 'string' },
                  metadata: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Recorded' } },
      },
    },
    '/analytics/error': {
      post: {
        tags: ['Analytics'],
        summary: 'Report a frontend error (forwarded to Sentry)',
        operationId: 'reportError',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string' },
                  stack: { type: 'string' },
                  url: { type: 'string' },
                  userAgent: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Logged' } },
      },
    },
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Aggregate analytics dashboard data (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Dashboard payload' } },
      },
    },
    '/analytics/errors': {
      get: {
        tags: ['Analytics'],
        summary: 'Recent error log entries (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Paginated error list' } },
      },
    },
    '/analytics/errors/stats': {
      get: {
        tags: ['Analytics'],
        summary: 'Error frequency rollups (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Error stats (24h, 7d, 30d)' } },
      },
    },

    // === Newsletter ===
    '/newsletter/stats': {
      get: {
        tags: ['Newsletter'],
        summary: 'Subscriber count + growth (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Newsletter analytics' } },
      },
    },

    // === Admin ===
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Top-line platform KPI snapshot (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'KPI bundle' } },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List users with role + verification + activity (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          {
            in: 'query',
            name: 'role',
            schema: { type: 'string', enum: ['USER', 'ADMIN', 'CONSULTANT'] },
          },
        ],
        responses: { '200': { description: 'Paginated user list' } },
      },
    },
    '/admin/users/{id}/role': {
      patch: {
        tags: ['Admin'],
        summary: 'Update user role (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['USER', 'ADMIN', 'CONSULTANT'] },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Role updated' } },
      },
    },
    '/admin/users/{id}/active': {
      patch: {
        tags: ['Admin'],
        summary: 'Activate or deactivate a user account (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: { isActive: { type: 'boolean' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Active flag updated' } },
      },
    },
    // P16 BE Track 2 / Aşama 1 — Cache observability
    '/admin/cache/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Read in-process response cache stats (admin)',
        operationId: 'adminCacheStats',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Cache hit/miss/eviction counters' } },
      },
    },
    '/admin/cache/invalidate': {
      post: {
        tags: ['Admin'],
        summary: 'Purge cached responses by path prefix (admin)',
        operationId: 'adminCacheInvalidate',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prefix'],
                properties: {
                  prefix: { type: 'string', minLength: 2, example: '/api/geo/' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Purge count returned' },
          '400': { description: 'Missing or invalid prefix' },
        },
      },
    },
    '/admin/cache': {
      delete: {
        tags: ['Admin'],
        summary: 'Clear the entire response cache (admin)',
        operationId: 'adminCacheClear',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Cache cleared, size before clear returned' } },
      },
    },
    '/admin/cache/warmup': {
      post: {
        tags: ['Admin'],
        summary: 'Trigger post-deploy cache warm-up (admin or CACHE_WARMUP_TOKEN bearer)',
        description:
          'Sequentially fetches the curated top-N read endpoints to fill LRU + Redis caches. Auth: either a valid ADMIN JWT, or `Authorization: Bearer <CACHE_WARMUP_TOKEN>` (minimum 16 chars).',
        operationId: 'adminCacheWarmup',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Warm-up summary (attempted/succeeded/failed/timings)' },
          '401': { description: 'Missing or invalid auth (token + JWT both rejected)' },
          '403': { description: 'JWT presented but role !== ADMIN' },
        },
      },
    },
    // P17 BE Track 2 / Aşama 4 — API key CRUD
    '/admin/api-keys': {
      get: {
        tags: ['Admin'],
        summary: 'List API keys (admin)',
        operationId: 'adminApiKeyList',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'query',
            name: 'includeRevoked',
            schema: { type: 'boolean', default: false },
          },
        ],
        responses: { '200': { description: 'API key list (raw key never returned)' } },
      },
      post: {
        tags: ['Admin'],
        summary: 'Mint a new API key (admin)',
        description: 'Returns the raw key exactly once. The server only persists a SHA-256 hash.',
        operationId: 'adminApiKeyCreate',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'scopes'],
                properties: {
                  name: { type: 'string', minLength: 1, maxLength: 120 },
                  scopes: {
                    type: 'array',
                    items: { type: 'string' },
                    minItems: 1,
                    example: ['read:bookings', 'write:contacts'],
                  },
                  userId: { type: 'string', nullable: true },
                  expiresAt: { type: 'string', format: 'date-time', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'API key minted; rawKey present in response (one-time)' },
          '400': { description: 'Validation error' },
        },
      },
    },
    // P18 BE Track 2 / Aşama 3 — Bull-Board dashboard.
    // Mount serves an interactive HTML UI; we expose it in the spec
    // so the OpenAPI contract test recognises the route surface.
    '/admin/queues': {
      get: {
        tags: ['Admin'],
        summary: 'BullMQ admin dashboard (Bull-Board, HTML)',
        description:
          'HTML UI for queue inspection (waiting/active/delayed/failed counts + retry). ADMIN-only. Additional IP allowlist via ADMIN_QUEUES_IP_ALLOWLIST.',
        operationId: 'adminQueuesDashboard',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Dashboard HTML', content: { 'text/html': {} } },
          '401': { description: 'Authentication required' },
          '403': { description: 'IP not allowlisted or not an admin' },
          '503': { description: 'Bull-Board dependency not installed' },
        },
      },
    },
    '/admin/api-keys/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Revoke an API key (admin)',
        operationId: 'adminApiKeyRevoke',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Revoked (or already revoked)' },
          '404': { description: 'API key not found' },
        },
      },
    },
    // P18 BE Track 2 / Aşama 1 — File upload pipeline.
    '/upload': {
      post: {
        tags: ['Admin'],
        summary: 'Upload an image (multipart/form-data, field name "file")',
        description:
          'Authenticated multipart upload. MIME whitelist: image/jpeg, image/png, image/webp, image/avif. Max 5 MB (UPLOAD_MAX_BYTES override). Returns the canonical URL + hash; deduplicated against existing rows via SHA-256.',
        operationId: 'uploadImage',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { file: { type: 'string', format: 'binary' } },
                required: ['file'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Image accepted; variant fan-out enqueued' },
          '200': { description: 'Existing image returned (hash dedupe)' },
          '400': { description: 'No file field, parse error, etc.' },
          '401': { description: 'Authentication required' },
          '413': { description: 'File exceeds max size' },
          '415': { description: 'MIME not allowed' },
        },
      },
    },
    '/uploads/get': {
      get: {
        tags: ['Admin'],
        summary: 'HMAC-signed object read (local storage adapter only)',
        operationId: 'uploadsGet',
        parameters: [
          { in: 'query', name: 'key', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'exp', required: true, schema: { type: 'integer' } },
          { in: 'query', name: 'sig', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Object bytes', content: { 'application/octet-stream': {} } },
          '400': { description: 'Missing query params' },
          '403': { description: 'Signature invalid or expired' },
          '404': { description: 'Object not found or S3 adapter active' },
        },
      },
    },
    // P17 BE Track 2 / Aşama 3 — Full-text search
    '/search': {
      get: {
        tags: ['Search'],
        summary: 'Full-text search across services (Postgres tsvector + GIN)',
        operationId: 'searchQuery',
        parameters: [
          {
            in: 'query',
            name: 'q',
            required: true,
            schema: { type: 'string', minLength: 1, maxLength: 256 },
          },
          {
            in: 'query',
            name: 'lang',
            schema: { type: 'string', enum: ['tr', 'en'], default: 'tr' },
          },
          {
            in: 'query',
            name: 'limit',
            schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
          },
          { in: 'query', name: 'cursor', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Search results with rank + nextCursor for pagination' },
          '400': { description: 'Missing or oversized q parameter' },
          '500': { description: 'Search backend error' },
        },
      },
    },
    '/admin/contacts': {
      get: {
        tags: ['Admin'],
        summary: 'List inbound contact submissions (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'isRead', schema: { type: 'boolean' } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Paginated contact submissions' } },
      },
    },
    '/admin/contacts/{id}/read': {
      patch: {
        tags: ['Admin'],
        summary: 'Mark a contact submission as read (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Marked read' } },
      },
    },
    '/admin/newsletter': {
      get: {
        tags: ['Admin'],
        summary: 'List newsletter subscribers (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Paginated subscriber list' } },
      },
    },
    '/admin/newsletter/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Hard-unsubscribe a newsletter subscriber (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Unsubscribed' } },
      },
    },
    '/admin/blog': {
      get: {
        tags: ['Admin'],
        summary: 'List blog posts including drafts (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'All posts' } },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create a blog post (admin)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['slug', 'title', 'content'],
                properties: {
                  slug: { type: 'string' },
                  title: { type: 'string' },
                  content: { type: 'string' },
                  status: { type: 'string', enum: ['DRAFT', 'PUBLISHED'] },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Post created' } },
      },
    },
    '/admin/blog/{slug}': {
      get: {
        tags: ['Admin'],
        summary: 'Fetch a blog post by slug including draft (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Post detail' },
          '404': { description: 'Not found' },
        },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Update a blog post (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'Post updated' } },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete a blog post (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Post deleted' } },
      },
    },
    '/admin/settings': {
      get: {
        tags: ['Admin'],
        summary: 'Read platform settings (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Settings bundle' } },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Update platform settings (admin)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'Settings updated' } },
      },
    },

    // === AI ===
    '/ai/health': {
      get: {
        tags: ['Health'],
        summary: 'AI provider health check (Gemini)',
        operationId: 'aiHealth',
        responses: {
          '200': { description: 'AI provider reachable' },
          '503': { description: 'AI provider unavailable' },
        },
      },
    },
    '/ai/models': {
      get: {
        tags: ['Health'],
        summary: 'List available AI models',
        operationId: 'aiModels',
        responses: { '200': { description: 'Model list' } },
      },
    },
    '/ai/complete': {
      post: {
        tags: ['Health'],
        summary: 'Single-turn completion (non-streaming)',
        operationId: 'aiComplete',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt'],
                properties: {
                  prompt: { type: 'string' },
                  model: { type: 'string' },
                  temperature: { type: 'number', minimum: 0, maximum: 2 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Completion text' } },
      },
    },
    '/ai/chat': {
      post: {
        tags: ['Health'],
        summary: 'Multi-turn chat (non-streaming)',
        operationId: 'aiChat',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  messages: { type: 'array', items: { type: 'object' } },
                  model: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Assistant reply' } },
      },
    },
    '/ai/stream': {
      post: {
        tags: ['Health'],
        summary: 'Streaming completion (SSE)',
        operationId: 'aiStream',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'SSE event stream',
            content: { 'text/event-stream': { schema: { type: 'string' } } },
          },
        },
      },
    },
    '/ai/stream/chat': {
      post: {
        tags: ['Health'],
        summary: 'Streaming chat (SSE)',
        operationId: 'aiStreamChat',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'SSE event stream',
            content: { 'text/event-stream': { schema: { type: 'string' } } },
          },
        },
      },
    },

    // === CRM ===
    '/crm/leads/hot': {
      get: {
        tags: ['Admin'],
        summary: 'Top scoring leads (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } }],
        responses: { '200': { description: 'Ordered list of leads' } },
      },
    },
    '/crm/pipeline-stats': {
      get: {
        tags: ['Admin'],
        summary: 'CRM pipeline stage counts (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Stage roll-ups' } },
      },
    },
    '/crm/notify': {
      post: {
        tags: ['Admin'],
        summary: 'Push a Telegram CRM notification (admin)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: { message: { type: 'string' }, severity: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Notification queued' } },
      },
    },
    '/crm/sync-contact': {
      post: {
        tags: ['Admin'],
        summary: 'Sync a contact into the CRM pipeline (admin)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['contactId'],
                properties: { contactId: { type: 'string', format: 'uuid' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Sync queued' } },
      },
    },

    // === Leads ===
    '/leads/score': {
      post: {
        tags: ['Admin'],
        summary: 'Compute lead score for an ad-hoc contact payload',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } },
        },
        responses: { '200': { description: 'Computed score + breakdown' } },
      },
    },
    '/leads/weights': {
      get: {
        tags: ['Admin'],
        summary: 'Active lead scoring weights (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Weight table' } },
      },
    },
    '/leads/{contactId}/score': {
      get: {
        tags: ['Admin'],
        summary: 'Stored lead score for a contact (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: 'path',
            name: 'contactId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: { '200': { description: 'Score + tier' } },
      },
    },

    // === Geo ===
    '/geo/banner': {
      get: {
        tags: ['Health'],
        summary: 'Localized banner content for the visitor country',
        operationId: 'geoBanner',
        responses: { '200': { description: 'Banner payload' } },
      },
    },
    '/geo/lookup': {
      get: {
        tags: ['Health'],
        summary: 'IP → country lookup (server-side proxy)',
        operationId: 'geoLookup',
        parameters: [{ in: 'query', name: 'ip', schema: { type: 'string', format: 'ipv4' } }],
        responses: { '200': { description: 'Country + region' } },
      },
    },
    '/geo/countries': {
      get: {
        tags: ['Health'],
        summary: 'Supported countries directory',
        operationId: 'geoCountries',
        responses: { '200': { description: 'Country list' } },
      },
    },
    '/geo/cache/stats': {
      get: {
        tags: ['Health'],
        summary: 'Geo cache hit-rate diagnostics (admin)',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Cache stats' } },
      },
    },

    // === Contact ===
    '/contact': {
      post: {
        tags: ['Analytics'],
        summary: 'Public contact form submission',
        operationId: 'submitContactForm',
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
                  message: { type: 'string' },
                  company: { type: 'string' },
                  honeypot: { type: 'string', description: 'Anti-bot — must be empty' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Submission recorded' },
          '400': { description: 'Validation error' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },

    // === Feedback (list-own) ===
    '/feedback': {
      get: {
        tags: ['Bookings'],
        summary: 'List feedback submitted by the calling user',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Feedback list' } },
      },
    },

    // === GDPR / KVKK ===
    '/gdpr/status': {
      get: {
        tags: ['Auth'],
        summary: 'Outstanding GDPR export / delete request state for the caller',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'Status payload' } },
      },
    },
    '/gdpr/export': {
      post: {
        tags: ['Auth'],
        summary: 'Trigger a GDPR data export (Article 15)',
        security: [{ BearerAuth: [] }],
        responses: {
          '202': { description: 'Export queued; download link delivered by email' },
          '429': { description: 'Already in flight' },
        },
      },
    },
    '/gdpr/delete': {
      post: {
        tags: ['Auth'],
        summary: 'Request GDPR account deletion (Article 17)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['confirm'],
                properties: {
                  confirm: {
                    type: 'string',
                    enum: ['DELETE'],
                    description: 'Type "DELETE" to confirm',
                  },
                },
              },
            },
          },
        },
        responses: {
          '202': { description: 'Deletion scheduled (30-day grace)' },
          '400': { description: 'Confirmation missing' },
        },
      },
    },

    // === Manage (token-bound public flows) ===
    '/manage/booking': {
      get: {
        tags: ['Bookings'],
        summary: 'Public booking lookup via HMAC-signed manage token',
        parameters: [{ in: 'query', name: 'token', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Booking summary' },
          '400': { description: 'Invalid token' },
        },
      },
    },
    '/manage/booking/cancel': {
      post: {
        tags: ['Bookings'],
        summary: 'Cancel a booking via manage-token (no login)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: { token: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Cancelled' },
          '400': { description: 'Invalid token' },
          '409': { description: 'Already cancelled or in the past' },
        },
      },
    },
    // ─── P23 BE Track 2 / Aşama 2 — Admin Webhook CRUD ────────────────
    // POST   /api/admin/webhooks                — create subscription
    // GET    /api/admin/webhooks                — list (own; admin sees all)
    // PATCH  /api/admin/webhooks/{id}           — update url/events/active
    // DELETE /api/admin/webhooks/{id}           — remove subscription
    '/admin/webhooks': {
      post: {
        tags: ['admin-webhooks'],
        summary: 'P23: Webhook subscription oluştur',
        description:
          'Yeni bir outbound webhook aboneliği yaratır. Yanıtta `secret` döner — bu değer **yalnızca bir kez** verilir ve istemci kalıcı olarak saklamalıdır. ADMIN istemciler `userId` parametresi ile başka bir kullanıcı adına abonelik açabilir; normal kullanıcılar daima kendi adlarına yaratır.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WebhookSubscriptionCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/WebhookSubscriptionCreateResponse' },
              },
            },
          },
          '400': { description: 'Invalid url or events array' },
          '401': { description: 'Auth required' },
        },
      },
      get: {
        tags: ['admin-webhooks'],
        summary: 'P23: Webhook subscription listesi',
        description:
          "Çağıran kullanıcı ADMIN ise tüm abonelikleri, değilse yalnızca kendi `userId`'ına bağlı abonelikleri döndürür. Sıralama: createdAt DESC, max 100 kayıt. `secret` alanı bu yanıtta yer almaz.",
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    subscriptions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/WebhookSubscription' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Auth required' },
        },
      },
    },
    '/admin/webhooks/{id}': {
      patch: {
        tags: ['admin-webhooks'],
        summary: 'P23: Webhook subscription güncelle',
        description:
          '`url`, `events` ve `active` alanlarından en az biri verilmelidir. `active=true` set edildiğinde `failureCount` sıfırlanır (auto-deactivation breaker resetlenir).',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/WebhookSubscriptionPatch' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    subscription: { $ref: '#/components/schemas/WebhookSubscription' },
                  },
                },
              },
            },
          },
          '400': { description: 'no_fields — request body did not contain any updatable field' },
          '401': { description: 'Auth required' },
          '403': { description: 'forbidden — non-admin caller is not the owner' },
          '404': { description: 'not_found' },
        },
      },
      delete: {
        tags: ['admin-webhooks'],
        summary: 'P23: Webhook subscription sil',
        description:
          'Aboneliği veritabanından kalıcı olarak siler. Geçmiş `WebhookDelivery` kayıtları (audit trail) cascade ile kaldırılır.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': { description: 'Deleted' },
          '401': { description: 'Auth required' },
          '403': { description: 'forbidden — non-admin caller is not the owner' },
          '404': { description: 'not_found' },
        },
      },
    },
    '/admin/webhooks/{id}/deliveries': {
      get: {
        tags: ['admin-webhooks'],
        summary: 'P23: Webhook delivery history',
        description:
          'Belirtilen abonelik için son 100 delivery girdisini (createdAt DESC) döndürür. Audit / debug için kullanılır. `payload` body alanı yanıttan elide edilmiştir.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    deliveries: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/WebhookDeliveryItem' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Auth required' },
          '403': { description: 'forbidden — non-admin caller is not the owner' },
          '404': { description: 'not_found' },
        },
      },
    },
    '/admin/webhooks/{id}/retry/{deliveryId}': {
      post: {
        tags: ['admin-webhooks'],
        summary: 'P23: Manual retry of a single delivery',
        description:
          "Tek bir delivery kaydını `pending` statüsüne çekip `webhook-out` queue'suna yeniden ekler. `attemptCount` değeri korunur — audit trail toplam (otomatik + operator) deneme sayısını yansıtır. Yanıtın `mode` alanı queue'nun gerçekten enqueue edildiğini (`bullmq`) veya in-process fallback ile çalıştığını (`memory`) belirtir.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
          {
            in: 'path',
            name: 'deliveryId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Re-enqueued',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    delivery: { type: 'string', format: 'uuid' },
                    mode: { type: 'string', enum: ['bullmq', 'memory'] },
                  },
                },
              },
            },
          },
          '401': { description: 'Auth required' },
          '403': { description: 'forbidden — non-admin caller is not the owner' },
          '404': {
            description:
              'not_found — subscription/delivery missing or delivery does not belong to subscription',
          },
        },
      },
    },
    // ─── P23 BE Track 2 / Aşama 1 — Topic-based SSE stream ───────────
    // GET  /api/stream?topic=a,b           — subscribe (text/event-stream)
    // POST /api/stream/publish             — admin fan-out
    // GET  /api/stream/_stats              — manager telemetry (admin)
    '/stream': {
      get: {
        tags: ['stream'],
        summary: 'P23: SSE subscription',
        description:
          "Virgülle ayrılmış `topic` query parametresi ile bir veya daha çok kanala abone olur. Yalnızca `PUBLIC_TOPICS` (`status:tick`) için anonim erişim açıktır; diğer topic'ler `BearerAuth` zorunludur. Tek connection üzerinde en fazla 8 topic. SSE çıktısı `text/event-stream`; ilk frame `event: subscribed` ile gelir.",
        security: [{ BearerAuth: [] }, {}],
        parameters: [
          {
            in: 'query',
            name: 'topic',
            required: true,
            schema: { type: 'string', example: 'job:done,status:tick' },
            description: 'Comma-separated topic ids ([a-z0-9:_-]{1,64}), max 8.',
          },
        ],
        responses: {
          '200': {
            description: 'SSE stream — `text/event-stream`',
            content: {
              'text/event-stream': {
                schema: { type: 'string', description: 'newline-framed SSE events' },
              },
            },
          },
          '400': { description: 'topic query param required' },
          '401': { description: 'Auth required for non-public topic' },
          '429': { description: 'per-user / per-ip connection limit exceeded' },
          '503': { description: 'process_total_limit — node is at max SSE capacity' },
        },
      },
    },
    '/stream/publish': {
      post: {
        tags: ['stream'],
        summary: 'P23: Admin fan-out to a stream topic',
        description:
          "Bir worker yazmadan tüm aktif aboneye event göndermek için HTTP fan-out. ADMIN-only. Yanıttaki `fanout` alanı event'in anlık ulaştığı abone sayısını verir.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StreamPublishInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Published',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StreamPublishResponse' },
              },
            },
          },
          '400': { description: 'invalid topic' },
          '401': { description: 'Auth required' },
          '403': { description: 'admin only' },
        },
      },
    },
    '/stream/_stats': {
      get: {
        tags: ['stream'],
        summary: 'P23: SSE manager telemetry',
        description:
          "In-process SSE yöneticisinin canlı istatistikleri: aktif connection sayısı, topic dağılımı. ADMIN-only — uçtaki worker / Render dashboard'una alternatif tanı yüzeyi.",
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StreamStats' },
              },
            },
          },
          '401': { description: 'Auth required' },
          '403': { description: 'admin only' },
        },
      },
    },
  },
} as const;
