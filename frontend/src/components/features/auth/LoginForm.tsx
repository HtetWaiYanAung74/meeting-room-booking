import { FormEvent, MutableRefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input } from '@/components/common';

interface LoginFormProps {
    onSubmit: (name: string, password: string) => Promise<void>;
    isLoading: boolean;
    setNameRef?: MutableRefObject<((name: string) => void) | null>;
}

interface AuthErrors {
    name?: string;
    password?: string;
}

export function LoginForm({ onSubmit, isLoading, setNameRef }: LoginFormProps) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<AuthErrors>({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (setNameRef) {
            setNameRef.current = (value: string) => {
                setName(value);
                setErrors((prev) => ({ ...prev, name: '' }));
                setTimeout(() => passwordRef.current?.focus(), 0);
            };
        }
    }, [setNameRef]);

    useEffect(() => {
        if (isLoading) {
            setErrors({});
            setHasSubmitted(false);
        }
    }, [isLoading]);

    const validate = useCallback((): { name?: string; password?: string } => {
        const newErrors: AuthErrors = {};
        if (!name.trim()) newErrors.name = 'Username is required';
        if (!password) newErrors.password = 'Password is required';
        return newErrors;
    }, [name, password]);

    const handleNameChange = (value: string) => {
        setName(value);
        if (hasSubmitted) {
            setErrors((prev) => ({ 
                ...prev, 
                name: value.trim() ? undefined : 'Username is required', 
            }));
        }
    };
    
    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (hasSubmitted) {
        setErrors((prev) => ({
            ...prev,
            password: value ? undefined : 'Password is required',
        }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setHasSubmitted(true);
        const newErrors = validate();
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        try {
            await onSubmit(name.trim(), password);
        } catch (err) {
            setErrors({
                password: err instanceof Error ? err.message : 'Login failed. Please try again.',
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="login-form" noValidate>
            <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter your name"
                disabled={isLoading}
                error={hasSubmitted ? errors.name : undefined}
                required
                autoFocus
                autoComplete="name"
            />
            <Input
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                error={hasSubmitted ? errors.password : undefined}
                required
                autoComplete="current-password"
            />
            <Button type="submit" fullWidth isLoading={isLoading} className="login-form__submit">
                {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
        </form>
    );
}