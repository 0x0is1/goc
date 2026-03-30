import { Router } from 'express';
import { listPosts, getPost, createPost, deletePost, updatePost } from '@controllers/postController';
import { requireAuth, optionalAuth } from '@middleware/auth';
import { validate } from '@middleware/validate';
import { postCreateLimiter } from '@middleware/rateLimiter';
import { createPostSchema } from '@utils/validators';

const router = Router();

router.get('/', optionalAuth, listPosts);
router.get('/:id', optionalAuth, getPost);
router.post('/', requireAuth, postCreateLimiter, validate(createPostSchema), createPost);
router.put('/:id', requireAuth, validate(createPostSchema), updatePost);
router.delete('/:id', requireAuth, deletePost);

export default router;
