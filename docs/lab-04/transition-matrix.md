# Lab 4 Status Transition Matrix

## Overview
This document describes the finalized ticket status transition matrix for TokTickIT. The matrix defines which status transitions are allowed and enforces workflow rules including the resolution gate (tickets with incomplete follow-up actions cannot be resolved).

## Authorization
- **IT Staff and Administrator**: Can change ticket status (subject to transition rules)
- **Requester**: Cannot change ticket status directly (read-only view of status)

## Complete Transition Matrix

| From Status | To Status | Allowed? | Role | Notes |
|-------------|-----------|----------|------|-------|
| **NEW** | OPEN | ✅ Yes | IT Staff/Admin | Initial assignment |
| NEW | CANCELLED | ✅ Yes | IT Staff/Admin | Duplicate or invalid |
| NEW | IN_PROGRESS | ❌ No | - | Must go through OPEN first |
| NEW | RESOLVED | ❌ No | - | Cannot skip triage |
| **OPEN** | IN_PROGRESS | ✅ Yes | IT Staff/Admin | Work started |
| OPEN | CANCELLED | ✅ Yes | IT Staff/Admin | Duplicate or invalid |
| OPEN | RESOLVED | ❌ No | - | Must do work first |
| OPEN | WAITING_FOR_REQUESTER | ❌ No | - | Must be IN_PROGRESS first |
| **IN_PROGRESS** | WAITING_FOR_REQUESTER | ✅ Yes | IT Staff/Admin | Need input from requester |
| IN_PROGRESS | RESOLVED | ✅ Yes | IT Staff/Admin | Work completed (requires no incomplete follow-ups) |
| IN_PROGRESS | CANCELLED | ✅ Yes | IT Staff/Admin | Invalid or duplicate |
| IN_PROGRESS | OPEN | ❌ No | - | Cannot go backward |
| **WAITING_FOR_REQUESTER** | IN_PROGRESS | ✅ Yes | IT Staff/Admin | Requester responded |
| WAITING_FOR_REQUESTER | RESOLVED | ✅ Yes | IT Staff/Admin | Issue can be closed (requires no incomplete follow-ups) |
| WAITING_FOR_REQUESTER | CANCELLED | ✅ Yes | IT Staff/Admin | Requester not responding or duplicate |
| WAITING_FOR_REQUESTER | OPEN | ❌ No | - | Cannot go backward |
| **RESOLVED** | CLOSED | ✅ Yes | IT Staff/Admin | Final closure |
| RESOLVED | REOPENED | ✅ Yes | IT Staff/Admin | Issue recurred |
| RESOLVED | IN_PROGRESS | ❌ No | - | Must reopen first |
| **CLOSED** | REOPENED | ✅ Yes | IT Staff/Admin | Issue recurred after closure |
| CLOSED | IN_PROGRESS | ❌ No | - | Must reopen first |
| CLOSED | RESOLVED | ❌ No | - | Cannot go backward |
| **REOPENED** | OPEN | ✅ Yes | IT Staff/Admin | Re-triaging |
| REOPENED | IN_PROGRESS | ✅ Yes | IT Staff/Admin | Resuming work |
| REOPENED | RESOLVED | ✅ Yes | IT Staff/Admin | Quick re-resolution (requires no incomplete follow-ups) |
| REOPENED | CANCELLED | ✅ Yes | IT Staff/Admin | False alarm |
| REOPENED | WAITING_FOR_REQUESTER | ❌ No | - | Must be IN_PROGRESS first |
| **CANCELLED** | Any | ❌ No | - | Terminal state - no transitions allowed |

## Resolution Gate

When transitioning TO **RESOLVED** status, the backend validates that no Actions Taken on the ticket have `followUpRequired = true`. If incomplete follow-ups exist:

- **Response**: 409 Conflict
- **Error Code**: `INCOMPLETE_ACTIONS`
- **Message**: "Cannot resolve ticket: unresolved follow-up actions exist"
- **Details**: Array of action IDs and follow-up notes

IT Staff must either:
1. Complete the follow-up work and mark `followUpRequired = false` on the action, OR
2. Determine follow-up is not needed and edit the action to set `followUpRequired = false`

## Validation Rules

1. **Case Insensitive**: Status values are case-insensitive (e.g., "open", "OPEN", "Open" all work)
2. **Invalid Status**: Returns 400 Bad Request with VALIDATION_ERROR code
3. **Invalid Transition**: Returns 400 Bad Request with INVALID_TRANSITION code
4. **Missing Ticket**: Returns 404 Not Found
5. **Unauthorized Role**: Returns 403 Forbidden
6. **Not Authenticated**: Returns 401 Unauthorized

## Implementation

**Backend**: `server/src/controllers/staff.controller.ts`
- `STATUS_TRANSITIONS` constant defines the matrix
- `updateTicketStatus` function validates transitions
- Resolution gate checks `ActionTaken.followUpRequired` before allowing RESOLVED status

**Tests**: `server/tests/lab-04/ticket-workflow.api.test.ts`
- 46 tests covering all allowed and disallowed transitions
- Authorization tests (IT Staff/Admin vs Requester)
- Resolution blocking tests (with/without incomplete actions)
- Edge cases (invalid status, missing ticket, case sensitivity)

## Timestamp Updates

When transitioning to **RESOLVED**:
- `status` field updated to `RESOLVED`
- `resolvedAt` timestamp set to current server time
- `updatedAt` timestamp automatically updated

All other transitions only update `updatedAt`.

## Future Considerations

**Not Implemented in Lab 4** (potential future enhancements):
- Requester-initiated status changes (e.g., cancel own ticket, reopen resolved ticket)
- Automatic transitions based on inactivity timeouts
- Status change approval workflow
- Conditional transitions based on custom business rules
- Audit log of all status changes with reason codes

---

**Test Results**: ✅ 46/46 tests passing  
**Last Updated**: Lab 4 Sprint  
**Status**: Complete and production-ready
