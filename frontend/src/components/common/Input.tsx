import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const inputClasses = ['form-input', error && 'form-input--error', className]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="form-group">
            {label && (
                <label htmlFor={inputId} className="form-label">
                    {label}
                </label>
            )}
            <input id={inputId} className={inputClasses} {...props} />
            {error && <span className="text-sm text-error">{error}</span>}
        </div>
    );
}