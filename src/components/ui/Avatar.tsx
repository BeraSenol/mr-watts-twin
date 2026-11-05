export function Avatar({ initials, name }: { initials: string; name: string }) {
  return (
    <span
      title={name}
      aria-label={name}
      className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-semibold"
    >
      {initials}
    </span>
  )
}
