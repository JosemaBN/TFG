type EmptyStateProps = {
    title: string;
    hint?: string;
};
export default function EmptyState({ title, hint }: EmptyStateProps) {
    return (<div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {hint ? <p className="muted">{hint}</p> : null}
    </div>);
}
