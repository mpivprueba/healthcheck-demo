export type UserRole = 'customer' | 'consultant'

export interface FindingMetric {
  label: string
  value: string
  numericValue?: number
}

export interface Finding {
  id: string
  domainId: string
  title: string
  score: number
  confidence: 'Low' | 'Medium' | 'High'
  summary: string
  storyBeat: string
  recommendation: string
  metrics: FindingMetric[]
  consultantValueIndicator: string
}

export interface DomainScore {
  id: string
  name: string
  score: number
}

export interface ContextEnrichment {
  input: string
  enrichmentEffect: string
  demoImpact: string
}

export interface Annotation {
  findingId: string
  type: 'Context note' | 'Validation note' | 'Recommendation refinement'
  author: string
  date: string
  text: string
}

export interface ScoreOverride {
  findingId: string
  fromScore: number
  toScore: number
  justification: string
}

export interface CustomFinding {
  id: string
  domainId: string
  title: string
  severity: 'Medium' | 'High'
  summary: string
}

export interface EngagementRecord {
  model: string
  consultant: string
  duration: string
  interviewsConducted: string[]
  status: string
}

export interface QuestionnaireOnlyFinding {
  id: string
  title: string
  storyBeat: string
}

export interface DemoData {
  companyName: string
  overallScoreBaseline: number
  overallScoreWithContext: number
  maturityLabel: string
  domainScores: DomainScore[]
  findings: Finding[]
  questionnaireOnlyFindings: QuestionnaireOnlyFinding[]
  enrichments: ContextEnrichment[]
  annotations: Annotation[]
  scoreOverride: ScoreOverride
  customFindings: CustomFinding[]
  engagement: EngagementRecord
}
