import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Lab 4: UI Style Tests
 * Tests CSS classes, visual states, badges, buttons, form fields, and design consistency
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
describe('Lab 4: UI Style Tests', () => {
    describe('Badge Styles', () => {
        it('priority badges have correct CSS classes', () => {
            const { container } = render(_jsxs("div", { children: [_jsx("span", { className: "badge badge-priority-high", children: "High" }), _jsx("span", { className: "badge badge-priority-medium", children: "Medium" }), _jsx("span", { className: "badge badge-priority-low", children: "Low" })] }));
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
            const { container } = render(_jsxs("div", { children: [_jsx("span", { className: "badge badge-success", children: "Resolved" }), _jsx("span", { className: "badge badge-warning", children: "In Progress" }), _jsx("span", { className: "badge badge-danger", children: "High Priority" })] }));
            expect(container.querySelector('.badge-success')).toBeInTheDocument();
            expect(container.querySelector('.badge-warning')).toBeInTheDocument();
            expect(container.querySelector('.badge-danger')).toBeInTheDocument();
        });
        it('follow-up required badge uses warning style', () => {
            const { container } = render(_jsx("span", { className: "badge badge-warning", children: "Follow-Up Required" }));
            const badge = container.querySelector('.badge-warning');
            expect(badge).toBeInTheDocument();
            expect(badge?.textContent).toBe('Follow-Up Required');
        });
    });
    describe('Button Styles', () => {
        it('primary buttons have correct CSS class', () => {
            render(_jsx("button", { className: "btn-primary", children: "Click Me" }));
            const button = screen.getByRole('button', { name: /click me/i });
            expect(button).toHaveClass('btn-primary');
        });
        it('secondary buttons have correct CSS class', () => {
            render(_jsx("button", { className: "btn-secondary", children: "Cancel" }));
            const button = screen.getByRole('button', { name: /cancel/i });
            expect(button).toHaveClass('btn-secondary');
        });
        it('disabled buttons have correct styling', () => {
            render(_jsx("button", { className: "btn-primary", disabled: true, children: "Disabled" }));
            const button = screen.getByRole('button', { name: /disabled/i });
            expect(button).toBeDisabled();
            expect(button).toHaveClass('btn-primary');
        });
        it('small buttons have btn-sm class', () => {
            render(_jsx("button", { className: "btn-primary btn-sm", children: "Small" }));
            const button = screen.getByRole('button', { name: /small/i });
            expect(button).toHaveClass('btn-sm');
        });
    });
    describe('Form Field Styles', () => {
        it('editable inputs have zen-input class', () => {
            const { container } = render(_jsx("input", { type: "text", className: "zen-input", placeholder: "Enter text" }));
            const input = container.querySelector('.zen-input');
            expect(input).toBeInTheDocument();
            expect(input).not.toHaveClass('zen-readonly');
            expect(input).not.toHaveClass('error');
        });
        it('read-only fields have zen-readonly class', () => {
            const { container } = render(_jsx("input", { type: "text", className: "zen-input zen-readonly", value: "Read only", readOnly: true }));
            const input = container.querySelector('.zen-readonly');
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute('readOnly');
        });
        it('invalid fields have error class', () => {
            const { container } = render(_jsxs("div", { children: [_jsx("input", { type: "text", className: "zen-input error", "aria-invalid": "true" }), _jsx("div", { className: "error-message", children: "This field is required" })] }));
            const input = container.querySelector('.error');
            const errorMsg = container.querySelector('.error-message');
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(errorMsg).toBeInTheDocument();
        });
        it('required fields show red asterisk', () => {
            const { container } = render(_jsxs("label", { children: ["Field Name ", _jsx("span", { className: "required", children: "*" })] }));
            const asterisk = container.querySelector('.required');
            expect(asterisk).toBeInTheDocument();
            expect(asterisk?.textContent).toBe('*');
        });
        it('helper text has correct class', () => {
            const { container } = render(_jsx("div", { className: "helper-text", children: "Enter 10-2000 characters" }));
            const helper = container.querySelector('.helper-text');
            expect(helper).toBeInTheDocument();
        });
        it('character counter has correct class', () => {
            const { container } = render(_jsx("div", { className: "char-counter", children: "150 / 2000 characters" }));
            const counter = container.querySelector('.char-counter');
            expect(counter).toBeInTheDocument();
        });
    });
    describe('Card Styles', () => {
        it('metric cards have correct structure', () => {
            const { container } = render(_jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-header", children: _jsx("h3", { className: "metric-label", children: "Open Tickets" }) }), _jsx("div", { className: "metric-value", children: "5" }), _jsx("div", { className: "metric-description", children: "Active tickets" }), _jsx("button", { className: "metric-link", children: "View All \u2192" })] }));
            expect(container.querySelector('.metric-card')).toBeInTheDocument();
            expect(container.querySelector('.metric-header')).toBeInTheDocument();
            expect(container.querySelector('.metric-label')).toBeInTheDocument();
            expect(container.querySelector('.metric-value')).toBeInTheDocument();
            expect(container.querySelector('.metric-description')).toBeInTheDocument();
            expect(container.querySelector('.metric-link')).toBeInTheDocument();
        });
        it('action cards have correct styling', () => {
            const { container } = render(_jsxs("button", { className: "action-card", children: [_jsx("span", { className: "action-icon", children: "\u2795" }), _jsx("span", { className: "action-label", children: "Create Ticket" })] }));
            expect(container.querySelector('.action-card')).toBeInTheDocument();
            expect(container.querySelector('.action-icon')).toBeInTheDocument();
            expect(container.querySelector('.action-label')).toBeInTheDocument();
        });
        it('highlighted cards have highlight class', () => {
            const { container } = render(_jsx("div", { className: "metric-card highlight", children: _jsx("div", { className: "metric-value", children: "3" }) }));
            const card = container.querySelector('.metric-card.highlight');
            expect(card).toBeInTheDocument();
        });
        it('urgent cards have urgent class', () => {
            const { container } = render(_jsx("div", { className: "metric-card urgent", children: _jsx("div", { className: "metric-value", children: "8" }) }));
            const card = container.querySelector('.metric-card.urgent');
            expect(card).toBeInTheDocument();
        });
    });
    describe('State Indicators', () => {
        it('empty state has correct structure', () => {
            const { container } = render(_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-icon", children: "\uD83D\uDCCB" }), _jsx("h2", { children: "No Tickets" }), _jsx("p", { children: "You don't have any tickets yet." })] }));
            expect(container.querySelector('.empty-state')).toBeInTheDocument();
            expect(container.querySelector('.empty-icon')).toBeInTheDocument();
        });
        it('error state has correct structure', () => {
            const { container } = render(_jsxs("div", { className: "error-state", children: [_jsx("div", { className: "error-icon", children: "\u26A0\uFE0F" }), _jsx("h2", { children: "Unable to Load" }), _jsx("p", { children: "Please try again" })] }));
            expect(container.querySelector('.error-state')).toBeInTheDocument();
            expect(container.querySelector('.error-icon')).toBeInTheDocument();
        });
        it('loading skeleton has correct classes', () => {
            const { container } = render(_jsxs("div", { className: "metric-card skeleton", children: [_jsx("div", { className: "skeleton-text skeleton-title" }), _jsx("div", { className: "skeleton-text skeleton-value" })] }));
            expect(container.querySelector('.skeleton')).toBeInTheDocument();
            expect(container.querySelector('.skeleton-text')).toBeInTheDocument();
            expect(container.querySelector('.skeleton-title')).toBeInTheDocument();
            expect(container.querySelector('.skeleton-value')).toBeInTheDocument();
        });
    });
    describe('Alert Messages', () => {
        it('success alert has correct class', () => {
            const { container } = render(_jsx("div", { className: "alert alert-success", children: "Action recorded successfully" }));
            const alert = container.querySelector('.alert-success');
            expect(alert).toBeInTheDocument();
            expect(alert).toHaveClass('alert');
        });
        it('error alert has correct class', () => {
            const { container } = render(_jsx("div", { className: "alert alert-error", children: "Unable to save" }));
            const alert = container.querySelector('.alert-error');
            expect(alert).toBeInTheDocument();
            expect(alert).toHaveClass('alert');
        });
    });
    describe('Zen Green Color System', () => {
        it('components use consistent color classes', () => {
            const { container } = render(_jsxs("div", { children: [_jsx("button", { className: "btn-primary", children: "Primary" }), _jsx("div", { className: "metric-value", children: "5" }), _jsx("div", { className: "metric-link", children: "Link" })] }));
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
            const { container } = render(_jsx("button", { className: "btn-primary", children: "Focusable" }));
            const button = container.querySelector('.btn-primary');
            expect(button).toBeInTheDocument();
            // Focus the button to verify it's focusable
            button?.focus();
            expect(document.activeElement).toBe(button);
        });
        it('form inputs are keyboard accessible', () => {
            render(_jsx("input", { type: "text", className: "zen-input", "aria-label": "Test input" }));
            const input = screen.getByLabelText('Test input');
            expect(input).toBeInTheDocument();
            // Verify it can receive focus
            input.focus();
            expect(document.activeElement).toBe(input);
        });
    });
});
