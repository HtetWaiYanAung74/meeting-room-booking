import { useState, ChangeEvent } from 'react';
import { Button, Select, RoleBadge } from '@/components/common';
import { ROLE_OPTIONS } from '@/utils/constants';
import type { User, UserRole } from '@/types';

interface UserItemProps {
    user: User;
    currentUserId: string;
    onRoleChange: (userId: string, role: UserRole) => Promise<void>;
    onDelete: (userId: string, name: string) => Promise<void>;
}

export function UserItem({ user, currentUserId, onRoleChange, onDelete }: UserItemProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isCurrentUser = user.id === currentUserId;

    const handleRoleChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        setIsUpdating(true);
        try {
            await onRoleChange(user.id, e.target.value as UserRole);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            `Are you sure you want to delete user "${user.name}"? This will also delete all their bookings.`
        );
        if (!confirmed) return;

        setIsDeleting(true);
        try {
            await onDelete(user.id, user.name);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="list-item">
            <div className="list-item__content flex items-center gap-sm">
                <span className="font-medium">{user.name}</span>
                <RoleBadge role={user.role} />
                {isCurrentUser && <span className="text-primary font-medium">(You)</span>}
            </div>
            {!isCurrentUser && (
                <div className="list-item__actions">
                    <Select
                        value={user.role}
                        onChange={handleRoleChange}
                        disabled={isUpdating}
                        className="form-select"
                    >
                        {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                    <Button variant="danger" size="sm" onClick={handleDelete} isLoading={isDeleting}>
                        Delete
                    </Button>
                </div>
            )}
        </div>
    );
}