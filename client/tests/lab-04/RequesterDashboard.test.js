import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequesterDashboard from '../../src/components/RequesterDashboard';
import { TestProviders } from '../test-utils';
// Mock the API module
vi.mock('../../src/api', async () => {
    const actual = await vi.importActual('../../src/api');
    return {
        ...actual,
        fetchRequesterDashboard: vi.fn(),
    };
});
import * as api from '../../src/api';
const mockFetchRequesterDashboard = api.fetchRequesterDashboard;
describe('Lab 4: RequesterDashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('Loading State', () => {
        it('displays loading skeleton while fetching data', () => {
            mockFetchRequesterDashboard.mockImplementation(() => new Promise(() => { }));
            render(_jsx(TestProviders, { children: _jsx(RequesterDashboard, {}) }));
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0) ||
                expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
        });
    });
    describe('Data Display', () => {
        it('displays all four metrics when data loads successfully', async () => {
            mockFetchRequesterDashboard.mockResolvedValue({
                totalOpen: 5,
                waitingForRequester: 2,
                recentlyUpdated: 3,
                recentlyResolved: 8,
            });
            render(_jsx(TestProviders, { children: _jsx(RequesterDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Open Tickets')).toBeInTheDocument();
            });
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('Waiting for You')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
            expect(screen.getByText('Recently Updated')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.getByText('Recently Resolved')).toBeInTheDocument();
            expect(screen.getByText('8')).toBeInTheDocument();
        });
        it('displays zero values correctly', async () => {
            mockFetchRequesterDashboard.mockResolvedValue({
                totalOpen: 0,
                waitingForRequester: 0,
                recentlyUpdated: 0,
                recentlyResolved: 0,
            });
            render(_jsx(TestProviders, { children: _jsx(RequesterDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Dashboard')).toBeInTheDocument();
            });
            const zeroValues = screen.getAllByText('0');
            expect(zeroValues.length).toBeGreaterThanOrEqual(4);
        });
    });
    describe('Empty State', () => {
        it('displays empty state when all metrics are zero', async () => {
            mockFetchRequesterDashboard.mockResolvedValue({
                totalOpen: 0,
                waitingForRequester: 0,
                recentlyUpdated: 0,
                recentlyResolved: 0,
            });
            render(_jsx(TestProviders, { children: _jsx(RequesterDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText(/Welcome to TokTickIT/i)).toBeInTheDocument();
            });
            expect(screen.getByText(/don't have any tickets yet/i)).toBeInTheDocument();
        });
    });
    describe('Error State', () => {
        it('displays error message when API call fails', async () => {
            mockFetchRequesterDashboard.mockRejectedValue(new Error('Failed to load dashboard'));
            render(_jsx(TestProviders, { children: _jsx(RequesterDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Unable to Load Dashboard')).toBeInTheDocument();
            });
            expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
            expect(screen.getByText('Retry')).toBeInTheDocument();
        });
        it('retry button calls API again', async () => {
            mockFetchRequesterDashboard.mockRejectedValueOnce(new Error('Failed'));
            mockFetchRequesterDashboard.mockResolvedValueOnce({
                totalOpen: 5,
                waitingForRequester: 2,
                recentlyUpdated: 3,
                recentlyResolved: 8,
            });
            render(_jsx(TestProviders, { children: _jsx(RequesterDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Retry')).toBeInTheDocument();
            });
            await userEvent.click(screen.getByText('Retry'));
            await waitFor(() => {
                expect(screen.getByText('Open Tickets')).toBeInTheDocument();
            });
        });
    });
    describe('Drill-down Links', () => {
        it('all metric cards have "View All" links', async () => {
            mockFetchRequesterDashboard.mockResolvedValue({
                totalOpen: 5,
                waitingForRequester: 2,
                recentlyUpdated: 3,
                recentlyResolved: 8,
            });
            render(_jsx(TestProviders, { children: _jsx(RequesterDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Open Tickets')).toBeInTheDocument();
            });
            const viewAllLinks = screen.getAllByText(/View All/i);
            expect(viewAllLinks.length).toBe(4);
        });
    });
    describe('Accessibility', () => {
        it('has accessible labels for all links', async () => {
            mockFetchRequesterDashboard.mockResolvedValue({
                totalOpen: 5,
                waitingForRequester: 2,
                recentlyUpdated: 3,
                recentlyResolved: 8,
            });
            render(_jsx(TestProviders, { children: _jsx(RequesterDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Open Tickets')).toBeInTheDocument();
            });
            expect(screen.getByLabelText('View all open tickets')).toBeInTheDocument();
            expect(screen.getByLabelText('View tickets waiting for response')).toBeInTheDocument();
            expect(screen.getByLabelText('View recently updated tickets')).toBeInTheDocument();
            expect(screen.getByLabelText('View recently resolved tickets')).toBeInTheDocument();
        });
        it('has semantic heading structure', async () => {
            mockFetchRequesterDashboard.mockResolvedValue({
                totalOpen: 5,
                waitingForRequester: 2,
                recentlyUpdated: 3,
                recentlyResolved: 8,
            });
            render(_jsx(TestProviders, { children: _jsx(RequesterDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
            });
        });
    });
});
