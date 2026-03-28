
interface Props {
    value: number | string | null;
}

export function ResultDisplay({ value }: Props) {
    if (value === null) return null;

    return <p className="result">结果: {value}</p>;
}
