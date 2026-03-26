import { Router } from 'express';
import { getSnapshot } from '@controllers/waybackController';
import { requireAuth } from '@middleware/auth';
import { validate } from '@middleware/validate';
import { postCreateLimiter } from '@middleware/rateLimiter';
import { waybackRequestSchema } from '@utils/validators';

const router = Router();

router.post('/snapshot', postCreateLimiter, requireAuth, validate(waybackRequestSchema), getSnapshot);

export default router;
