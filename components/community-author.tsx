export function CommunityAuthor({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span>{role === 'staff' ? 'Aitock公式' : name}</span>
      {role === 'staff' && (
        <span className="rounded-full bg-sapphire px-2 py-0.5 text-xs font-semibold text-white">
          運営
        </span>
      )}
    </span>
  );
}
