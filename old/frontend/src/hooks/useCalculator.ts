import { useState } from 'react'
import type { InputMode } from '../components/ModeSelector';
import { validateInput, parseInput } from '../utils/validation';
import { calculateSum } from '../services/api';

/**
 * 自定义 Hook: 封装计算逻辑，并添加错误处理和超时机制
 */
function useCalculator(initialN: string) {
    const [n, setN] = useState<string>(initialN)
    const [sum, setSum] = useState<number | string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [inputMode, setInputMode] = useState<InputMode>('normal')

    async function calculate() {
        // 1. 验证
        const validationError = validateInput(n, inputMode);
        if (validationError) {
            setError(validationError);
            return;
        }

        // 2. 解析
        let valueToSend: string;
        try {
            valueToSend = parseInput(n, inputMode);
        } catch (e) {
            setError('数值解析错误');
            return;
        }

        setLoading(true)
        setError(null)
        console.log(`[Frontend] Fetching sum for n = ${n}...`)

        // 设置 5 秒超时，防止请求永久挂起
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        try {
            // 3. API 调用
            const data = await calculateSum(valueToSend, controller.signal)
            console.log(`[Frontend] Received:`, data)
            setSum(data.sum)
        } catch (err: unknown) {
            console.error(`[Frontend] Error:`, err)
            const message = err instanceof Error ? err.message : '网络请求失败'
            if (err instanceof Error && err.name === 'AbortError') {
                setError('请求超时，请检查后端是否存活 (端口 5000)')
            } else {
                setError(message)
            }
        }
        finally {
            clearTimeout(timeoutId)
            setLoading(false)
        }
    }

    return { n, setN, sum, loading, error, calculate, inputMode, setInputMode }
}

export default useCalculator
