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
    setField: (key: keyof CreatePostFields, value: string) => void;
    submit: () => Promise<void>;
}

export function useCreatePost(): CreatePostHook {
    const { showToast } = useToastContext();
    const [fields, setFields] = useState<CreatePostFields>({ tweetUrl: '', title: '', description: '' });
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [submitting, setSubmitting] = useState(false);

    const setField = useCallback((key: keyof CreatePostFields, value: string) => {
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
            return;
        }
        setSubmitting(true);
        try {
            await apiCreatePost(result.data);
            showToast('Gem published!', 'success');
            router.replace('/');
        } catch {
            showToast('Failed to publish. Try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    }, [fields, showToast]);

    return { fields, fieldErrors, submitting, setField, submit };
}

