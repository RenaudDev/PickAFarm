interface SubscriberBadgeProps {
  count: number;
}

export function SubscriberBadge({ count }: SubscriberBadgeProps) {
  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-white shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  );
}
