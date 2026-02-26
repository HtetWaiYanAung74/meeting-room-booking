import type { SelectHTMLAttributes, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}

export function Select({ label, error, id, required, className = '', children, ...props }: SelectProps) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const selectClasses = ['form-select', error && 'form-input--error', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={selectId} className="form-label">
                    {label}
                    {required && <span className="form-required">*</span>}
                </label>
            )}
            <select id={selectId} className={selectClasses} {...props}>
                {children}
            </select>
            {error && <span className="form-error">{error}</span>}
        </div>
    );
}