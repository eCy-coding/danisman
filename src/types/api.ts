// Frontend-safe API types derived from Prisma schema
// Never includes sensitive fields (passwordHash, totpSecret, tokenHash)

// ─── Generic API wrappers ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  ok: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
  details?: Record<string, string>;
}

// ─── Enums (mirror Prisma enums) ─────────────────────────────────────────────

export type UserRole = 'USER' | 'CLIENT' | 'CONSULTANT' | 'ADMIN' | 'PREMIUM';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export type InteractionType =
  | 'PAGE_VIEW'
  | 'CTA_CLICK'
  | 'FORM_SUBMIT'
  | 'BOOKING_START'
  | 'DOWNLOAD'
  | 'SCROLL_DEPTH';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionDto {
  id: string;
  jti: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface ServiceDto {
  id: string;
  slug: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  iconName: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Booking ──────────────────────────────────────────────────────────────────

export interface BookingDto {
  id: string;
  userId: string;
  serviceId: string | null;
  status: BookingStatus;
  scheduledAt: string;
  durationMin: number;
  notesTr: string | null;
  notesEn: string | null;
  meetingUrl: string | null;
  cancellationReason: string | null;
  calcomUid: string | null;
  reminder24hSent: boolean;
  reminder1hSent: boolean;
  feedbackEmailSent: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<UserDto, 'id' | 'email' | 'name'>;
  service?: Pick<ServiceDto, 'id' | 'slug' | 'titleTr' | 'titleEn'> | null;
}

export interface BookingFeedbackDto {
  id: string;
  bookingId: string;
  score: number;
  comment: string | null;
  submittedAt: string;
  tokenUsed: boolean;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export interface ContactSubmissionDto {
  id: string;
  fullName: string;
  email: string;
  company: string | null;
  phone: string | null;
  service: string | null;
  messageTr: string | null;
  messageEn: string | null;
  source: string | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export interface NewsletterSubscriberDto {
  id: string;
  email: string;
  consent: boolean;
  source: string | null;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface SiteConfigEntry {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'boolean' | 'number' | 'json';
  label: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginPayload {
  email: string;
  password: string;
  totpCode?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}
