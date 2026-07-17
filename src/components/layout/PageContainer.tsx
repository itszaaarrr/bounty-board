import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function PageContainer({ children, title, description }: PageContainerProps) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {(title || description) && (
        <div className="mb-10">
          {title && (
            <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 tracking-tight">{title}</h1>
          )}
          {description && (
            <p className="mt-3 text-lg text-neutral-600 max-w-2xl">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
