import express from 'express';
import { getOwnExpenses, createExpense } from '../controllers/expenseController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/fileUpload.js';

const router = express.Router();

// Get own expenses (Members only)
router.get('/', authenticateToken, requireRole('member'), getOwnExpenses);

// Submit new expense (Members only, includes upload middleware)
router.post('/', authenticateToken, requireRole('member'), upload.single('proof'), createExpense);

export default router;
