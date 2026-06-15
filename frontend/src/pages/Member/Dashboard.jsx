import React, { useState, useEffect } from 'react';
import { useAuth, VITE_API_URL } from '../../context/AuthContext';
import { 
  LogOut, Plus, Receipt, History, User, CreditCard, 
  TrendingUp, Wallet, Bell, CheckCircle, XCircle, AlertCircle, 
  FileText, Upload, Search, Check, Sun, Moon, HeartHandshake
} from 'lucide-react';
import axios from 'axios';
import sabeelLogo from '../../assets/sabeel_logo.jpg';

const MemberDashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Form Fields (Simplified Expense)
  const [itemPurchased, setItemPurchased] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [proofFile, setProofFile] = useState(null);

  // Donation Form States
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [donationPaymentMethod, setDonationPaymentMethod] = useState('Cash');
  const [donationProofFile, setDonationProofFile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [submittingDonation, setSubmittingDonation] = useState(false);
  const [activeLedgerTab, setActiveLedgerTab] = useState('expenses'); // 'expenses' | 'donations'

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchExpenses();
    fetchDonations();
    fetchNotifications();
  }, [searchQuery]);

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;

      const res = await axios.get(`${VITE_API_URL}/expenses`, { params });
      setExpenses(res.data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const fetchDonations = async () => {
    setLoadingDonations(true);
    try {
      const res = await axios.get(`${VITE_API_URL}/donations`);
      setDonations(res.data);
    } catch (err) {
      console.error('Error fetching donations:', err);
    } finally {
      setLoadingDonations(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${VITE_API_URL}/notifications`);
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${VITE_API_URL}/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleDonationFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDonationProofFile(e.target.files[0]);
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!itemPurchased || !amount) {
      setFormError('Item Name and Price are required.');
      return;
    }

    setSubmittingExpense(true);

    const formData = new FormData();
    // Auto-filled fields behind the scenes
    formData.append('title', `Expense: ${itemPurchased}`);
    formData.append('category', 'Other');
    formData.append('purchaseDate', new Date().toISOString().split('T')[0]);
    
    // User fields
    formData.append('itemPurchased', itemPurchased);
    formData.append('vendorName', vendorName);
    formData.append('amount', amount);
    formData.append('quantity', quantity);
    formData.append('paymentMethod', paymentMethod);
    formData.append('notes', '');
    
    if (proofFile) {
      formData.append('proof', proofFile);
    }

    try {
      await axios.post(`${VITE_API_URL}/expenses`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFormSuccess('Expense submitted successfully for review!');
      setItemPurchased('');
      setVendorName('');
      setAmount('');
      setQuantity('1');
      setPaymentMethod('Cash');
      setProofFile(null);
      
      await refreshUser();
      fetchExpenses();
      
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess('');
      }, 1500);

    } catch (err) {
      setFormError(err.response?.data?.message || 'Error submitting expense entry.');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!donorName || !donationAmount) {
      setFormError('Donor Name and Amount are required.');
      return;
    }

    setSubmittingDonation(true);

    const formData = new FormData();
    formData.append('donorName', donorName);
    formData.append('amount', donationAmount);
    formData.append('paymentMethod', donationPaymentMethod);
    
    if (donationProofFile) {
      formData.append('proof', donationProofFile);
    }

    try {
      await axios.post(`${VITE_API_URL}/donations`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFormSuccess('Donation logged successfully!');
      setDonorName('');
      setDonationAmount('');
      setDonationPaymentMethod('Cash');
      setDonationProofFile(null);
      
      fetchDonations();
      
      setTimeout(() => {
        setShowDonationModal(false);
        setFormSuccess('');
      }, 1500);

    } catch (err) {
      setFormError(err.response?.data?.message || 'Error logging donation.');
    } finally {
      setSubmittingDonation(false);
    }
  };

  // Calculations
  const totalApprovedSpent = expenses
    .filter(e => e.approval_status === 'Approved')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPendingSpent = expenses
    .filter(e => e.approval_status === 'Pending')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalApprovedDonations = donations
    .filter(d => d.approval_status === 'Approved')
    .reduce((sum, d) => sum + d.amount, 0);

  const contribution = user?.contributionAmount || 0;
  const settlementDiff = totalApprovedSpent - contribution;
  const isSettled = user?.settled === 1 || user?.settled === true;
  
  let settlementText = 'Fully Settled';
  let settlementColorClass = 'text-gray-600 bg-gray-50 dark:bg-neutral-800 dark:text-neutral-300';
  
  if (isSettled) {
    settlementText = 'Fully Settled';
    settlementColorClass = 'text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50';
  } else if (settlementDiff > 0) {
    settlementText = `Receive ₹${settlementDiff.toLocaleString('en-IN')}`;
    settlementColorClass = 'text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 border border-green-200/50';
  } else if (settlementDiff < 0) {
    settlementText = `Refund Pending ₹${Math.abs(settlementDiff).toLocaleString('en-IN')}`;
    settlementColorClass = 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50';
  }

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
    <div className={`min-h-screen bg-brand-cream text-neutral-800 ${darkMode ? 'dark text-neutral-200 bg-neutral-950' : ''}`}>
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
              <h1 className="text-lg font-bold text-brand-red-dark dark:text-brand-cream">Sabeel E Aliasgar</h1>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold dark:text-neutral-500">Volunteer Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer dark:text-neutral-300"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors relative cursor-pointer"
              >
                <Bell size={20} className={darkMode ? 'text-neutral-300' : 'text-neutral-600'} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-red-medium text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-xl rounded-2xl p-4 z-40 max-h-96 overflow-y-auto text-neutral-800 dark:text-neutral-200">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800 mb-2">
                    <span className="font-bold text-sm text-neutral-800 dark:text-neutral-100">Notifications</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-brand-green-medium font-semibold hover:underline"
                    >
                      Close
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs py-6 text-neutral-400 dark:text-neutral-500">No notifications yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 rounded-xl text-xs flex gap-2.5 transition-all ${n.is_read ? 'opacity-60 bg-neutral-50 dark:bg-neutral-850' : 'bg-brand-green-medium/5 dark:bg-brand-green-medium/10'}`}
                        >
                          <div className="mt-0.5">
                            {n.is_read ? <CheckCircle size={14} className="text-neutral-400 dark:text-neutral-500" /> : <AlertCircle size={14} className="text-brand-green-medium" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-neutral-800 dark:text-neutral-100">{n.title}</p>
                            <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">{n.message}</p>
                            {!n.is_read && (
                              <button 
                                onClick={() => handleMarkAsRead(n.id)}
                                className="mt-1.5 text-[10px] font-bold text-brand-green-medium hover:underline flex items-center gap-0.5"
                              >
                                Mark Read <Check size={10} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Signpost & Logout */}
            <div className="flex items-center gap-2 border-l border-neutral-200 dark:border-neutral-800 pl-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{user?.fullName}</p>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 capitalize">{user?.role}</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-955 rounded-lg transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100 font-serif">
              As-salamu alaykum, {user?.fullName.split(' ')[0]}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Welcome to the Sabeel E Aliasgar management portal. Track your funds, log donations, and request bill approvals here.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 self-start sm:self-auto">
            <button 
              onClick={() => setShowDonationModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-brand-red-medium hover:bg-brand-red-dark text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer text-sm"
            >
              <HeartHandshake size={18} /> Log Donation
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-brand-green-medium hover:bg-brand-green-dark text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer text-sm"
            >
              <Plus size={18} /> Add Expense
            </button>
          </div>
        </div>

        {/* FINANCIAL SUMMARY CARDS (5 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          {/* Contribution Deposited */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-800 dark:text-neutral-100">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Deposited Contribution</span>
              <p className="text-xl font-black text-neutral-800 dark:text-neutral-100 mt-1">
                ₹{contribution.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-brand-green-medium/10 rounded-xl text-brand-green-medium">
              <Wallet size={20} />
            </div>
          </div>

          {/* Donations Collected */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-800 dark:text-neutral-100">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Donations Collected</span>
              <p className="text-xl font-black text-amber-600 mt-1">
                ₹{totalApprovedDonations.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-550">
              <HeartHandshake size={20} />
            </div>
          </div>

          {/* Total Approved Spent */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-800 dark:text-neutral-100">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Approved Expenses</span>
              <p className="text-xl font-black text-neutral-800 dark:text-neutral-100 mt-1">
                ₹{totalApprovedSpent.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-brand-red-medium/10 rounded-xl text-brand-red-medium">
              <TrendingUp size={20} />
            </div>
          </div>

          {/* Pending Bills */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-800 dark:text-neutral-100">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Pending Approvals</span>
              <p className="text-xl font-black text-neutral-800 dark:text-neutral-100 mt-1">
                ₹{totalPendingSpent.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Receipt size={20} />
            </div>
          </div>

          {/* Settlement Status */}
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-neutral-800 dark:text-neutral-100">
            <div className="space-y-1 flex-1">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-550 uppercase tracking-wider">Settlement Diff</span>
              <div className={`mt-1.5 py-0.5 px-2 text-[10px] font-extrabold rounded inline-block ${settlementColorClass}`}>
                {settlementText}
              </div>
            </div>
            <div className="p-3 bg-brand-red-dark/10 rounded-xl text-brand-red-dark dark:text-brand-cream">
              <CreditCard size={20} />
            </div>
          </div>
        </div>

        {/* RECENT EXPENSES & HISTORY */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          
          {/* Table Header / Filters */}
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveLedgerTab('expenses')}
                className={`flex items-center gap-2 pb-2 border-b-2 font-bold text-base transition-all cursor-pointer ${
                  activeLedgerTab === 'expenses'
                    ? 'border-brand-green-medium text-brand-green-medium'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
              >
                <History size={16} /> My Expenses
              </button>
              <button
                onClick={() => setActiveLedgerTab('donations')}
                className={`flex items-center gap-2 pb-2 border-b-2 font-bold text-base transition-all cursor-pointer ${
                  activeLedgerTab === 'donations'
                    ? 'border-brand-red-medium text-brand-red-medium'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                }`}
              >
                <HeartHandshake size={16} /> My Donations
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder={activeLedgerTab === 'expenses' ? "Search item name..." : "Search donor name..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs w-48 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-brand-green-medium"
                />
              </div>
            </div>
          </div>

          {/* Table proper */}
          {activeLedgerTab === 'expenses' ? (
            loadingExpenses ? (
              <div className="py-20 text-center text-neutral-400 dark:text-neutral-550 text-sm">
                <div className="w-8 h-8 border-4 border-brand-green-medium border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                Fetching expense entries...
              </div>
            ) : expenses.length === 0 ? (
              <div className="py-20 text-center text-neutral-400 dark:text-neutral-550 text-sm">
                No expenses logged yet. Try adding a new expense!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-800 text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-400 tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                      <th className="px-6 py-4">Item Name</th>
                      <th className="px-6 py-4">Taken From Whom</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Quantity</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4">Proof of Payment</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-neutral-800 dark:text-neutral-100">
                          {exp.item_purchased}
                        </td>
                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                          {exp.vendor_name || <span className="text-neutral-400 dark:text-neutral-650 text-xs italic">Not Specified</span>}
                        </td>
                        <td className="px-6 py-4 font-black text-neutral-800 dark:text-neutral-100">
                          ₹{exp.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                          {exp.quantity}
                        </td>
                        <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
                          {exp.payment_method}
                        </td>
                        <td className="px-6 py-4">
                          {exp.proof_url ? (
                            <a 
                              href={`http://localhost:5000${exp.proof_url}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-brand-green-medium hover:text-brand-green-dark hover:underline font-medium"
                            >
                              <FileText size={14} /> View Proof
                            </a>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-500 text-xs italic">No Receipt</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            loadingDonations ? (
              <div className="py-20 text-center text-neutral-400 dark:text-neutral-550 text-sm">
                <div className="w-8 h-8 border-4 border-brand-red-medium border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                Fetching donation entries...
              </div>
            ) : donations.length === 0 ? (
              <div className="py-20 text-center text-neutral-400 dark:text-neutral-550 text-sm">
                No donations logged yet. Use the 'Log Donation' button to add one!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-800 text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-400 tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                      <th className="px-6 py-4">Donor Name</th>
                      <th className="px-6 py-4">Price (Amount)</th>
                      <th className="px-6 py-4">Payment Method</th>
                      <th className="px-6 py-4">Proof of Payment</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-sm">
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-neutral-800 dark:text-neutral-100">
                          {d.donor_name}
                        </td>
                        <td className="px-6 py-4 font-black text-neutral-800 dark:text-neutral-100">
                          ₹{d.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400 text-xs font-semibold">
                          {d.payment_method}
                        </td>
                        <td className="px-6 py-4">
                          {d.proof_url ? (
                            <a 
                              href={`http://localhost:5000${d.proof_url}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-brand-green-medium hover:text-brand-green-dark hover:underline font-medium"
                            >
                              <FileText size={14} /> View Proof
                            </a>
                          ) : (
                            <span className="text-neutral-400 dark:text-neutral-500 text-xs italic">No Receipt</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </main>

      {/* ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 animate-fade-in my-8 text-neutral-800 dark:text-neutral-100">
            <div className="bg-brand-green-medium text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Receipt size={20} /> Add Expense
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
              
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-xs rounded-xl flex items-center gap-2 border border-green-100">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={itemPurchased}
                  onChange={(e) => setItemPurchased(e.target.value)}
                  placeholder="e.g. Milk, Bottles, Paper Cups"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-brand-green-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Taken From Whom</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Al-Madina Traders"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-850 dark:text-neutral-100 focus:outline-none focus:border-brand-green-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-850 dark:text-neutral-100 focus:outline-none focus:border-brand-green-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Quantity</label>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 10 packs, 100 liters"
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-850 dark:text-neutral-100 focus:outline-none focus:border-brand-green-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-850 dark:text-neutral-100 focus:outline-none focus:border-brand-green-medium cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Optional uploads for all payment methods */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center text-center">
                <Upload className="text-neutral-400 dark:text-neutral-550 mb-2" size={24} />
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Upload Receipt Proof (Optional)</span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mb-3">Allowed files: JPG, PNG, PDF up to 5MB</span>
                
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="proof-upload"
                />
                <label 
                  htmlFor="proof-upload"
                  className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-700 rounded-xl text-xs font-bold shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-850 cursor-pointer text-brand-green-medium hover:border-brand-green-medium transition-colors"
                >
                  Select File
                </label>
                {proofFile && (
                  <span className="text-[10px] text-brand-green-medium font-bold mt-2">
                    Selected: {proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-neutral-550 dark:text-neutral-450 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-5 py-2.5 bg-brand-green-medium hover:bg-brand-green-dark text-white rounded-xl text-sm font-semibold shadow-md cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all"
                >
                  {submittingExpense ? 'Submitting...' : 'Request Approval'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* LOG DONATION MODAL */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 dark:border-neutral-800 animate-fade-in my-8 text-neutral-800 dark:text-neutral-100">
            <div className="bg-brand-red-medium text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <HeartHandshake size={20} /> Log Donation
              </h3>
              <button 
                onClick={() => setShowDonationModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitDonation} className="p-6 space-y-4 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
              
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-xs rounded-xl flex items-center gap-2 border border-green-100">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Donor's Name *</label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="e.g. Al-Haj Merchant"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-850 dark:text-neutral-100 focus:outline-none focus:border-brand-red-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-850 dark:text-neutral-100 focus:outline-none focus:border-brand-red-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Payment Method *</label>
                <select
                  value={donationPaymentMethod}
                  onChange={(e) => setDonationPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-855 dark:text-neutral-100 focus:outline-none focus:border-brand-red-medium cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-750 flex flex-col items-center justify-center text-center">
                <Upload className="text-neutral-400 dark:text-neutral-500 mb-2" size={24} />
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1">Upload Receipt/Proof (Optional)</span>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mb-3">Allowed files: JPG, PNG, PDF up to 5MB</span>
                
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleDonationFileChange}
                  className="hidden"
                  id="donation-proof-upload"
                />
                <label 
                  htmlFor="donation-proof-upload"
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
                  onClick={() => setShowDonationModal(false)}
                  className="px-4 py-2 text-neutral-550 dark:text-neutral-450 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
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

export default MemberDashboard;
