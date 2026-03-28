import type { InputMode } from './ModeSelector';

interface Props {
    value: string;
    onChange: (value: string) => void;
    mode: InputMode;
}

export function NumberInput({ value, onChange, mode }: Props) {
    const placeholder = mode === 'normal'
        ? '输入一个大数字'
        : '例如: 1e10, 1.5e6';

    return (
        <div className="input-group">
            <span>n =</span>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={2}
            />
        </div>
    );
}
