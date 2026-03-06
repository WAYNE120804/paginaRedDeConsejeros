export function Tabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            value === option.value ? 'bg-emerald-700 text-white' : 'border border-slate-200 text-slate-600 hover:text-emerald-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
