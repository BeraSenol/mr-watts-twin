type Props = { checked: boolean; label: string; onChange: (checked: boolean) => void }

export function Switch({ checked, label, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-success' : 'bg-white/15'
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] size-[22px] rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : ''
        }`}
      />
    </button>
  )
}
