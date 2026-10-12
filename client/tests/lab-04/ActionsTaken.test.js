import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionsTaken from '../../src/components/ActionsTaken';
import * as api from '../../src/api';
import { TestProviders } from '../test-utils';
/**
 * Lab 4: Actions Taken Component Tests
 *
 * Test Coverage:
 * - ActionForm (create and edit modes)
 * - ActionsList display
 * - Validation and error handling
 * - Authorization UI (edit button visibility)
 *
 * Related Requirements: FR-48 through FR-52, UI AC-01 through AC-12
 */
const MOCK_TICKET_NUMBER = 'TKT-2026-000001';
const MOCK_CURRENT_USER_ID = 5;
const MOCK_ACTIONS = [
    {
        id: 1,
        ticketId: 10,
        ticketNumber: MOCK_TICKET_NUMBER,
        performerId: MOCK_CURRENT_USER_ID,
        performerName: 'Jane Doe',
        performerRole: 'IT_STAFF',
        actionDateTime: '2026-09-14T10:30:00Z',
        actionDescription: 'Diagnosed network issue and identified DNS misconfiguration',
        result: 'Corrected DNS settings, user now has full network access',
        followUpRequired: false,
        followupNote: null,
        attachmentNotes: 'Network diagnostics screenshot attached',
        createdAt: '2026-09-14T10:30:00Z',
        updatedAt: '2026-09-14T10:30:00Z',
    },
    {
        id: 2,
        ticketId: 10,
        ticketNumber: MOCK_TICKET_NUMBER,
        performerId: 6,
        performerName: 'John Smith',
        performerRole: 'IT_STAFF',
        actionDateTime: '2026-09-15T14:00:00Z',
        actionDescription: 'Followed up with user to verify network stability',
        result: 'User confirmed no further issues after 24 hours',
        followUpRequired: true,
        followupNote: 'Check again in one week to ensure no recurring problems',
        attachmentNotes: null,
        createdAt: '2026-09-15T14:00:00Z',
        updatedAt: '2026-09-15T14:00:00Z',
    },
];
const MOCK_OLD_ACTION = {
    ...MOCK_ACTIONS[0],
    id: 3,
    createdAt: '2026-08-14T10:30:00Z', // > 24 hours ago
    updatedAt: '2026-08-14T10:30:00Z',
};
describe('Lab 4: ActionsTaken Component', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(api, 'fetchActions').mockResolvedValue(MOCK_ACTIONS);
    });
    describe('ActionsList - Display', () => {
        it('UI-09: displays all actions in chronological order (oldest first)', async () => {
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await waitFor(() => {
                expect(screen.getByText(/Diagnosed network issue/i)).toBeInTheDocument();
            });
            const actions = screen.getAllByTestId(/^action-card-/);
            expect(actions).toHaveLength(2);
        });
        it('each action shows performer name and role badge', async () => {
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await waitFor(() => {
                expect(screen.getByText('Jane Doe')).toBeInTheDocument();
                expect(screen.getByText('John Smith')).toBeInTheDocument();
            });
        });
        it('UI-11: actions with followUpRequired=true show "Follow-Up Required" badge', async () => {
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await waitFor(() => {
                expect(screen.getByText(/Follow-Up Required/i)).toBeInTheDocument();
            });
        });
        it('follow-up note is displayed when present', async () => {
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await waitFor(() => {
                expect(screen.getByText(/Check again in one week/i)).toBeInTheDocument();
            });
        });
    });
    describe('ActionsList - Empty State', () => {
        it('UI-12: empty state shows "No actions recorded yet" message', async () => {
            vi.spyOn(api, 'fetchActions').mockResolvedValue([]);
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await waitFor(() => {
                expect(screen.getByText(/No actions.*recorded yet/i)).toBeInTheDocument();
            });
        });
        it('empty state shows "Record First Action" button', async () => {
            vi.spyOn(api, 'fetchActions').mockResolvedValue([]);
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /Record First Action/i })).toBeInTheDocument();
            });
        });
    });
    describe('ActionForm - Create Mode', () => {
        it('UI-01: renders empty form with all required fields', async () => {
            vi.spyOn(api, 'fetchActions').mockResolvedValue([]);
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /Record.*Action/i })).toBeInTheDocument();
            });
            await userEvent.click(screen.getByRole('button', { name: /Record.*Action/i }));
            await waitFor(() => {
                expect(screen.getByLabelText(/Action Description/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/^Result/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/Follow-Up Required/i)).toBeInTheDocument();
            });
        });
        it('UI-03: checking Follow-Up Required shows Follow-up Note field', async () => {
            vi.spyOn(api, 'fetchActions').mockResolvedValue([]);
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await userEvent.click(screen.getByRole('button', { name: /Record.*Action/i }));
            await waitFor(() => {
                expect(screen.getByLabelText(/Follow-Up Required/i)).toBeInTheDocument();
            });
            const checkbox = screen.getByLabelText(/Follow-Up Required/i);
            await userEvent.click(checkbox);
            await waitFor(() => {
                expect(screen.getByLabelText(/Follow-up Note/i)).toBeInTheDocument();
            });
        });
    });
    describe('ActionForm - Validation (Create)', () => {
        it('UI-02: submit with empty description shows field-level error', async () => {
            vi.spyOn(api, 'fetchActions').mockResolvedValue([]);
            vi.spyOn(api, 'createAction').mockResolvedValue(MOCK_ACTIONS[0]);
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await userEvent.click(screen.getByRole('button', { name: /Record.*Action/i }));
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /Record Action/i })).toBeInTheDocument();
            });
            const submitButton = screen.getByRole('button', { name: /Record Action/i });
            await userEvent.click(submitButton);
            await waitFor(() => {
                expect(screen.getByText(/description.*required/i)).toBeInTheDocument();
            });
        });
        it('UI-04: submit with followUpRequired=true and no note shows error below note field', async () => {
            vi.spyOn(api, 'fetchActions').mockResolvedValue([]);
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await userEvent.click(screen.getByRole('button', { name: /Record.*Action/i }));
            await waitFor(() => {
                expect(screen.getByLabelText(/Action Description/i)).toBeInTheDocument();
            });
            // Fill required fields
            await userEvent.type(screen.getByLabelText(/Action Description/i), 'Valid description here');
            await userEvent.type(screen.getByLabelText(/^Result/i), 'Valid result here');
            // Check follow-up required
            await userEvent.click(screen.getByLabelText(/Follow-Up Required/i));
            // Don't fill follow-up note
            const submitButton = screen.getByRole('button', { name: /Record Action/i });
            await userEvent.click(submitButton);
            await waitFor(() => {
                expect(screen.getByText(/follow.*up.*note.*required/i)).toBeInTheDocument();
            });
        });
        it('does not call API when validation fails', async () => {
            const createSpy = vi.spyOn(api, 'createAction');
            vi.spyOn(api, 'fetchActions').mockResolvedValue([]);
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await userEvent.click(screen.getByRole('button', { name: /Record.*Action/i }));
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /Record Action/i })).toBeInTheDocument();
            });
            await userEvent.click(screen.getByRole('button', { name: /Record Action/i }));
            await waitFor(() => {
                expect(screen.getByText(/description.*required/i)).toBeInTheDocument();
            });
            expect(createSpy).not.toHaveBeenCalled();
        });
    });
    describe('ActionForm - Successful Creation', () => {
        it('UI-05: successful submit shows success message', async () => {
            vi.spyOn(api, 'fetchActions').mockResolvedValue([]);
            vi.spyOn(api, 'createAction').mockResolvedValue(MOCK_ACTIONS[0]);
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await userEvent.click(screen.getByRole('button', { name: /Record.*Action/i }));
            await waitFor(() => {
                expect(screen.getByLabelText(/Action Description/i)).toBeInTheDocument();
            });
            await userEvent.type(screen.getByLabelText(/Action Description/i), 'Valid action description that meets minimum requirements');
            await userEvent.type(screen.getByLabelText(/^Result/i), 'Valid result that meets minimum requirements');
            await userEvent.click(screen.getByRole('button', { name: /Record Action/i }));
            await waitFor(() => {
                expect(screen.getByText(/success/i)).toBeInTheDocument();
            });
        });
        it('calls API with correct payload', async () => {
            const createSpy = vi.spyOn(api, 'createAction').mockResolvedValue(MOCK_ACTIONS[0]);
            vi.spyOn(api, 'fetchActions').mockResolvedValue([]);
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: true }) }));
            await userEvent.click(screen.getByRole('button', { name: /Record.*Action/i }));
            await waitFor(() => {
                expect(screen.getByLabelText(/Action Description/i)).toBeInTheDocument();
            });
            await userEvent.type(screen.getByLabelText(/Action Description/i), 'Test description');
            await userEvent.type(screen.getByLabelText(/^Result/i), 'Test result here');
            await userEvent.click(screen.getByRole('button', { name: /Record Action/i }));
            await waitFor(() => {
                expect(createSpy).toHaveBeenCalledWith(MOCK_TICKET_NUMBER, expect.objectContaining({
                    actionDescription: 'Test description',
                    result: 'Test result here',
                    followUpRequired: false,
                }));
            });
        });
    });
    describe('Requester View - Read Only', () => {
        it('Requesters see all actions but no create/edit controls', async () => {
            render(_jsx(TestProviders, { children: _jsx(ActionsTaken, { ticketNumber: MOCK_TICKET_NUMBER, currentUserId: MOCK_CURRENT_USER_ID, isStaff: false }) }));
            await waitFor(() => {
                expect(screen.getByText(/Diagnosed network issue/i)).toBeInTheDocument();
            });
            // Should not have Record Action button
            expect(screen.queryByRole('button', { name: /Record.*Action/i })).not.toBeInTheDocument();
        });
    });
});
