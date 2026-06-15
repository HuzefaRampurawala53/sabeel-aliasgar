import bcrypt from 'bcryptjs';
import { queryRun, queryAll, queryGet } from '../config/db.js';
import { recalculateDailySummary } from './expenseController.js';
import fs from 'fs';

// Get list of all members and their financial totals
export const getMembers = async (req, res) => {
  try {
    const members = await queryAll(`
      SELECT 
        u.id, 
        u.username, 
        u.full_name, 
        u.role, 
        u.contribution_amount, 
        u.settled,
        COALESCE(SUM(CASE WHEN e.approval_status = 'Approved' THEN e.amount ELSE 0 END), 0) as approved_expenses_total,
        COALESCE(SUM(CASE WHEN e.approval_status = 'Pending' THEN e.amount ELSE 0 END), 0) as pending_expenses_total
      FROM users u
      LEFT JOIN expenses e ON u.id = e.member_id
      WHERE u.role = 'member'
      GROUP BY u.id
      ORDER BY u.full_name ASC
    `);

    res.status(200).json(members);
  } catch (error) {
    console.error('Error fetching members list:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new member user
export const createMember = async (req, res) => {
  const { username, password, fullName, contributionAmount } = req.body;
  const adminId = req.user.id;

  if (!username || !password || !fullName) {
    return res.status(400).json({ message: 'Username, password, and full name are required' });
  }

  try {
    // Check if user exists
    const existing = await queryGet('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const amount = parseFloat(contributionAmount || 0);

    const result = await queryRun(
      'INSERT INTO users (username, password_hash, full_name, role, contribution_amount) VALUES (?, ?, ?, ?, ?)',
      [username, passwordHash, fullName, 'member', amount]
    );

    const newUserId = result.lastID;

    // Log action
    await queryRun(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'Create Member', `Created member ${username} (ID: ${newUserId}) with contribution ₹${amount}`]
    );

    // If today is one of the Sabeel days, trigger daily summary recalculation
    const today = new Date().toISOString().split('T')[0];
    await recalculateDailySummary(today);

    res.status(201).json({ message: 'Member created successfully', userId: newUserId });
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update member contribution or details
export const updateMember = async (req, res) => {
  const { id } = req.params;
  const { fullName, contributionAmount, password } = req.body;
  const adminId = req.user.id;

  try {
    const user = await queryGet("SELECT * FROM users WHERE id = ? AND role = 'member'", [id]);
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }

    let query = 'UPDATE users SET full_name = ?, contribution_amount = ?';
    const params = [fullName || user.full_name, parseFloat(contributionAmount ?? user.contribution_amount)];

    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(passwordHash);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await queryRun(query, params);

    // Notify member about contribution update if changed
    if (parseFloat(contributionAmount) !== user.contribution_amount) {
      await queryRun(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [
          id,
          'Contribution Updated',
          `Your contribution deposit amount has been updated to ₹${contributionAmount} by the admin.`
        ]
      );
    }

    // Log Action
    await queryRun(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'Update Member', `Updated member ID ${id}. New contribution: ₹${contributionAmount}`]
    );

    // Recalculate daily summary for today
    const today = new Date().toISOString().split('T')[0];
    await recalculateDailySummary(today);

    res.status(200).json({ message: 'Member updated successfully' });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete member
export const deleteMember = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    const user = await queryGet("SELECT * FROM users WHERE id = ? AND role = 'member'", [id]);
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await queryRun('DELETE FROM users WHERE id = ?', [id]);

    // Log Action
    await queryRun(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'Delete Member', `Deleted member ${user.username} (ID: ${id})`]
    );

    res.status(200).json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get settlement list with dynamic status
export const getSettlements = async (req, res) => {
  try {
    const users = await queryAll(`
      SELECT 
        u.id, 
        u.full_name, 
        u.contribution_amount, 
        u.settled,
        COALESCE(SUM(CASE WHEN e.approval_status = 'Approved' THEN e.amount ELSE 0 END), 0) as approved_expenses_total
      FROM users u
      LEFT JOIN expenses e ON u.id = e.member_id
      WHERE u.role = 'member'
      GROUP BY u.id
      ORDER BY u.full_name ASC
    `);

    const settlements = users.map((user) => {
      const difference = user.approved_expenses_total - user.contribution_amount;
      let status = 'Settled';
      
      if (user.settled) {
        status = 'Settled';
      } else if (difference > 0) {
        status = `Receive ₹${difference.toFixed(2)}`;
      } else if (difference < 0) {
        status = `Remaining ₹${Math.abs(difference).toFixed(2)}`;
      }

      return {
        memberId: user.id,
        fullName: user.full_name,
        contribution: user.contribution_amount,
        expenses: user.approved_expenses_total,
        difference,
        settled: !!user.settled,
        status
      };
    });

    res.status(200).json(settlements);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get list of daily summaries (Day 1 to Day 10 of Moharram)
export const getDailySummaries = async (req, res) => {
  try {
    const summaries = await queryAll('SELECT * FROM daily_summaries ORDER BY summary_date ASC');
    res.status(200).json(summaries);
  } catch (error) {
    console.error('Error fetching daily summaries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Backup database to JSON
export const backupDatabase = async (req, res) => {
  try {
    const users = await queryAll('SELECT id, username, full_name, role, contribution_amount, created_at FROM users');
    const expenses = await queryAll('SELECT * FROM expenses');
    const summaries = await queryAll('SELECT * FROM daily_summaries');
    const logs = await queryAll('SELECT * FROM audit_logs');

    const backupData = {
      timestamp: new Date().toISOString(),
      users,
      expenses,
      daily_summaries: summaries,
      audit_logs: logs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="sabeel_backup.json"');
    res.status(200).json(backupData);
  } catch (error) {
    console.error('Error backing up database:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Restore database from JSON
export const restoreDatabase = async (req, res) => {
  const adminId = req.user.id;
  if (!req.files || !req.files.backup) {
    return res.status(400).json({ message: 'Backup file is required' });
  }

  const backupFile = req.files.backup;

  try {
    const rawData = fs.readFileSync(backupFile.tempFilePath || backupFile.path);
    const backupData = JSON.parse(rawData);

    if (!backupData.users || !backupData.expenses) {
      return res.status(400).json({ message: 'Invalid backup file structure' });
    }

    // Begin transaction (represented as sequential queries in sqlite for safety)
    await queryRun('DELETE FROM notifications');
    await queryRun('DELETE FROM audit_logs');
    await queryRun('DELETE FROM daily_summaries');
    await queryRun('DELETE FROM expenses');
    await queryRun('DELETE FROM users');

    // Restore Users
    for (const u of backupData.users) {
      await queryRun(
        'INSERT INTO users (id, username, password_hash, full_name, role, contribution_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.username, u.password_hash || '$2a$10$xyz', u.full_name, u.role, u.contribution_amount, u.created_at]
      );
    }

    // Restore Expenses
    for (const e of backupData.expenses) {
      await queryRun(
        `INSERT INTO expenses (
          id, member_id, title, item_purchased, category, quantity, amount, 
          vendor_name, payment_method, approval_status, approved_by, proof_url, proof_type, purchase_date, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e.id, e.member_id, e.title, e.item_purchased, e.category, e.quantity, e.amount,
          e.vendor_name, e.payment_method, e.approval_status, e.approved_by, e.proof_url, e.proof_type, e.purchase_date, e.notes, e.created_at
        ]
      );
    }

    // Restore summaries
    for (const s of backupData.daily_summaries || []) {
      await queryRun(
        'INSERT INTO daily_summaries (summary_date, opening_balance, contributions_total, expenses_total, closing_balance, cash_expenses, online_expenses) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s.summary_date, s.opening_balance, s.contributions_total, s.expenses_total, s.closing_balance, s.cash_expenses, s.online_expenses]
      );
    }

    // Log Action
    await queryRun(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'Restore Database', 'Restored database tables successfully from backup file']
    );

    res.status(200).json({ message: 'Database restored successfully' });
  } catch (error) {
    console.error('Error restoring database:', error);
    res.status(500).json({ message: 'Error parsing backup file or restoring database' });
  }
};

// Toggle member settlement status
export const toggleMemberSettlement = async (req, res) => {
  const { id } = req.params;
  const { settled } = req.body;
  const adminId = req.user.id;

  try {
    const user = await queryGet("SELECT * FROM users WHERE id = ? AND role = 'member'", [id]);
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const value = settled ? 1 : 0;
    await queryRun('UPDATE users SET settled = ? WHERE id = ?', [value, id]);

    // Send notification to member
    await queryRun(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [
        id,
        value ? 'Settlement Completed' : 'Settlement Reopened',
        value 
          ? 'Your final remaining balance has been marked as fully settled/paid.' 
          : 'Your settlement status has been reopened by the admin.'
      ]
    );

    // Log Action
    await queryRun(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [adminId, 'Settle Member', `Marked member ${user.username} (ID: ${id}) settlement as ${value ? 'Settled' : 'Unsettled'}`]
    );

    res.status(200).json({ 
      message: `Member settlement status updated to ${value ? 'Settled' : 'Unsettled'}`,
      settled: !!value 
    });
  } catch (error) {
    console.error('Error toggling member settlement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
