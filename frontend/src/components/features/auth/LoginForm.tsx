import { useState, FormEvent } from 'react';
import { Button, Input } from '@/components/common';

interface LoginFormProps {
    onSubmit: (name: string) => Promise<void>;
    isLoading: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Please enter a name');
            return;
        }

        try {
            await onSubmit(name.trim());
        } catch {
            setError('Login failed. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="login-form">
            <Input
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                }}
                placeholder="Enter your name"
                disabled={isLoading}
                error={error}
                autoFocus
                autoComplete="name"
            />
            <Button type="submit" fullWidth isLoading={isLoading} className="login-form__submit">
                Sign In
            </Button>
        </form>
    );
}