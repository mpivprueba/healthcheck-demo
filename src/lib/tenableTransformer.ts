import type { DemoData, DomainScore, Finding } from '../types'
import type {
  TenableAssetsResponse,
  TenableVulnerabilitiesResponse,
  TenableScansResponse,
} from './tenable'

// ---------------------------------------------------------------------------
// Public input type
// ---------------------------------------------------------------------------

export interface TransformInput {
  assets: TenableAssetsResponse
  /** Aggregated vulnerabilities across all assets (optional). */
  vulnerabilities?: TenableVulnerabilitiesResponse
  scans?: TenableScansResponse
  companyName?: string
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DAY_MS = 1000 * 60 * 60 * 24

function clamp(score: number): number {
  return Math.round(Math.max(1.0, Math.min(5.0, score)) * 10) / 10
}

function pct(n: number, total: number): number {
  if (total === 0) return 0
  return Math.round((n / total) * 100)
}

function ageInDays(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS))
}

/** Higher rate is better. Thresholds: [excellent, good, fair] → 4.5 / 3.5 / 2.5 / 1.5 */
function rateScore(rate: number, thresholds: [number, number, number]): number {
  if (rate >= thresholds[0]) return 4.5
  if (rate >= thresholds[1]) return 3.5
  if (rate >= thresholds[2]) return 2.5
  return 1.5
}

