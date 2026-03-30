import { Router } from 'express';
import {
    listCancelledPersons,
    getCancelledPerson,
    createCancelledPerson,
    updateCancelledPerson,
    deleteCancelledPerson,
    voteCancelledPerson,
    getCancelledPersonVote,
    getUserEnlistments
} from '@controllers/CancelledController';
import { requireAuth, optionalAuth } from '@middleware/auth';
import { validate } from '@middleware/validate';
import { z } from 'zod';

const router = Router();

const createCancelledSchema = z.object({
    name: z.string().min(2).max(100).trim(),
    description: z.string().min(10).max(5000).trim(),
    profession: z.string().min(2).max(100).trim(),
    images: z.array(z.string()).optional().default([]),
    postLinks: z.array(z.string()).optional().default([]),
    avatar: z.string().optional(),
    isIndian: z.boolean().optional().default(true),
    isAnonymous: z.boolean().optional().default(false),
});

const voteSchema = z.object({
    type: z.enum(['up', 'down']),
});

router.get('/', optionalAuth, listCancelledPersons);
router.get('/:id', optionalAuth, getCancelledPerson);
router.get('/user/:userId', optionalAuth, getUserEnlistments);
router.post('/', requireAuth, validate(createCancelledSchema), createCancelledPerson);
router.put('/:id', requireAuth, validate(createCancelledSchema), updateCancelledPerson);
router.delete('/:id', requireAuth, deleteCancelledPerson);
router.post('/:id/vote', requireAuth, validate(voteSchema), voteCancelledPerson);
router.get('/:id/vote', requireAuth, getCancelledPersonVote);

export default router;
