import { Router } from 'express';
import {
  createBooking,
  listBookings,
  getBookingById,
  deleteBooking,
  updateBookingStatus,
} from '../controllers/bookingController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

router.post('/', createBooking);
router.get('/', listBookings);
router.get('/:id', getBookingById);                            // Phase 20 C1
router.delete('/:id', deleteBooking);                          // Phase 20 C2
router.patch('/:id/status', requireRole('ADMIN'), updateBookingStatus);

export default router;
