import express from 'express';
import { getOwnDonations, createDonation, getAllDonations, updateDonationStatus } from '../controllers/donationController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/fileUpload.js';

const router = express.Router();

// Member endpoints
router.get('/', authenticateToken, requireRole('member'), getOwnDonations);
router.post('/', authenticateToken, upload.single('proof'), createDonation);

// Admin endpoints
router.get('/admin', authenticateToken, requireRole('admin'), getAllDonations);
router.put('/admin/:id/status', authenticateToken, requireRole('admin'), updateDonationStatus);

export default router;
