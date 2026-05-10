// Server-side test environment — sets env vars before any module loads.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-not-for-production-32chars!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/ecypro_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.VITE_PROD_URL = 'http://localhost:5173';
process.env.CAL_COM_WEBHOOK_SECRET = 'test-webhook-secret-32chars-minimum';
process.env.BOOKING_HMAC_SECRET = 'test-booking-hmac-secret-32chars!!';
