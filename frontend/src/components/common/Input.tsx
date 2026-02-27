import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, id, required, className = '', ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
        const inputClasses = ['form-input', error && 'form-input--error', className]
            .filter(Boolean)
            .join(' ');

        return (
            <div className="form-group">
                {label && (
                    <label htmlFor={inputId} className="form-label">
                        {label}
                        {required && <span className="form-required">*</span>}
                    </label>
                )}
                <input ref={ref} id={inputId} className={inputClasses} {...props} />
                {error && <span className="form-error">{error}</span>}
            </div>
        );
    });

    Input.displayName = 'Input';