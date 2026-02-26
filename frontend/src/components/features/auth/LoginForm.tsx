import { useState, FormEvent, useCallback } from 'react';
import { Button, Input } from '@/components/common';

interface LoginFormProps {
    onSubmit: (name: string) => Promise<void>;
    isLoading: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);

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
        setTouched(true);
        setError(validateName(name));
    };

    const handleChange = (value: string) => {
        setName(value);
        if (touched) {
            setError(validateName(value));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setTouched(true);

        const validationError = validateName(name);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            await onSubmit(name.trim());
        } catch {
            setError('Login failed. Please check your name.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="login-form" noValidate>
            <Input
                value={name}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
                placeholder="Enter your name"
                disabled={isLoading}
                error={touched ? error : undefined}
                required
                autoFocus
                autoComplete="name"
            />
            <Button type="submit" fullWidth isLoading={isLoading} className="login-form__submit">
                Sign In
            </Button>
        </form>
    );
}