import { useEffect, useState } from 'react';
import { fetchStaffDashboard, StaffDashboardMetrics } from '../api';
import './StaffDashboard.css';

interface StaffDashboardProps {
  onNavigate?: () => void;
}

const StaffDashboard = ({ onNavigate }: StaffDashboardProps) => {
  const [metrics, setMetrics] = useState<StaffDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchStaffDashboard();
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

  const navigate = (_path: string) => {
    onNavigate?.();
  };

  if (loading) {
    return (
      <div className="staff-dashboard">
        <h1 className="dashboard-title">IT Staff Dashboard</h1>
        <div className="dashboard-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="metric-card skeleton">
              <div className="skeleton-text skeleton-title"></div>
              <div className="skeleton-text skeleton-value"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-dashboard">
        <h1 className="dashboard-title">IT Staff Dashboard</h1>
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

  const hasNoTickets = metrics.unassigned === 0 && 
                       metrics.myAssigned === 0 && 
                       metrics.highPriorityUnresolved === 0;

  return (
    <div className="staff-dashboard">
      <h1 className="dashboard-title">IT Staff Dashboard</h1>
      
      {hasNoTickets && (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h2>All Clear!</h2>
          <p>No tickets require immediate attention.</p>
        </div>
      )}

      {/* Primary Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Ticket Overview</h2>
        <div className="dashboard-grid">
          {/* Unassigned */}
          <div className="metric-card urgent">
            <div className="metric-header">
              <h3 className="metric-label">Unassigned</h3>
            </div>
            <div className="metric-value">{metrics.unassigned}</div>
            <div className="metric-description">
              Tickets needing assignment
            </div>
            <button 
              className="metric-link"
              onClick={() => navigate('/staff/tickets?assignment=unassigned')}
              aria-label="View unassigned tickets"
            >
              View All →
            </button>
          </div>

          {/* My Assigned */}
          <div className="metric-card highlight">
            <div className="metric-header">
              <h3 className="metric-label">My Assigned</h3>
            </div>
            <div className="metric-value">{metrics.myAssigned}</div>
            <div className="metric-description">
              Tickets assigned to you
            </div>
            <button 
              className="metric-link"
              onClick={() => navigate('/staff/tickets?assignment=assigned-to-me')}
              aria-label="View my assigned tickets"
            >
              View All →
            </button>
          </div>

          {/* High Priority Unresolved */}
          <div className="metric-card danger">
            <div className="metric-header">
              <h3 className="metric-label">High Priority</h3>
            </div>
            <div className="metric-value">{metrics.highPriorityUnresolved}</div>
            <div className="metric-description">
              Urgent unresolved tickets
            </div>
            <button 
              className="metric-link"
              onClick={() => navigate('/staff/tickets?itPriority=HIGH')}
              aria-label="View high priority tickets"
            >
              View All →
            </button>
          </div>

          {/* Recently Updated */}
          <div className="metric-card">
            <div className="metric-header">
              <h3 className="metric-label">Recently Updated</h3>
            </div>
            <div className="metric-value">{metrics.recentlyUpdated}</div>
            <div className="metric-description">
              Updated in last 7 days
            </div>
            <button 
              className="metric-link"
              onClick={() => navigate('/staff/tickets')}
              aria-label="View recently updated tickets"
            >
              View All →
            </button>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="dashboard-section">
        <h2 className="section-title">Tickets by Status</h2>
        <div className="breakdown-grid">
          <div className="breakdown-card">
            <span className="badge badge-info">NEW</span>
            <span className="breakdown-value">{metrics.byStatus.NEW}</span>
            <button 
              className="breakdown-link"
              onClick={() => navigate('/staff/tickets?status=NEW')}
              aria-label="View new tickets"
            >
              View →
            </button>
          </div>
          <div className="breakdown-card">
            <span className="badge badge-primary">OPEN</span>
            <span className="breakdown-value">{metrics.byStatus.OPEN}</span>
            <button 
              className="breakdown-link"
              onClick={() => navigate('/staff/tickets?status=OPEN')}
              aria-label="View open tickets"
            >
              View →
            </button>
          </div>
          <div className="breakdown-card">
            <span className="badge badge-warning">IN PROGRESS</span>
            <span className="breakdown-value">{metrics.byStatus.IN_PROGRESS}</span>
            <button 
              className="breakdown-link"
              onClick={() => navigate('/staff/tickets?status=IN_PROGRESS')}
              aria-label="View in progress tickets"
            >
              View →
            </button>
          </div>
          <div className="breakdown-card">
            <span className="badge badge-secondary">WAITING</span>
            <span className="breakdown-value">{metrics.byStatus.WAITING_FOR_REQUESTER}</span>
            <button 
              className="breakdown-link"
              onClick={() => navigate('/staff/tickets?status=WAITING_FOR_REQUESTER')}
              aria-label="View waiting tickets"
            >
              View →
            </button>
          </div>
          <div className="breakdown-card">
            <span className="badge badge-success">RESOLVED</span>
            <span className="breakdown-value">{metrics.byStatus.RESOLVED}</span>
            <button 
              className="breakdown-link"
              onClick={() => navigate('/staff/tickets?status=RESOLVED')}
              aria-label="View resolved tickets"
            >
              View →
            </button>
          </div>
          <div className="breakdown-card">
            <span className="badge badge-danger">REOPENED</span>
            <span className="breakdown-value">{metrics.byStatus.REOPENED}</span>
            <button 
              className="breakdown-link"
              onClick={() => navigate('/staff/tickets?status=REOPENED')}
              aria-label="View reopened tickets"
            >
              View →
            </button>
          </div>
        </div>
      </div>

      {/* Priority Breakdown */}
      <div className="dashboard-section">
        <h2 className="section-title">Tickets by Priority</h2>
        <div className="breakdown-grid">
          <div className="breakdown-card">
            <span className="badge badge-priority-high">HIGH</span>
            <span className="breakdown-value">{metrics.byPriority.HIGH}</span>
            <button 
              className="breakdown-link"
              onClick={() => navigate('/staff/tickets?itPriority=HIGH')}
              aria-label="View high priority tickets"
            >
              View →
            </button>
          </div>
          <div className="breakdown-card">
            <span className="badge badge-priority-medium">MEDIUM</span>
            <span className="breakdown-value">{metrics.byPriority.MEDIUM}</span>
            <button 
              className="breakdown-link"
              onClick={() => navigate('/staff/tickets?itPriority=MEDIUM')}
              aria-label="View medium priority tickets"
            >
              View →
            </button>
          </div>
          <div className="breakdown-card">
            <span className="badge badge-priority-low">LOW</span>
            <span className="breakdown-value">{metrics.byPriority.LOW}</span>
            <button 
              className="breakdown-link"
              onClick={() => navigate('/staff/tickets?itPriority=LOW')}
              aria-label="View low priority tickets"
            >
              View →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => navigate('/staff/tickets?assignment=unassigned')}
          >
            <span className="action-icon">📥</span>
            <span className="action-label">Unassigned Queue</span>
          </button>
          <button 
            className="action-card"
            onClick={() => navigate('/staff/tickets?assignment=assigned-to-me')}
          >
            <span className="action-icon">👤</span>
            <span className="action-label">My Tickets</span>
          </button>
          <button 
            className="action-card"
            onClick={() => navigate('/staff/tickets')}
          >
            <span className="action-icon">📋</span>
            <span className="action-label">All Tickets</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
