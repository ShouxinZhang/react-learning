export type InputMode = 'normal' | 'scientific';

interface Props {
    mode: InputMode;
    onChange: (mode: InputMode) => void;
}

export function ModeSelector({ mode, onChange }: Props) {
    return (
        <div className="mode-selector">
            <label htmlFor="input-mode">输入模式：</label>
            <select
                id="input-mode"
                value={mode}
                onChange={(e) => onChange(e.target.value as InputMode)}
            >
                <option value="normal">正常</option>
                <option value="scientific">科学计数法</option>
            </select>
        </div>
    );
}
