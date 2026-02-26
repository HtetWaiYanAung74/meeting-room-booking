import type { TabItem, UserRole } from '@/types';

interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    userRole: UserRole;
    onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, userRole, onTabChange }: TabsProps) {
    const visibleTabs = tabs.filter((tab) => !tab.roles || tab.roles.includes(userRole));

    return (
        <nav className="tabs">
            {visibleTabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}