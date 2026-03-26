import { formatRelativeTime } from '@utils/formatters';

export function useRelativeTime(dateString: string): string {
    return formatRelativeTime(dateString);
}

