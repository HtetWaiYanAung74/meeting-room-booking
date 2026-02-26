import { RoleBadge } from '@/components/common';
import { DEMO_USERS } from '@/utils/constants';

interface QuickLoginButtonsProps {
    onSelect: (name: string) => Promise<void>;
    isLoading: boolean;
}

export function QuickLoginButtons({ onSelect, isLoading }: QuickLoginButtonsProps) {
    return (
        <div className="quick-login">
            <div className="quick-login__grid">
                {DEMO_USERS.map((user) => (
                    <button
                        key={user.name}
                        className="quick-login__button"
                        onClick={() => onSelect(user.name)}
                        disabled={isLoading}
                        type="button"
                    >
                        <span className="quick-login__avatar">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="quick-login__info">
                            <span className="quick-login__name">{user.name}</span>
                            <RoleBadge role={user.role} />
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}