import type { BayesStep, BayesResult } from '@/lib/types'

export function bayesTheorem(prior: number, likelihood: number, falsePositive: number): BayesResult {
  const pNotDisease = 1 - prior
  const evidence = (likelihood * prior) + (falsePositive * pNotDisease)
  const posterior = (likelihood * prior) / evidence

  const steps: BayesStep[] = [
    { step: 1, description: 'Define Prior Probability P(D)', formula: `P(D) = ${prior}`, value: prior },
    { step: 2, description: 'Define Complement P(¬D)', formula: `P(¬D) = 1 - ${prior} = ${pNotDisease.toFixed(6)}`, value: pNotDisease },
    { step: 3, description: 'Likelihood P(+|D) — True Positive Rate', formula: `P(+|D) = ${likelihood}`, value: likelihood },
    { step: 4, description: 'False Positive Rate P(+|¬D)', formula: `P(+|¬D) = ${falsePositive}`, value: falsePositive },
    { step: 5, description: 'Total Evidence P(+)', formula: `P(+) = P(+|D)·P(D) + P(+|¬D)·P(¬D) = ${evidence.toFixed(6)}`, value: evidence },
    { step: 6, description: 'Apply Bayes Theorem → Posterior', formula: `P(D|+) = P(+|D)·P(D) / P(+) = ${posterior.toFixed(6)}`, value: posterior },
  ]

  return { prior, likelihood, evidence, posterior, steps }
}

export function medicalDiagnosis(
  disease: string, prevalence: number, sensitivity: number,
  falsePositiveRate: number, testResult: 'positive' | 'negative'
): BayesResult {
  if (testResult === 'positive') {
    return bayesTheorem(prevalence, sensitivity, falsePositiveRate)
  }
  const fnr = 1 - sensitivity
  const tnr = 1 - falsePositiveRate
  const pNegEvidence = (fnr * prevalence) + (tnr * (1 - prevalence))
  const posterior = (fnr * prevalence) / pNegEvidence

  const steps: BayesStep[] = [
    { step: 1, description: `Prior: Prevalence of ${disease}`, formula: `P(D) = ${prevalence}`, value: prevalence },
    { step: 2, description: 'False Negative Rate P(−|D)', formula: `P(−|D) = 1 − ${sensitivity} = ${fnr.toFixed(6)}`, value: fnr },
    { step: 3, description: 'True Negative Rate P(−|¬D)', formula: `P(−|¬D) = 1 − ${falsePositiveRate} = ${tnr.toFixed(6)}`, value: tnr },
    { step: 4, description: 'Total Evidence P(−)', formula: `P(−) = ${pNegEvidence.toFixed(6)}`, value: pNegEvidence },
    { step: 5, description: 'Posterior P(D|−)', formula: `P(D|−) = P(−|D)·P(D) / P(−) = ${posterior.toFixed(6)}`, value: posterior },
  ]

  return { prior: prevalence, likelihood: fnr, evidence: pNegEvidence, posterior, steps }
}

export interface SensorInput { name: string; reading: number; reliability: number }
export interface SensorResult { combined: number; confidence: number; steps: BayesStep[] }

export function sensorFusion(sensors: SensorInput[]): SensorResult {
  const steps: BayesStep[] = []
  let combined = 0; let totalWeight = 0

  sensors.forEach((s, i) => {
    const w = s.reliability
    combined += s.reading * w
    totalWeight += w
    steps.push({
      step: i + 1,
      description: `${s.name}: reading=${s.reading.toFixed(2)}, reliability=${s.reliability.toFixed(2)}`,
      formula: `weighted += ${s.reading.toFixed(2)} × ${s.reliability.toFixed(2)} = ${(s.reading * w).toFixed(4)}`,
      value: s.reading * w,
    })
  })

  const result = combined / totalWeight
  const confidence = sensors.reduce((acc, s) => acc * s.reliability, 1)
  const jointConf = 1 - (1 - confidence)

  steps.push({
    step: sensors.length + 1,
    description: 'Weighted average fusion',
    formula: `combined = ${combined.toFixed(4)} / ${totalWeight.toFixed(2)} = ${result.toFixed(4)}`,
    value: result,
  })
  steps.push({
    step: sensors.length + 2,
    description: 'Joint confidence estimate',
    formula: `confidence = 1 − Π(1 − rᵢ) ≈ ${jointConf.toFixed(4)}`,
    value: jointConf,
  })

  return { combined: result, confidence: jointConf, steps }
}
