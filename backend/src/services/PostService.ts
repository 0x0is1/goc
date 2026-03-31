import { db } from '@config/firebase';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { Post, AppError } from '@appTypes/index';
import { CreatePostInput } from '@utils/validators';
import { SnapshotService } from '@services/SnapshotService';

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
    static async getFeed(limit: number, cursor?: string, sort: 'latest' | 'top' = 'latest', tag?: string, queryText?: string): Promise<FeedResult> {
        let query: any = db.collection('posts');

        if (tag) {
            query = query.where('tags', 'array-contains', tag);
        }

        if (sort === 'top') {
            query = query.orderBy('upvotes', 'desc').orderBy('createdAt', 'desc');
        } else {
            query = query.orderBy('createdAt', 'desc');
        }

        if (queryText) {
            query = query.limit(100); // Fetch more for search to improve filter yield
        } else {
            query = query.limit(limit + 1);
        }

        if (cursor) {
            const cursorDoc = await db.collection('posts').doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc);
            }
        }

        const snapshot = await query.get();
        let allPosts = await Promise.all(
            snapshot.docs.map((doc: any) => PostService.serializePost(doc))
        );

        let filteredPosts = allPosts;
        if (queryText) {
            const lowerQuery = queryText.toLowerCase();
            filteredPosts = allPosts.filter(p => {
                const titleMatch = (p.title || '').toLowerCase().includes(lowerQuery);
                const descMatch = (p.description || '').toLowerCase().includes(lowerQuery);
                const tagMatch = (p.tags || []).some((t: string) => t.toLowerCase().includes(lowerQuery));
                return titleMatch || descMatch || tagMatch;
            });
        }

        const posts = filteredPosts.slice(0, limit);
        const hasMore = !queryText && snapshot.docs.length > limit;
        const nextCursor = (hasMore || (queryText && filteredPosts.length > limit))
            ? snapshot.docs[Math.min(snapshot.docs.length - 1, limit)].id
            : (queryText && filteredPosts.length > 0) ? filteredPosts[filteredPosts.length - 1].id : null;

        return { posts, cursor: nextCursor, hasMore };
    }

    static async createPost(
        data: CreatePostInput,
        userId: string,
        authorName: string,
        authorAvatar: string
    ): Promise<Post> {
        const ref = db.collection('posts').doc();
        const now = FieldValue.serverTimestamp();

        const postData = {
            tweetUrl: data.tweetUrl,
            title: data.title,
            description: data.description,
            articleLinks: data.articleLinks || [],
            youtubeLink: data.youtubeLink || null,
            tags: data.tags || [],
            showUserInfo: data.showUserInfo !== false,
            authorId: userId,
            authorName,
            authorAvatar,
            snapshotScreenshot: null,
            snapshotTimestamp: null,
            upvotes: 0,
            downvotes: 0,
            createdAt: now,
            updatedAt: now,
        };

        await ref.set(postData);


        setImmediate(async () => {
            try {
                const snapshot = await SnapshotService.createSnapshotWithRetry(data.tweetUrl);

                if (snapshot) {
                    await PostService.updatePostSnapshot(ref.id, snapshot);
                }
            } catch (err) {
                console.error('Background snapshot failed:', err);
            }
        });

        const created = await ref.get();
        return PostService.serializePost(created);
    }

    static async updatePostSnapshot(
        id: string,
        snapshot: {
            screenshotBase64: string;
            htmlContent: string;
            timestamp: string;
        }
    ): Promise<void> {
        await db.collection('posts').doc(id).set(
            {
                snapshotScreenshot: snapshot.screenshotBase64,
                snapshotTimestamp: snapshot.timestamp,
                updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
        );
    }

    static async getPost(id: string): Promise<Post> {
        const doc = await db.collection('posts').doc(id).get();
        if (!doc.exists) throw makeError('Post not found', 404, 'NOT_FOUND');
        return PostService.serializePost(doc);
    }

    static async deletePost(id: string, requestingUserId: string): Promise<void> {
        const post = await PostService.getPost(id);
        if (post.authorId !== requestingUserId) {
            throw makeError('Forbidden', 403, 'FORBIDDEN');
        }
        await db.collection('posts').doc(id).delete();
    }

    static async updatePost(id: string, data: CreatePostInput, requestingUserId: string): Promise<Post> {
        const postRef = db.collection('posts').doc(id);
        const doc = await postRef.get();
        if (!doc.exists) throw makeError('Post not found', 404, 'NOT_FOUND');

        const post = doc.data()!;
        if (post.authorId !== requestingUserId) {
            throw makeError('Forbidden', 403, 'FORBIDDEN');
        }

        const updateData: any = {
            title: data.title,
            description: data.description,
            articleLinks: data.articleLinks || [],
            youtubeLink: data.youtubeLink || null,
            tags: data.tags || [],
            showUserInfo: data.showUserInfo !== false,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (post.tweetUrl !== data.tweetUrl) {
            updateData.tweetUrl = data.tweetUrl;
            updateData.snapshotScreenshot = null;
            updateData.snapshotTimestamp = null;

            setImmediate(async () => {
                try {
                    const snapshot = await SnapshotService.createSnapshotWithRetry(data.tweetUrl);
                    if (snapshot) {
                        await PostService.updatePostSnapshot(id, snapshot);
                    }
                } catch (err) {
                    console.error('Background snapshot failed during update:', err);
                }
            });
        }

        await postRef.update(updateData);
        const updated = await postRef.get();
        return PostService.serializePost(updated);
    }

    static async getUserPosts(userId: string, limit: number, cursor?: string): Promise<FeedResult> {
        let query: any = db
            .collection('posts')
            .where('authorId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit + 1);

        if (cursor) {
            const cursorDoc = await db.collection('posts').doc(cursor).get();
            if (cursorDoc.exists) {
                query = query.startAfter(cursorDoc);
            }
        }

        const snapshot = await query.get();
        const posts = await Promise.all(
            snapshot.docs.slice(0, limit).map((doc: any) => PostService.serializePost(doc))
        );

        const hasMore = snapshot.docs.length > limit;
        const nextCursor = hasMore ? snapshot.docs[limit - 1].id : null;

        return { posts, cursor: nextCursor, hasMore };
    }

    static async serializePost(doc: FirebaseFirestore.DocumentSnapshot): Promise<Post> {
        const data = doc.data()!;


        let articleLinks = data.articleLinks || [];
        if (data.articleLink && typeof data.articleLink === 'string' && articleLinks.length === 0) {
            articleLinks = [data.articleLink];
        }

        return {
            id: doc.id,
            ...data,
            articleLinks,
            tweetEmbedHtml: `<blockquote class="twitter-tweet"><a href="${data.tweetUrl}"></a></blockquote>`,
            createdAt:
                data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate().toISOString()
                    : new Date().toISOString(),
            updatedAt:
                data.updatedAt instanceof Timestamp
                    ? data.updatedAt.toDate().toISOString()
                    : new Date().toISOString(),
        } as unknown as Post;
    }
}