import express from 'express';
import { 
  getMembers, 
  createMember, 
  updateMember, 
  deleteMember, 
  getSettlements, 
  getDailySummaries, 
  backupDatabase, 
  restoreDatabase,
  toggleMemberSettlement
} from '../controllers/adminController.js';
import { getAllExpenses, updateExpenseStatus, deleteExpense } from '../controllers/expenseController.js';
import { exportExcelReport, exportCSVReport } from '../controllers/reportsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Apply admin role-guards globally on this router
router.use(authenticateToken);
router.use(requireRole('admin'));

// Member management
router.get('/members', getMembers);
router.post('/members', createMember);
router.put('/members/:id', updateMember);
router.delete('/members/:id', deleteMember);
router.put('/members/:id/settle', toggleMemberSettlement);

// Expense review & actions
router.get('/expenses', getAllExpenses);
router.put('/expenses/:id/status', updateExpenseStatus);
router.delete('/expenses/:id', deleteExpense);

// Analytics & Financial reports
router.get('/settlements', getSettlements);
router.get('/daily-summaries', getDailySummaries);
router.get('/reports/excel', exportExcelReport);
router.get('/reports/csv', exportCSVReport);

// Database security options
router.get('/backup', backupDatabase);
router.post('/restore', restoreDatabase);

export default router;
