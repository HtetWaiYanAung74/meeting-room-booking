import { useState, FormEvent, useCallback } from 'react';
import { Button, Input, Select } from '@/components/common';
import { ROLE_OPTIONS } from '@/utils/constants';
import type { UserRole } from '@/types';

interface UserFormProps {
    onSubmit: (name: string, password: string, role: UserRole) => Promise<void>;
}

interface FormErrors {
    name?: string;
    password?: string;
    role?: string;
}

export function UserForm({ onSubmit }: UserFormProps) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole | ''>('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const validateField = useCallback((field: string, value: string): string | undefined => {
        switch (field) {
            case 'name':
                if (!value.trim()) {
                    return 'Username is required';
                }
                if (value.trim().length < 2) {
                    return 'Username must be at least 2 characters';
                }
                if (value.trim().length > 50) {
                    return 'Username must be less than 50 characters';
                }
                if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) {
                    return 'Username can only contain letters, numbers, and underscores';
                }
                return undefined;

            case 'password':
                if (!value) {
                    return 'Password is required';
                }
                if (value.length < 6) {
                    return 'Password must be at least 6 characters';
                }
                return undefined;

            case 'role':
                if (!value) {
                    return 'Please select a role';
                }
                if (!['admin', 'owner', 'user'].includes(value)) {
                    return 'Invalid role selected';
                }
                return undefined;

            default:
                return undefined;
        }
    }, []);

    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {
            name: validateField('name', name),
            password: validateField('password', password),
            role: validateField('role', role),
        };

        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    }, [name, password, role, validateField]);

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        const value = field === 'name' ? name : field === 'password' ? password : role;
        setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    };

    const handleNameChange = (value: string) => {
        setName(value);
        if (touched.name) {
            setErrors((prev) => ({ ...prev, name: validateField('name', value) }));
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (touched.password) {
            setErrors((prev) => ({ ...prev, password: validateField('password', value) }));
        }
    }

    const handleRoleChange = (value: string) => {
        setRole(value as UserRole | '');
        if (touched.role) {
            setErrors((prev) => ({ ...prev, role: validateField('role', value) }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setTouched({ name: true, password: true, role: true });
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(name.trim(), password, role as UserRole);
            setName('');
            setPassword('');
            setRole('');
            setErrors({});
            setTouched({});
        } catch {
            // Error handled by parent
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate className='gap-lg p-lg'>
            <div className="form-row">
                <Input
                    label="Name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={() => handleBlur('name')}
                    placeholder="Enter name"
                    disabled={isLoading}
                    error={touched.name ? errors.name : undefined}
                    required
                    maxLength={50}
                />
                <Input
                    type="password"
                    label="Password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Set password"
                    disabled={isLoading}
                    error={touched.password ? errors.password : undefined}
                    required
                />
                <Select
                    label="Role"
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    onBlur={() => handleBlur('role')}
                    disabled={isLoading}
                    error={touched.role ? errors.role : undefined}
                    required
                >
                    <option value="">Select a role</option>
                    {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Select>
            </div>

            <Button type="submit" isLoading={isLoading} className="mt-md">
                Create User
            </Button>
        </form>
    );
}