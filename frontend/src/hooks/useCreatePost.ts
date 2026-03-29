import { useCallback, useState } from 'react';
import { router } from 'expo-router';
import { createPost as apiCreatePost } from '@services/api';
import { createPostSchema } from '@utils/validators';
import { useToastContext } from '@contexts/ToastContext';
import { CreatePostFields, FieldErrors } from '@appTypes/index';

interface CreatePostHook {
    fields: CreatePostFields;
    fieldErrors: FieldErrors;
    submitting: boolean;
    setField: (key: keyof CreatePostFields, value: string | boolean) => void;
    submit: () => Promise<boolean>;
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

    const submit = useCallback(async () => {
        const result = createPostSchema.safeParse(fields);
        if (!result.success) {
            const errs: FieldErrors = {};
            result.error.issues.forEach((issue) => {
                const key = issue.path[0] as keyof FieldErrors;
                errs[key] = issue.message;
            });
            setFieldErrors(errs);
            return false;
        }
        setSubmitting(true);
        try {
            
            const processedTags = fields.tags
                ? fields.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
                : [];

            const processedLinks = (fields.articleLinks || []).filter(l => l.trim().length > 0);

            await apiCreatePost({
                ...result.data,
                articleLinks: processedLinks,
                tags: processedTags
            });
            showToast('Gem published!', 'success');
            router.replace('/');
            return true;
        } catch {
            showToast('Failed to publish. Try again.', 'error');
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [fields, showToast]);

    return { fields, fieldErrors, submitting, setField, submit };
}

