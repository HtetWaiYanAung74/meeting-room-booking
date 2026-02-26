import { EmptyState } from '@/components/common';
import { UserItem } from './UserItem';
import type { User, UserRole } from '@/types';

interface UserListProps {
    users: User[];
    currentUserId: string;
    onRoleChange: (userId: string, role: UserRole) => Promise<void>;
    onDelete: (userId: string, name: string) => Promise<void>;
}

export function UserList({ users, currentUserId, onRoleChange, onDelete }: UserListProps) {
    if (users.length === 0) {
        return <EmptyState icon="👥" title="No users found" />;
    }

    return (
        <div className="flex flex-col gap-sm">
            {users.map((user) => (
                <UserItem
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId}
                    onRoleChange={onRoleChange}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}