import { queryRun, queryAll, queryGet } from '../config/db.js';
import { recalculateDailySummary } from './expenseController.js';

// Get own donations for logged-in member
export const getOwnDonations = async (req, res) => {
  const memberId = req.user.id;
  try {
    const donations = await queryAll(
      `SELECT * FROM donations WHERE member_id = ? ORDER BY created_at DESC`,
      [memberId]
    );
    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching member donations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new donation entry
export const createDonation = async (req, res) => {
  const { donorName, amount, paymentMethod, memberId: bodyMemberId } = req.body;

  if (!donorName || !amount || !paymentMethod) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  // Handle optional proof file
  let proofUrl = null;
  if (req.file) {
    proofUrl = `/uploads/${req.file.filename}`;
  }

  // Determine member ID and approval status
  let finalMemberId = req.user.id;
  let approvalStatus = 'Pending';

  if (req.user.role === 'admin') {
    approvalStatus = 'Approved';
    finalMemberId = bodyMemberId ? parseInt(bodyMemberId) : null;
  }

  try {
    if (req.file) {
      await queryRun(
        'INSERT INTO uploads (filename, mimetype, data) VALUES (?, ?, ?)',
        [req.file.filename, req.file.mimetype, req.file.buffer]
      );
    }

    const result = await queryRun(
      `INSERT INTO donations (member_id, donor_name, amount, payment_method, proof_url, approval_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [finalMemberId, donorName, numericAmount, paymentMethod, proofUrl, approvalStatus]
    );

    const donationId = result.lastID;

    // Send notifications
    if (req.user.role === 'admin') {
      // If admin logged it for a member, notify the member
      if (finalMemberId) {
        await queryRun(
          'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
          [
            finalMemberId,
            'Donation Logged by Admin',
            `Admin logged a donation of ₹${numericAmount} from "${donorName}" under your name.`
          ]
        );
      }
    } else {
      // If member logged it, notify all admins
      const admins = await queryAll("SELECT id FROM users WHERE role = 'admin'");
      const memberName = req.user.fullName;
      for (const admin of admins) {
        await queryRun(
          'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
          [
            admin.id,
            'New Donation Logged',
            `${memberName} logged a donation of ₹${numericAmount} from "${donorName}".`
          ]
        );
      }
    }

    if (approvalStatus === 'Approved') {
      const today = new Date().toISOString().split('T')[0];
      await recalculateDailySummary(today);
    }

    res.status(201).json({
      message: 'Donation logged successfully',
      donationId
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Get all donations
export const getAllDonations = async (req, res) => {
  try {
    const donations = await queryAll(
      `SELECT d.*, u.full_name as member_name, u.username as member_username
       FROM donations d
       LEFT JOIN users u ON d.member_id = u.id
       ORDER BY d.created_at DESC`
    );
    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching all donations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin: Approve or Reject Donation
export const updateDonationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' or 'Rejected'
  const adminId = req.user.id;

  if (!status || !['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "Approved" or "Rejected"' });
  }

  try {
    const donation = await queryGet('SELECT * FROM donations WHERE id = ?', [id]);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.approval_status === status) {
      return res.status(400).json({ message: `Donation is already ${status}` });
    }

    await queryRun(
      'UPDATE donations SET approval_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    if (donation.member_id) {
      await queryRun(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [
          donation.member_id,
          `Donation ${status}`,
          `The donation of ₹${donation.amount} from "${donation.donor_name}" you logged has been ${status.toLowerCase()} by the admin.`
        ]
      );
    }

    const donationDate = donation.created_at.split(' ')[0];
    await recalculateDailySummary(donationDate);

    res.status(200).json({ message: `Donation has been successfully ${status}` });
  } catch (error) {
    console.error('Error updating donation status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
