/**
 * DEBUG VERSION of AdminDashboard
 * This version makes API calls individually to identify which endpoint is failing
 * Replace the fetchDashboardData function in AdminDashboard.tsx with this version
 */

const fetchDashboardDataDebug = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }

    const authHeaders = getAuthHeaders();
    
    console.log('🔍 Starting individual API calls...');

    // 1. Admin Dashboard Overview
    try {
      console.log('📊 Testing: Admin Dashboard Overview...');
      const overviewRes = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD), authHeaders);
      console.log('✅ Admin Dashboard Overview: SUCCESS');
      setOverview(overviewRes.data.overview);
    } catch (error) {
      console.error('❌ Admin Dashboard Overview: FAILED', error);
      console.error('Error details:', error.response?.data || error.message);
    }

    // 2. Admin Users
    try {
      console.log('👥 Testing: Admin Users...');
      const usersRes = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_USERS), authHeaders);
      console.log('✅ Admin Users: SUCCESS');
      setUsers(usersRes.data);
    } catch (error) {
      console.error('❌ Admin Users: FAILED', error);
      console.error('Error details:', error.response?.data || error.message);
    }

    // 3. Admin Transactions
    try {
      console.log('💰 Testing: Admin Transactions...');
      const transactionsRes = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_TRANSACTIONS), authHeaders);
      console.log('✅ Admin Transactions: SUCCESS');
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('❌ Admin Transactions: FAILED', error);
      console.error('Error details:', error.response?.data || error.message);
    }

    // 4. Admin Withdrawals
    try {
      console.log('💸 Testing: Admin Withdrawals...');
      const withdrawalsRes = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_WITHDRAWALS), authHeaders);
      console.log('✅ Admin Withdrawals: SUCCESS');
      setWithdrawals(withdrawalsRes.data);
    } catch (error) {
      console.error('❌ Admin Withdrawals: FAILED', error);
      console.error('Error details:', error.response?.data || error.message);
    }

    // 5. Admin Demos
    try {
      console.log('🎮 Testing: Admin Demos...');
      const demosRes = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_DEMOS), authHeaders);
      console.log('✅ Admin Demos: SUCCESS');
      setDemos(demosRes.data);
    } catch (error) {
      console.error('❌ Admin Demos: FAILED', error);
      console.error('Error details:', error.response?.data || error.message);
    }

    // 6. Admin Pending Deposits
    try {
      console.log('💳 Testing: Admin Pending Deposits...');
      const pendingDepositsRes = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_PENDING_DEPOSITS), authHeaders);
      console.log('✅ Admin Pending Deposits: SUCCESS');
      setPendingDeposits(pendingDepositsRes.data.pendingDeposits || []);
    } catch (error) {
      console.error('❌ Admin Pending Deposits: FAILED', error);
      console.error('Error details:', error.response?.data || error.message);
    }

    // 7. Chat Admin Conversations
    try {
      console.log('💬 Testing: Chat Admin Conversations...');
      const chatRes = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT_ADMIN_CONVERSATIONS), authHeaders);
      console.log('✅ Chat Admin Conversations: SUCCESS');
      setChatConversations(chatRes.data.conversations || []);
    } catch (error) {
      console.error('❌ Chat Admin Conversations: FAILED', error);
      console.error('Error details:', error.response?.data || error.message);
    }

    console.log('🏁 All individual API calls completed. Check above for any failures.');

  } catch (error) {
    console.error('❌ Unexpected error in fetchDashboardDataDebug:', error);
  }
};

/* 
INSTRUCTIONS:
1. Copy this function
2. Replace the fetchDashboardData function in AdminDashboard.tsx with fetchDashboardDataDebug
3. Deploy the changes
4. Open your admin dashboard and check the browser console
5. You'll see exactly which API endpoint is failing with detailed error information
6. Report back which endpoint shows "FAILED" in the console

After debugging, remember to revert back to the original fetchDashboardData function.
*/