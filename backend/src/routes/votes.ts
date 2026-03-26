import { Router } from 'express';
import { castVote, getVote } from '@controllers/voteController';
import { requireAuth } from '@middleware/auth';
import { validate } from '@middleware/validate';
import { voteLimiter } from '@middleware/rateLimiter';
import { voteSchema } from '@utils/validators';

const router = Router();

router.get('/:postId', requireAuth, getVote);
router.post('/:postId', voteLimiter, requireAuth, validate(voteSchema), castVote);

export default router;
