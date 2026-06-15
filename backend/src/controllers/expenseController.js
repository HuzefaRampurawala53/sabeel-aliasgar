import { queryRun, queryAll, queryGet } from '../config/db.js';

// Get own expenses for logged-in member
export const getOwnExpenses = async (req, res) => {
  const memberId = req.user.id;
  const { status, category, search, startDate, endDate } = req.query;

  let query = `
    SELECT * FROM expenses 
    WHERE member_id = ?
  `;
  const params = [memberId];

  if (status) {
    query += ` AND approval_status = ?`;
    params.push(status);
  }
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  if (startDate) {
    query += ` AND purchase_date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND purchase_date <= ?`;
    params.push(endDate);
  }
  if (search) {
    query += ` AND (title LIKE ? OR item_purchased LIKE ? OR vendor_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY purchase_date DESC, created_at DESC`;

  try {
    const expenses = await queryAll(query, params);
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching member expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new expense entry
export const createExpense = async (req, res) => {
  const memberId = req.user.id;
  const {
    title,
    itemPurchased,
    category,
    quantity,
    amount,
    vendorName,
    paymentMethod,
    purchaseDate,
    notes
  } = req.body;

  if (!title || !itemPurchased || !category || !amount || !paymentMethod || !purchaseDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  const numericQuantity = parseFloat(quantity || 1.00);

  // Handle uploaded proof file (screenshot/receipt/PDF)
  let proofUrl = null;
  let proofType = null;

  if (req.file) {
    proofUrl = `/uploads/${req.file.filename}`;
    proofType = req.file.mimetype.includes('pdf') ? 'pdf' : 'image';
  }

  try {
    // 1. Insert expense
    const result = await queryRun(
      `INSERT INTO expenses (
        member_id, title, item_purchased, category, quantity, amount, 
        vendor_name, payment_method, proof_url, proof_type, purchase_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memberId,
        title,
        itemPurchased,
        category,
        numericQuantity,
        numericAmount,
        vendorName || '',
        paymentMethod,
        proofUrl,
        proofType,
        purchaseDate,
        notes || ''
      ]
    );

    const expenseId = result.lastID;

    // 2. Add notifications for Admins
    const admins = await queryAll("SELECT id FROM users WHERE role = 'admin'");
    const memberName = req.user.fullName;
    for (const admin of admins) {
      await queryRun(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [
          admin.id,
          'New Expense Submitted',
          `${memberName} has submitted a new expense of ₹${numericAmount} for "${itemPurchased}".`
        ]
      );
    }

    // 3. Log action
    await queryRun(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [
        memberId,
        'Submit Expense',
        `Submitted expense ID ${expenseId} for ${itemPurchased} of amount ₹${numericAmount}`
      ]
    );

    res.status(201).json({
      message: 'Expense submitted successfully',
      expenseId
    });

  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Get all expenses (filtered)
export const getAllExpenses = async (req, res) => {
  const { memberId, status, category, paymentMethod, search, startDate, endDate } = req.query;

  let query = `
    SELECT e.*, u.full_name as member_name, u.username as member_username
    FROM expenses e
    JOIN users u ON e.member_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (memberId) {
    query += ` AND e.member_id = ?`;
    params.push(memberId);
  }
  if (status) {
    query += ` AND e.approval_status = ?`;
    params.push(status);
  }
  if (category) {
    query += ` AND e.category = ?`;
    params.push(category);
  }
  if (paymentMethod) {
    query += ` AND e.payment_method = ?`;
    params.push(paymentMethod);
  }
  if (startDate) {
    query += ` AND e.purchase_date >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND e.purchase_date <= ?`;
    params.push(endDate);
  }
  if (search) {
    query += ` AND (e.title LIKE ? OR e.item_purchased LIKE ? OR e.vendor_name LIKE ? OR u.full_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY e.purchase_date DESC, e.created_at DESC`;

  try {
    const expenses = await queryAll(query, params);
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching all expenses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Approve or Reject Expense
export const updateExpenseStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' or 'Rejected'
  const adminId = req.user.id;

  if (!status || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "Approved" or "Rejected"' });
  }

  try {
    // 1. Get the expense to find the owner and details
    const expense = await queryGet('SELECT * FROM expenses WHERE id = ?', [id]);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.approval_status === status) {
      return res.status(400).json({ message: `Expense is already ${status}` });
    }

    // 2. Update status
    await queryRun(
      'UPDATE expenses SET approval_status = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, adminId, id]
    );

    // 3. Create notification for the member
    await queryRun(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [
        expense.member_id,
        `Expense ${status}`,
        `Your expense of ₹${expense.amount} for "${expense.item_purchased}" has been ${status.toLowerCase()} by the admin.`
      ]
    );

    // 4. Log Action
    await queryRun(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [
        adminId,
        `${status} Expense`,
        `${status} expense ID ${id} of amount ₹${expense.amount}`
      ]
    );

    // 5. Trigger Daily Summary recalculation for that purchase date
    await recalculateDailySummary(expense.purchase_date);

    res.status(200).json({ message: `Expense has been successfully ${status}` });

  } catch (error) {
    console.error('Error updating expense status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper: Recalculate daily financial summary for a given date
export const recalculateDailySummary = async (dateStr) => {
  try {
    // Fetch total contributions for that date (assuming daily summaries log contributions made on that day)
    // Wait, in this Sabeel app, contributions are deposited before start. If we track user contributions, we can summarize
    // let's compute daily parameters:
    // Today's Contributions: users updated on this day? No, users have contribution_amount. Let's see if we track deposit logs. 
    // To make it simple, we can compute today's total contributions based on users created or we can track deposits.
    // Let's assume daily summaries can just aggregate today's approved expenses.
    
    const expensesToday = await queryAll(
      "SELECT amount, payment_method FROM expenses WHERE purchase_date = ? AND approval_status = 'Approved'",
      [dateStr]
    );

    let expensesTotal = 0;
    let cashExpenses = 0;
    let onlineExpenses = 0;

    expensesToday.forEach((exp) => {
      expensesTotal += exp.amount;
      if (exp.payment_method === 'Cash') {
        cashExpenses += exp.amount;
      } else {
        onlineExpenses += exp.amount;
      }
    });

    // Let's check if there is an existing entry for this day
    const existing = await queryGet('SELECT * FROM daily_summaries WHERE summary_date = ?', [dateStr]);

    // Calculate opening/closing balances:
    // For Sabeel (10 days), opening balance of a day is the closing balance of the previous day.
    // Let's find the closing balance of the previous day.
    const prevDay = await queryGet(
      'SELECT closing_balance FROM daily_summaries WHERE summary_date < ? ORDER BY summary_date DESC LIMIT 1',
      [dateStr]
    );
    const openingBalance = prevDay ? prevDay.closing_balance : 0.00;

    // Today's contributions: For simplicity in the daily summaries, since contributions are set at user-level,
    // we can log if a new member was added today or we can sum contributions. Let's assume contributions are deposited on the day the user is created.
    const contributionsRow = await queryGet(
      "SELECT SUM(contribution_amount) as total FROM users WHERE date(created_at) = ?",
      [dateStr]
    );
    
    // Also include approved donations for this date
    const donationsRow = await queryGet(
      "SELECT SUM(amount) as total FROM donations WHERE date(created_at) = ? AND approval_status = 'Approved'",
      [dateStr]
    );
    const donationsTotal = donationsRow.total || 0.00;
    
    const contributionsTotal = (contributionsRow.total || 0.00) + donationsTotal;

    const closingBalance = openingBalance + contributionsTotal - expensesTotal;

    if (existing) {
      await queryRun(
        `UPDATE daily_summaries 
         SET opening_balance = ?, contributions_total = ?, expenses_total = ?, closing_balance = ?, cash_expenses = ?, online_expenses = ?, updated_at = CURRENT_TIMESTAMP
         WHERE summary_date = ?`,
        [openingBalance, contributionsTotal, expensesTotal, closingBalance, cashExpenses, onlineExpenses, dateStr]
      );
    } else {
      await queryRun(
        `INSERT INTO daily_summaries (summary_date, opening_balance, contributions_total, expenses_total, closing_balance, cash_expenses, online_expenses)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dateStr, openingBalance, contributionsTotal, expensesTotal, closingBalance, cashExpenses, onlineExpenses]
      );
    }

    // Trigger update of subsequent days
    const nextDays = await queryAll('SELECT summary_date FROM daily_summaries WHERE summary_date > ? ORDER BY summary_date ASC', [dateStr]);
    for (const next of nextDays) {
      await recalculateDailySummary(next.summary_date);
    }

  } catch (error) {
    console.error('Error recalculating daily summary:', error);
  }
};
