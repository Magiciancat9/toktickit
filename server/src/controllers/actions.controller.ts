import { Request, Response } from 'express';
import { getPrisma } from '../prisma.js';

const prisma = getPrisma();

/**
 * Lab 4: Actions Taken Controller
 * 
 * Handles CRUD operations for ActionsTaken on tickets.
 * Authorization: IT_STAFF and ADMINISTRATOR only (except GET for Requesters on own tickets).
 */

// Validation helper functions
function validateActionDescription(description: string | undefined): string | null {
  if (!description || typeof description !== 'string') {
    return 'Action description is required';
  }
  const trimmed = description.trim();
  if (trimmed.length < 10) {
    return 'Action description must be between 10 and 2000 characters';
  }
  if (trimmed.length > 2000) {
    return 'Action description must be between 10 and 2000 characters';
  }
  return null;
}

function validateResult(result: string | undefined): string | null {
  if (!result || typeof result !== 'string') {
    return 'Result is required';
  }
  const trimmed = result.trim();
  if (trimmed.length < 10) {
    return 'Result must be between 10 and 2000 characters';
  }
  if (trimmed.length > 2000) {
    return 'Result must be between 10 and 2000 characters';
  }
  return null;
}

function validateFollowupNote(followupNote: string | undefined, followUpRequired: boolean): string | null {
  if (followUpRequired) {
    if (!followupNote || typeof followupNote !== 'string') {
      return 'Follow-up note is required when follow-up is needed';
    }
    const trimmed = followupNote.trim();
    if (trimmed.length < 10) {
      return 'Follow-up note must be between 10 and 500 characters';
    }
    if (trimmed.length > 500) {
      return 'Follow-up note must be between 10 and 500 characters';
    }
  } else if (followupNote && typeof followupNote === 'string') {
    const trimmed = followupNote.trim();
    if (trimmed.length > 0 && trimmed.length < 10) {
      return 'Follow-up note must be between 10 and 500 characters';
    }
    if (trimmed.length > 500) {
      return 'Follow-up note must be between 10 and 500 characters';
    }
  }
  return null;
}

function validateAttachmentNotes(attachmentNotes: string | undefined): string | null {
  if (attachmentNotes && typeof attachmentNotes === 'string') {
    const trimmed = attachmentNotes.trim();
    if (trimmed.length > 500) {
      return 'Attachment notes cannot exceed 500 characters';
    }
  }
  return null;
}

/**
 * POST /api/staff/tickets/:ticketNumber/actions
 * Create a new action on a ticket
 */
