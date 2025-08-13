import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/api';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Calendar,
  Search,
  Edit,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  Play
} from 'lucide-react';

interface UserBreakdown {
  userId: string;
  email: string;
  deposited: number;
  projectedPayouts: {
    next7Days: number;
    next30Days: number;
    next12Months: number;
  };
  status: 'active' | 'paused' | 'completed';
  joinDate: string;
  simulationStartDate: string;
}

interface AdminOverview {
  totalDeposited: number;
  activeSimulations: number;
  projectedPayouts: {
    next7Days: number;
    next30Days: number;
    next12Months: number;
  };
  userBreakdown: UserBreakdown[];
}

interface SimulationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userEmail: string;
  onUpdate: () => void;
}

const SimulationDetailModal: React.FC<SimulationDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  userId, 
  userEmail,
  onUpdate 
}) => {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [newRate, setNewRate] = useState<string>('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [impactPreview, setImpactPreview] = useState<any>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/compound-interest/admin/user/${userId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateOverride = async () => {
    if (!editingMonth || !newRate || !userId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/compound-interest/admin/user/${userId}/override-rate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: editingMonth,
          newRate: parseFloat(newRate) / 100 // Convert percentage to decimal
        })
      });

      if (response.ok) {
        const data = await response.json();
        setImpactPreview(data.impactPreview);
        setPreviewVisible(true);
        await fetchUserDetails(); // Refresh details
        onUpdate(); // Refresh parent component
        alert(`Month ${editingMonth} rate updated successfully!`);
        setEditingMonth(null);
        setNewRate('');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error overriding rate:', error);
      alert('Failed to update rate');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          borderBottom: '1px solid #E5E7EB',
          paddingBottom: '1rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            Edit Simulation: {userEmail}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div>Loading simulation details...</div>
          </div>
        ) : userDetails ? (
          <div>
            {/* User Info */}
            <div style={{
              backgroundColor: '#F3F4F6',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>Status:</strong> {userDetails.status.status}
                </div>
                <div>
                  <strong>Total Deposited:</strong> ${userDetails.simulation.totalDeposited.toLocaleString()}
                </div>
                <div>
                  <strong>Join Date:</strong> {new Date(userDetails.user.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>Projected Return:</strong> ${userDetails.simulation.totalProjectedReturn.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Monthly Breakdown */}
            <h3 style={{ marginBottom: '1rem' }}>Monthly Simulation Details</h3>
            <div style={{
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '1.5rem'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#1F2937' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB', color: '#FFFFFF' }}>Month</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB', color: '#FFFFFF' }}>Rate</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB', color: '#FFFFFF' }}>Starting</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB', color: '#FFFFFF' }}>Interest</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB', color: '#FFFFFF' }}>Daily $</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB', color: '#FFFFFF' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB', color: '#FFFFFF' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userDetails.simulation.months.map((month: any, index: number) => (
                    <tr key={index} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '0.75rem', color: '#000000' }}>{month.monthNumber}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {editingMonth === month.monthNumber ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={newRate}
                              onChange={(e) => setNewRate(e.target.value)}
                              placeholder="15.50"
                              style={{
                                width: '80px',
                                padding: '0.25rem',
                                border: '1px solid #D1D5DB',
                                borderRadius: '4px'
                              }}
                            />
                            <span style={{ color: '#000000' }}>%</span>
                            <button
                              onClick={handleRateOverride}
                              style={{
                                backgroundColor: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingMonth(null);
                                setNewRate('');
                              }}
                              style={{
                                backgroundColor: '#6B7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.25rem 0.5rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span style={{
                            fontWeight: '600',
                            color: '#059669'
                          }}>
                            {(month.lockedRate * 100).toFixed(2)}%
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#000000' }}>${month.startingBalance.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem', color: '#000000' }}>${month.projectedInterest.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem', color: '#000000' }}>${month.dailyPayoutSchedule?.dailyPayout.toFixed(2) || '0.00'}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.875rem',
                          color: '#000000'
                        }}>
                          {month.status === 'active' && <CheckCircle size={16} color="#10B981" />}
                          {month.status === 'scheduled' && <Clock size={16} color="#F59E0B" />}
                          {month.status === 'completed' && <CheckCircle size={16} color="#6B7280" />}
                          {month.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {editingMonth !== month.monthNumber && (
                          <button
                            onClick={() => {
                              setEditingMonth(month.monthNumber);
                              setNewRate((month.lockedRate * 100).toFixed(2));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#3B82F6'
                            }}
                          >
                            <Edit size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Impact Preview */}
            {previewVisible && impactPreview && (
              <div style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #DBEAFE',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1E40AF' }}>Rate Change Impact</h4>
                <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                  <p>Old Monthly Interest: ${impactPreview.oldMonthlyInterest.toFixed(2)}</p>
                  <p>New Monthly Interest: ${impactPreview.newMonthlyInterest.toFixed(2)}</p>
                  <p>New Total Return: ${impactPreview.newTotalReturn.toFixed(2)}</p>
                  <p>Affected Months: {impactPreview.affectedMonths}</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #E5E7EB'
            }}>
              <button
                style={{
                  backgroundColor: '#F59E0B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Pause size={16} />
                Pause Simulation
              </button>
              <button
                style={{
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <DollarSign size={16} />
                Add Deposit
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
            No simulation data found for this user.
          </div>
        )}
      </div>
    </div>
  );
};

const CompoundInterestAdmin: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/compound-interest/admin/overview'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOverview(data.stats);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = (userId: string, email: string) => {
    setSelectedUser({ id: userId, email });
    setModalOpen(true);
  };

  const filteredUsers = overview?.userBreakdown.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div>Loading compound interest overview...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '2rem', 
          fontWeight: '700',
          color: '#1F2937'
        }}>
          🏦 Compound Interest Admin
        </h1>
        <p style={{ margin: 0, color: '#6B7280' }}>
          Manage compound interest simulations and monitor payout projections
        </p>
      </div>

      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Total Deposited */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              backgroundColor: '#DBEAFE',
              borderRadius: '8px',
              padding: '0.5rem',
              display: 'flex'
            }}>
              <DollarSign size={20} color="#3B82F6" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              Total Deposited
            </h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.5rem' }}>
            ${overview?.totalDeposited.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            {overview?.activeSimulations || 0} Active Simulations
          </div>
        </div>

        {/* Projected Payouts */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              backgroundColor: '#D1FAE5',
              borderRadius: '8px',
              padding: '0.5rem',
              display: 'flex'
            }}>
              <TrendingUp size={20} color="#10B981" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              Projected Payouts
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>7 Days:</span>
              <span style={{ fontWeight: '600' }}>${overview?.projectedPayouts.next7Days.toLocaleString() || '0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>30 Days:</span>
              <span style={{ fontWeight: '600' }}>${overview?.projectedPayouts.next30Days.toLocaleString() || '0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>12 Months:</span>
              <span style={{ fontWeight: '600' }}>${overview?.projectedPayouts.next12Months.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Table Header */}
        <div style={{
          padding: '1.5rem 1.5rem 1rem 1.5rem',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
              User Simulation Management
            </h2>
            <button
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>

          {/* Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search 
                size={18} 
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6B7280'
                }}
              />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#1F2937' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '500', color: '#FFFFFF' }}>
                  User
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '500', color: '#FFFFFF' }}>
                  Deposited
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '500', color: '#FFFFFF' }}>
                  7-Day
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '500', color: '#FFFFFF' }}>
                  30-Day
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '500', color: '#FFFFFF' }}>
                  1-Year
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#FFFFFF' }}>
                  Status
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#FFFFFF' }}>
                  Join Date
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#FFFFFF' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr 
                  key={user.userId}
                  style={{ 
                    borderBottom: '1px solid #F3F4F6',
                    backgroundColor: index % 2 === 0 ? '#FAFAFA' : 'white'
                  }}
                >
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: '500', color: '#000000' }}>
                      {user.email}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500', color: '#000000' }}>
                    ${user.deposited.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#000000' }}>
                    ${user.projectedPayouts.next7Days.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#000000' }}>
                    ${user.projectedPayouts.next30Days.toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500', color: '#000000' }}>
                    ${user.projectedPayouts.next12Months.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: user.status === 'active' ? '#D1FAE5' : 
                                     user.status === 'paused' ? '#FEF3C7' : '#F3F4F6',
                      color: user.status === 'active' ? '#065F46' : 
                             user.status === 'paused' ? '#92400E' : '#374151'
                    }}>
                      {user.status === 'active' && <CheckCircle size={12} />}
                      {user.status === 'paused' && <Pause size={12} />}
                      {user.status === 'completed' && <CheckCircle size={12} />}
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: '#000000' }}>
                    {new Date(user.joinDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <button
                      onClick={() => openUserModal(user.userId, user.email)}
                      style={{
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem'
                      }}
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#6B7280' 
          }}>
            No users found matching your criteria.
          </div>
        )}
      </div>

      {/* Simulation Detail Modal */}
      <SimulationDetailModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?.id || null}
        userEmail={selectedUser?.email || ''}
        onUpdate={fetchOverview}
      />
    </div>
  );
};

export default CompoundInterestAdmin;