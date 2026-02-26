import { PageSection } from '@/components/layout';
import { Loader } from '@/components/common';
import { UserForm, UserList } from '@/components/features/users';
import { useUsers, useAuth } from '@/hooks';
import type { UserRole } from '@/types';

export function UsersPage() {
    const { user } = useAuth();
    const { users, isLoading, createUser, updateUserRole, deleteUser } = useUsers();

    const handleCreateUser = async (name: string, role: UserRole) => {
        try {
            await createUser(name, role);
        } catch {
            // Error is handled in the hook
        }
    };

    const handleRoleChange = async (userId: string, role: UserRole) => {
        try {
            await updateUserRole(userId, role);
        } catch {
            // Error is handled in the hook
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUser(userId);
        } catch {
            // Error is handled in the hook
        }
    };

    if (!user) return null;

    return (
        <>
            <PageSection title="Create New User">
                <UserForm onSubmit={handleCreateUser} />
            </PageSection>

            <PageSection title={`All Users (${users.length})`}>
                {isLoading && users.length === 0 ? (
                    <Loader text="Loading users..." />
                ) : (
                    <UserList
                        users={users}
                        currentUserId={user.id}
                        onRoleChange={handleRoleChange}
                        onDelete={handleDeleteUser}
                    />
                )}
            </PageSection>
        </>
    );
}