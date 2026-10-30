import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StaffDashboard from '../../src/components/StaffDashboard';
import { TestProviders } from '../test-utils';
// Mock the API module
vi.mock('../../src/api', async () => {
    const actual = await vi.importActual('../../src/api');
    return {
        ...actual,
        fetchStaffDashboard: vi.fn(),
    };
});
import * as api from '../../src/api';
const mockFetchStaffDashboard = api.fetchStaffDashboard;
describe('Lab 4: StaffDashboard Component', () => {
    const mockMetrics = {
        unassigned: 15,
        myAssigned: 8,
        recentlyUpdated: 22,
        highPriorityUnresolved: 4,
        byStatus: {
            NEW: 5,
            OPEN: 12,
            IN_PROGRESS: 18,
            WAITING_FOR_REQUESTER: 7,
            RESOLVED: 45,
            REOPENED: 2,
        },
        byPriority: {
            LOW: 35,
            MEDIUM: 50,
            HIGH: 12,
        },
    };
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('Loading State', () => {
        it('displays loading skeleton while fetching data', () => {
            mockFetchStaffDashboard.mockImplementation(() => new Promise(() => { }));
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            expect(screen.getByText('IT Staff Dashboard')).toBeInTheDocument();
            expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0);
        });
    });
    describe('Data Display', () => {
        it('displays all primary metrics when data loads successfully', async () => {
            mockFetchStaffDashboard.mockResolvedValue(mockMetrics);
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Unassigned')).toBeInTheDocument();
            });
            expect(screen.getByText('15')).toBeInTheDocument();
            expect(screen.getByText('My Assigned')).toBeInTheDocument();
            expect(screen.getByText('8')).toBeInTheDocument();
            expect(screen.getByText('High Priority')).toBeInTheDocument();
            expect(screen.getByText('4')).toBeInTheDocument();
            expect(screen.getByText('22')).toBeInTheDocument();
        });
        it('displays status breakdown with badges', async () => {
            mockFetchStaffDashboard.mockResolvedValue(mockMetrics);
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('NEW')).toBeInTheDocument();
            });
            expect(screen.getByText('OPEN')).toBeInTheDocument();
            expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
            expect(screen.getByText('WAITING')).toBeInTheDocument();
            expect(screen.getByText('RESOLVED')).toBeInTheDocument();
            expect(screen.getByText('REOPENED')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('12')).toBeInTheDocument();
            expect(screen.getByText('18')).toBeInTheDocument();
            expect(screen.getByText('7')).toBeInTheDocument();
            expect(screen.getByText('45')).toBeInTheDocument();
            expect(screen.getByText('2')).toBeInTheDocument();
        });
        it('displays priority breakdown', async () => {
            mockFetchStaffDashboard.mockResolvedValue(mockMetrics);
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Tickets by Priority')).toBeInTheDocument();
            });
            expect(screen.getByText('HIGH')).toBeInTheDocument();
            expect(screen.getByText('MEDIUM')).toBeInTheDocument();
            expect(screen.getByText('LOW')).toBeInTheDocument();
            expect(screen.getByText('35')).toBeInTheDocument();
            expect(screen.getByText('50')).toBeInTheDocument();
        });
        it('displays zero values correctly', async () => {
            mockFetchStaffDashboard.mockResolvedValue({
                unassigned: 0,
                myAssigned: 0,
                recentlyUpdated: 0,
                highPriorityUnresolved: 0,
                byStatus: {
                    NEW: 0,
                    OPEN: 0,
                    IN_PROGRESS: 0,
                    WAITING_FOR_REQUESTER: 0,
                    RESOLVED: 0,
                    REOPENED: 0,
                },
                byPriority: {
                    LOW: 0,
                    MEDIUM: 0,
                    HIGH: 0,
                },
            });
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('IT Staff Dashboard')).toBeInTheDocument();
            });
            const zeroValues = screen.getAllByText('0');
            expect(zeroValues.length).toBeGreaterThan(0);
        });
    });
    describe('Empty State', () => {
        it('displays empty state when no tickets need attention', async () => {
            mockFetchStaffDashboard.mockResolvedValue({
                unassigned: 0,
                myAssigned: 0,
                recentlyUpdated: 0,
                highPriorityUnresolved: 0,
                byStatus: {
                    NEW: 0,
                    OPEN: 0,
                    IN_PROGRESS: 0,
                    WAITING_FOR_REQUESTER: 0,
                    RESOLVED: 0,
                    REOPENED: 0,
                },
                byPriority: {
                    LOW: 0,
                    MEDIUM: 0,
                    HIGH: 0,
                },
            });
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText(/All Clear/i)).toBeInTheDocument();
            });
            expect(screen.getByText(/No tickets require immediate attention/i)).toBeInTheDocument();
        });
    });
    describe('Error State', () => {
        it('displays error message when API call fails', async () => {
            mockFetchStaffDashboard.mockRejectedValue(new Error('Failed to load dashboard'));
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Unable to Load Dashboard')).toBeInTheDocument();
            });
            expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
            expect(screen.getByText('Retry')).toBeInTheDocument();
        });
        it('retry button calls API again', async () => {
            mockFetchStaffDashboard.mockRejectedValueOnce(new Error('Failed'));
            mockFetchStaffDashboard.mockResolvedValueOnce(mockMetrics);
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Retry')).toBeInTheDocument();
            });
            await userEvent.click(screen.getByText('Retry'));
            await waitFor(() => {
                expect(screen.getByText('Unassigned')).toBeInTheDocument();
            });
        });
    });
    describe('Drill-down Links', () => {
        it('primary metrics have "View All" links', async () => {
            mockFetchStaffDashboard.mockResolvedValue(mockMetrics);
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Unassigned')).toBeInTheDocument();
            });
            const viewAllLinks = screen.getAllByText(/View All/i);
            expect(viewAllLinks.length).toBeGreaterThan(0);
        });
        it('status breakdown cards have View links', async () => {
            mockFetchStaffDashboard.mockResolvedValue(mockMetrics);
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Tickets by Status')).toBeInTheDocument();
            });
            const viewLinks = screen.getAllByText(/View →/i);
            expect(viewLinks.length).toBeGreaterThan(0);
        });
    });
    describe('Accessibility', () => {
        it('has accessible labels for all links', async () => {
            mockFetchStaffDashboard.mockResolvedValue(mockMetrics);
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('Unassigned')).toBeInTheDocument();
            });
            expect(screen.getByLabelText('View unassigned tickets')).toBeInTheDocument();
            expect(screen.getByLabelText('View my assigned tickets')).toBeInTheDocument();
            expect(screen.getByLabelText('View high priority tickets')).toBeInTheDocument();
        });
        it('has semantic heading structure', async () => {
            mockFetchStaffDashboard.mockResolvedValue(mockMetrics);
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByRole('heading', { level: 1, name: 'IT Staff Dashboard' })).toBeInTheDocument();
            });
            expect(screen.getByRole('heading', { level: 2, name: 'Ticket Overview' })).toBeInTheDocument();
        });
        it('status badges have text labels not just colors', async () => {
            mockFetchStaffDashboard.mockResolvedValue(mockMetrics);
            render(_jsx(TestProviders, { children: _jsx(StaffDashboard, {}) }));
            await waitFor(() => {
                expect(screen.getByText('NEW')).toBeInTheDocument();
            });
            // All status badges should have text
            expect(screen.getByText('OPEN')).toBeInTheDocument();
            expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
            expect(screen.getByText('RESOLVED')).toBeInTheDocument();
        });
    });
});
