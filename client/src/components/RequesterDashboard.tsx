import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRequesterDashboard, RequesterDashboardMetrics } from '../api';
import './RequesterDashboard.css';

const RequesterDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<RequesterDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchRequesterDashboard();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadDashboard();
  };

  if (loading) {
    return (
      <div className="requester-dashboard">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="dashboard-grid">
          <div className="metric-card skeleton">
            <div className="skeleton-text skeleton-title"></div>
            <div className="skeleton-text skeleton-value"></div>
          </div>
          <div className="metric-card skeleton">
            <div className="skeleton-text skeleton-title"></div>
            <div className="skeleton-text skeleton-value"></div>
          </div>
          <div className="metric-card skeleton">
            <div className="skeleton-text skeleton-title"></div>
            <div className="skeleton-text skeleton-value"></div>
          </div>
          <div className="metric-card skeleton">
            <div className="skeleton-text skeleton-title"></div>
            <div className="skeleton-text skeleton-value"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="requester-dashboard">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Unable to Load Dashboard</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={handleRetry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const hasNoTickets = metrics.totalOpen === 0 && 
                       metrics.recentlyUpdated === 0 && 
                       metrics.recentlyResolved === 0;

  return (
    <div className="requester-dashboard">
      <h1 className="dashboard-title">Dashboard</h1>
      
      {hasNoTickets && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>Welcome to TokTickIT</h2>
          <p>You don't have any tickets yet. Create your first ticket to get started.</p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/my-tickets/new')}
          >
            Create Ticket
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Total Open */}
        <div className="metric-card">
          <div className="metric-header">
            <h2 className="metric-label">Open Tickets</h2>
          </div>
          <div className="metric-value">{metrics.totalOpen}</div>
          <div className="metric-description">
            Active tickets requiring attention
          </div>
          <button 
            className="metric-link"
            onClick={() => navigate('/my-tickets')}
            aria-label="View all open tickets"
          >
            View All →
          </button>
        </div>

        {/* Waiting for Requester */}
        <div className="metric-card highlight">
          <div className="metric-header">
            <h2 className="metric-label">Waiting for You</h2>
          </div>
          <div className="metric-value">{metrics.waitingForRequester}</div>
          <div className="metric-description">
            Tickets needing your response
          </div>
          <button 
            className="metric-link"
            onClick={() => navigate('/my-tickets?status=WAITING_FOR_REQUESTER')}
            aria-label="View tickets waiting for response"
          >
            View All →
          </button>
        </div>

        {/* Recently Updated */}
        <div className="metric-card">
          <div className="metric-header">
            <h2 className="metric-label">Recently Updated</h2>
          </div>
          <div className="metric-value">{metrics.recentlyUpdated}</div>
          <div className="metric-description">
            Updated in the last 7 days
          </div>
          <button 
            className="metric-link"
            onClick={() => navigate('/my-tickets')}
            aria-label="View recently updated tickets"
          >
            View All →
          </button>
        </div>

        {/* Recently Resolved */}
        <div className="metric-card success">
          <div className="metric-header">
            <h2 className="metric-label">Recently Resolved</h2>
          </div>
          <div className="metric-value">{metrics.recentlyResolved}</div>
          <div className="metric-description">
            Resolved in the last 30 days
          </div>
          <button 
            className="metric-link"
            onClick={() => navigate('/my-tickets?status=RESOLVED,CLOSED')}
            aria-label="View recently resolved tickets"
          >
            View All →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => navigate('/my-tickets/new')}
          >
            <span className="action-icon">➕</span>
            <span className="action-label">Create Ticket</span>
          </button>
          <button 
            className="action-card"
            onClick={() => navigate('/my-tickets')}
          >
            <span className="action-icon">📋</span>
            <span className="action-label">View My Tickets</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequesterDashboard;
