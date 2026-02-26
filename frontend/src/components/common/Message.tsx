import type { MessageType } from '@/types';

interface MessageProps {
    type: MessageType;
    children: string;
    onDismiss?: () => void;
}

export function Message({ type, children, onDismiss }: MessageProps) {
    return (
        <div className={`message message--${type}`}>
            <span>{children}</span>
            {onDismiss && (
                <button onClick={onDismiss} className="ml-sm" aria-label="Dismiss">
                    ×
                </button>
            )}
        </div>
    );
}