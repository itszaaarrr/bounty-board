interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
      {description && (
        <p className="text-base text-neutral-600 mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
