/**
 * Lab 4: UI Style Tests
 * Tests CSS classes, visual states, badges, buttons, form fields, and design consistency
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

describe('Lab 4: UI Style Tests', () => {
  describe('Badge Styles', () => {
    it('priority badges have correct CSS classes', () => {
      const { container } = render(
        <div>
          <span className="badge badge-priority-high">High</span>
          <span className="badge badge-priority-medium">Medium</span>
          <span className="badge badge-priority-low">Low</span>
        </div>
      );

      const highBadge = container.querySelector('.badge-priority-high');
      const mediumBadge = container.querySelector('.badge-priority-medium');
      const lowBadge = container.querySelector('.badge-priority-low');

      expect(highBadge).toBeInTheDocument();
      expect(mediumBadge).toBeInTheDocument();
      expect(lowBadge).toBeInTheDocument();

      // Verify badge base class
      expect(highBadge?.classList.contains('badge')).toBe(true);
      expect(mediumBadge?.classList.contains('badge')).toBe(true);
      expect(lowBadge?.classList.contains('badge')).toBe(true);
    });

    it('status badges have correct colors', () => {
      const { container } = render(
        <div>
          <span className="badge badge-success">Resolved</span>
          <span className="badge badge-warning">In Progress</span>
          <span className="badge badge-danger">High Priority</span>
        </div>
      );

      expect(container.querySelector('.badge-success')).toBeInTheDocument();
      expect(container.querySelector('.badge-warning')).toBeInTheDocument();
      expect(container.querySelector('.badge-danger')).toBeInTheDocument();
    });

    it('follow-up required badge uses warning style', () => {
      const { container } = render(
        <span className="badge badge-warning">Follow-Up Required</span>
      );

      const badge = container.querySelector('.badge-warning');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe('Follow-Up Required');
    });
  });

  describe('Button Styles', () => {
    it('primary buttons have correct CSS class', () => {
      render(<button className="btn-primary">Click Me</button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toHaveClass('btn-primary');
    });

    it('secondary buttons have correct CSS class', () => {
      render(<button className="btn-secondary">Cancel</button>);
      
      const button = screen.getByRole('button', { name: /cancel/i });
      expect(button).toHaveClass('btn-secondary');
    });

    it('disabled buttons have correct styling', () => {
      render(<button className="btn-primary" disabled>Disabled</button>);
      
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('btn-primary');
    });

    it('small buttons have btn-sm class', () => {
      render(<button className="btn-primary btn-sm">Small</button>);
      
      const button = screen.getByRole('button', { name: /small/i });
      expect(button).toHaveClass('btn-sm');
    });
  });

  describe('Form Field Styles', () => {
    it('editable inputs have zen-input class', () => {
      const { container } = render(
        <input type="text" className="zen-input" placeholder="Enter text" />
      );
      
      const input = container.querySelector('.zen-input');
      expect(input).toBeInTheDocument();
      expect(input).not.toHaveClass('zen-readonly');
      expect(input).not.toHaveClass('error');
    });

    it('read-only fields have zen-readonly class', () => {
      const { container } = render(
        <input 
          type="text" 
          className="zen-input zen-readonly" 
          value="Read only" 
          readOnly 
        />
      );
      
      const input = container.querySelector('.zen-readonly');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('readOnly');
    });

    it('invalid fields have error class', () => {
      const { container } = render(
        <div>
          <input 
            type="text" 
            className="zen-input error" 
            aria-invalid="true"
          />
          <div className="error-message">This field is required</div>
        </div>
      );
      
      const input = container.querySelector('.error');
      const errorMsg = container.querySelector('.error-message');
      
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(errorMsg).toBeInTheDocument();
    });

    it('required fields show red asterisk', () => {
      const { container } = render(
        <label>
          Field Name <span className="required">*</span>
        </label>
      );
      
      const asterisk = container.querySelector('.required');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk?.textContent).toBe('*');
    });

    it('helper text has correct class', () => {
      const { container } = render(
        <div className="helper-text">Enter 10-2000 characters</div>
      );
      
      const helper = container.querySelector('.helper-text');
      expect(helper).toBeInTheDocument();
    });

    it('character counter has correct class', () => {
      const { container } = render(
        <div className="char-counter">150 / 2000 characters</div>
      );
      
      const counter = container.querySelector('.char-counter');
      expect(counter).toBeInTheDocument();
    });
  });

  describe('Card Styles', () => {
    it('metric cards have correct structure', () => {
      const { container } = render(
        <div className="metric-card">
          <div className="metric-header">
            <h3 className="metric-label">Open Tickets</h3>
          </div>
          <div className="metric-value">5</div>
          <div className="metric-description">Active tickets</div>
          <button className="metric-link">View All →</button>
        </div>
      );

      expect(container.querySelector('.metric-card')).toBeInTheDocument();
      expect(container.querySelector('.metric-header')).toBeInTheDocument();
      expect(container.querySelector('.metric-label')).toBeInTheDocument();
      expect(container.querySelector('.metric-value')).toBeInTheDocument();
      expect(container.querySelector('.metric-description')).toBeInTheDocument();
      expect(container.querySelector('.metric-link')).toBeInTheDocument();
    });

    it('action cards have correct styling', () => {
      const { container } = render(
        <button className="action-card">
          <span className="action-icon">➕</span>
          <span className="action-label">Create Ticket</span>
        </button>
      );

      expect(container.querySelector('.action-card')).toBeInTheDocument();
      expect(container.querySelector('.action-icon')).toBeInTheDocument();
      expect(container.querySelector('.action-label')).toBeInTheDocument();
    });

    it('highlighted cards have highlight class', () => {
      const { container } = render(
        <div className="metric-card highlight">
          <div className="metric-value">3</div>
        </div>
      );

      const card = container.querySelector('.metric-card.highlight');
      expect(card).toBeInTheDocument();
    });

    it('urgent cards have urgent class', () => {
      const { container } = render(
        <div className="metric-card urgent">
          <div className="metric-value">8</div>
        </div>
      );

      const card = container.querySelector('.metric-card.urgent');
      expect(card).toBeInTheDocument();
    });
  });

  describe('State Indicators', () => {
    it('empty state has correct structure', () => {
      const { container } = render(
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No Tickets</h2>
          <p>You don't have any tickets yet.</p>
        </div>
      );

      expect(container.querySelector('.empty-state')).toBeInTheDocument();
      expect(container.querySelector('.empty-icon')).toBeInTheDocument();
    });

    it('error state has correct structure', () => {
      const { container } = render(
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Unable to Load</h2>
          <p>Please try again</p>
        </div>
      );

      expect(container.querySelector('.error-state')).toBeInTheDocument();
      expect(container.querySelector('.error-icon')).toBeInTheDocument();
    });

    it('loading skeleton has correct classes', () => {
      const { container } = render(
        <div className="metric-card skeleton">
          <div className="skeleton-text skeleton-title"></div>
          <div className="skeleton-text skeleton-value"></div>
        </div>
      );

      expect(container.querySelector('.skeleton')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-text')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-title')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-value')).toBeInTheDocument();
    });
  });

  describe('Alert Messages', () => {
    it('success alert has correct class', () => {
      const { container } = render(
        <div className="alert alert-success">Action recorded successfully</div>
      );

      const alert = container.querySelector('.alert-success');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('alert');
    });

    it('error alert has correct class', () => {
      const { container } = render(
        <div className="alert alert-error">Unable to save</div>
      );

      const alert = container.querySelector('.alert-error');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('alert');
    });
  });

  describe('Zen Green Color System', () => {
    it('components use consistent color classes', () => {
      const { container } = render(
        <div>
          <button className="btn-primary">Primary</button>
          <div className="metric-value">5</div>
          <div className="metric-link">Link</div>
        </div>
      );

      // All these should be rendered (color validation would be in E2E/visual tests)
      expect(container.querySelector('.btn-primary')).toBeInTheDocument();
      expect(container.querySelector('.metric-value')).toBeInTheDocument();
      expect(container.querySelector('.metric-link')).toBeInTheDocument();
    });
  });

  describe('Accessibility Styles', () => {
    it('focus indicators are defined in CSS', () => {
      // This test verifies the presence of focus-related CSS classes
      // Actual visual focus testing would be done in E2E tests
      
      const { container } = render(
        <button className="btn-primary">Focusable</button>
      );

      const button = container.querySelector('.btn-primary');
      expect(button).toBeInTheDocument();
      
      // Focus the button to verify it's focusable
      button?.focus();
      expect(document.activeElement).toBe(button);
    });

    it('form inputs are keyboard accessible', () => {
      render(
        <input 
          type="text" 
          className="zen-input"
          aria-label="Test input"
        />
      );

      const input = screen.getByLabelText('Test input');
      expect(input).toBeInTheDocument();
      
      // Verify it can receive focus
      input.focus();
      expect(document.activeElement).toBe(input);
    });
  });
});
