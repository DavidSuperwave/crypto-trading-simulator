import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface PendingDeposit {
  id: string;
  amount: number;
  plan: string;
  method: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const PendingRequestsWidget: React.FC = () => {
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number) => 
    `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} style={{ color: '#F59E0B' }} />;
      case 'approved':
        return <CheckCircle size={16} style={{ color: '#10B981' }} />;
      case 'rejected':
        return <XCircle size={16} style={{ color: '#EF4444' }} />;
      default:
        return <AlertCircle size={16} style={{ color: '#6B7280' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const [depositsRes, withdrawalsRes] = await Promise.all([
        axios.get('http://localhost:5001/api/user/pending-deposits'),
        axios.get('http://localhost:5001/api/user/withdrawals')
      ]);

      setPendingDeposits(depositsRes.data.pendingDeposits || []);
      setWithdrawalRequests(withdrawalsRes.data || []);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPendingRequests = pendingDeposits.length + withdrawalRequests.filter(w => w.status === 'pending').length;

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          Cargando solicitudes...
        </div>
      </div>
    );
  }

  if (totalPendingRequests === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1F2937', fontSize: '1.1rem' }}>
          Solicitudes Pendientes
        </h3>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6B7280'
        }}>
          <CheckCircle size={48} style={{ color: '#10B981', margin: '0 auto 1rem auto' }} />
          <p style={{ margin: 0 }}>No tienes solicitudes pendientes</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: '#1F2937', fontSize: '1.1rem' }}>
          Solicitudes Pendientes
        </h3>
        {totalPendingRequests > 0 && (
          <div style={{
            background: '#FEF3C7',
            color: '#D97706',
            borderRadius: '20px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            {totalPendingRequests}
          </div>
        )}
      </div>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {/* Pending Deposits */}
        {pendingDeposits.map((deposit) => (
          <div
            key={deposit.id}
            style={{
              padding: '1rem',
              marginBottom: '0.75rem',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: '#FAFBFC'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ color: '#4F46E5' }}>💰</div>
                <span style={{ fontWeight: '600', color: '#1F2937' }}>Depósito</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getStatusIcon(deposit.status)}
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '600',
                  color: getStatusColor(deposit.status)
                }}>
                  {deposit.status === 'pending' ? 'En revisión' : 
                   deposit.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </span>
              </div>
            </div>
            
            <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '0.5rem' }}>
              <strong>{formatCurrency(deposit.amount)}</strong> • Plan {deposit.plan}
            </div>
            
            <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
              Solicitado: {formatDate(deposit.createdAt)}
            </div>

            {deposit.status === 'pending' && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: '#FEF3C7',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: '#92400E'
              }}>
                ⏳ Verificando pago. Los fondos estarán disponibles una vez confirmado.
              </div>
            )}
          </div>
        ))}

        {/* Withdrawal Requests */}
        {withdrawalRequests.filter(w => w.status === 'pending').map((withdrawal) => (
          <div
            key={withdrawal.id}
            style={{
              padding: '1rem',
              marginBottom: '0.75rem',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              background: '#FAFBFC'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ color: '#10B981' }}>💸</div>
                <span style={{ fontWeight: '600', color: '#1F2937' }}>Retiro</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {getStatusIcon(withdrawal.status)}
                <span style={{ 
                  fontSize: '0.8rem', 
                  fontWeight: '600',
                  color: getStatusColor(withdrawal.status)
                }}>
                  En proceso
                </span>
              </div>
            </div>
            
            <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '0.5rem' }}>
              <strong>{formatCurrency(withdrawal.amount)}</strong> • {withdrawal.method === 'bank' ? 'Transferencia' : withdrawal.method === 'oxxo' ? 'OXXO' : 'Crypto'}
            </div>
            
            <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
              Solicitado: {formatDate(withdrawal.createdAt)}
            </div>

            <div style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: '#ECFDF5',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: '#047857'
            }}>
              💬 Tu asesor se contactará contigo pronto para procesar el retiro.
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={fetchPendingRequests}
        style={{
          width: '100%',
          marginTop: '1rem',
          background: '#F3F4F6',
          color: '#374151',
          border: 'none',
          borderRadius: '8px',
          padding: '0.75rem',
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontWeight: '500'
        }}
      >
        🔄 Actualizar estado
      </button>
    </div>
  );
};

export default PendingRequestsWidget;