export function formatRelativeTime(dateString: string): string {
    if (!dateString) return '...';
    const now = new Date();
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '...';

    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 5) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffMonths / 12)}y ago`;
}

export function formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Formats numbers into a compact string representation (e.g., 1.2K, 14M, 2B).
 * If the number is zero or negative, returns "0".
 */
/**
 * Formats numbers into a compact string representation (e.g., 1.2K, 14M, 2B).
 * If the number is zero or negative, returns "0".
 */
export function formatCompactNumber(num: number | string | undefined | null): string {
    const val = Number(num);
    if (!val || isNaN(val) || val <= 0) return '0';

    if (val >= 1000000000) {
        return (val / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (val >= 1000000) {
        return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (val >= 1000) {
        return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return val.toString();
}

