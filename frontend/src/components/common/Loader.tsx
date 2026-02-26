interface LoaderProps {
    size?: 'sm' | 'md';
    text?: string;
}

export function Loader({ size = 'md', text }: LoaderProps) {
    const spinnerClass = size === 'sm' ? 'loader__spinner loader__spinner--sm' : 'loader__spinner';

    return (
        <div className="loader">
            <div className={spinnerClass} />
            {text && <span className="ml-sm text-gray-500">{text}</span>}
        </div>
    );
}