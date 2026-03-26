import { db } from '@config/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Post, AppError } from '@appTypes/index';
import { CreatePostInput } from '@utils/validators';
import { WaybackService } from '@services/WaybackService';

function makeError(message: string, statusCode: number, code: string): AppError {
    const err = new Error(message) as AppError;
    err.statusCode = statusCode;
    err.code = code;
    return err;
}

interface FeedResult {
    posts: Post[];
    cursor: string | null;
    hasMore: boolean;
}

export class PostService {
    static async getFeed(limit: number, cursor?: string): Promise<FeedResult> {
        let query = db
            .collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(limit + 1);

        if (cursor) {
            const cursorDoc = await db.collection('posts').doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc) as typeof query;
            }
        }

        const snapshot = await query.get();
        const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
        const hasMore = all.length > limit;
        const posts = hasMore ? all.slice(0, limit) : all;
        const nextCursor = hasMore ? posts[posts.length - 1].id : null;

        return { posts, cursor: nextCursor, hasMore };
    }

    static async getPost(id: string): Promise<Post> {
        const doc = await db.collection('posts').doc(id).get();
        if (!doc.exists) throw makeError('Post not found', 404, 'NOT_FOUND');
        return { id: doc.id, ...doc.data() } as Post;
    }

    static async createPost(data: CreatePostInput, userId: string, authorName: string, authorAvatar: string): Promise<Post> {
        const ref = db.collection('posts').doc();
        const now = FieldValue.serverTimestamp();
        const postData = {
            tweetUrl: data.tweetUrl,
            title: data.title,
            description: data.description,
            authorId: userId,
            authorName,
            authorAvatar,
            waybackUrl: null,
            upvotes: 0,
            downvotes: 0,
            createdAt: now,
            updatedAt: now,
        };

        await ref.set(postData);

        WaybackService.createSnapshot(data.tweetUrl)
            .then((url) => (url ? PostService.updatePostWayback(ref.id, url) : Promise.resolve()))
            .catch(() => undefined);

        const created = await ref.get();
        return { id: ref.id, ...created.data() } as Post;
    }

    static async updatePostWayback(id: string, waybackUrl: string): Promise<void> {
        await db.collection('posts').doc(id).set({ waybackUrl }, { merge: true });
    }

    static async deletePost(id: string, requestingUserId: string): Promise<void> {
        const post = await PostService.getPost(id);
        if (post.authorId !== requestingUserId) {
            throw makeError('Forbidden', 403, 'FORBIDDEN');
        }
        await db.collection('posts').doc(id).delete();
    }

    static async getUserPosts(userId: string, limit: number, cursor?: string): Promise<FeedResult> {
        let query = db
            .collection('posts')
            .where('authorId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit + 1);

        if (cursor) {
            const cursorDoc = await db.collection('posts').doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc) as typeof query;
            }
        }

        const snapshot = await query.get();
        const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
        const hasMore = all.length > limit;
        const posts = hasMore ? all.slice(0, limit) : all;
        const nextCursor = hasMore ? posts[posts.length - 1].id : null;

        return { posts, cursor: nextCursor, hasMore };
    }
}
