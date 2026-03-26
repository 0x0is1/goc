import { Router } from 'express';
import { getUser, syncUser, getUserPosts } from '@controllers/userController';
import { requireAuth } from '@middleware/auth';

const router = Router();

router.get('/:id', getUser);
router.get('/:id/posts', getUserPosts);
router.post('/sync', requireAuth, syncUser);

export default router;
