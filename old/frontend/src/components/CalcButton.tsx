
interface Props {
    onClick: () => void;
    loading: boolean;
}

export function CalcButton({ onClick, loading }: Props) {
    return (
        <button className="calc-btn" onClick={onClick} disabled={loading}>
            {loading ? '...' : '计算'}
        </button>
    )
}