export async function createAction(req: Request, res: Response) {
  try {
    const { ticketNumber } = req.params;
    const { actionDescription, result, followUpRequired, followupNote, attachmentNotes } = req.body;

    // Authorization: only IT_STAFF and ADMINISTRATOR can create actions
    if (req.user?.role !== 'IT_STAFF' && req.user?.role !== 'ADMINISTRATOR') {
      return res.status(403).json({
        error: { message: 'Only IT Staff can record actions on tickets' },
      });
    }

    // Find the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
    });

    if (!ticket) {
      return res.status(404).json({
        error: { message: 'Ticket not found' },
      });
    }

    // Validate all fields
    const errors: Array<{ field: string; message: string }> = [];

    const descError = validateActionDescription(actionDescription);
    if (descError) {
      errors.push({ field: 'actionDescription', message: descError });
    }

    const resultError = validateResult(result);
    if (resultError) {
      errors.push({ field: 'result', message: resultError });
    }

    const followupError = validateFollowupNote(followupNote, followUpRequired === true);
    if (followupError) {
      errors.push({ field: 'followupNote', message: followupError });
    }

    const attachmentError = validateAttachmentNotes(attachmentNotes);
    if (attachmentError) {
      errors.push({ field: 'attachmentNotes', message: attachmentError });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    // Create the action
    const action = await prisma.actionTaken.create({
      data: {
        ticketId: ticket.id,
        performerId: req.user!.id,
        actionDescription: actionDescription.trim(),
        result: result.trim(),
        followUpRequired: followUpRequired === true,
        followupNote: followUpRequired && followupNote ? followupNote.trim() : null,
        attachmentNotes: attachmentNotes ? attachmentNotes.trim() : null,
      },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Format response
    return res.status(201).json({
      data: {
        id: action.id,
        ticketId: action.ticketId,
        ticketNumber: ticket.ticketNumber,
        performerId: action.performerId,
        performerName: action.performer.name,
        performerRole: action.performer.role,
        actionDateTime: action.actionDateTime.toISOString(),
        actionDescription: action.actionDescription,
        result: action.result,
        followUpRequired: action.followUpRequired,
        followupNote: action.followupNote,
        attachmentNotes: action.attachmentNotes,
        createdAt: action.createdAt.toISOString(),
        updatedAt: action.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating action:', error);
    return res.status(500).json({
      error: { message: 'An unexpected error occurred. Please try again later.' },
    });
  }
}

/**
 * GET /api/staff/tickets/:ticketNumber/actions
 * Get all actions for a ticket
 */
export async function getActions(req: Request, res: Response) {
  try {
    const { ticketNumber } = req.params;

    // Find the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
    });

    if (!ticket) {
      return res.status(404).json({
        error: { message: 'Ticket not found' },
      });
    }

    // Authorization: IT_STAFF and ADMINISTRATOR can view any ticket's actions
    // REQUESTER cannot view actions (per API spec API-07)
    if (req.user?.role === 'REQUESTER') {
      return res.status(403).json({
        error: { message: 'You do not have permission to view actions' },
      });
    }

    // Get all actions for the ticket, sorted chronologically
    const actions = await prisma.actionTaken.findMany({
      where: { ticketId: ticket.id },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { actionDateTime: 'asc' }, // Oldest first
    });

    // Format response
    const formattedActions = actions.map((action) => ({
      id: action.id,
      ticketId: action.ticketId,
      ticketNumber: ticket.ticketNumber,
      performerId: action.performerId,
      performerName: action.performer.name,
      performerRole: action.performer.role,
      actionDateTime: action.actionDateTime.toISOString(),
      actionDescription: action.actionDescription,
      result: action.result,
      followUpRequired: action.followUpRequired,
      followupNote: action.followupNote,
      attachmentNotes: action.attachmentNotes,
      createdAt: action.createdAt.toISOString(),
      updatedAt: action.updatedAt.toISOString(),
    }));

    return res.status(200).json({
      data: formattedActions,
    });
  } catch (error) {
    console.error('Error getting actions:', error);
    return res.status(500).json({
      error: { message: 'An unexpected error occurred. Please try again later.' },
    });
  }
}

/**
 * PATCH /api/staff/tickets/:ticketNumber/actions/:actionId
 * Update an existing action (performer only, within 24 hours)
 */
export async function updateAction(req: Request, res: Response) {
  try {
    const { ticketNumber, actionId } = req.params;
    const { actionDescription, result, followUpRequired, followupNote, attachmentNotes } = req.body;

    // Authorization: only IT_STAFF and ADMINISTRATOR can edit actions
    if (req.user?.role !== 'IT_STAFF' && req.user?.role !== 'ADMINISTRATOR') {
      return res.status(403).json({
        error: { message: 'Only IT Staff can edit actions' },
      });
    }

    // Find the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
    });

    if (!ticket) {
      return res.status(404).json({
        error: { message: 'Ticket not found' },
      });
    }

    // Find the action
    const actionIdNum = parseInt(actionId, 10);
    if (isNaN(actionIdNum)) {
      return res.status(404).json({
        error: { message: 'Action not found' },
      });
    }

    const action = await prisma.actionTaken.findUnique({
      where: { id: actionIdNum },
    });

    if (!action || action.ticketId !== ticket.id) {
      return res.status(404).json({
        error: { message: 'Action not found' },
      });
    }

    // Authorization: only the performer can edit their own action
    if (action.performerId !== req.user!.id) {
      return res.status(403).json({
        error: { message: 'You can only edit your own actions' },
      });
    }

    // Check 24-hour restriction
    const now = new Date();
    const actionAge = now.getTime() - action.createdAt.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (actionAge > twentyFourHours) {
      return res.status(403).json({
        error: { message: 'Actions cannot be edited after 24 hours' },
      });
    }

    // Validate all fields (same as create)
    const errors: Array<{ field: string; message: string }> = [];

    const descError = validateActionDescription(actionDescription);
    if (descError) {
      errors.push({ field: 'actionDescription', message: descError });
    }

    const resultError = validateResult(result);
    if (resultError) {
      errors.push({ field: 'result', message: resultError });
    }

    const followupError = validateFollowupNote(followupNote, followUpRequired === true);
    if (followupError) {
      errors.push({ field: 'followupNote', message: followupError });
    }

    const attachmentError = validateAttachmentNotes(attachmentNotes);
    if (attachmentError) {
      errors.push({ field: 'attachmentNotes', message: attachmentError });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    // Update the action
    const updatedAction = await prisma.actionTaken.update({
      where: { id: actionIdNum },
      data: {
        actionDescription: actionDescription.trim(),
        result: result.trim(),
        followUpRequired: followUpRequired === true,
        followupNote: followUpRequired && followupNote ? followupNote.trim() : null,
        attachmentNotes: attachmentNotes ? attachmentNotes.trim() : null,
        // performerId and actionDateTime are NOT updated
      },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Format response
    return res.status(200).json({
      data: {
        id: updatedAction.id,
        ticketId: updatedAction.ticketId,
        ticketNumber: ticket.ticketNumber,
        performerId: updatedAction.performerId,
        performerName: updatedAction.performer.name,
        performerRole: updatedAction.performer.role,
        actionDateTime: updatedAction.actionDateTime.toISOString(),
        actionDescription: updatedAction.actionDescription,
        result: updatedAction.result,
        followUpRequired: updatedAction.followUpRequired,
        followupNote: updatedAction.followupNote,
        attachmentNotes: updatedAction.attachmentNotes,
        createdAt: updatedAction.createdAt.toISOString(),
        updatedAt: updatedAction.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating action:', error);
    return res.status(500).json({
      error: { message: 'An unexpected error occurred. Please try again later.' },
    });
  }
}
