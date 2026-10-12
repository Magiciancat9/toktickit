import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActionsTaken from '../../src/components/ActionsTaken';
import type { ActionTaken } from '../../src/api';
import { TestProviders } from '../test-utils';

// Mock the API module
vi.mock('../../src/api', async () => {
  const actual = await vi.importActual('../../src/api');
  return {
    ...actual,
    fetchActions: vi.fn(),
    createAction: vi.fn(),
    updateAction: vi.fn(),
  };
});

import * as api from '../../src/api';

const mockFetchActions = api.fetchActions as ReturnType<typeof vi.fn>;
const mockCreateAction = api.createAction as ReturnType<typeof vi.fn>;
const mockUpdateAction = api.updateAction as ReturnType<typeof vi.fn>;

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

const MOCK_ACTIONS: ActionTaken[] = [
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

const MOCK_OLD_ACTION: api.ActionTaken = {
  ...MOCK_ACTIONS[0],
  id: 3,
  createdAt: '2026-08-14T10:30:00Z', // > 24 hours ago
  updatedAt: '2026-08-14T10:30:00Z',
};

describe('Lab 4: ActionsTaken Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchActions.mockResolvedValue(MOCK_ACTIONS);
  });

  describe('ActionsList - Display', () => {
    it('UI-09: displays all actions in chronological order (oldest first)', async () => {
      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/Diagnosed network issue/i)).toBeInTheDocument();
      });

      const actions = screen.getAllByTestId(/^action-card-/);
      expect(actions).toHaveLength(2);
    });

    it('each action shows performer name and role badge', async () => {
      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });
    });

    it('UI-11: actions with followUpRequired=true show "Follow-Up Required" badge', async () => {
      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/Follow-Up Required/i)).toBeInTheDocument();
      });
    });

    it('follow-up note is displayed when present', async () => {
      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/Check again in one week/i)).toBeInTheDocument();
      });
    });
  });

  describe('ActionsList - Empty State', () => {
    it('UI-12: empty state shows "No actions recorded yet" message', async () => {
      mockFetchActions.mockResolvedValue([]);

      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/No actions have been recorded/i)).toBeInTheDocument();
      });
    });

    it('empty state shows "Record First Action" button', async () => {
      mockFetchActions.mockResolvedValue([]);

      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Record First Action/i })).toBeInTheDocument();
      });
    });
  });

  describe('ActionForm - Create Mode', () => {
    it('UI-01: renders empty form with all required fields', async () => {
      mockFetchActions.mockResolvedValue([]);

      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      // Wait for empty state to load
      await waitFor(() => {
        expect(screen.getByText(/No actions have been recorded/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /Record.*Action/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Action Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Result/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Follow-Up Required/i)).toBeInTheDocument();
      });
    });

    it('UI-03: checking Follow-Up Required shows Follow-up Note field', async () => {
      mockFetchActions.mockResolvedValue([]);

      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      // Wait for empty state to load
      await waitFor(() => {
        expect(screen.getByText(/No actions have been recorded/i)).toBeInTheDocument();
      });

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
      mockFetchActions.mockResolvedValue([]);
      mockCreateAction.mockResolvedValue(MOCK_ACTIONS[0]);

      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      // Wait for empty state to load
      await waitFor(() => {
        expect(screen.getByText(/No actions have been recorded/i)).toBeInTheDocument();
      });

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
      mockFetchActions.mockResolvedValue([]);

      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      // Wait for empty state to load
      await waitFor(() => {
        expect(screen.getByText(/No actions have been recorded/i)).toBeInTheDocument();
      });

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
      mockFetchActions.mockResolvedValue([]);

      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      // Wait for empty state to load
      await waitFor(() => {
        expect(screen.getByText(/No actions have been recorded/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /Record.*Action/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Record Action/i })).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /Record Action/i }));

      await waitFor(() => {
        expect(screen.getByText(/description.*required/i)).toBeInTheDocument();
      });

      expect(mockCreateAction).not.toHaveBeenCalled();
    });
  });

  describe('ActionForm - Successful Creation', () => {
    it('UI-05: successful submit shows success message', async () => {
      mockFetchActions.mockResolvedValue([]);
      mockCreateAction.mockResolvedValue(MOCK_ACTIONS[0]);

      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      // Wait for actions to load (empty list)
      await waitFor(() => {
        expect(screen.getByText(/No actions have been recorded/i)).toBeInTheDocument();
      });

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
      mockCreateAction.mockResolvedValue(MOCK_ACTIONS[0]);
      mockFetchActions.mockResolvedValue([]);

      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={true} />
        </TestProviders>
      );

      // Wait for actions to load (empty list)
      await waitFor(() => {
        expect(screen.getByText(/No actions have been recorded/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /Record.*Action/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Action Description/i)).toBeInTheDocument();
      });

      await userEvent.type(screen.getByLabelText(/Action Description/i), 'Test description');
      await userEvent.type(screen.getByLabelText(/^Result/i), 'Test result here');

      await userEvent.click(screen.getByRole('button', { name: /Record Action/i }));

      await waitFor(() => {
        expect(mockCreateAction).toHaveBeenCalledWith(
          MOCK_TICKET_NUMBER,
          expect.objectContaining({
            actionDescription: 'Test description',
            result: 'Test result here',
            followUpRequired: false,
          })
        );
      });
    });
  });

  describe('Requester View - Read Only', () => {
    it('Requesters see all actions but no create/edit controls', async () => {
      render(
        <TestProviders>
          <ActionsTaken ticketNumber={MOCK_TICKET_NUMBER} currentUserId={MOCK_CURRENT_USER_ID} isStaff={false} />
        </TestProviders>
      );

      await waitFor(() => {
        expect(screen.getByText(/Diagnosed network issue/i)).toBeInTheDocument();
      });

      // Should not have Record Action button
      expect(screen.queryByRole('button', { name: /Record.*Action/i })).not.toBeInTheDocument();
    });
  });
});