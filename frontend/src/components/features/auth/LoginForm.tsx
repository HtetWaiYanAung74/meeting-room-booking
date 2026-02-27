import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input } from '@/components/common';

interface LoginFormProps {
    onSubmit: (name: string) => Promise<void>;
    isLoading: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isLoading) {
            setError('');
            setHasSubmitted(false);
        }
    }, [isLoading]);

    const validateName = useCallback((value: string): string => {
        if (!value.trim()) {
            return 'Username is required';
        }
        if (value.trim().length < 2) {
            return 'Username must be at least 2 characters';
        }
        return '';
    }, []);

    const handleBlur = () => {
        if (hasTyped && name.trim()) {
            setError(validateName(name));
        }
    };

    const handleChange = (value: string) => {
        setName(value);
        setHasTyped(true);
        if (hasSubmitted) {
            setError(validateName(value));
        } else if (error && value.trim()) {
            setError('');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);
        const validationError = validateName(name);
        if (validationError) {
            setError(validationError);
            inputRef.current?.focus();
            return;
        }

        try {
            await onSubmit(name.trim());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
        }
    };

    const showError = error && (hasSubmitted || (hasTyped && name.length > 0));

    return (
        <form onSubmit={handleSubmit} className="login-form" noValidate>
            <Input
                value={name}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
                placeholder="Enter your name"
                disabled={isLoading}
                error={showError ? error : undefined}
                required
                autoFocus
                autoComplete="name"
            />
            <Button type="submit" fullWidth isLoading={isLoading} className="login-form__submit">
                {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
        </form>
    );
}