/** Lower rate is better (failure rate, stale rate, age). Thresholds: [good, fair, poor] */
function rateScoreInv(rate: number, thresholds: [number, number, number]): number {
  if (rate <= thresholds[0]) return 4.5
  if (rate <= thresholds[1]) return 3.5
  if (rate <= thresholds[2]) return 2.5
  return 1.5
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function scoreToFindingScore(s: number): 1 | 2 | 3 | 4 | 5 {
  if (s >= 4.5) return 5
  if (s >= 3.5) return 4
  if (s >= 2.5) return 3
  if (s >= 1.5) return 2
  return 1
}

// ---------------------------------------------------------------------------
// D1 — Asset Visibility
// ---------------------------------------------------------------------------

function buildD1(assets: TenableAssetsResponse): { score: number; findings: Finding[] } {
  const sample = assets.assets
  const total = assets.total
  const n = sample.length
  const now = Date.now()

  let recentlyScanned = 0
  let staleCount = 0
  let agentCount = 0
  const cloudSourceNames = new Set<string>()

  for (const a of sample) {
    if (a.last_scan_time) {
      const age = (now - new Date(a.last_scan_time).getTime()) / DAY_MS
      if (age <= 30) recentlyScanned++
    }
    if ((now - new Date(a.last_seen).getTime()) / DAY_MS > 90) staleCount++
    if (a.agent_name.length > 0) agentCount++
    for (const s of (a.sources ?? [])) {
      if (/aws|azure|gcp|cloud|connector/i.test(s.name)) cloudSourceNames.add(s.name)
    }
  }

  const scanCoverage = pct(recentlyScanned, n)
  const staleRate = pct(staleCount, n)
  const agentRate = pct(agentCount, n)
  const cloudSourceCount = cloudSourceNames.size

  const coverageScore = rateScore(scanCoverage, [90, 75, 60])
  const agentScore = rateScore(agentRate, [80, 60, 40])
  const staleScore = rateScoreInv(staleRate, [5, 15, 30])

  const d1Score = clamp(coverageScore * 0.5 + agentScore * 0.3 + staleScore * 0.2)
  const sampleConfidence = n >= 200 || n >= total * 0.5 ? 'High' : n >= 30 ? 'Medium' : 'Low'

  const f11: Finding = {
    id: '1.1',
    domainId: 'd1',
    title: 'Overall Asset Coverage',
    score: scoreToFindingScore(coverageScore),
    confidence: sampleConfidence,
    summary: `${total.toLocaleString()} assets in Tenable. ${scanCoverage}% scanned in the last 30 days. ${staleRate}% stale (90+ days without activity).`,
    storyBeat:
      'Organizations cannot protect what they cannot see. Every asset outside vulnerability management visibility is an asset where vulnerabilities go undetected, patches go unverified, and risk goes unmeasured. Coverage gaps translate directly into unknown exposure.',
    recommendation:
      'Investigate why unscanned assets are outside recent visibility, reconcile inventory sources, and prioritize onboarding for assets not scanned within the last 30 days.',
    metrics: [
      { label: 'Assets In Tenable', value: total.toLocaleString(), numericValue: total },
      { label: 'Scanned In 30 Days', value: `${scanCoverage}%`, numericValue: scanCoverage },
      { label: 'Stale Assets (90+ Days)', value: `${staleRate}%`, numericValue: staleRate },
    ],
    consultantValueIndicator: `Approximately ${Math.round(((100 - scanCoverage) / 100) * total).toLocaleString()} assets may lack recent scan coverage. A consultant can reconcile inventory and discovery data to close visibility gaps.`,
  }

  const f12: Finding = {
    id: '1.2',
    domainId: 'd1',
    title: 'Agent Deployment Health',
    score: scoreToFindingScore(agentScore),
    confidence: sampleConfidence,
    summary: `${agentRate}% of sampled assets have Nessus Agents deployed. ${100 - agentRate}% rely exclusively on network scanning.`,
    storyBeat:
      'Agents provide authenticated, continuous visibility without requiring network scanner reach. Assets scanned only via the network receive shallower assessment and are detected less frequently. High agent deployment rates correlate directly with higher vulnerability detection accuracy.',
    recommendation:
      'Identify asset groups without agents, evaluate deployment blockers, and prioritize agent coverage for high-criticality endpoints unreachable by network scanners.',
    metrics: [
      { label: 'Assets With Agent', value: `${agentRate}%`, numericValue: agentRate },
      { label: 'Network-Only Assets', value: `${100 - agentRate}%`, numericValue: 100 - agentRate },
      { label: 'Sample Size', value: `${n.toLocaleString()} assets` },
    ],
    consultantValueIndicator:
      'A consultant can identify unmanaged endpoint populations and build an automated agent deployment plan integrated with endpoint management tooling.',
  }

  const f15: Finding = {
    id: '1.5',
    domainId: 'd1',
    title: 'Cloud Connectors',
    score: cloudSourceCount >= 2 ? 3 : cloudSourceCount === 1 ? 3 : 2,
    confidence: 'Low',
    summary:
      cloudSourceCount > 0
        ? `${cloudSourceCount} cloud-related source(s) detected in asset data: ${[...cloudSourceNames].join(', ')}.`
        : 'No cloud connector sources detected in sampled asset data.',
    storyBeat:
      'Cloud environments change constantly. Without connectors, new cloud assets exist in a window of invisibility between deployment and the next scheduled scan. In autoscaling environments, some assets may never be scanned.',
    recommendation:
      'Validate cloud connector configuration, confirm sync frequency and scope, and evaluate agent-based scanning for ephemeral workloads.',
    metrics: [
      {
        label: 'Cloud Sources Detected',
        value: cloudSourceCount.toString(),
        numericValue: cloudSourceCount,
      },
      {
        label: 'Source Names',
        value: cloudSourceCount > 0 ? [...cloudSourceNames].join(', ') : 'None',
      },
    ],
    consultantValueIndicator:
      'A consultant can validate cloud-account coverage, harden connector configuration, and evaluate CNAPP capabilities for containerized workloads.',
  }

  return { score: d1Score, findings: [f11, f12, f15] }
}

// ---------------------------------------------------------------------------
// D2 — Scanning Operations
// ---------------------------------------------------------------------------

function buildD2(scans?: TenableScansResponse): { score: number; findings: Finding[] } {
  const scanList = scans?.scans ?? []

  if (scanList.length === 0) {
    return {
      score: 3,
      findings: [
        {
          id: '2.1',
          domainId: 'd2',
          title: 'Scanning Operations',
          score: 3,
          confidence: 'Low',
          summary:
            'Scan data not available. Ensure the API token has scan:list permission to analyze scanning operations.',
          storyBeat:
            'Scan configuration quality, execution reliability, and policy diversity determine the accuracy and completeness of vulnerability data. Without this analysis, coverage blind spots go undetected.',
          recommendation:
            'Grant scan:list permission to the API token to enable full scanning operations analysis.',
          metrics: [{ label: 'Scan Data', value: 'Not Available' }],
          consultantValueIndicator:
            'A consultant can audit scan configurations, failure patterns, credential coverage, and scheduling to surface hidden coverage gaps.',
        },
      ],
    }
  }

  const total = scanList.length
  const enabled = scanList.filter((s) => s.enabled).length
  const failed = scanList.filter((s) =>
    ['aborted', 'canceled', 'error', 'stopped'].includes(s.status),
  ).length
  const completed = scanList.filter((s) => s.status === 'completed').length
  const running = scanList.filter((s) => s.status === 'running').length
  const evaluated = total - running
  const successRate = pct(completed, evaluated)
  const enabledRate = pct(enabled, total)

  const successScore = rateScore(successRate, [95, 85, 70])
  const enabledScore = rateScore(enabledRate, [90, 75, 60])
  const d2Score = clamp(successScore * 0.6 + enabledScore * 0.4)

  const f21: Finding = {
    id: '2.1',
    domainId: 'd2',
    title: 'Scan Configuration Overview',
    score: scoreToFindingScore(enabledScore),
    confidence: 'High',
    summary: `${total} scan configurations total. ${enabled} enabled (${enabledRate}%). ${failed} failed on last execution. Success rate: ${successRate}%.`,
    storyBeat:
      'Scan configurations define the scope and depth of vulnerability assessment. Disabled or failing scans silently remove assets from visibility without generating any alert. The gap between what is scheduled to be scanned and what actually completes is often larger than assumed.',
    recommendation:
      'Review disabled scan configurations to confirm intentional decommission, investigate all recent failures, and confirm every intended asset group is covered by an active, healthy scan.',
    metrics: [
      { label: 'Total Scan Configs', value: total.toString(), numericValue: total },
      { label: 'Enabled Configs', value: `${enabled} (${enabledRate}%)`, numericValue: enabled },
      { label: 'Failed Last Run', value: failed.toString(), numericValue: failed },
      { label: 'Success Rate', value: `${successRate}%`, numericValue: successRate },
    ],
    consultantValueIndicator:
      'A consultant can audit scan configurations, identify coverage gaps, review credential assignments, and optimize scheduling to eliminate contention.',
  }

  return { score: d2Score, findings: [f21] }
}

// ---------------------------------------------------------------------------
// D3 — Risk Prioritization
// ---------------------------------------------------------------------------

function buildD3(vulns?: TenableVulnerabilitiesResponse): { score: number; findings: Finding[] } {
  const vulnList = vulns?.vulnerabilities ?? []

  if (vulnList.length === 0) {
    return {
      score: 3,
      findings: [
        {
          id: '3.1',
          domainId: 'd3',
          title: 'Risk Prioritization',
          score: 3,
          confidence: 'Low',
          summary:
            'Vulnerability data not available. Connect workbench API to analyze the vulnerability landscape and prioritization posture.',
          storyBeat:
            'How vulnerabilities are prioritized determines whether remediation effort reduces the most risk. Without data, it is impossible to assess whether the most dangerous vulnerabilities are receiving attention.',
          recommendation:
            'Grant workbench API permissions to enable vulnerability landscape and prioritization analysis.',
          metrics: [{ label: 'Vulnerability Data', value: 'Not Available' }],
          consultantValueIndicator:
            'A consultant can analyze VPR adoption, CVSS vs. exploitability alignment, and recurrence patterns.',
        },
      ],
    }
  }

  const total = vulns!.total
  const critical = vulnList.filter((v) => v.severity === 4)
  const high = vulnList.filter((v) => v.severity === 3)
  const withVpr = vulnList.filter((v) => v.vpr_score !== null)
  const vprRate = pct(withVpr.length, vulnList.length)
  const cvssHighLowVpr = vulnList.filter(
    (v) => v.severity >= 3 && v.vpr_score !== null && v.vpr_score < 5,
  ).length

  const criticalAges = critical.map((v) => ageInDays(v.first_found))
  const meanCriticalAge = criticalAges.length
    ? Math.round(criticalAges.reduce((a, b) => a + b, 0) / criticalAges.length)
    : 0

  const vprScore = rateScore(vprRate, [80, 60, 40])
  // Penalize if mean critical age exceeds 30 days
  const ageScore = rateScoreInv(meanCriticalAge, [14, 30, 60])
  const d3Score = clamp(vprScore * 0.5 + ageScore * 0.5)

  const f31: Finding = {
    id: '3.1',
    domainId: 'd3',
    title: 'Vulnerability Landscape',
    score: scoreToFindingScore(ageScore),
    confidence: vulnList.length >= 50 ? 'High' : 'Medium',
    summary: `${total.toLocaleString()} open vulnerabilities. ${critical.length} Critical, ${high.length} High. Mean critical open age: ${meanCriticalAge} days.`,
    storyBeat:
      'Raw vulnerability counts are noise. What matters is which vulnerabilities represent real exploitable risk, which assets concentrate the most exposure, and whether the situation is improving or deteriorating.',
    recommendation:
      'Prioritize remediation by exploitability and blast radius, with focused action on aging critical exposures.',
    metrics: [
      { label: 'Open Vulnerabilities', value: total.toLocaleString(), numericValue: total },
      { label: 'Critical', value: critical.length.toString(), numericValue: critical.length },
      { label: 'High', value: high.length.toString(), numericValue: high.length },
      { label: 'Mean Critical Age', value: `${meanCriticalAge} days`, numericValue: meanCriticalAge },
    ],
    consultantValueIndicator:
      'A consultant can convert landscape volume into prioritized remediation waves aligned to exploitability and business impact.',
  }

  const f32: Finding = {
    id: '3.2',
    domainId: 'd3',
    title: 'VPR Adoption',
    score: scoreToFindingScore(vprScore),
    confidence: vulnList.length >= 20 ? 'Medium' : 'Low',
    summary: `${vprRate}% of sampled vulnerabilities have VPR scores. ${cvssHighLowVpr} Critical/High-CVSS findings have VPR below 5.0.`,
    storyBeat:
      'Not all critical vulnerabilities are equally dangerous. A vulnerability with a Critical CVSS rating but no known exploit poses far less immediate risk than a High-rated finding with active exploitation. How the team prioritizes determines whether effort goes to the highest risk.',
    recommendation:
      'Shift triage and workflow defaults toward VPR-informed prioritization to focus remediation on exploitable risk rather than theoretical severity.',
    metrics: [
      { label: 'VPR Coverage', value: `${vprRate}%`, numericValue: vprRate },
      {
        label: 'CVSS-Critical / Low-VPR Mismatch',
        value: cvssHighLowVpr.toString(),
        numericValue: cvssHighLowVpr,
      },
    ],
    consultantValueIndicator:
      'A consultant can redesign prioritization governance and operational dashboards around VPR and asset criticality context.',
  }

  return { score: d3Score, findings: [f31, f32] }
}

// ---------------------------------------------------------------------------
// D4 — Remediation
// ---------------------------------------------------------------------------

function buildD4(vulns?: TenableVulnerabilitiesResponse): { score: number; findings: Finding[] } {
  const vulnList = vulns?.vulnerabilities ?? []

  if (vulnList.length === 0) {
    return {
      score: 3,
      findings: [
        {
          id: '4.1',
          domainId: 'd4',
          title: 'Remediation Velocity',
          score: 3,
          confidence: 'Low',
          summary:
            'Vulnerability data not available. Connect workbench API to analyze remediation timelines.',
          storyBeat:
            'The time between detecting a vulnerability and fixing it is the window of known exposure. Without tracking this, the program cannot demonstrate whether it translates awareness into action.',
          recommendation:
            'Grant workbench API permissions to enable remediation velocity and backlog analysis.',
          metrics: [{ label: 'Vulnerability Data', value: 'Not Available' }],
          consultantValueIndicator:
            'A consultant can map the detection-to-remediation workflow and surface SLA compliance gaps.',
        },
      ],
    }
  }

  const critical = vulnList.filter((v) => v.severity === 4)
  const high = vulnList.filter((v) => v.severity === 3)

  const criticalAges = critical.map((v) => ageInDays(v.first_found))
  const highAges = high.map((v) => ageInDays(v.first_found))
  const medCritical = median(criticalAges)
  const medHigh = median(highAges)

  // Compare to standard SLAs: Critical 15d, High 30d
  const critRatio = medCritical / 15
  const highRatio = medHigh / 30
  const critSlaScore = critRatio <= 1.0 ? 4.5 : critRatio <= 2.0 ? 3.0 : critRatio <= 4.0 ? 2.0 : 1.5
  const highSlaScore = highRatio <= 1.0 ? 4.5 : highRatio <= 2.0 ? 3.0 : highRatio <= 4.0 ? 2.0 : 1.5
  const d4Score = clamp(critSlaScore * 0.6 + highSlaScore * 0.4)

  const f41: Finding = {
    id: '4.1',
    domainId: 'd4',
    title: 'Remediation Velocity',
    score: scoreToFindingScore(critSlaScore),
    confidence: critical.length >= 10 ? 'High' : critical.length >= 3 ? 'Medium' : 'Low',
    summary: `Median open age — Critical: ${medCritical} days (15d SLA), High: ${medHigh} days (30d SLA). Based on ${critical.length} open critical and ${high.length} open high findings.`,
    storyBeat:
      'The time between detecting a vulnerability and fixing it is the window during which the organization is knowingly exposed. Every day a critical vulnerability remains open is a day an attacker could exploit it. Remediation velocity is the single most direct measure of whether a program translates awareness into action.',
    recommendation:
      'Establish explicit SLA targets for Critical (15 days) and High (30 days) severities. Map the detection-to-remediation workflow end to end and implement escalation triggers for overdue items.',
    metrics: [
      { label: 'Median Age (Critical)', value: `${medCritical} days`, numericValue: medCritical },
      { label: 'Median Age (High)', value: `${medHigh} days`, numericValue: medHigh },
      { label: 'Open Critical Count', value: critical.length.toString(), numericValue: critical.length },
      { label: 'Open High Count', value: high.length.toString(), numericValue: high.length },
    ],
    consultantValueIndicator:
      'A consultant can map workflow bottlenecks and improve ticketing, triage, and escalation processes to reduce time-to-remediation.',
  }

  return { score: d4Score, findings: [f41] }
}

// ---------------------------------------------------------------------------
// D5 — Program Governance
// ---------------------------------------------------------------------------

function buildD5(
  assets: TenableAssetsResponse,
  scans?: TenableScansResponse,
): { score: number; findings: Finding[] } {
  // Proxy: diversity of asset sources and scan config count
  const sourceNames = new Set<string>()
  for (const a of assets.assets) {
    for (const s of (a.sources ?? [])) sourceNames.add(s.name)
  }
  const sourceCount = sourceNames.size
  const scanCount = scans?.scans?.length ?? 0
  const enabledScans = scans?.scans?.filter((s) => s.enabled).length ?? 0

  // More sources → more intentional coverage architecture → higher governance signal
  const sourceScore = rateScore(sourceCount, [5, 3, 2])
  const d5Score = clamp(sourceScore)

  const f51: Finding = {
    id: '5.1',
    domainId: 'd5',
    title: 'Platform Configuration Breadth',
    score: scoreToFindingScore(sourceScore),
    confidence: 'Low',
    summary: `${sourceCount} distinct asset source(s) detected. ${scanCount > 0 ? `${enabledScans} of ${scanCount} scan configurations active.` : 'Scan data unavailable.'}`,
    storyBeat:
      'A vulnerability management platform is only as effective as the people and processes behind it. Source diversity and scan configuration activity indicate whether the program is actively managed or running on autopilot.',
    recommendation:
      'Conduct a platform governance review covering user access, scan ownership, and configuration currency. Assign named owners to each scan configuration and establish a quarterly review cadence.',
    metrics: [
      { label: 'Asset Sources Detected', value: sourceCount.toString(), numericValue: sourceCount },
      {
        label: 'Active / Total Scans',
        value: scanCount > 0 ? `${enabledScans} / ${scanCount}` : 'N/A',
      },
    ],
    consultantValueIndicator:
      'A consultant can assess governance maturity, review user access patterns, and establish configuration ownership and review cadences.',
  }

  return { score: d5Score, findings: [f51] }
}

// ---------------------------------------------------------------------------
// D6 — Ecosystem Integration
// ---------------------------------------------------------------------------

function buildD6(assets: TenableAssetsResponse): { score: number; findings: Finding[] } {
  const allSourceNames = new Set<string>()
  for (const a of assets.assets) {
    for (const s of (a.sources ?? [])) allSourceNames.add(s.name)
  }

  // Sources that are not native Tenable scan sources suggest integrations
  const integrationSources = [...allSourceNames].filter(
    (name) => !/(nessus|tenable|agent|scanner)/i.test(name),
  )
  const integrationCount = integrationSources.length

  const integrationScore = rateScore(integrationCount, [3, 1, 1])
  const d6Score = clamp(integrationScore)

  const f61: Finding = {
    id: '6.1',
    domainId: 'd6',
    title: 'Integration Activity Indicators',
    score: scoreToFindingScore(integrationScore),
    confidence: 'Low',
    summary:
      integrationCount > 0
        ? `${integrationCount} non-scanner source(s) detected in asset data: ${integrationSources.slice(0, 3).join(', ')}. These may indicate active integrations feeding asset records into Tenable.`
        : 'No non-scanner integration sources detected in sampled asset data.',
    storyBeat:
      'Vulnerability management data that stays inside the scanning platform cannot reach the ticketing systems, SIEMs, and dashboards that drive remediation. Every missing integration is a break in the chain between detection and action.',
    recommendation:
      'Inventory all integration touchpoints, confirm which are automated vs. manual, and prioritize durable API-based connections for ticketing and SIEM workflows.',
    metrics: [
      {
        label: 'Integration Sources Detected',
        value: integrationCount.toString(),
        numericValue: integrationCount,
      },
      {
        label: 'Source Names',
        value: integrationCount > 0 ? integrationSources.slice(0, 3).join(', ') : 'None detected',
      },
    ],
    consultantValueIndicator:
      'A consultant can assess integration architecture, identify manual workflows masquerading as automated, and design durable data flows to ticketing and SIEM systems.',
  }

  return { score: d6Score, findings: [f61] }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function transformTenableData(input: TransformInput): DemoData {
  const { assets, vulnerabilities, scans, companyName = 'Client Environment' } = input

  const d1 = buildD1(assets)
  const d2 = buildD2(scans)
  const d3 = buildD3(vulnerabilities)
  const d4 = buildD4(vulnerabilities)
  const d5 = buildD5(assets, scans)
  const d6 = buildD6(assets)

  const domainScores: DomainScore[] = [
    { id: 'd1', name: 'Asset Visibility', score: d1.score },
    { id: 'd2', name: 'Scanning Operations', score: d2.score },
    { id: 'd3', name: 'Risk Prioritization', score: d3.score },
    { id: 'd4', name: 'Remediation', score: d4.score },
    { id: 'd5', name: 'Program Governance', score: d5.score },
    { id: 'd6', name: 'Ecosystem Integration', score: d6.score },
  ]

  const allFindings = [
    ...d1.findings,
    ...d2.findings,
    ...d3.findings,
    ...d4.findings,
    ...d5.findings,
    ...d6.findings,
  ]

  const overallScore = clamp(
    domainScores.reduce((sum, d) => sum + d.score, 0) / domainScores.length,
  )

  const maturityLabel =
    overallScore >= 4.5
      ? 'Advanced'
      : overallScore >= 3.5
        ? 'Proficient'
        : overallScore >= 2.5
          ? 'Developing'
          : overallScore >= 1.5
            ? 'Basic'
            : 'Initial'

  return {
    companyName,
    overallScoreBaseline: overallScore,
    overallScoreWithContext: overallScore,
    maturityLabel,
    domainScores,
    findings: allFindings,
    questionnaireOnlyFindings: [],
    enrichments: [],
    annotations: [],
    scoreOverride: { findingId: '', fromScore: 0, toScore: 0, justification: '' },
    customFindings: [],
    engagement: {
      model: '',
      consultant: '',
      duration: '',
      interviewsConducted: [],
      status: '',
    },
  }
}
