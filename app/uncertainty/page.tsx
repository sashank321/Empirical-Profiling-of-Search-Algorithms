'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity, Gauge } from 'lucide-react'
import { bayesTheorem, medicalDiagnosis, sensorFusion } from '@/lib/algorithms/bayes'
import type { SensorInput } from '@/lib/algorithms/bayes'
import type { BayesResult, BayesStep } from '@/lib/types'

type Mode = 'medical' | 'sensor'

function ProbBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="text-white font-mono">{(value * 100).toFixed(2)}%</span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(value * 100, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function Slider({ label, value, onChange, min, max, step: s, display }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; display: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="text-white font-mono text-[11px]">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={s} value={value} onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-surface-3 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
    </div>
  )
}

export default function UncertaintyPage() {
  const [mode, setMode] = useState<Mode>('medical')
  const [prevalence, setPrevalence] = useState(0.01)
  const [sensitivity, setSensitivity] = useState(0.95)
  const [fpr, setFpr] = useState(0.05)
  const [testResult, setTestResult] = useState<'positive' | 'negative'>('positive')
  const [bayesResult, setBayesResult] = useState<BayesResult | null>(null)

  const [sensors, setSensors] = useState<SensorInput[]>([
    { name: 'Camera', reading: 0.85, reliability: 0.90 },
    { name: 'GPS', reading: 0.78, reliability: 0.85 },
    { name: 'Radar', reading: 0.92, reliability: 0.95 },
  ])
  const [sensorResult, setSensorResult] = useState<{ combined: number; confidence: number; steps: BayesStep[] } | null>(null)

  const runMedical = () => setBayesResult(medicalDiagnosis('Disease X', prevalence, sensitivity, fpr, testResult))
  const runSensor = () => setSensorResult(sensorFusion(sensors))

  const updateSensor = (i: number, field: 'reading' | 'reliability', v: number) => {
    const ns = [...sensors]; ns[i] = { ...ns[i], [field]: v }; setSensors(ns)
  }

  const activeSteps = mode === 'medical' ? bayesResult?.steps : sensorResult?.steps

  return (
    <div className="min-h-screen bg-surface-0 text-white">
      <header className="sticky top-0 z-50 h-14 bg-surface-0/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] flex items-center px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-[0.2em]">CORTEX</span>
          <span className="text-sm text-text-secondary">AI</span>
        </div>
        <span className="absolute left-1/2 -translate-x-1/2 text-xs text-text-tertiary tracking-wider uppercase">Uncertainty Intelligence Lab</span>
        <Link href="/" className="ml-auto flex items-center gap-1.5 text-text-secondary hover:text-white transition-colors text-xs"><ArrowLeft className="w-3.5 h-3.5" />Home</Link>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Panel */}
        <aside className="w-64 bg-surface-1 border-r border-[rgba(255,255,255,0.06)] p-5 flex flex-col gap-5 overflow-y-auto">
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-3">Scenario</p>
            {(['medical','sensor'] as Mode[]).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm mb-1.5 transition-all duration-200 ${mode === m ? 'bg-surface-3 border border-[rgba(255,255,255,0.2)] text-white' : 'bg-surface-1 border border-transparent text-text-secondary hover:bg-surface-2'}`}>
                {m === 'medical' ? '🩺 Medical Diagnosis' : '📡 Sensor Fusion'}
              </button>
            ))}
          </div>

          {mode === 'medical' ? (
            <div className="space-y-4">
              <Slider label="Prevalence" value={prevalence} onChange={setPrevalence} min={0.001} max={0.1} step={0.001} display={`${(prevalence*100).toFixed(1)}%`} />
              <Slider label="Sensitivity" value={sensitivity} onChange={setSensitivity} min={0.8} max={0.99} step={0.01} display={`${(sensitivity*100).toFixed(0)}%`} />
              <Slider label="False Positive Rate" value={fpr} onChange={setFpr} min={0.01} max={0.2} step={0.01} display={`${(fpr*100).toFixed(0)}%`} />
              <div>
                <p className="text-xs text-text-secondary mb-2">Test Result</p>
                <div className="flex gap-2">
                  {(['positive','negative'] as const).map(t => (
                    <button key={t} onClick={() => setTestResult(t)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${testResult === t ? (t === 'positive' ? 'bg-accent-red/10 text-accent-red border border-accent-red/20' : 'bg-accent-green/10 text-accent-green border border-accent-green/20') : 'bg-surface-2 text-text-secondary border border-transparent'}`}>
                      {t === 'positive' ? '+ Positive' : '− Negative'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={runMedical} className="bg-white text-black font-medium text-sm py-2.5 rounded-xl hover:bg-neutral-200 transition-all w-full">Calculate</button>
            </div>
          ) : (
            <div className="space-y-4">
              {sensors.map((s, i) => (
                <div key={s.name} className="space-y-2 pb-3 border-b border-[rgba(255,255,255,0.06)]">
                  <p className="text-xs text-white font-medium">{s.name}</p>
                  <Slider label="Reading" value={s.reading} onChange={v => updateSensor(i, 'reading', v)} min={0} max={1} step={0.01} display={s.reading.toFixed(2)} />
                  <Slider label="Reliability" value={s.reliability} onChange={v => updateSensor(i, 'reliability', v)} min={0.5} max={0.99} step={0.01} display={`${(s.reliability*100).toFixed(0)}%`} />
                </div>
              ))}
              <button onClick={runSensor} className="bg-white text-black font-medium text-sm py-2.5 rounded-xl hover:bg-neutral-200 transition-all w-full">Fuse Sensors</button>
            </div>
          )}
        </aside>

        {/* Center */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-8 flex items-center justify-center">
            {mode === 'medical' ? (
              <div className="w-full max-w-3xl space-y-8">
                <p className="text-xs text-text-tertiary uppercase tracking-wider text-center">Bayesian Probability Flow</p>
                {bayesResult ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: 'Prior P(D)', value: bayesResult.prior, color: '#71717a' },
                        { label: 'Likelihood P(+|D)', value: bayesResult.likelihood, color: '#f59e0b' },
                        { label: 'Evidence P(+)', value: bayesResult.evidence, color: '#a855f7' },
                        { label: 'Posterior P(D|+)', value: bayesResult.posterior, color: '#3b82f6' },
                      ].map((item, i) => (
                        <div key={i} className="bg-surface-1 border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 text-center">
                          <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-3">{item.label}</p>
                          <p className="text-3xl font-light font-mono" style={{ color: item.color }}>{(item.value * 100).toFixed(2)}%</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3 bg-surface-1 border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                      <ProbBar value={bayesResult.prior} label="Prior" color="#71717a" />
                      <ProbBar value={bayesResult.posterior} label="Posterior" color="#3b82f6" />
                    </div>
                    <div className="bg-surface-1 border border-[rgba(255,255,255,0.06)] rounded-2xl p-5">
                      <p className="text-xs text-text-tertiary mb-3">Interpretation</p>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {bayesResult.posterior > bayesResult.prior
                          ? `A positive test increases the probability from ${(bayesResult.prior*100).toFixed(2)}% to ${(bayesResult.posterior*100).toFixed(2)}%. The test is ${bayesResult.posterior > 0.5 ? 'strongly' : 'moderately'} informative given the base rate.`
                          : `A negative test decreases the probability from ${(bayesResult.prior*100).toFixed(2)}% to ${(bayesResult.posterior*100).toFixed(2)}%, providing reassurance.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-text-muted text-sm">Adjust parameters and click Calculate to see Bayesian inference</div>
                )}
              </div>
            ) : (
              <div className="w-full max-w-3xl space-y-8">
                <p className="text-xs text-text-tertiary uppercase tracking-wider text-center">Sensor Fusion Pipeline</p>
                {sensorResult ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {sensors.map((s, i) => (
                        <div key={i} className="bg-surface-1 border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 text-center">
                          <p className="text-2xl mb-2">{['📷','📍','📡'][i]}</p>
                          <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">{s.name}</p>
                          <p className="text-2xl font-light font-mono text-white">{s.reading.toFixed(2)}</p>
                          <span className="inline-block mt-2 text-[10px] bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded-full">{(s.reliability*100).toFixed(0)}% reliable</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center"><span className="text-text-muted text-2xl">↓</span></div>
                    <div className="bg-surface-1 border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 text-center">
                      <p className="text-xs text-text-tertiary uppercase tracking-wider mb-3">Fused Result</p>
                      <p className="text-4xl font-light font-mono text-white mb-2">{sensorResult.combined.toFixed(4)}</p>
                      <ProbBar value={sensorResult.confidence} label="Joint Confidence" color="#22c55e" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-text-muted text-sm">Configure sensors and click Fuse to see weighted combination</div>
                )}
              </div>
            )}
          </div>

          {/* Bottom: Reasoning */}
          <div className="h-44 border-t border-[rgba(255,255,255,0.06)] bg-surface-1 p-5 overflow-x-auto">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-3">Reasoning Timeline</p>
            {activeSteps && activeSteps.length > 0 ? (
              <div className="flex gap-3">
                {activeSteps.map((s, i) => (
                  <div key={i} className="min-w-[220px] bg-surface-2 border border-[rgba(255,255,255,0.06)] rounded-xl p-3 shrink-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-surface-3 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-mono">{s.step}</span>
                      <span className="text-xs text-white font-medium truncate">{s.description}</span>
                    </div>
                    <p className="text-[11px] text-text-tertiary font-mono truncate">{s.formula}</p>
                    <p className="text-xs text-accent-blue font-mono mt-1">= {typeof s.value === 'number' ? s.value.toFixed(6) : s.value}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-text-muted text-xs">Run a calculation to see reasoning steps</p>}
          </div>
        </main>
      </div>
    </div>
  )
}
