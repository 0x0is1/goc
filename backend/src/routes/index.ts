import { Router } from 'express';
import postsRouter from '@routes/posts';
import votesRouter from '@routes/votes';
import usersRouter from '@routes/users';
import waybackRouter from '@routes/wayback';

const router = Router();

router.use('/posts', postsRouter);
router.use('/votes', votesRouter);
router.use('/users', usersRouter);
router.use('/wayback', waybackRouter);

export default router;
