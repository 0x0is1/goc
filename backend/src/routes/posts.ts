import { Router } from 'express';
import { listPosts, getPost, createPost, deletePost } from '@controllers/postController';
import { requireAuth, optionalAuth } from '@middleware/auth';
import { validate } from '@middleware/validate';
import { postCreateLimiter } from '@middleware/rateLimiter';
import { createPostSchema } from '@utils/validators';

const router = Router();

router.get('/', optionalAuth, listPosts);
router.get('/:id', optionalAuth, getPost);
router.post('/', postCreateLimiter, requireAuth, validate(createPostSchema), createPost);
router.delete('/:id', requireAuth, deletePost);

export default router;
