import './App.css'
import useCalculator from './hooks/useCalculator'
import { NumberInput } from './components/NumberInput'
import { CalcButton } from './components/CalcButton'
import { ResultDisplay } from './components/ResultDisplay'
import { ModeSelector } from './components/ModeSelector'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const { n, setN, sum, calculate, loading, error, inputMode, setInputMode } = useCalculator('10')

  return (
    <ErrorBoundary>
      <div className="container">
        <ModeSelector mode={inputMode} onChange={setInputMode} />
        <div className="input-row">
          <NumberInput value={n} onChange={setN} mode={inputMode} />
          <CalcButton onClick={calculate} loading={loading} />
        </div>

        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
        <ResultDisplay value={sum} />
      </div>
    </ErrorBoundary>
  )
}

export default App
