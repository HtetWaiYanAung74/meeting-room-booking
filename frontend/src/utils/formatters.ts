export function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatShortDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDateTimeForInput(date: Date = new Date()): string {
    return date.toISOString().slice(0, 16);
}

export function toISOString(localDateTime: string): string {
    return new Date(localDateTime).toISOString();
}

export function formatMinutesToHours(minutes: number): string {
    const hours = Math.round((minutes / 60) * 100) / 100;
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
    return count === 1 ? singular : plural || `${singular}s`;
}