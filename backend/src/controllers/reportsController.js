import ExcelJS from 'exceljs';
import { queryAll } from '../config/db.js';

// Export complete data to Excel sheet (multi-sheet workbook)
export const exportExcelReport = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sabeel E Aliasgar Management';
    workbook.created = new Date();

    // 1. Members Sheet
    const members = await queryAll("SELECT id, username, full_name, contribution_amount, created_at FROM users WHERE role = 'member'");
    const sheetMembers = workbook.addWorksheet('Members');
    sheetMembers.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Username', key: 'username', width: 15 },
      { header: 'Full Name', key: 'full_name', width: 25 },
      { header: 'Contribution (₹)', key: 'contribution_amount', width: 18 },
      { header: 'Registered On', key: 'created_at', width: 20 }
    ];
    members.forEach((m) => sheetMembers.addRow(m));
    sheetMembers.getRow(1).font = { bold: true };

    // 2. Contributions Sheet
    const sheetContributions = workbook.addWorksheet('Contributions');
    sheetContributions.columns = [
      { header: 'Member Name', key: 'full_name', width: 25 },
      { header: 'Contribution Amount (₹)', key: 'contribution_amount', width: 25 }
    ];
    members.forEach((m) => {
      sheetContributions.addRow({
        full_name: m.full_name,
        contribution_amount: m.contribution_amount
      });
    });
    sheetContributions.getRow(1).font = { bold: true };

    // 3. Expenses Sheet
    const expenses = await queryAll(`
      SELECT e.*, COALESCE(u.full_name, 'Deleted User') as member_name 
      FROM expenses e 
      LEFT JOIN users u ON e.member_id = u.id
      ORDER BY e.purchase_date ASC
    `);
    const sheetExpenses = workbook.addWorksheet('Expenses');
    sheetExpenses.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Member Name', key: 'member_name', width: 22 },
      { header: 'Title', key: 'title', width: 20 },
      { header: 'Item Purchased', key: 'item_purchased', width: 22 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Qty', key: 'quantity', width: 8 },
      { header: 'Amount (₹)', key: 'amount', width: 15 },
      { header: 'Vendor', key: 'vendor_name', width: 20 },
      { header: 'Payment Method', key: 'payment_method', width: 18 },
      { header: 'Status', key: 'approval_status', width: 12 },
      { header: 'Purchase Date', key: 'purchase_date', width: 15 }
    ];
    expenses.forEach((e) => sheetExpenses.addRow(e));
    sheetExpenses.getRow(1).font = { bold: true };

    // 3.5. Donations Sheet
    const donations = await queryAll(`
      SELECT d.*, COALESCE(u.full_name, 'Direct / Deleted User') as member_name 
      FROM donations d
      LEFT JOIN users u ON d.member_id = u.id
      ORDER BY d.created_at ASC
    `);
    const sheetDonations = workbook.addWorksheet('Donations');
    sheetDonations.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Logged By Member', key: 'member_name', width: 25 },
      { header: 'Donor Name', key: 'donor_name', width: 25 },
      { header: 'Amount (₹)', key: 'amount', width: 15 },
      { header: 'Payment Method', key: 'payment_method', width: 18 },
      { header: 'Status', key: 'approval_status', width: 12 },
      { header: 'Date Logged', key: 'created_at', width: 20 }
    ];
    donations.forEach((d) => sheetDonations.addRow(d));
    sheetDonations.getRow(1).font = { bold: true };

    // 4. Settlements Sheet
    const settlementsSheet = workbook.addWorksheet('Settlements');
    settlementsSheet.columns = [
      { header: 'Member Name', key: 'fullName', width: 25 },
      { header: 'Contribution (₹)', key: 'contribution', width: 20 },
      { header: 'Expenses Paid (₹)', key: 'expenses', width: 20 },
      { header: 'Difference (₹)', key: 'difference', width: 20 },
      { header: 'Settlement Status', key: 'status', width: 25 }
    ];

    members.forEach((m) => {
      const userExpenses = expenses
        .filter((e) => e.member_id === m.id && e.approval_status === 'Approved')
        .reduce((sum, e) => sum + e.amount, 0);

      const diff = userExpenses - m.contribution_amount;
      let status = 'Settled';
      if (diff > 0) {
        status = `Receive ₹${diff.toFixed(2)}`;
      } else if (diff < 0) {
        status = `Remaining ₹${Math.abs(diff).toFixed(2)}`;
      }

      settlementsSheet.addRow({
        fullName: m.full_name,
        contribution: m.contribution_amount,
        expenses: userExpenses,
        difference: diff,
        status: status
      });
    });
    settlementsSheet.getRow(1).font = { bold: true };

    // 5. Daily Summary Sheet
    const dailySummaries = await queryAll('SELECT * FROM daily_summaries ORDER BY summary_date ASC');
    const dailySheet = workbook.addWorksheet('Daily Summary');
    dailySheet.columns = [
      { header: 'Date', key: 'summary_date', width: 15 },
      { header: 'Opening Balance (₹)', key: 'opening_balance', width: 20 },
      { header: 'Today\'s Contributions (₹)', key: 'contributions_total', width: 25 },
      { header: 'Today\'s Expenses (₹)', key: 'expenses_total', width: 22 },
      { header: 'Closing Balance (₹)', key: 'closing_balance', width: 20 },
      { header: 'Cash Spent (₹)', key: 'cash_expenses', width: 18 },
      { header: 'Online Spent (₹)', key: 'online_expenses', width: 18 }
    ];
    dailySummaries.forEach((d) => dailySheet.addRow(d));
    dailySheet.getRow(1).font = { bold: true };

    // Write buffer and respond
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sabeel_financial_report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
};

// Export raw lists to CSV file
export const exportCSVReport = async (req, res) => {
  try {
    const expenses = await queryAll(`
      SELECT e.purchase_date, COALESCE(u.full_name, 'Deleted User') as member_name, e.item_purchased, e.category, e.amount, e.payment_method, e.approval_status
      FROM expenses e 
      LEFT JOIN users u ON e.member_id = u.id
      ORDER BY e.purchase_date ASC
    `);

    let csvContent = 'Date,Member Name,Item,Category,Amount (INR),Payment Method,Status\n';
    expenses.forEach((e) => {
      // Escape commas in names/items if they exist
      const name = `"${e.member_name.replace(/"/g, '""')}"`;
      const item = `"${e.item_purchased.replace(/"/g, '""')}"`;
      const cat = `"${e.category.replace(/"/g, '""')}"`;
      csvContent += `${e.purchase_date},${name},${item},${cat},${e.amount},${e.payment_method},${e.approval_status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sabeel_expenses_report.csv"');
    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500).json({ message: 'Error generating report' });
  }
};
