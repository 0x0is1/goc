import { Router } from 'express';
import postsRouter from '@routes/posts';
import votesRouter from '@routes/votes';
import usersRouter from '@routes/users';
import waybackRouter from '@routes/wayback';
import cancelledRouter from '@routes/cancelled';

const router = Router();

router.use('/posts', postsRouter);
router.use('/votes', votesRouter);
router.use('/users', usersRouter);
router.use('/wayback', waybackRouter);
router.use('/cancelled', cancelledRouter);

export default router;
