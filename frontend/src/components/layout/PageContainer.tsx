import type { ReactNode } from 'react';

interface PageContainerProps {
    children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
    return <main className="page">{children}</main>;
}

interface PageSectionProps {
    title: string;
    children: ReactNode;
}

export function PageSection({ title, children }: PageSectionProps) {
    return (
        <section className="page__section">
            <h2 className="page__section-title">{title}</h2>
            {children}
        </section>
    );
}