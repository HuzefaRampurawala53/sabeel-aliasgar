import React, { useState, useEffect } from 'react';
import { useAuth, VITE_API_URL } from '../../context/AuthContext';
import { 
  LogOut, Shield, Users, Wallet, TrendingUp, AlertCircle, 
  CreditCard, Check, X, FileSpreadsheet, Download, RefreshCw, 
  Trash2, UserPlus, Eye, Calendar, DollarSign, Database, 
  ChevronRight, CheckCircle2, XCircle, Sun, Moon, Edit3, FileText, HeartHandshake
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import sabeelLogo from '../../assets/sabeel_logo.jpg';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const VITE_BACKEND_URL = VITE_API_URL.replace('/api', '');
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [donations, setDonations] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);
  const [activeTab, setActiveTab] = useState('approvals');
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Member Form Modal State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberUsername, setMemberUsername] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberFullName, setMemberFullName] = useState('');
  const [memberContribution, setMemberContribution] = useState('');
  const [memberFormError, setMemberFormError] = useState('');
  const [memberFormSuccess, setMemberFormSuccess] = useState('');

  // Donation Form Modal State (Admin logging on behalf of member)
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationMember, setDonationMember] = useState(null);
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationPaymentMethod, setDonationPaymentMethod] = useState('Cash');
  const [donationProofFile, setDonationProofFile] = useState(null);
  const [donationFormError, setDonationFormError] = useState('');
  const [donationFormSuccess, setDonationFormSuccess] = useState('');
  const [submittingDonation, setSubmittingDonation] = useState(false);

  // Backup file state
  const [backupFile, setBackupFile] = useState(null);
  const [backupStatus, setBackupStatus] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sabeel_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [mRes, eRes, sRes, dRes, donRes] = await Promise.all([
        axios.get(`${VITE_API_URL}/admin/members`, { headers }),
        axios.get(`${VITE_API_URL}/admin/expenses`, { headers }),
        axios.get(`${VITE_API_URL}/admin/settlements`, { headers }),
        axios.get(`${VITE_API_URL}/admin/daily-summaries`, { headers }),
        axios.get(`${VITE_API_URL}/donations/admin`, { headers })
      ]);

      setMembers(mRes.data);
      setExpenses(eRes.data);
      setSettlements(sRes.data);
      setDailySummaries(dRes.data);
      setDonations(donRes.data);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Expense Approvals Actions
  const handleApproveExpense = async (id) => {
    try {
      const token = localStorage.getItem('sabeel_token');
      await axios.put(`${VITE_API_URL}/admin/expenses/${id}/status`, { status: 'Approved' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error approving expense:', err);
      alert(err.response?.data?.message || 'Error approving expense');
    }
  };

  const handleRejectExpense = async (id) => {
    try {
      const token = localStorage.getItem('sabeel_token');
      await axios.put(`${VITE_API_URL}/admin/expenses/${id}/status`, { status: 'Rejected' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error rejecting expense:', err);
      alert(err.response?.data?.message || 'Error rejecting expense');
    }
  };

  // Donation Approvals Actions
  const handleApproveDonation = async (id) => {
    try {
      const token = localStorage.getItem('sabeel_token');
      await axios.put(`${VITE_API_URL}/donations/admin/${id}/status`, { status: 'Approved' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error approving donation:', err);
      alert(err.response?.data?.message || 'Error approving donation');
    }
  };

  const handleRejectDonation = async (id) => {
    try {
      const token = localStorage.getItem('sabeel_token');
      await axios.put(`${VITE_API_URL}/donations/admin/${id}/status`, { status: 'Rejected' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error rejecting donation:', err);
      alert(err.response?.data?.message || 'Error rejecting donation');
    }
  };

  const handleDonationFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDonationProofFile(e.target.files[0]);
    }
  };

  const handleLogDonationSubmit = async (e) => {
    e.preventDefault();
    setDonationFormError('');
    setDonationFormSuccess('');

    if (!donorName || !donationAmount) {
      setDonationFormError('Donor Name and Amount are required.');
      return;
    }

    setSubmittingDonation(true);

    const formData = new FormData();
    formData.append('donorName', donorName);
    formData.append('amount', donationAmount);
    formData.append('paymentMethod', donationPaymentMethod);
    if (donationMember) {
      formData.append('memberId', donationMember.id);
    }
    if (donationProofFile) {
      formData.append('proof', donationProofFile);
    }

    try {
      const token = localStorage.getItem('sabeel_token');
      await axios.post(`${VITE_API_URL}/donations`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      setDonationFormSuccess('Donation logged successfully and auto-approved!');
      setDonorName('');
      setDonationAmount('');
      setDonationPaymentMethod('Cash');
      setDonationProofFile(null);
      
      fetchDashboardData();
      
      setTimeout(() => {
        setShowDonationModal(false);
        setDonationMember(null);
        setDonationFormSuccess('');
      }, 1500);

    } catch (err) {
      setDonationFormError(err.response?.data?.message || 'Error logging donation.');
    } finally {
      setSubmittingDonation(false);
    }
  };

  const handleToggleSettle = async (memberId, currentSettled) => {
    try {
      const token = localStorage.getItem('sabeel_token');
      await axios.put(
        `${VITE_API_URL}/admin/members/${memberId}/settle`,
        { settled: !currentSettled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDashboardData();
    } catch (err) {
      console.error('Error toggling member settlement:', err);
      alert(err.response?.data?.message || 'Error updating settlement status');
    }
  };

  // Member CRUD
  const handleSaveMember = async (e) => {
    e.preventDefault();
    setMemberFormError('');
    setMemberFormSuccess('');

    if (!memberFullName || (!editingMember && (!memberUsername || !memberPassword))) {
      setMemberFormError('Please fill in all required fields.');
      return;
    }

    try {
      const token = localStorage.getItem('sabeel_token');
      const headers = { Authorization: `Bearer ${token}` };
      const body = {
        fullName: memberFullName,
        contributionAmount: parseFloat(memberContribution || 0)
      };

      if (editingMember) {
        if (memberPassword) body.password = memberPassword;
        await axios.put(`${VITE_API_URL}/admin/members/${editingMember.id}`, body, { headers });
        setMemberFormSuccess('Member updated successfully!');
      } else {
        body.username = memberUsername;
        body.password = memberPassword;
        await axios.post(`${VITE_API_URL}/admin/members`, body, { headers });
        setMemberFormSuccess('Member registered successfully!');
      }

      fetchDashboardData();
      setTimeout(() => {
        setShowMemberModal(false);
        setEditingMember(null);
        setMemberUsername('');
        setMemberPassword('');
        setMemberFullName('');
        setMemberContribution('');
        setMemberFormSuccess('');
      }, 1500);

    } catch (err) {
      setMemberFormError(err.response?.data?.message || 'Error saving member details.');
    }
  };

  const handleEditMemberClick = (m) => {
    setEditingMember(m);
    setMemberFullName(m.full_name);
    setMemberContribution(m.contribution_amount.toString());
    setMemberUsername(m.username);
    setMemberPassword('');
    setShowMemberModal(true);
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to remove this volunteer member? This deletes all associated expenses.')) return;
    try {
      const token = localStorage.getItem('sabeel_token');
      await axios.delete(`${VITE_API_URL}/admin/members/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error deleting member:', err);
    }
  };

  // Excel / CSV download helpers
  const handleExportExcel = () => {
    const token = localStorage.getItem('sabeel_token');
    window.open(`${VITE_API_URL}/admin/reports/excel?token=${token}`, '_blank');
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('sabeel_token');
    window.open(`${VITE_API_URL}/admin/reports/csv?token=${token}`, '_blank');
  };

  // Backup & Restore
  const handleBackupDownload = () => {
    const token = localStorage.getItem('sabeel_token');
    window.open(`${VITE_API_URL}/admin/backup?token=${token}`, '_blank');
  };

  const handleRestoreUpload = async (e) => {
    e.preventDefault();
    if (!backupFile) {
      setBackupStatus('Please select a JSON backup file first.');
      return;
    }
    setBackupStatus('Restoring database...');
    const formData = new FormData();
    formData.append('backup', backupFile);

    try {
      const token = localStorage.getItem('sabeel_token');
      await axios.post(`${VITE_API_URL}/admin/restore`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setBackupStatus('Database restored successfully! Refreshing details...');
      setBackupFile(null);
      fetchDashboardData();
      setTimeout(() => setBackupStatus(''), 2000);
    } catch (err) {
      console.error('Restore failed:', err);
      setBackupStatus(err.response?.data?.message || 'Restore database failed. Verify JSON structure.');
    }
  };

  // CALCULATIONS FOR METRIC CARDS
  const totalMembers = members.length;
  const totalContributions = members.reduce((sum, m) => sum + m.contribution_amount, 0);
  const totalExpensesApproved = expenses
    .filter(e => e.approval_status === 'Approved')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalDonationsApproved = donations
    .filter(d => d.approval_status === 'Approved')
    .reduce((sum, d) => sum + d.amount, 0);
  const pendingApprovalsCount = expenses.filter(e => e.approval_status === 'Pending').length;
  const pendingDonationsCount = donations.filter(d => d.approval_status === 'Pending').length;
  const netBalance = totalContributions + totalDonationsApproved - totalExpensesApproved;

  // Settlements metrics (Receive vs Refund totals)
  let totalToBeReceived = 0; // Members who spent less than contribution (owing Sabeel)
  let totalToBePaid = 0;     // Members who spent more than contribution (Sabeel owes them)

  settlements.forEach(s => {
    if (s.difference > 0) {
      totalToBePaid += s.difference;
    } else if (s.difference < 0) {
      totalToBeReceived += Math.abs(s.difference);
    }
  });

  // Recharts Chart Data Formatting (Daily curves & Category distributions)
  const expenseTimelineData = dailySummaries.map(summary => ({
    name: summary.summary_date.split('-').slice(1).join('/'), // Format MM/DD
    Expenses: summary.expenses_total,
    Contributions: summary.contributions_total
  }));

  const categoryTotals = expenses
    .filter(e => e.approval_status === 'Approved')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

  const categoryData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    value: categoryTotals[cat]
  }));

  const COLORS = ['#7A0C0C', '#065F46', '#D97706', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#6B7280'];

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen bg-brand-cream text-neutral-800 flex flex-col ${darkMode ? 'dark text-neutral-200 bg-neutral-950' : ''}`}>
      <div className="absolute inset-0 bg-islamic-pattern opacity-5 dark:opacity-2 pointer-events-none"></div>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shadow-sm backdrop-blur-md bg-white/95 dark:bg-neutral-900/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={sabeelLogo} 
              alt="Sabeel Logo" 
              className="h-12 w-auto object-contain rounded-lg shadow-sm border border-neutral-100 dark:border-neutral-800"
            />
            <div>
              <h1 className="text-lg font-bold text-brand-red-dark dark:text-brand-cream">Sabeel Organizers Portal</h1>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold dark:text-neutral-500">Admin Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer dark:text-neutral-300"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={fetchDashboardData}
              className="p-2 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer dark:text-neutral-300"
              title="Refresh Data"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-955 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={14} /> Log Out
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* DASHBOARD METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-8">
          
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between text-neutral-800 dark:text-neutral-100">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Total Members</span>
            <span className="text-xl font-black mt-2 text-neutral-800 dark:text-neutral-100">{totalMembers}</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between text-neutral-800 dark:text-neutral-100">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Member Deposits</span>
            <span className="text-xl font-black mt-2 text-brand-green-medium">₹{totalContributions.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between text-neutral-800 dark:text-neutral-100">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Total Donations</span>
            <span className="text-xl font-black mt-2 text-amber-500 font-black">₹{totalDonationsApproved.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between text-neutral-800 dark:text-neutral-100">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Total Expenses</span>
            <span className="text-xl font-black mt-2 text-brand-red-medium">₹{totalExpensesApproved.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between text-neutral-800 dark:text-neutral-100 relative">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Pending Expenses</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl font-black text-neutral-800 dark:text-neutral-100">{pendingApprovalsCount}</span>
              {pendingApprovalsCount > 0 && (
                <span className="w-2.5 h-2.5 bg-brand-red-medium rounded-full animate-ping"></span>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between text-neutral-800 dark:text-neutral-100 relative">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Pending Donations</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xl font-black text-neutral-800 dark:text-neutral-100">{pendingDonationsCount}</span>
              {pendingDonationsCount > 0 && (
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between text-neutral-800 dark:text-neutral-100">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Available Balance</span>
            <span className={`text-xl font-black mt-2 ${netBalance >= 0 ? 'text-green-650' : 'text-red-650'}`}>
              ₹{netBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between text-neutral-800 dark:text-neutral-100">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">To Be Refunded</span>
            <span className="text-xl font-black mt-2 text-amber-600">₹{totalToBePaid.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex flex-col justify-between text-neutral-800 dark:text-neutral-100">
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">To Be Collected</span>
            <span className="text-xl font-black mt-2 text-blue-600">₹{totalToBeReceived.toLocaleString('en-IN')}</span>
          </div>

        </div>

        {/* CHARTS CONTAINER */}
        {expenses.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Expense History Graph */}
            <div className="md:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm text-neutral-800 dark:text-neutral-200">
              <h3 className="font-bold text-sm text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider">Event Daily Finance Curves</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={expenseTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#333' : '#eee'} />
                    <XAxis dataKey="name" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip contentStyle={darkMode ? { backgroundColor: '#222', borderColor: '#444', color: '#fff' } : {}} />
                    <Line type="monotone" dataKey="Expenses" stroke="#7A0C0C" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Contributions" stroke="#065F46" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Pie Chart */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm flex flex-col text-neutral-800 dark:text-neutral-200">
              <h3 className="font-bold text-sm text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider">Spent by Category</h3>
              <div className="h-52 flex-1 relative">
                {categoryData.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400">No approved bills logged yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} contentStyle={darkMode ? { backgroundColor: '#222', color: '#fff' } : {}} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {/* Pie Legends */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] max-h-20 overflow-y-auto">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    <span className="truncate font-semibold text-neutral-700 dark:text-neutral-300">{c.name}: ₹{c.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TABS CONTAINER */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden mb-8">
          
          {/* Tab buttons */}
          <div className="flex flex-wrap border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-2 gap-1">
            <button 
              onClick={() => setActiveTab('approvals')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'approvals' ? 'bg-brand-red-medium text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
            >
              Approvals Queue ({expenses.filter(e => e.approval_status === 'Pending').length})
            </button>
            
            <button 
              onClick={() => setActiveTab('donations')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'donations' ? 'bg-brand-red-medium text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
            >
              Donations Queue ({donations.filter(d => d.approval_status === 'Pending').length})
            </button>
            
            <button 
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'members' ? 'bg-brand-red-medium text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
            >
              Members Manager ({totalMembers})
            </button>
            
            <button 
              onClick={() => setActiveTab('settlements')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'settlements' ? 'bg-brand-red-medium text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
            >
              Settlement Sheet
            </button>
            
            <button 
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'daily' ? 'bg-brand-red-medium text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-850 dark:text-neutral-400 dark:hover:text-neutral-200'}`}
            >
              Daily Summaries
            </button>

            {/* Float Right Action */}
            <div className="ml-auto flex items-center gap-2 px-2 py-1">
              <button 
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1 px-3 py-1 bg-brand-green-medium hover:bg-brand-green-dark text-white rounded-lg text-[10px] font-bold shadow-sm cursor-pointer"
              >
                <FileSpreadsheet size={12} /> Excel Report
              </button>
              <button 
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-100 rounded-lg text-[10px] font-bold shadow-sm cursor-pointer"
              >
                <Download size={12} /> CSV
              </button>
            </div>
          </div>

          {/* TAB CONTENTS */}
          <div className="p-6">
            
            {/* 1. APPROVALS QUEUE */}
            {activeTab === 'approvals' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100">
                  <h4 className="font-bold text-base">Expense Vouchers Verification Queue</h4>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">Total: {expenses.length} submitted</span>
                </div>

                {expenses.length === 0 ? (
                  <p className="text-center text-sm py-12 text-neutral-400 dark:text-neutral-500">No expense logs submitted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-400 tracking-wider border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850">
                          <th className="px-4 py-3">Member Name</th>
                          <th className="px-4 py-3">Item Name</th>
                          <th className="px-4 py-3">Taken From Whom</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Quantity</th>
                          <th className="px-4 py-3">Payment Method</th>
                          <th className="px-4 py-3">Proof of Payment</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                        {expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-neutral-50/20 dark:hover:bg-neutral-800/10">
                            <td className="px-4 py-4 text-neutral-800 dark:text-neutral-200">
                              <div className="font-bold">{exp.member_name}</div>
                              <div className="text-[10px] text-neutral-450 dark:text-neutral-500">@{exp.member_username}</div>
                            </td>
                            <td className="px-4 py-4 font-bold text-neutral-800 dark:text-neutral-200">
                              {exp.item_purchased}
                            </td>
                            <td className="px-4 py-4 text-neutral-600 dark:text-neutral-300">
                              {exp.vendor_name || <span className="text-neutral-400 dark:text-neutral-600 text-xs italic">Not Specified</span>}
                            </td>
                            <td className="px-4 py-4 font-black text-neutral-800 dark:text-neutral-100">
                              ₹{exp.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                              {exp.quantity}
                            </td>
                            <td className="px-4 py-4 text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
                              {exp.payment_method}
                            </td>
                            <td className="px-4 py-4">
                              {exp.proof_url ? (
                                <a 
                                  href={`${VITE_BACKEND_URL}${exp.proof_url}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-brand-green-medium hover:underline inline-flex items-center gap-0.5 mt-0.5 font-medium"
                                >
                                  <Eye size={10} /> View Proof
                                </a>
                              ) : (
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic">No Receipt</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                exp.approval_status === 'Approved' 
                                  ? 'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400' 
                                  : exp.approval_status === 'Pending'
                                  ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400'
                                  : 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400'
                              }`}>
                                {exp.approval_status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              {exp.approval_status === 'Pending' ? (
                                <div className="inline-flex gap-1.5">
                                  <button
                                    onClick={() => handleApproveExpense(exp.id)}
                                    className="px-2.5 py-1.5 bg-brand-green-medium hover:bg-brand-green-dark text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
                                    title="Approve expense"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectExpense(exp.id)}
                                    className="px-2.5 py-1.5 bg-brand-red-medium hover:bg-brand-red-dark text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
                                    title="Reject expense"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-550 italic">Audited</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 1.5. DONATIONS QUEUE */}
            {activeTab === 'donations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100">
                  <h4 className="font-serif font-bold text-base text-brand-red-dark dark:text-brand-cream">Sabeel External Donations Verification</h4>
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">Total Inflow: ₹{totalDonationsApproved.toLocaleString('en-IN')} approved</span>
                </div>

                {donations.length === 0 ? (
                  <p className="text-center text-sm py-12 text-neutral-400 dark:text-neutral-550">No donations logged yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-400 tracking-wider border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850">
                          <th className="px-4 py-3">Logged By</th>
                          <th className="px-4 py-3">Donor Name</th>
                          <th className="px-4 py-3">Price (Amount)</th>
                          <th className="px-4 py-3">Payment Method</th>
                          <th className="px-4 py-3">Proof of Payment</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                        {donations.map((d) => (
                          <tr key={d.id} className="hover:bg-neutral-50/20 dark:hover:bg-neutral-800/10">
                            <td className="px-4 py-4 text-neutral-800 dark:text-neutral-200">
                              <div className="font-bold">{d.member_name || 'System / Direct'}</div>
                              {d.member_username && <div className="text-[10px] text-neutral-450 dark:text-neutral-500">@{d.member_username}</div>}
                            </td>
                            <td className="px-4 py-4 font-bold text-neutral-800 dark:text-neutral-250">
                              {d.donor_name}
                            </td>
                            <td className="px-4 py-4 font-black text-neutral-850 dark:text-neutral-100">
                              ₹{d.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-4 text-neutral-550 dark:text-neutral-405 font-medium">
                              {d.payment_method}
                            </td>
                            <td className="px-4 py-4">
                              {d.proof_url ? (
                                <a 
                                  href={`${VITE_BACKEND_URL}${d.proof_url}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-brand-green-medium hover:underline inline-flex items-center gap-0.5 mt-0.5 font-medium"
                                >
                                  <Eye size={10} /> View Proof
                                </a>
                              ) : (
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic">No Receipt</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                d.approval_status === 'Approved' 
                                  ? 'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400' 
                                  : d.approval_status === 'Pending'
                                  ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400'
                                  : 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400'
                              }`}>
                                {d.approval_status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              {d.approval_status === 'Pending' ? (
                                <div className="inline-flex gap-1.5">
                                  <button
                                    onClick={() => handleApproveDonation(d.id)}
                                    className="px-2.5 py-1.5 bg-brand-green-medium text-white rounded-lg hover:bg-brand-green-dark cursor-pointer transition-colors text-xs font-bold shadow-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectDonation(d.id)}
                                    className="px-2.5 py-1.5 bg-brand-red-medium text-white rounded-lg hover:bg-brand-red-dark cursor-pointer transition-colors text-xs font-bold shadow-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-550 italic">Audited</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 2. MEMBERS MANAGER */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100">
                  <h4 className="font-bold text-base">Volunteers Registration & Deposit Manager</h4>
                  <button
                    onClick={() => {
                      setEditingMember(null);
                      setMemberUsername('');
                      setMemberPassword('');
                      setMemberFullName('');
                      setMemberContribution('');
                      setShowMemberModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-green-medium hover:bg-brand-green-dark text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                  >
                    <UserPlus size={14} /> Register Volunteer
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-400 tracking-wider border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850">
                        <th className="px-4 py-3">Member Name</th>
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3">Contribution Deposit</th>
                        <th className="px-4 py-3">Approved Spend</th>
                        <th className="px-4 py-3">Pending Logs</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-neutral-50/20 dark:hover:bg-neutral-800/10">
                          <td className="px-4 py-4 font-bold text-neutral-800 dark:text-neutral-200">
                            {m.full_name}
                          </td>
                          <td className="px-4 py-4 text-neutral-500 dark:text-neutral-400 font-mono text-xs">
                            @{m.username}
                          </td>
                          <td className="px-4 py-4 font-bold text-brand-green-medium">
                            ₹{m.contribution_amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-4 font-semibold text-neutral-700 dark:text-neutral-300">
                            ₹{m.approved_expenses_total.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-4 text-xs font-medium text-amber-600">
                            ₹{m.pending_expenses_total.toLocaleString('en-IN')} pending
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => {
                                  setDonationMember(m);
                                  setShowDonationModal(true);
                                }}
                                className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-950/20 rounded cursor-pointer transition-colors"
                                title="Log donation for this member"
                              >
                                <HeartHandshake size={14} />
                              </button>
                              <button
                                onClick={() => handleEditMemberClick(m)}
                                className="p-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded cursor-pointer transition-colors"
                                title="Edit member"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(m.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 rounded cursor-pointer transition-colors"
                                title="Delete member"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. SETTLEMENT SHEET */}
            {activeTab === 'settlements' && (
              <div className="space-y-4 text-neutral-800 dark:text-neutral-200">
                <div className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
                  <h4 className="font-bold text-base">Sabeel Final Settlements Ledger</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Calculated as: <span className="font-semibold font-mono">Difference = Total Approved Spent - Contribution Deposited</span>.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-400 tracking-wider border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850">
                        <th className="px-4 py-3">Member Name</th>
                        <th className="px-4 py-3">Contribution Deposited</th>
                        <th className="px-4 py-3">Approved Expenses Paid</th>
                        <th className="px-4 py-3">Difference</th>
                        <th className="px-4 py-3">Final Settlement Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                      {settlements.map((s) => {
                        const isOwed = s.difference > 0;
                        const isOwing = s.difference < 0;
                        return (
                          <tr key={s.memberId} className="hover:bg-neutral-50/20 dark:hover:bg-neutral-800/10">
                            <td className="px-4 py-4 font-bold text-neutral-800 dark:text-neutral-200">{s.fullName}</td>
                            <td className="px-4 py-4 font-semibold text-neutral-500 dark:text-neutral-400">₹{s.contribution.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-4 font-semibold text-neutral-500 dark:text-neutral-400">₹{s.expenses.toLocaleString('en-IN')}</td>
                            <td className={`px-4 py-4 font-mono font-bold ${isOwed ? 'text-green-600' : isOwing ? 'text-red-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
                              {isOwed ? '+' : ''}₹{s.difference.toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                                s.settled
                                  ? 'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400'
                                  : isOwed 
                                  ? 'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400' 
                                  : isOwing
                                  ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400'
                                  : 'text-gray-700 bg-gray-50 border-gray-200 dark:bg-neutral-800 dark:text-neutral-450'
                              }`}>
                                {s.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <button
                                onClick={() => handleToggleSettle(s.memberId, s.settled)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  s.settled
                                    ? 'bg-neutral-100 hover:bg-neutral-250 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                                    : 'bg-brand-green-medium hover:bg-brand-green-dark text-white'
                                }`}
                              >
                                {s.settled ? (
                                  <>
                                    <X size={12} /> Reopen
                                  </>
                                ) : (
                                  <>
                                    <Check size={12} /> Mark Settled
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. DAILY SUMMARIES */}
            {activeTab === 'daily' && (
              <div className="space-y-4 text-neutral-800 dark:text-neutral-200">
                <div className="pb-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base">Sabeel 10-Day Daily Financial Logs</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">Aggregated ledger of opening balances, purchases, and final tallies.</p>
                  </div>
                </div>

                {dailySummaries.length === 0 ? (
                  <p className="text-center text-sm py-12 text-neutral-400 dark:text-neutral-500">No daily summary data created yet. Record approved transactions to automatically trigger logs.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-400 tracking-wider border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850">
                          <th className="px-4 py-3">Summary Date</th>
                          <th className="px-4 py-3">Opening Bal</th>
                          <th className="px-4 py-3">Daily Deposits</th>
                          <th className="px-4 py-3">Daily Outflow</th>
                          <th className="px-4 py-3">Closing Bal</th>
                          <th className="px-4 py-3">Cash Spent</th>
                          <th className="px-4 py-3">Online Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm font-mono">
                        {dailySummaries.map((d) => (
                          <tr key={d.summary_date} className="hover:bg-neutral-50/20 dark:hover:bg-neutral-800/10">
                            <td className="px-4 py-4 font-bold text-neutral-800 dark:text-neutral-200 font-sans">{d.summary_date}</td>
                            <td className="px-4 py-4 text-neutral-500 dark:text-neutral-400">₹{d.opening_balance.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-4 text-green-600">+₹{d.contributions_total.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-4 text-red-600">-₹{d.expenses_total.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-4 font-black text-neutral-800 dark:text-neutral-100">₹{d.closing_balance.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-4 text-neutral-500 dark:text-neutral-400 text-xs">₹{d.cash_expenses.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-4 text-neutral-500 dark:text-neutral-400 text-xs">₹{d.online_expenses.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* BACKUP & SECURITY SETTING BOX */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
          <h4 className="font-bold text-base flex items-center gap-2 mb-4">
            <Database size={18} className="text-brand-red-medium" /> Database Storage Security & Restoration
          </h4>
          
          <div className="grid md:grid-cols-2 gap-8 items-start">
            
            {/* Backup Box */}
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl space-y-3">
              <h5 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Download Data Archive Backup</h5>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Exports all users, expenses, logs, and summaries into a local JSON file format. Keep this secure for restoration.
              </p>
              <button 
                onClick={handleBackupDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-red-medium hover:bg-brand-red-dark text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                <Download size={14} /> Download Backup (.json)
              </button>
            </div>

            {/* Restore Box */}
            <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl space-y-3">
              <h5 className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Restore Archive File</h5>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Warning: Restoring will overwrite all existing tables with data contained in the uploaded JSON backup file.
              </p>

              <form onSubmit={handleRestoreUpload} className="flex items-center gap-2">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={(e) => setBackupFile(e.target.files?.[0] || null)}
                  className="text-xs file:bg-white dark:file:bg-neutral-900 file:border file:border-neutral-200 dark:file:border-neutral-700 file:px-2 file:py-1 file:rounded file:text-[10px] file:font-bold file:cursor-pointer dark:text-neutral-100"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 text-white hover:bg-neutral-700 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Import
                </button>
              </form>
              {backupStatus && (
                <p className="text-[10px] text-brand-red-medium font-bold mt-1">{backupStatus}</p>
              )}
            </div>

          </div>
        </div>

      </main>

      {/* MEMBER REGISTRATION / EDIT MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 animate-fade-in text-neutral-800 dark:text-neutral-200">
            <div className="bg-brand-red-medium text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserPlus size={20} /> {editingMember ? 'Modify Volunteer Member' : 'Register Volunteer Member'}
              </h3>
              <button 
                onClick={() => setShowMemberModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
              
              {memberFormError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{memberFormError}</span>
                </div>
              )}

              {memberFormSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-xs rounded-xl flex items-center gap-2 border border-green-100">
                  <Check size={16} className="shrink-0" />
                  <span>{memberFormSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={memberFullName}
                  onChange={(e) => setMemberFullName(e.target.value)}
                  placeholder="e.g. Sajjad Hussain"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-brand-red-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingMember}
                  value={memberUsername}
                  onChange={(e) => setMemberUsername(e.target.value)}
                  placeholder="e.g. member_c"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-brand-red-medium disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                  Password {editingMember ? '(Leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingMember}
                  value={memberPassword}
                  onChange={(e) => setMemberPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-brand-red-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Initial Deposit Contribution (₹)</label>
                <input
                  type="number"
                  value={memberContribution}
                  onChange={(e) => setMemberContribution(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-brand-red-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-red-medium hover:bg-brand-red-dark text-white rounded-xl text-sm font-semibold shadow-md cursor-pointer transition-all"
                >
                  Save Member
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* LOG DONATION MODAL */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 animate-fade-in text-neutral-800 dark:text-neutral-100">
            <div className="bg-brand-red-medium text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <HeartHandshake size={20} /> Log Donation
              </h3>
              <button 
                onClick={() => {
                  setShowDonationModal(false);
                  setDonationMember(null);
                  setDonorName('');
                  setDonationAmount('');
                  setDonationPaymentMethod('Cash');
                  setDonationProofFile(null);
                  setDonationFormError('');
                  setDonationFormSuccess('');
                }}
                className="text-white/80 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleLogDonationSubmit} className="p-6 space-y-4 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
              
              {donationMember && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-semibold text-neutral-550 dark:text-neutral-450">Logging on behalf of volunteer:</span>
                  <p className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{donationMember.full_name}</p>
                </div>
              )}

              {donationFormError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{donationFormError}</span>
                </div>
              )}

              {donationFormSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-xs rounded-xl flex items-center gap-2 border border-green-100">
                  <Check size={16} className="shrink-0" />
                  <span>{donationFormSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-550 dark:text-neutral-400 mb-1">Donor's Name *</label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Al-Haj Merchant"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-brand-red-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-550 dark:text-neutral-400 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-brand-red-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-550 dark:text-neutral-400 mb-1">Payment Method *</label>
                <select
                  value={donationPaymentMethod}
                  onChange={(e) => setDonationPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-850 dark:text-neutral-100 focus:outline-none focus:border-brand-red-medium cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Optional uploads */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-750 flex flex-col items-center justify-center text-center">
                <FileText className="text-neutral-400 dark:text-neutral-550 mb-2" size={24} />
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Upload Receipt/Proof (Optional)</span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mb-3">Allowed files: JPG, PNG, PDF up to 5MB</span>
                
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleDonationFileChange}
                  className="hidden"
                  id="admin-donation-proof-upload"
                />
                <label 
                  htmlFor="admin-donation-proof-upload"
                  className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-700 rounded-xl text-xs font-bold shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer text-brand-red-medium hover:border-brand-red-medium transition-colors"
                >
                  Select File
                </label>
                {donationProofFile && (
                  <span className="text-[10px] text-brand-red-medium font-bold mt-2">
                    Selected: {donationProofFile.name} ({(donationProofFile.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDonationModal(false);
                    setDonationMember(null);
                    setDonorName('');
                    setDonationAmount('');
                    setDonationPaymentMethod('Cash');
                    setDonationProofFile(null);
                    setDonationFormError('');
                    setDonationFormSuccess('');
                  }}
                  className="px-4 py-2 text-neutral-500 dark:text-neutral-450 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDonation}
                  className="px-5 py-2.5 bg-brand-red-medium hover:bg-brand-red-dark text-white rounded-xl text-sm font-semibold shadow-md cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all"
                >
                  {submittingDonation ? 'Logging...' : 'Log Donation'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
