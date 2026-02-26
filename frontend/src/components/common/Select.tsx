import type { SelectHTMLAttributes, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    children: ReactNode;
}

export function Select({ label, error, id, className = '', children, ...props }: SelectProps) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const selectClasses = ['form-select', error && 'form-input--error', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={selectId} className="form-label">
                    {label}
                </label>
            )}
            <select id={selectId} className={selectClasses} {...props}>
                {children}
            </select>
            {error && <span className="text-sm text-error">{error}</span>}
        </div>
    );
}