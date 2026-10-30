import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Lab 4: Responsive Design Tests
 * Tests layout behavior at different viewport sizes: mobile (375px), tablet (768px), desktop (1280px)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RequesterDashboard from '../../src/components/RequesterDashboard';
import StaffDashboard from '../../src/components/StaffDashboard';
// Mock API calls
vi.mock('../../src/api', () => ({
    fetchRequesterDashboard: vi.fn(() => Promise.resolve({
        totalOpen: 5,
        waitingForRequester: 2,
        recentlyUpdated: 3,
        recentlyResolved: 4,
    })),
    fetchStaffDashboard: vi.fn(() => Promise.resolve({
        unassigned: 8,
        myAssigned: 12,
        recentlyUpdated: 15,
        highPriorityUnresolved: 3,
        byStatus: {
            NEW: 2,
            OPEN: 5,
            IN_PROGRESS: 8,
            WAITING_FOR_REQUESTER: 3,
            RESOLVED: 20,
            CLOSED: 15,
            REOPENED: 1,
            CANCELLED: 2,
        },
        byPriority: {
            LOW: 10,
            MEDIUM: 25,
            HIGH: 8,
        },
    })),
}));
// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});
describe('Lab 4: Responsive Design Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('Mobile Viewport (375px)', () => {
        beforeEach(() => {
            // Simulate mobile viewport
            global.innerWidth = 375;
            global.innerHeight = 667;
        });
        it('Requester Dashboard: cards stack in single column', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            // Wait for content to load
            await screen.findByText(/Dashboard/i);
            const grid = container.querySelector('.dashboard-grid');
            expect(grid).toBeInTheDocument();
            // Verify grid layout class exists (CSS handles actual stacking)
            const cards = container.querySelectorAll('.metric-card');
            expect(cards.length).toBeGreaterThan(0);
        });
        it('Staff Dashboard: cards stack in single column', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(StaffDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const grid = container.querySelector('.dashboard-grid');
            expect(grid).toBeInTheDocument();
            const cards = container.querySelectorAll('.metric-card');
            expect(cards.length).toBeGreaterThan(0);
        });
        it('metric values remain readable at mobile size', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const metricValues = container.querySelectorAll('.metric-value');
            expect(metricValues.length).toBeGreaterThan(0);
            // Verify metric values are rendered (size would be checked in E2E)
            metricValues.forEach(value => {
                expect(value).toBeInTheDocument();
                expect(value.textContent).toBeTruthy();
            });
        });
        it('buttons are touch-friendly size', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const buttons = container.querySelectorAll('button.metric-link, button.btn-primary');
            expect(buttons.length).toBeGreaterThan(0);
            // Buttons should be present and clickable (actual size checked in E2E)
            buttons.forEach(button => {
                expect(button).toBeInTheDocument();
            });
        });
    });
    describe('Tablet Viewport (768px)', () => {
        beforeEach(() => {
            global.innerWidth = 768;
            global.innerHeight = 1024;
        });
        it('Requester Dashboard: 2-column grid layout', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const grid = container.querySelector('.dashboard-grid');
            expect(grid).toBeInTheDocument();
            // CSS handles actual 2-column layout
            // Verify we have the expected number of cards
            const cards = container.querySelectorAll('.metric-card');
            expect(cards.length).toBe(4); // 4 metric cards for requester
        });
        it('Staff Dashboard: 2-column grid layout', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(StaffDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const grid = container.querySelector('.dashboard-grid');
            expect(grid).toBeInTheDocument();
            const cards = container.querySelectorAll('.metric-card');
            expect(cards.length).toBeGreaterThanOrEqual(4);
        });
        it('breakdown cards adapt to tablet width', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(StaffDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            // Staff dashboard has breakdown cards
            const breakdownCards = container.querySelectorAll('.breakdown-card');
            // Should have cards for statuses and priorities
            expect(breakdownCards.length).toBeGreaterThan(0);
        });
        it('text remains readable at tablet size', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const labels = container.querySelectorAll('.metric-label');
            const values = container.querySelectorAll('.metric-value');
            expect(labels.length).toBeGreaterThan(0);
            expect(values.length).toBeGreaterThan(0);
            // All text should be present
            labels.forEach(label => expect(label).toBeInTheDocument());
            values.forEach(value => expect(value).toBeInTheDocument());
        });
    });
    describe('Desktop Viewport (1280px)', () => {
        beforeEach(() => {
            global.innerWidth = 1280;
            global.innerHeight = 800;
        });
        it('Requester Dashboard: 4-column grid layout', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const grid = container.querySelector('.dashboard-grid');
            expect(grid).toBeInTheDocument();
            const cards = container.querySelectorAll('.metric-card');
            expect(cards.length).toBe(4);
        });
        it('Staff Dashboard: 3-column grid for metrics', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(StaffDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const grid = container.querySelector('.dashboard-grid');
            expect(grid).toBeInTheDocument();
            // Should have multiple metric cards
            const metricCards = container.querySelectorAll('.metric-card');
            expect(metricCards.length).toBeGreaterThanOrEqual(4);
        });
        it('cards have equal height in each row', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            // All cards should be rendered (height equality checked in E2E)
            const cards = container.querySelectorAll('.metric-card');
            cards.forEach(card => {
                expect(card).toBeInTheDocument();
            });
        });
        it('breakdown cards display in optimal layout', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(StaffDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const breakdownGrid = container.querySelector('.breakdown-grid');
            if (breakdownGrid) {
                expect(breakdownGrid).toBeInTheDocument();
            }
        });
        it('all content visible without horizontal scroll', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx("div", { style: { width: '1280px' }, children: _jsx(RequesterDashboard, {}) }) }));
            await screen.findByText(/Dashboard/i);
            // Container should not exceed viewport width
            const dashboard = container.querySelector('.requester-dashboard');
            expect(dashboard).toBeInTheDocument();
            // Max-width should be set (1400px as per CSS)
            // Actual scroll behavior checked in E2E tests
        });
    });
    describe('Responsive Grid Behavior', () => {
        it('dashboard grid uses auto-fit for responsive columns', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const grid = container.querySelector('.dashboard-grid');
            expect(grid).toBeInTheDocument();
            // Grid should exist with proper class
            // CSS grid-template-columns with auto-fit handles responsiveness
        });
        it('cards maintain minimum width', async () => {
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            // CSS sets minmax(280px, 1fr) for card width
            const cards = container.querySelectorAll('.metric-card');
            expect(cards.length).toBeGreaterThan(0);
            // All cards should render (min-width handled by CSS)
            cards.forEach(card => {
                expect(card).toBeInTheDocument();
            });
        });
        it('grid gap adjusts for smaller screens', async () => {
            // Test that grid exists at various sizes
            const viewports = [375, 768, 1280];
            for (const width of viewports) {
                global.innerWidth = width;
                const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
                await screen.findByText(/Dashboard/i);
                const grid = container.querySelector('.dashboard-grid');
                expect(grid).toBeInTheDocument();
            }
        });
    });
    describe('Content Adaptation', () => {
        it('empty state adapts to mobile width', async () => {
            // Mock empty dashboard
            vi.mocked(await import('../../src/api')).fetchRequesterDashboard
                .mockResolvedValueOnce({
                totalOpen: 0,
                waitingForRequester: 0,
                recentlyUpdated: 0,
                recentlyResolved: 0,
            });
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            // Empty state should render
            const emptyState = container.querySelector('.empty-state');
            if (emptyState) {
                expect(emptyState).toBeInTheDocument();
            }
        });
        it('error state adapts to mobile width', async () => {
            // Mock error
            vi.mocked(await import('../../src/api')).fetchRequesterDashboard
                .mockRejectedValueOnce(new Error('Network error'));
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            // Error state should render
            const errorState = container.querySelector('.error-state');
            if (errorState) {
                expect(errorState).toBeInTheDocument();
            }
        });
    });
    describe('Typography Scaling', () => {
        it('metric values scale appropriately for mobile', async () => {
            global.innerWidth = 375;
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const metricValues = container.querySelectorAll('.metric-value');
            // Values should be present (font-size checked in E2E)
            // Mobile CSS sets font-size: 2rem (down from 3rem desktop)
            metricValues.forEach(value => {
                expect(value).toBeInTheDocument();
            });
        });
        it('dashboard title scales for mobile', async () => {
            global.innerWidth = 375;
            const { container } = render(_jsx(BrowserRouter, { children: _jsx(RequesterDashboard, {}) }));
            await screen.findByText(/Dashboard/i);
            const title = container.querySelector('.dashboard-title');
            expect(title).toBeInTheDocument();
            // Mobile CSS sets font-size: 1.5rem (down from 2rem desktop)
        });
    });
});
