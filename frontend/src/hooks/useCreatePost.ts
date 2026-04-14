import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { createPost as apiCreatePost, updatePost as apiUpdatePost, getPost as apiGetPost, createEditSuggestion } from '@services/api';
import { createPostSchema } from '@utils/validators';
import { useToastContext } from '@contexts/ToastContext';
import { CreatePostFields, FieldErrors } from '@appTypes/index';

interface CreatePostHook {
    fields: CreatePostFields;
    fieldErrors: FieldErrors;
    submitting: boolean;
    setField: (key: keyof CreatePostFields, value: string | boolean) => void;
    submit: (params: { editId?: string, suggestId?: string, opId?: string }) => Promise<boolean>;
    loadPost: (id: string) => Promise<void>;
}

export function useCreatePost(): CreatePostHook {
    const { showToast } = useToastContext();
    const [fields, setFields] = useState<CreatePostFields>({
        tweetUrl: '',
        title: '',
        description: '',
        articleLinks: [''],
        youtubeLink: '',
        tags: '',
        showUserInfo: true
    });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const setField = useCallback((key: keyof CreatePostFields, value: string | boolean) => {
        setFields((prev) => ({ ...prev, [key]: value }));
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }, []);

    const loadPost = useCallback(async (id: string) => {
        setSubmitting(true);
        try {
            const post = await apiGetPost(id);
            setFields({
                tweetUrl: post.tweetUrl,
                title: post.title,
                description: post.description,
                articleLinks: post.articleLinks && post.articleLinks.length > 0 ? post.articleLinks : [''],
                youtubeLink: post.youtubeLink || '',
                tags: post.tags ? post.tags.join(', ') : '',
                showUserInfo: post.showUserInfo !== false
            });
        } catch {
            showToast('Failed to load post data.', 'error');
        } finally {
            setSubmitting(false);
        }
    }, [showToast]);

    const submit = useCallback(async (params: { editId?: string, suggestId?: string, opId?: string } = {}) => {
        const { editId, suggestId, opId } = params;
        const processedLinks = (fields.articleLinks || []).filter(l => l.trim().length > 0);
        const processedTags = fields.tags
            ? fields.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
            : [];

        const validationFields = {
            ...fields,
            articleLinks: processedLinks,
            tags: processedTags
        };

        const result = createPostSchema.safeParse(validationFields);
        if (!result.success) {
            const errs: FieldErrors = {};
            result.error.issues.forEach((issue) => {
                const key = issue.path[0] as keyof FieldErrors;
                errs[key] = issue.message;
            });
            setFieldErrors(errs);
            showToast('Please correct the highlighted errors.', 'error');
            return false;
        }
        setSubmitting(true);
        try {
            const payload = {
                ...result.data,
                articleLinks: processedLinks,
                tags: processedTags
            };

            if (suggestId) {
                // Fetch original data for comparison
                const originalPost = await apiGetPost(suggestId);
                await createEditSuggestion({
                    targetId: suggestId,
                    targetType: 'post',
                    opId: opId || originalPost.authorId,
                    originalData: {
                        title: originalPost.title,
                        description: originalPost.description,
                        tags: originalPost.tags,
                        tweetUrl: originalPost.tweetUrl,
                    },
                    suggestedData: payload
                });
                showToast('Suggestion submitted for review!', 'success');
            } else if (editId) {
                await apiUpdatePost(editId, payload);
                showToast('Post updated!', 'success');
            } else {
                await apiCreatePost(payload);
                showToast('Post published!', 'success');
            }
            router.back();
            return true;
        } catch (err: any) {
            showToast(err.message || 'Action failed. Try again.', 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [fields, showToast]);

    return { fields, fieldErrors, submitting, setField, submit, loadPost };
}

