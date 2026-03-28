export interface CalculationResult {
    n: number | string;
    sum: string;
}

export async function calculateSum(n: string, signal?: AbortSignal): Promise<CalculationResult> {
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000').replace(/\/$/, '');
    const res = await fetch(`${apiBaseUrl}/calculate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ n }),
        signal
    });

    if (!res.ok) {
        throw new Error(`HTTP 错误! 状态: ${res.status}`);
    }

    return await res.json();
}
