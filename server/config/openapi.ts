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
    description: 'RESTful API for the EcyPro Premium Consulting SAAS platform. Provides authentication, booking management, analytics tracking, and real-time dashboard streaming.',
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
          serviceType: { type: 'string', enum: ['STRATEGY', 'TECHNOLOGY', 'OPERATIONS', 'FINANCE', 'HR'] },
          date: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
        },
      },
    },
  },
} as const;
