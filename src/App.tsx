import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { meridianData } from './data/meridianData'
import type { UserRole } from './types'

type ScreenKey =
  | 'dashboard'
  | 'findings'
  | 'questionnaire'
  | 'engagement'
  | 'report'
  | 'expansion-opportunities'
  | 'interview-guide'

const navItems: { key: ScreenKey; label: string; consultantOnly?: boolean }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'findings', label: 'Findings' },
  { key: 'questionnaire', label: 'Questionnaire' },
  { key: 'interview-guide', label: 'Interview Guide', consultantOnly: true },
  { key: 'report', label: 'Report Preview' },
  { key: 'expansion-opportunities', label: 'Expansion Opportunities', consultantOnly: true },
  { key: 'engagement', label: 'Engagement', consultantOnly: true },
]

interface EnrichmentPreview {
  findingId: string
  message: string
}

const enrichmentPreviewByQuestionId: Record<string, EnrichmentPreview> = {
  'Q1.2': {
    findingId: '1.2',
    message:
      'This section enriches agent health by comparing deployed agents to managed endpoint population and deployment model.',
  },
  'Q1.3': {
    findingId: '1.3',
    message:
      'This section enriches scanner health by mapping observed scanner coverage to real network-segment exposure.',
  },
  'Q1.4': {
    findingId: '1.4',
    message:
      'This section enriches tagging maturity by connecting tags to compliance scope and business criticality.',
  },
  'Q1.5': {
    findingId: '1.5',
    message:
      'This section enriches cloud visibility by validating connector state against real cloud footprint.',
  },
  'Q2.2': {
    findingId: '2.2',
    message:
      'This section enriches scan recency by evaluating execution against your declared scanning cadence policy.',
  },
  'Q2.3': {
    findingId: '2.3',
    message:
      'This section enriches scan health by adding monitoring, ownership, and response-time context to failure metrics.',
  },
  'Q2.4': {
    findingId: '2.4',
    message:
      'This section enriches policy analysis by matching scan templates to system sensitivity and operational constraints.',
  },
  'Q2.5': {
    findingId: '2.5',
    message:
      'This section enriches exclusion risk by separating justified exceptions from unmanaged blind spots.',
  },
  'Q3.1': {
    findingId: '3.1',
    message:
      'This section enriches exposure interpretation by adding risk appetite and leadership-governance context.',
  },
  'Q3.2': {
    findingId: '3.2',
    message:
      'This section enriches prioritization behavior by clarifying whether methodology is deliberate, documented, and consistent.',
  },
  'Q3.3': {
    findingId: '3.3',
    message:
      'This section enriches recurrence analysis by linking reopened findings to image and configuration-management practices.',
  },
  'Q4.2': {
    findingId: '4.2',
    message:
      'This section enriches fix-rate interpretation by combining capacity constraints with risk-acceptance governance.',
  },
  'Q4.3': {
    findingId: '4.3',
    message:
      'This section enriches remediation distribution by identifying workflow and tooling bottlenecks.',
  },
  'Q5.1': {
    findingId: '5.1',
    message:
      'This section enriches user-activity signals with team structure, ownership authority, and governance context.',
  },
  'Q5.2': {
    findingId: '5.2',
    message:
      'This section enriches operational activity patterns by validating review cadence and change-management practice.',
  },
  'Q6.1': {
    findingId: '6.1',
    message:
      'This section enriches integration indicators by mapping service-account evidence to real architecture status.',
  },
  'Q6.2': {
    findingId: '6.2',
    message:
      'This section enriches export behavior by showing who receives vulnerability data and at what cadence.',
  },
}

function getScoreColor(score: number) {
  if (score <= 2) return '#C62828'
  if (score <= 3.5) return '#F57F17'
  return '#2E7D32'
}

interface QuestionnaireState {
  expectedAssetCount: number
  excludedPopulationMode: 'none' | 'some'
  excludedPopulationCount: number
  nonCredentialablePercent: number
  criticalSlaDays: number
  highSlaDays: number
}

type InterviewResponseMap = Record<
  | '1.1'
  | '1.2'
  | '1.4'
  | '2.1'
  | '2.3'
  | '2.4'
  | '2.5'
  | '3.2'
  | '3.3'
  | '4.1'
  | '4.2'
  | '4.3'
  | '5.1'
  | '5.2'
  | '6.1'
  | 'pattern-1'
  | 'pattern-2'
  | 'pattern-3'
  | 'pattern-4'
  | 'pattern-5',
  string
>

type ObservationResponseMap = Record<
  | 'obs-1'
  | 'obs-2'
  | 'obs-3'
  | 'obs-4'
  | 'obs-5'
  | 'obs-6'
  | 'obs-7'
  | 'obs-8'
  | 'obs-9'
  | 'obs-10'
  | 'obs-11'
  | 'obs-12',
  string
>

type ClosingResponseMap = Record<
  'close-1' | 'close-2' | 'close-3' | 'close-4' | 'close-5' | 'close-6',
  string
>

const defaultQuestionnaire: QuestionnaireState = {
  expectedAssetCount: 15000,
  excludedPopulationMode: 'none',
  excludedPopulationCount: 0,
  nonCredentialablePercent: 28,
  criticalSlaDays: 15,
  highSlaDays: 30,
}

const defaultInterviewResponses: InterviewResponseMap = {
  '1.1': '',
  '1.2': '',
  '1.4': '',
  '2.1': '',
  '2.3': '',
  '2.4': '',
  '2.5':
    "Two exclusions are for the OT/manufacturing floor. Program owner confirmed PLC controller resets from active scanning. The other 5 - they couldn't explain any of them. 'Those were there when I started.' No documentation exists.",
  '3.2': '',
  '3.3': '',
  '4.1':
    "Program owner confirmed: security team reviews vulns weekly, manually creates ServiceNow tickets. IT ops doesn't see the ticket for 5-7 days. Actual patching time once IT gets the ticket is 7-10 days for Critical. The velocity problem is almost entirely in the handoff.",
  '4.2': '',
  '4.3': '',
  '5.1':
    "Program owner acknowledged the concentration risk. 'If I got hit by a bus, nobody could run Tenable. My manager knows the login but has never used the platform.' No cross-training has been attempted. No SOPs exist. 'It's all in my head.'",
  '5.2': '',
  '6.1': '',
  'pattern-1': '',
  'pattern-2': '',
  'pattern-3':
    "The full chain: Tenable detects to security team reviews in weekly meeting to someone manually selects vulns and exports CSV to creates ServiceNow tickets by hand to IT ops triages in their sprint cycle. Nobody owns the end-to-end flow. Program owner said 'I've asked for automated ticketing three times but it never gets prioritized.'",
  'pattern-4': '',
  'pattern-5':
    "Program owner has never presented a VM status report to the CISO. 'He knows we have Tenable and he asks me about it sometimes in our skip-level, but there's no formal reporting. I wouldn't know what to put in a report.' No SLA enforcement because 'nobody above me has ever asked about remediation timelines.'",
}

const defaultObservationResponses: ObservationResponseMap = {
  'obs-1': '',
  'obs-2': '',
  'obs-3': '',
  'obs-4':
    "Scan credentials stored in a shared spreadsheet on the program owner's desktop. The 4 uncredentialed scan configs - program owner said 'I think those were set up by my predecessor, I don't have credentials for those systems.' Windows scans use a domain admin account. Program owner was unaware this was a security risk.",
  'obs-5': '',
  'obs-6': '',
  'obs-7': '',
  'obs-8': '',
  'obs-9': '',
  'obs-10':
    'Reviewed ticket INC0047823. Created 9 days after Tenable detection. Contains only CVE number and hostname - no severity, no VPR, no asset context, no remediation guidance. Currently unassigned after 4 days in queue. Program owner was surprised by the gap.',
  'obs-11': '',
  'obs-12': '',
}

const defaultClosingResponses: ClosingResponseMap = {
  'close-1': '',
  'close-2': '',
  'close-3':
    "'The IT ops manager controls patching windows and sprint priorities. He's not hostile but security tickets compete with feature work and always lose. If the CISO told him security patches get priority, it would change overnight.'",
  'close-4': '',
  'close-5':
    "'In 12 months I want three things: automated ticketing so I'm not spending 4 hours a week creating tickets, a second person on the team, and a monthly meeting with the CISO where I present metrics and get air cover for remediation pushback.'",
  'close-6': '',
}

const findingTriggeredPromptByFindingId: Partial<
  Record<string, { metric: string; question: string }>
> = {
  '1.1': {
    metric: 'True coverage: 62%, ~3,150 assets invisible',
    question:
      'Your environment has approximately 3,150 assets that Tenable has no visibility into. Do you know where these are? Are they in network segments your scanners cannot reach, or are they systems that were never onboarded?',
  },
  '1.2': {
    metric: 'Agent coverage: 72% of managed endpoints, 3,200 without agents',
    question:
      'Your endpoint management tools track 11,400 endpoints but only 8,200 have Nessus Agents. Is there a reason agents were not deployed to the remaining 3,200? Is it a technical barrier, a resourcing issue, or were those systems not identified?',
  },
  '1.4': {
    metric: 'Zero tags map to regulatory scope, PCI/SOX assets unidentifiable',
    question:
      "Your PCI-scoped assets and SOX-relevant systems are not identifiable in Tenable. Has there been a discussion about aligning Tenable's asset tagging with your compliance scope, and if so, what prevented it?",
  },
  '2.1': {
    metric: 'Achievable auth rate: 85%, but 4 scan configs have no credentials',
    question:
      'I see 4 scan configurations running without credentials. Which asset types do these target, and what has prevented adding credentials to them?',
  },
  '2.3': {
    metric: 'Chronic failure scan: failed 4 of last 5 cycles, no monitoring',
    question:
      'One of your scans has failed 4 of its last 5 executions. Were you aware of this before this assessment? How do you currently find out when a scan fails?',
  },
  '2.4': {
    metric: 'All 8 scans use default template, prior production disruption',
    question:
      'All your scans use the default Basic Network Scan template, and there was a scan-related disruption to a production database. After that incident, was there a discussion about adjusting scan policies for sensitive systems?',
  },
  '2.5': {
    metric: '5 of 7 permanent exclusions unjustified, covering ~2,800 hosts',
    question:
      'Five of your permanent scan exclusions have no documented justification. Do you know the history behind these? Are the systems they cover still in the environment?',
  },
  '3.2': {
    metric: 'CVSS prioritization inherited from defaults, team unaware of VPR',
    question:
      "Your prioritization follows CVSS severity, which appears to be the default rather than a deliberate choice. Has your team evaluated Tenable's VPR as an alternative, and if not, would you be open to seeing how it would change your prioritization?",
  },
  '3.3': {
    metric: '22% recurrence rate, base images updated annually',
    question:
      'About a fifth of your remediated vulnerabilities are reappearing. Your base images are updated annually. Has the team connected these two issues, and is there a plan to update images more frequently?',
  },
  '4.1': {
    metric: 'Median Critical TTR: 52 days vs. 15-day SLA, worsening trend',
    question:
      'Your team targets 15 days for Critical remediation but the actual median is 52 days. Where in the workflow does the time go? Is it detection-to-ticket, ticket-to-assignment, or assignment-to-patching?',
  },
  '4.2': {
    metric: '~120 informally accepted risks, no expiration, backlog growing by 400/month',
    question:
      'Your backlog is growing by about 400 vulnerabilities per month. Of the open vulnerabilities, roughly 120 appear to be informally accepted. Is there a process for deciding which vulnerabilities to accept, and who has that authority?',
  },
  '4.3': {
    metric: 'OS-to-third-party fix ratio 3:1, no third-party patching process',
    question:
      'Your OS patching is automated through SCCM, but there is no process for third-party applications like Java and Adobe. Has this been raised as a gap, and what would be needed to establish a process?',
  },
  '5.1': {
    metric: '82% activity from one user, primary owner two layers below CISO',
    question:
      'The data shows 82% of all platform activity comes from your account. If you were unavailable for an extended period, who would manage the program? And when you need IT to remediate something, what happens when they push back?',
  },
  '5.2': {
    metric: '75% of scan configs unmodified since creation, no capability tracking',
    question:
      'Most of your scan configurations have not been changed since initial deployment. Has there been a deliberate review of whether the original setup still matches your current environment?',
  },
  '6.1': {
    metric: 'ServiceNow: manual CSV export, Splunk: dashboard only',
    question:
      'Your ServiceNow integration operates through manual CSV export rather than automated sync. Was automated integration ever explored? And the data sent to Splunk does not appear to be used for alert correlation. Is the SOC aware they have vulnerability data available?',
  },
}

const observationPromptByFindingId: Partial<Record<string, { tag: string; promptId: keyof ObservationResponseMap; text: string }>> = {
  '1.2': {
    tag: 'Finding 1.2',
    promptId: 'obs-1',
    text: 'Ask the stakeholder to show how a new endpoint gets a Nessus Agent installed. Walk through the process for a server just provisioned through SCCM. Note whether agent deployment is part of the standard build process or a separate manual step that someone has to remember to do.',
  },
  '1.4': {
    tag: 'Finding 1.4',
    promptId: 'obs-2',
    text: 'Open the Tenable asset view together and search for a known PCI-scoped system by IP or hostname. Note whether it has any tags, whether the stakeholder can identify which assets are in PCI scope without leaving Tenable, and how long it takes them to answer.',
  },
  '1.5': {
    tag: 'Finding 1.5',
    promptId: 'obs-3',
    text: 'Ask to see the Azure connector configuration in Tenable. Check whether the 6-day sync outage has generated any alert or notification. Note whether the stakeholder was aware the connector had stopped syncing before this assessment surfaced it.',
  },
  '2.1': {
    tag: 'Finding 2.1',
    promptId: 'obs-4',
    text: 'Ask to see how scan credentials are stored and managed. Note whether they use a vault, a spreadsheet, or individual knowledge. Ask who knows the credentials for the 4 uncredentialed scan configurations and what would happen if that person were unavailable.',
  },
  '2.3': {
    tag: 'Finding 2.3',
    promptId: 'obs-5',
    text: 'Ask to view the current Tenable scan schedules and the scan history for the scan that has failed 4 of its last 5 executions. Note whether the stakeholder can navigate to this information easily, and watch their reaction when shown the failure pattern. Were they aware?',
  },
  '2.5': {
    tag: 'Finding 2.5',
    promptId: 'obs-6',
    text: 'Ask to see the list of the 5 permanent exclusions that have no documented justification. Ask the stakeholder to walk through each one on the spot and explain whether the excluded systems still exist and whether exclusion is still necessary. Note which ones they can explain and which ones they cannot.',
  },
  '3.2': {
    tag: 'Finding 3.2',
    promptId: 'obs-7',
    text: 'Ask the stakeholder to walk through how they decided which vulnerabilities to remediate this week or this month. Watch the actual process, not the description of it. Note whether they reference VPR, CVSS, asset criticality, or simply work from a list sorted by whatever the default view is.',
  },
  '3.3': {
    tag: 'Finding 3.3',
    promptId: 'obs-8',
    text: 'Ask to see the current base image for the most commonly deployed server operating system. Check the patch date on the image. Note whether it confirms the annual update cadence described in the questionnaire, and whether the team has visibility into how outdated their images are.',
  },
  '4.2': {
    tag: 'Finding 4.2',
    promptId: 'obs-9',
    text: 'Ask to see documentation for any of the approximately 120 informally accepted risks. Note whether any written record exists at all, whether there is an approval signature or email, and whether anyone can explain the specific compensating controls for a single accepted vulnerability picked at random.',
  },
  '4.3': {
    tag: 'Finding 4.3',
    promptId: 'obs-10',
    text: 'Request a recent ServiceNow ticket that was created from a Tenable vulnerability finding. Check when the vulnerability was first detected versus when the ticket was created (confirming or disproving the 1 to 2 week handoff lag). Note how much context from Tenable made it into the ticket: just the CVE number, or full asset details, severity, and remediation guidance?',
  },
  '5.2': {
    tag: 'Finding 5.2',
    promptId: 'obs-12',
    text: 'Ask the stakeholder to show their actual day-to-day workflow for reviewing new vulnerability findings in Tenable. Watch them do it live rather than describe it. Note which dashboard or view they open, how they sort or filter results, whether they use saved views or start from scratch each time, and how long it takes them to identify the most important items.',
  },
}

type UsedInDestination = { label: string; action?: () => void }

function createUsedInMappings(
  onOpenFindingAnchor: (findingId: string, anchorId: string) => void,
  onOpenReportSection: (sectionId: string) => void,
) {
  const usedInByInterviewId: Partial<Record<keyof InterviewResponseMap, UsedInDestination[]>> = {
    '4.1': [
      {
        label: 'Annotation on Finding 4.1',
        action: () => onOpenFindingAnchor('4.1', 'annotation-4.1-bottleneck'),
      },
    ],
    '2.5': [
      {
        label: 'Annotation on Finding 2.5',
        action: () => onOpenFindingAnchor('2.5', 'annotation-2.5-ot'),
      },
      {
        label: 'Score Override on Finding 2.5',
        action: () => onOpenFindingAnchor('2.5', 'score-override-2.5'),
      },
    ],
    '5.1': [
      {
        label: 'Annotation on Finding 5.1',
        action: () => onOpenFindingAnchor('5.1', 'annotation-5.1-key-person'),
      },
    ],
    'pattern-3': [
      {
        label: 'Annotation on Finding 4.3',
        action: () => onOpenFindingAnchor('4.3', 'annotation-4.3-pattern-chain'),
      },
      { label: 'Executive Summary', action: () => onOpenReportSection('report-executive-summary') },
    ],
    'pattern-5': [
      { label: 'Custom Finding - Executive Sponsorship Gap', action: () => onOpenReportSection('custom-finding-executive-sponsorship-gap') },
      { label: 'Roadmap', action: () => onOpenReportSection('report-prioritized-roadmap') },
    ],
  }

  const usedInByObservationId: Partial<Record<keyof ObservationResponseMap, UsedInDestination[]>> = {
    'obs-10': [
      {
        label: 'Annotation on Finding 4.3',
        action: () => onOpenFindingAnchor('4.3', 'annotation-4.3-ticket-observation'),
      },
    ],
    'obs-4': [{ label: 'Custom Finding - Credential Architecture Risk', action: () => onOpenReportSection('custom-finding-credential-architecture-risk') }],
  }

  const usedInByClosingId: Partial<Record<keyof ClosingResponseMap, UsedInDestination[]>> = {
    'close-5': [
      { label: 'Roadmap', action: () => onOpenReportSection('report-prioritized-roadmap') },
      { label: 'Executive Summary', action: () => onOpenReportSection('report-executive-summary') },
    ],
    'close-3': [
      { label: 'Custom Finding - Executive Sponsorship Gap', action: () => onOpenReportSection('custom-finding-executive-sponsorship-gap') },
      { label: 'Internal only (name redacted from report)' },
    ],
  }

  return { usedInByInterviewId, usedInByObservationId, usedInByClosingId }
}

function InterviewGuideNotesField({
  value,
  onChange,
  usedInDestinations,
}: {
  value: string
  onChange: (value: string) => void
  usedInDestinations: UsedInDestination[]
}) {
  const [showPromote, setShowPromote] = useState(false)
  const [showTip, setShowTip] = useState(false)
  const timerRef = useRef<number | null>(null)
  const trimmed = value.trim()
  const isPromoted = trimmed.length > 0 && usedInDestinations.length > 0

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (isPromoted || trimmed.length === 0) {
      setShowPromote(false)
      return
    }

    setShowPromote(false)
    timerRef.current = window.setTimeout(() => {
      setShowPromote(true)
    }, 2500)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [trimmed, isPromoted, value])

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">INTERVIEW NOTES</p>
      <textarea
        rows={3}
        value={value}
        onChange={(event) => {
          setShowPromote(false)
          onChange(event.target.value)
        }}
        onBlur={() => {
          if (!isPromoted && value.trim()) {
            setShowPromote(true)
          }
        }}
        className={`mt-1 w-full resize-none overflow-hidden rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 ${
          trimmed ? 'bg-[#F7FAFF]' : 'bg-white'
        }`}
      />

      {isPromoted && (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-[#999999]">
            Used in:{' '}
            {usedInDestinations.map((destination, index) => (
              <span key={destination.label}>
                {destination.action ? (
                  <button
                    type="button"
                    onClick={destination.action}
                    className="text-[#2E75B6] hover:underline"
                  >
                    {destination.label}
                  </button>
                ) : (
                  <span>{destination.label}</span>
                )}
                {index < usedInDestinations.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
          <span className="text-[12px] text-slate-500">✓ Promoted</span>
        </div>
      )}

      {!isPromoted && showPromote && trimmed.length > 0 && (
        <div className="mt-1 flex justify-end">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTip(true)
                window.setTimeout(() => setShowTip(false), 2200)
              }}
              className="text-xs font-medium text-slate-500 transition hover:text-[#2E75B6]"
            >
              Promote
            </button>
            {showTip && (
              <div className="absolute right-0 top-full z-20 mt-1 max-w-sm rounded bg-slate-900 px-2 py-1 text-xs text-white shadow">
                Available in production. The consultant selects a destination (annotation, score
                override, custom finding, or narrative input) and refines the raw note into a
                polished assessment output.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getCoverageRecalculation(questionnaire: QuestionnaireState) {
  const tenableAssets = 11847
  const adjustedExpected = Math.max(
    questionnaire.expectedAssetCount -
      (questionnaire.excludedPopulationMode === 'some'
        ? questionnaire.excludedPopulationCount
        : 0),
    1,
  )
  const coverage = Math.min((tenableAssets / adjustedExpected) * 100, 100)
  const invisibleAssets = Math.max(adjustedExpected - tenableAssets, 0)
  return { coverage, invisibleAssets, adjustedExpected }
}

function getAuthRecalculation(questionnaire: QuestionnaireState) {
  const baselineAuthRate = 61
  const denominator = Math.max(100 - questionnaire.nonCredentialablePercent, 1)
  const achievableAuth = Math.min((baselineAuthRate / denominator) * 100, 100)
  return { baselineAuthRate, achievableAuth }
}

function getSlaOvershoot(ttrDays: number, slaDays: number) {
  if (slaDays <= 0) return 0
  return ((ttrDays - slaDays) / slaDays) * 100
}

function getContextSource(findingId: string) {
  const sourceMap: Record<string, string> = {
    '1.1': 'Q1.1 Expected Environment Size',
    '1.2': 'Q1.2 Endpoint Management Baseline',
    '1.3': 'Q1.3 Network Architecture Context',
    '1.4': 'Q1.4 Asset Classification Framework',
    '1.5': 'Q1.5 Cloud Environment Profile',
    '2.1': 'Q2.1 Credential and Authentication Context',
    '2.2': 'Q2.2 Target Scan Cadence',
    '2.3': 'Q2.3 Scan Operations Management',
    '2.4': 'Q2.4 Asset Sensitivity and Policy Alignment',
    '2.5': 'Q2.5 Exclusion Justifications',
    '3.1': 'Q3.1 Risk Appetite and Vulnerability Context',
    '3.2': 'Q3.2 Prioritization Methodology',
    '3.3': 'Q3.3 Configuration Management and Image Practices',
    '4.1': 'Q4.1 Remediation SLAs and Enforcement',
    '4.2': 'Q4.2 Remediation Capacity, Risk Acceptance, and Compensating Controls',
    '4.3': 'Q4.3 Remediation Workflow and Tooling',
    '5.1': 'Q5.1 VM Team Structure and Ownership',
    '5.2': 'Q5.2 Platform Management Practices',
    '6.1': 'Q6.1 Integration Architecture and Status',
    '6.2': 'Q6.2 Data Consumption and Reporting Workflows',
  }

  return sourceMap[findingId] ?? 'Organizational Context enrichment'
}

interface RecommendationDetail {
  action: string
  why: string
  how: string
}

interface FindingRecommendationPlaybook {
  primaryWhy: string
  primaryHow: string
  confidenceBoosters: string[]
  additionalRecommendations: RecommendationDetail[]
}

interface DemoGuideState {
  active: boolean
  mounted: boolean
  isCalloutDismissed: (id: string) => boolean
  dismissCallout: (id: string) => void
  isAIIndicatorDismissed: (id: number) => boolean
  dismissAIIndicator: (id: number) => void
}

function DemoCallout({
  id,
  text,
  className,
  demoGuide,
}: {
  id: string
  text: string
  className?: string
  demoGuide: DemoGuideState
}) {
  if (!demoGuide.mounted || demoGuide.isCalloutDismissed(id)) return null

  return (
    <div
      className={`absolute z-20 max-w-[320px] rounded border border-[#CE93D8] bg-[#F3E5F5] p-3 text-[13px] leading-5 text-slate-700 shadow transition-opacity duration-300 ${
        demoGuide.active ? 'opacity-100' : 'pointer-events-none opacity-0'
      } ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => demoGuide.dismissCallout(id)}
        className="absolute right-2 top-1 text-xs text-slate-500 hover:text-slate-700"
      >
        X
      </button>
      {text}
    </div>
  )
}

function AIIndicatorCard({
  id,
  text,
  className,
  demoGuide,
}: {
  id: number
  text: string
  className?: string
  demoGuide: DemoGuideState
}) {
  if (!demoGuide.mounted || demoGuide.isAIIndicatorDismissed(id)) return null

  return (
    <div
      className={`absolute z-20 max-w-[320px] rounded border border-[#CE93D8] bg-[#F3E5F5] p-3 text-[13px] leading-5 text-slate-700 shadow transition-opacity duration-300 ${
        demoGuide.active ? 'opacity-100' : 'pointer-events-none opacity-0'
      } ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => demoGuide.dismissAIIndicator(id)}
        className="absolute right-2 top-1 text-xs text-slate-500 hover:text-slate-700"
      >
        X
      </button>
      <p>
        <span className="mr-1 text-[#7B1FA2]">✦</span>
        {text}
      </p>
    </div>
  )
}

function splitSentences(text: string) {
  return (text.match(/[^.!?]+[.!?]?/g) ?? []).map((sentence) => sentence.trim()).filter(Boolean)
}

function normalizeRecommendationBody(body: string, summary: string) {
  const sentences = splitSentences(body)
  if (sentences.length === 0) {
    return `${summary} This recommendation should be treated as a prioritized action for this finding. Define an owner and completion window so progress can be tracked in the next review cycle.`
  }
  if (sentences.length === 1) {
    return `${sentences[0]} This recommendation targets the primary risk pattern highlighted by this finding and should be addressed with clear ownership. Define a completion timeline and success metric so progress is measurable in the next operating review.`
  }
  if (sentences.length === 2) {
    return `${sentences[0]} ${sentences[1]} Define a completion timeline and measurable success criteria so implementation progress can be validated.`
  }
  if (sentences.length > 4) {
    return sentences.slice(0, 4).join(' ')
  }
  return sentences.join(' ')
}

function buildOverflowRecommendation(body: string): RecommendationDetail[] {
  const sentences = splitSentences(body)
  if (sentences.length <= 4) return []
  return [
    {
      action: sentences.slice(4).join(' '),
      why: 'This follow-on action captures additional risk-reduction work identified in this finding.',
      how: 'Plan this as the next execution phase after Recommendation 1, with a named owner and timeline.',
    },
  ]
}

const findingRecommendationPlaybook: Record<string, FindingRecommendationPlaybook> = {
  '1.1': {
    primaryWhy: 'Coverage gaps create unmanaged exposure and incomplete risk reporting.',
    primaryHow:
      'Reconcile asset sources monthly, then execute an onboarding sprint for missing populations with owner accountability.',
    confidenceBoosters: [
      'Validate expected asset totals with CMDB + discovery + cloud inventory.',
      'Document excluded populations with owner and review date.',
    ],
    additionalRecommendations: [
      {
        action: 'Set coverage KPIs by asset tier.',
        why: 'Tiered targets prevent high-value assets from being buried in aggregate percentages.',
        how: 'Define targets for critical/standard assets and track weekly in dashboard reviews.',
      },
      {
        action:
          'The current license count of 12,000 covers assets already in the platform but not the approximately 3,000 additional assets identified through this assessment. Work with your Tenable account team to align licensing with the true environment scope of 15,000 assets.',
        why: 'Full environment coverage requires licensed capacity for every asset.',
        how: 'Compare current license count against the validated environment size from CMDB reconciliation, then request a license adjustment.',
      },
    ],
  },
  '1.2': {
    primaryWhy: 'Unhealthy agents hide failures behind apparent deployment coverage.',
    primaryHow:
      'Monitor check-in and version drift daily, then enforce auto-upgrade and stale-agent remediation workflows.',
    confidenceBoosters: [
      'Validate endpoint denominator with endpoint management tools.',
      'Track 24h check-in and stale percentage by business unit.',
    ],
    additionalRecommendations: [
      {
        action: 'Create agent hygiene SLAs.',
        why: 'Without response targets, stale and broken agents persist unnoticed.',
        how: 'Set time-to-recover targets for offline agents and trigger tickets automatically.',
      },
    ],
  },
  '1.3': {
    primaryWhy: 'Scanner placement and uptime directly determine network visibility.',
    primaryHow:
      'Map scanners to segments, remediate inactive scanners, and implement scanner-health monitoring.',
    confidenceBoosters: [
      'Validate segment ownership and scanner assignment map with network team.',
      'Confirm unreachable segments and compensating controls.',
    ],
    additionalRecommendations: [
      {
        action: 'Implement scanner capacity planning.',
        why: 'Coverage degrades when scanner load or placement does not evolve with the environment.',
        how: 'Review scanner utilization monthly and rebalance scope by segment growth.',
      },
    ],
  },
  '1.4': {
    primaryWhy: 'Weak classification prevents risk-based prioritization and reporting.',
    primaryHow:
      'Define core taxonomy (criticality, environment, compliance), automate assignment, and audit tag quality.',
    confidenceBoosters: [
      'Validate tag accuracy on sampled high-value assets.',
      'Track percentage of untagged assets by domain monthly.',
    ],
    additionalRecommendations: [
      {
        action: 'Align tags to business and compliance owners.',
        why: 'Owner-linked tags improve accountability for remediation and exceptions.',
        how: 'Require owner metadata in tag model and enforce at onboarding time.',
      },
    ],
  },
  '1.5': {
    primaryWhy: 'Cloud asset churn creates short-lived blind spots without reliable connectors.',
    primaryHow:
      'Stabilize connector sync, validate account/scope coverage, and monitor connector freshness.',
    confidenceBoosters: [
      'Cross-check cloud account list against connector coverage weekly.',
      'Alert on stale connector sync beyond defined threshold.',
    ],
    additionalRecommendations: [
      {
        action: 'Add cloud onboarding checklist.',
        why: 'New cloud accounts often launch before security visibility is configured.',
        how: 'Gate new account readiness on connector, tagging, and ownership setup.',
      },
    ],
  },
  '2.1': {
    primaryWhy: 'Unauthenticated scanning materially understates true vulnerability exposure.',
    primaryHow:
      'Improve credential architecture by asset class and track authenticated success by scan profile.',
    confidenceBoosters: [
      'Validate non-credentialable denominator with infrastructure owners.',
      'Measure auth success by platform/segment, not only global average.',
    ],
    additionalRecommendations: [
      {
        action: 'Standardize credential lifecycle process.',
        why: 'Rotation and ownership gaps are common root causes of auth scan failure.',
        how: 'Implement vault-backed credentials, ownership, and expiry alerts.',
      },
    ],
  },
  '2.2': {
    primaryWhy: 'Long scan intervals increase exposure windows for newly disclosed vulnerabilities.',
    primaryHow:
      'Set tiered scan cadence policy and automate monitoring for missed schedules and abandoned configs.',
    confidenceBoosters: [
      'Validate cadence requirements against compliance and asset criticality.',
      'Track missed-execution root causes by scan configuration.',
    ],
    additionalRecommendations: [
      {
        action: 'Introduce scan recency SLA.',
        why: 'Recency targets make scheduling drift visible and actionable.',
        how: 'Define acceptable recency per tier and alert when thresholds are breached.',
      },
    ],
  },
  '2.3': {
    primaryWhy: 'Failed or long-running scans create silent data gaps despite scheduled execution.',
    primaryHow:
      'Implement scan-failure alerting, assign ownership, and tune schedule concurrency/capacity.',
    confidenceBoosters: [
      'Validate failure triage ownership and response-time tracking.',
      'Correlate long-running scans with scanner utilization and overlap windows.',
    ],
    additionalRecommendations: [
      {
        action: 'Define scan operations runbook.',
        why: 'Runbooks reduce mean-time-to-recovery for recurring operational failures.',
        how: 'Document triage paths, escalation points, and success criteria per failure type.',
      },
    ],
  },
  '2.4': {
    primaryWhy: 'Generic policies miss relevant checks or create avoidable operational disruption.',
    primaryHow:
      'Create policy tiers by asset sensitivity and test safely before production rollout.',
    confidenceBoosters: [
      'Validate policy fit with system owners for critical classes.',
      'Track policy exceptions and disruption incidents by template.',
    ],
    additionalRecommendations: [
      {
        action: 'Establish policy governance cadence.',
        why: 'Policy relevance decays as architecture and risk priorities evolve.',
        how: 'Review policy-to-asset alignment quarterly with security and operations.',
      },
    ],
  },
  '2.5': {
    primaryWhy: 'Uncontrolled exclusions create hidden, persistent risk blind spots.',
    primaryHow:
      'Require documented rationale, owner, expiry, and periodic review for each exclusion.',
    confidenceBoosters: [
      'Validate broad exclusions against asset inventories and business need.',
      'Track exclusion age and review completion rate.',
    ],
    additionalRecommendations: [
      {
        action: 'Risk-rank exclusions.',
        why: 'Not all exclusions carry equal risk and should not be treated uniformly.',
        how: 'Score exclusions by scope, criticality, and compensating controls.',
      },
    ],
  },
  '3.1': {
    primaryWhy: 'Landscape volume without risk framing obscures what truly needs action first.',
    primaryHow:
      'Translate exposure into risk views by exploitability, critical assets, and trend direction.',
    confidenceBoosters: [
      'Validate critical asset mapping and ownership in prioritization views.',
      'Confirm leadership risk appetite and exception governance inputs.',
    ],
    additionalRecommendations: [
      {
        action: 'Add executive risk narrative to reporting.',
        why: 'Leadership action depends on clear business framing, not raw counts.',
        how: 'Include top risk drivers, trend delta, and decision-required items each cycle.',
      },
    ],
  },
  '3.2': {
    primaryWhy: 'Prioritization methodology determines whether effort reduces real-world risk.',
    primaryHow:
      'Document criteria, align teams on one model, and compare CVSS vs VPR outcomes routinely.',
    confidenceBoosters: [
      'Validate whether prioritization behavior is deliberate or tool-default driven.',
      'Measure consistency of prioritization across teams and asset classes.',
    ],
    additionalRecommendations: [
      {
        action: 'Pilot VPR-guided queues on selected scopes.',
        why: 'Controlled pilots demonstrate impact before broad workflow change.',
        how: 'Run parallel queues for 4-6 weeks and compare risk-reduction outcomes.',
      },
    ],
  },
  '3.3': {
    primaryWhy: 'Recurrence indicates remediation fixes are not durable.',
    primaryHow:
      'Address root causes in image currency, configuration management, and rebuild pipelines.',
    confidenceBoosters: [
      'Validate recurrence clusters by software family and asset lifecycle.',
      'Correlate recurrence with image update frequency and config automation.',
    ],
    additionalRecommendations: [
      {
        action: 'Implement recurrence post-mortems.',
        why: 'Repeated vulnerabilities require systemic corrective actions, not repeated patching.',
        how: 'Perform monthly RCA on top recurring items and assign durable controls.',
      },
    ],
  },
  '4.1': {
    primaryWhy: 'Long TTR extends known exploitable exposure windows.',
    primaryHow:
      'Measure against defined SLAs, remove workflow bottlenecks, and enforce escalation paths.',
    confidenceBoosters: [
      'Validate SLA definitions and accountability ownership with operations leadership.',
      'Track detection-to-ticket and ticket-to-deploy durations separately.',
    ],
    additionalRecommendations: [
      {
        action: 'Publish remediation velocity scorecard.',
        why: 'Visibility by team/severity drives accountability and sustained improvement.',
        how: 'Report weekly SLA attainment by severity and exception category.',
      },
    ],
  },
  '4.2': {
    primaryWhy: 'If detection outpaces fixes, backlog growth increases risk despite scanning effort.',
    primaryHow:
      'Separate accepted risk from actionable backlog, then align capacity and maintenance windows to demand.',
    confidenceBoosters: [
      'Validate risk-acceptance register quality (approval, expiry, controls).',
      'Confirm staffing and maintenance-window constraints with remediation owners.',
    ],
    additionalRecommendations: [
      {
        action: 'Create capacity planning model.',
        why: 'Fix-rate targets are unattainable without realistic throughput planning.',
        how: 'Model intake vs remediation throughput by severity and team capacity.',
      },
    ],
  },
  '4.3': {
    primaryWhy: 'Effort distribution bias can leave higher-risk vectors under-remediated.',
    primaryHow:
      'Map detection-to-deploy workflow and fix third-party patch process gaps.',
    confidenceBoosters: [
      'Validate effort mix across OS, third-party, and configuration findings.',
      'Confirm ticket handoff latency and change-process constraints.',
    ],
    additionalRecommendations: [
      {
        action: 'Automate ticket creation and status feedback.',
        why: 'Manual handoffs introduce delay and reduce remediation consistency.',
        how: 'Integrate Tenable findings with ITSM triggers and closed-loop status sync.',
      },
    ],
  },
  '5.1': {
    primaryWhy: 'User activity concentration creates key-person and governance risk.',
    primaryHow:
      'Establish shared operating model, role clarity, and cross-training coverage for critical tasks.',
    confidenceBoosters: [
      'Validate stated VM team structure against observed platform activity.',
      'Review inactive admin accounts and role-to-duty alignment.',
    ],
    additionalRecommendations: [
      {
        action: 'Define VM RACI and succession coverage.',
        why: 'Documented ownership reduces execution risk when key individuals are unavailable.',
        how: 'Assign owners/backups for scanning, triage, reporting, and governance tasks.',
      },
    ],
  },
  '5.2': {
    primaryWhy: 'Autopilot operation decouples platform settings from current environment reality.',
    primaryHow:
      'Implement scheduled review cadence for scan configs, targets, and policies with change tracking.',
    confidenceBoosters: [
      'Validate whether claimed review process matches observed change frequency.',
      'Track days since last meaningful configuration update.',
    ],
    additionalRecommendations: [
      {
        action: 'Run quarterly optimization reviews.',
        why: 'Accumulated drift lowers coverage quality and risk-detection value over time.',
        how: 'Review stale configs, deprecated targets, and unused policy settings each quarter.',
      },
    ],
  },
  '6.1': {
    primaryWhy: 'Missing or degraded integrations break the path from detection to response.',
    primaryHow:
      'Map integration architecture, restore stale connections, and implement durable automation patterns.',
    confidenceBoosters: [
      'Validate each service account to a named integration and owner.',
      'Correlate activity regularity with expected integration schedules.',
    ],
    additionalRecommendations: [
      {
        action: 'Prioritize bidirectional ITSM synchronization.',
        why: 'Without feedback, platform views cannot reflect remediation progress accurately.',
        how: 'Implement automated create/update/close synchronization with status mapping.',
      },
    ],
  },
  '6.2': {
    primaryWhy: 'Sporadic manual exports produce stale awareness and inconsistent downstream action.',
    primaryHow:
      'Automate export cadence and align data delivery to stakeholder decision cycles.',
    confidenceBoosters: [
      'Validate who consumes vulnerability data and at what frequency.',
      'Track automation coverage across exports, reports, and SOC workflows.',
    ],
    additionalRecommendations: [
      {
        action: 'Define downstream data contract.',
        why: 'Clear ownership and schema expectations prevent data-flow degradation.',
        how: 'Document fields, refresh interval, recipients, and monitoring for each feed.',
      },
    ],
  },
}

type ParsedFieldType =
  | 'single-select'
  | 'multi-select'
  | 'numeric'
  | 'free-text-short'
  | 'free-text-long'
  | 'table-input'
  | 'dynamic-form'
  | 'unknown'

interface ParsedQuestionField {
  questionText: string
  fieldType: ParsedFieldType
  options: string[]
  conditionTag?: string
}

function parseQuestionField(prompt: string): ParsedQuestionField {
  const parentheticalMatch = prompt.match(/^(.*)\s\(([^()]*)\)\s*$/)
  let rawQuestionText = parentheticalMatch ? parentheticalMatch[1].trim() : prompt

  let conditionTag: string | undefined
  const conditionMatch = rawQuestionText.match(/^\[(If [^\]]+|Condition:\s*[^\]]+)\]\s*/i)
  if (conditionMatch) {
    conditionTag = conditionMatch[1].trim()
    rawQuestionText = rawQuestionText.slice(conditionMatch[0].length).trim()
  }

  if (!parentheticalMatch) {
    return { questionText: rawQuestionText, fieldType: 'unknown', options: [], conditionTag }
  }

  const questionText = rawQuestionText
  const metadata = parentheticalMatch[2].trim()
  const metadataLower = metadata.toLowerCase()

  const splitOptions = (raw: string) =>
    raw
      .split(' / ')
      .map((item) => item.trim())
      .filter(Boolean)

  if (metadataLower.startsWith('single-select:')) {
    return {
      questionText,
      fieldType: 'single-select',
      options: splitOptions(metadata.slice('Single-select:'.length).trim()),
      conditionTag,
    }
  }

  if (metadataLower.startsWith('multi-select:')) {
    return {
      questionText,
      fieldType: 'multi-select',
      options: splitOptions(metadata.slice('Multi-select:'.length).trim()),
      conditionTag,
    }
  }

  if (metadataLower === 'numeric') {
    return { questionText, fieldType: 'numeric', options: [], conditionTag }
  }

  if (metadataLower.startsWith('free-text short')) {
    return { questionText, fieldType: 'free-text-short', options: [], conditionTag }
  }

  if (metadataLower.startsWith('free-text long')) {
    return { questionText, fieldType: 'free-text-long', options: [], conditionTag }
  }

  if (metadataLower.startsWith('table input')) {
    return { questionText, fieldType: 'table-input', options: [], conditionTag }
  }

  if (metadataLower.startsWith('dynamic form:')) {
    return { questionText, fieldType: 'dynamic-form', options: [], conditionTag }
  }

  return { questionText, fieldType: 'unknown', options: [], conditionTag }
}

function getNumericSeed(value: string) {
  const numeric = Number(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function StoryBeatInfo({ storyBeat }: { storyBeat: string }) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{
    top: number
    left: number
    maxWidth: number
    centerOnTrigger: boolean
  }>({
    top: 0,
    left: 0,
    maxWidth: 400,
    centerOnTrigger: true,
  })

  const updatePosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const maxWidth = Math.min(400, viewportWidth - 24)
    const horizontalGap = 10
    const verticalGap = 10

    let left = rect.right + horizontalGap
    let top = rect.top + rect.height / 2
    let centerOnTrigger = true

    if (left + maxWidth > viewportWidth - 12) {
      const leftCandidate = rect.left - maxWidth - horizontalGap
      if (leftCandidate >= 12) {
        left = leftCandidate
      } else {
        left = Math.max(12, Math.min(rect.left + rect.width / 2 - maxWidth / 2, viewportWidth - maxWidth - 12))
        top = rect.bottom + verticalGap
        centerOnTrigger = false
      }
    }

    top = Math.max(12, Math.min(top, viewportHeight - 12))
    setPosition({ top, left, maxWidth, centerOnTrigger })
  }

  useEffect(() => {
    if (!open) return

    const frame = window.requestAnimationFrame(updatePosition)
    const onResizeOrScroll = () => updatePosition()
    const onOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || tooltipRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('resize', onResizeOrScroll)
    window.addEventListener('scroll', onResizeOrScroll, true)
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    document.addEventListener('keydown', onKey)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResizeOrScroll)
      window.removeEventListener('scroll', onResizeOrScroll, true)
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Show finding importance"
        className="inline-flex h-4 w-4 -translate-y-2 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] leading-none text-[#666666] transition-colors hover:text-[#2E75B6]"
        style={{ fontFamily: 'cursive' }}
      >
        i
      </button>
      {open && (
        <div
          ref={tooltipRef}
          className="fixed z-40 rounded-md border border-[#E0E0E0] bg-white p-4 text-[14px] text-slate-700 shadow-lg"
          style={{
            top: position.top,
            left: position.left,
            maxWidth: `${position.maxWidth}px`,
            transform: position.centerOnTrigger ? 'translateY(-50%)' : 'none',
            animation: 'storyBeatFadeIn 150ms ease-out',
          }}
        >
          {storyBeat}
        </div>
      )}
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence: 'Low' | 'Medium' | 'High' }) {
  return (
    <span className="group relative inline-flex">
      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        Confidence: {confidence}
      </span>
      <span className="pointer-events-none invisible absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-md border border-[#E0E0E0] bg-white p-2 text-[12px] text-slate-700 opacity-0 shadow-md transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
        Confidence indicates how reliable this finding is based on the quality and completeness
        of evidence. It increases when data from the environment is complete and healthy, context
        inputs are relevant and validated, advanced analysis is present, and assumptions are
        documented. Confidence is not severity or score.
      </span>
    </span>
  )
}

function EnrichmentPreviewBox({
  questionId,
  onOpenFinding,
}: {
  questionId: string
  onOpenFinding: (findingId: string, anchorId?: string) => void
}) {
  const preview = enrichmentPreviewByQuestionId[questionId]
  if (!preview) return null

  return (
    <div className="rounded-lg border border-green-200 bg-[#E8F5E9] p-4">
      <p className="text-sm text-slate-700">
        <span className="font-semibold">Context impact preview:</span> {preview.message}
      </p>
      <button
        type="button"
        onClick={() => onOpenFinding(preview.findingId)}
        className="mt-2 text-sm font-medium text-[#2E75B6] hover:text-[#1B3A5C]"
      >
        Open Finding {preview.findingId} detail
      </button>
    </div>
  )
}

function responseAsList(response: string | string[] | undefined) {
  if (!response) return []
  return Array.isArray(response) ? response : [response]
}

function responseAsText(response: string | string[] | undefined) {
  if (!response) return ''
  return Array.isArray(response) ? response.join(' ') : response
}

function isAffirmativeResponse(response: string | string[] | undefined) {
  const text = responseAsText(response).toLowerCase().trim()
  if (!text) return false
  if (
    text.includes('no') &&
    !text.includes('not sure') &&
    !text.includes('none') &&
    !text.includes('not tracked')
  ) {
    return false
  }
  return (
    text.includes('yes') ||
    text.includes('both') ||
    text.includes('formal') ||
    text.includes('documented') ||
    text.includes('integrated') ||
    text.includes('extensive') ||
    text.includes('extensively') ||
    text.includes('limited') ||
    text.includes('partial') ||
    text.includes('partially') ||
    text.includes('ad-hoc') ||
    text.includes('ad hoc')
  )
}

function hasMeaningfulSelection(response: string | string[] | undefined) {
  const values = responseAsList(response)
  if (values.length === 0) return false
  return values.some((value) => value.toLowerCase() !== 'none' && value.trim() !== '')
}

function App() {
  const [role, setRole] = useState<UserRole>('customer')
  const [screen, setScreen] = useState<ScreenKey>('dashboard')
  const [activeDomainId, setActiveDomainId] = useState('d1')
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null)
  const [pendingFindingAnchorId, setPendingFindingAnchorId] = useState<string | null>(null)
  const [demoGuideActive, setDemoGuideActive] = useState(false)
  const [demoGuideMounted, setDemoGuideMounted] = useState(false)
  const [dismissedCallouts, setDismissedCallouts] = useState<Record<string, boolean>>({})
  const [dismissedAIIndicators, setDismissedAIIndicators] = useState<Record<number, boolean>>({})
  const [seenHints, setSeenHints] = useState<Record<string, boolean>>({})
  const [dismissedHints, setDismissedHints] = useState<Record<string, boolean>>({})
  const [activeHintId, setActiveHintId] = useState<string | null>(null)
  const wasGuideActive = useRef(false)
  const toggleDemoGuide = () => setDemoGuideActive((prev) => !prev)
  const [pendingQuestionnaireQuestionId, setPendingQuestionnaireQuestionId] = useState<string | null>(
    null,
  )
  const [pendingQuestionnaireDomainId, setPendingQuestionnaireDomainId] = useState<
    'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | null
  >(null)
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireState>(defaultQuestionnaire)
  const [interviewResponses, setInterviewResponses] =
    useState<InterviewResponseMap>(defaultInterviewResponses)
  const [observationResponses, setObservationResponses] =
    useState<ObservationResponseMap>(defaultObservationResponses)
  const [closingResponses, setClosingResponses] =
    useState<ClosingResponseMap>(defaultClosingResponses)
  const highestOverallScore = Math.max(
    meridianData.overallScoreBaseline,
    meridianData.overallScoreWithContext,
  )
  const highestOverallScoreColor = getScoreColor(highestOverallScore)

  const demoGuide: DemoGuideState = {
    active: demoGuideActive,
    mounted: demoGuideMounted,
    isCalloutDismissed: (id) => Boolean(dismissedCallouts[id]),
    dismissCallout: (id) => setDismissedCallouts((prev) => ({ ...prev, [id]: true })),
    isAIIndicatorDismissed: (id) => Boolean(dismissedAIIndicators[id]),
    dismissAIIndicator: (id) => setDismissedAIIndicators((prev) => ({ ...prev, [id]: true })),
  }

  useEffect(() => {
    if (demoGuideActive) {
      setDemoGuideMounted(true)
      return
    }
    const timer = window.setTimeout(() => setDemoGuideMounted(false), 300)
    return () => window.clearTimeout(timer)
  }, [demoGuideActive])

  useEffect(() => {
    if (demoGuideActive && !wasGuideActive.current) {
      setDismissedCallouts({})
      setDismissedAIIndicators({})
      setSeenHints({})
      setDismissedHints({})
      setActiveHintId(null)
    }
    wasGuideActive.current = demoGuideActive
  }, [demoGuideActive])

  const hintCopy: Record<string, string> = {
    dashboard:
      'Explore the domain score cards below. Click any domain to see its findings. Then try the role toggle (top right) to switch between Customer and Consultant views.',
    'finding-three-layer':
      'This finding shows all three assessment layers: automated data (Layer 1), organizational context (Layer 2), and consultant analysis (Layer 3). Look for the collapsible Supporting Interview Evidence in Layer 3 to trace consultant conclusions back to the interview.',
    'finding-customer-value':
      "The teal 'Potential Consultant Value' message at the bottom is data-driven, not generic marketing. It describes the specific action a consultant would take based on this finding's data.",
    questionnaire:
      'This is an interactive section. Try changing the Expected Environment Size value and watch the coverage metrics recalculate in the finding. This demonstrates how organizational context transforms automated findings.',
    interview:
      "Click through all 5 sections: Context, Finding-triggered questions, Pattern-triggered questions, Observation prompts, and Closing prompts. Look for pre-populated answers with 'Used in:' links that trace interview notes to specific annotations and custom findings in the assessment.",
    report:
      "This is the consultant's deliverable preview. Scroll through all sections: Executive Summary, Score Dashboard, Domain Findings, Consultant Annotations, Consultant Findings, and Prioritized Roadmap. Each section demonstrates a different aspect of the report generation capability.",
    engagement:
      "This is the consultant's workspace. The Pre-Engagement Briefing at the bottom was auto-generated from assessment data before the consultant met the customer. This is one of the highest-value features for consultant preparation.",
    expansion:
      'This entire page is invisible in Customer View. It surfaces product expansion signals for the consultant\'s account planning. Notice how signal strength varies from Strong to Exploratory, and how each signal includes a specific conversation approach.',
  }

  useEffect(() => {
    if (!demoGuideActive) {
      setActiveHintId(null)
      return
    }

    const candidateHintId = (() => {
      if (screen === 'dashboard') return 'dashboard'
      if (screen === 'findings' && activeFindingId) {
        if (role === 'customer' && !seenHints['finding-customer-value']) return 'finding-customer-value'
        return 'finding-three-layer'
      }
      if (screen === 'questionnaire') return 'questionnaire'
      if (screen === 'interview-guide') return 'interview'
      if (screen === 'report') return 'report'
      if (screen === 'engagement' && role === 'consultant') return 'engagement'
      if (screen === 'expansion-opportunities' && role === 'consultant') return 'expansion'
      return null
    })()

    if (!candidateHintId || seenHints[candidateHintId] || dismissedHints[candidateHintId]) {
      setActiveHintId(null)
      return
    }

    setActiveHintId(candidateHintId)
    setSeenHints((prev) => ({ ...prev, [candidateHintId]: true }))
  }, [demoGuideActive, screen, role, activeFindingId, seenHints, dismissedHints])

  const visibleNav = useMemo(() => {
    const filtered = navItems.filter((item) => !item.consultantOnly || role === 'consultant')
    return filtered
  }, [role])

  const criticalFindings = useMemo(
    () =>
      [...meridianData.findings]
        .sort((a, b) => a.score - b.score)
        .slice(0, 5),
    [],
  )

  useEffect(() => {
    if (
      role === 'customer' &&
      (screen === 'engagement' ||
        screen === 'interview-guide' ||
        screen === 'expansion-opportunities')
    ) {
      setScreen('dashboard')
    }
  }, [role, screen])

  const openDomain = (domainId: string) => {
    setActiveDomainId(domainId)
    setActiveFindingId(null)
    setScreen('findings')
  }

  const openFinding = (findingId: string, anchorId?: string) => {
    const finding = meridianData.findings.find((item) => item.id === findingId)
    if (!finding) {
      const questionnaireOnlyFinding = meridianData.questionnaireOnlyFindings.find(
        (item) => item.id === findingId,
      )
      if (questionnaireOnlyFinding) {
        const domainNumber = questionnaireOnlyFinding.id.split('.')[0].replace('Q', '')
        if (['1', '2', '3', '4', '5', '6'].includes(domainNumber)) {
          setActiveDomainId(`d${domainNumber}`)
        }
        setActiveFindingId(null)
        setPendingFindingAnchorId(null)
        setScreen('findings')
      }
      return
    }
    setActiveDomainId(finding.domainId)
    setActiveFindingId(finding.id)
    setPendingFindingAnchorId(anchorId ?? null)
    setScreen('findings')
  }

  const openReportSection = (sectionId: string) => {
    setActiveFindingId(null)
    setScreen('report')
    window.setTimeout(() => {
      const target = document.getElementById(sectionId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 80)
  }

  const openQuestionnaireQuestion = (
    domainId: 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6',
    questionAnchorId: string,
  ) => {
    setPendingQuestionnaireDomainId(domainId)
    setPendingQuestionnaireQuestionId(questionAnchorId)
    setScreen('questionnaire')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex w-full flex-wrap items-center gap-4 md:flex-nowrap">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[#1B3A5C]">
                Tenable Vulnerability Management HealthCheck
              </h1>
              <div className="mt-1 flex items-center gap-3">
                <p className="text-[21px] text-slate-600">{meridianData.companyName} (Demo)</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Overall Maturity
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-0.5 text-sm font-semibold text-white"
                    style={{
                      backgroundColor: highestOverallScoreColor,
                      borderColor: highestOverallScoreColor,
                    }}
                  >
                    {highestOverallScore.toFixed(1)}/5.0
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-1 justify-center">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '13px',
                    color: '#666666',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Demo Guide
                </span>
                <button
                  onClick={toggleDemoGuide}
                  style={{
                    position: 'relative',
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: demoGuideActive ? '#7B1FA2' : '#D1D5DB',
                    transition: 'background-color 200ms ease',
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: demoGuideActive ? '22px' : '2px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      transition: 'left 200ms ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </button>
              </div>
            </div>

            <div className="relative ml-auto">
              <div className="flex items-center gap-3 rounded-md bg-white p-1">
                <span className="rounded bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  View
                </span>
                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-all ${
                    role === 'customer'
                      ? 'bg-[#2E75B6] text-white shadow'
                      : 'bg-[#EAF4FF] text-slate-700 hover:bg-[#dcecff] hover:text-slate-900'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('consultant')}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-all ${
                    role === 'consultant'
                      ? 'bg-[#2E75B6] text-white shadow'
                      : 'bg-[#EAF4FF] text-slate-700 hover:bg-[#dcecff] hover:text-slate-900'
                  }`}
                >
                  Consultant
                </button>
              </div>
              <DemoCallout
                id="callout-role-toggle"
                demoGuide={demoGuide}
                className="-left-80 top-14"
                text="Switch between Customer View and Consultant View. Customer View shows the assessment with Consultant Value Indicators. Consultant View reveals the Interview Guide, Engagement workspace, and Expansion Opportunities. Advanced Analysis content appears read-only in Customer View and editable in Consultant View."
              />
            </div>
          </div>

          <nav className="mt-4 flex flex-nowrap gap-2 overflow-x-auto pb-1">
            {visibleNav.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setScreen(item.key)
                  if (item.key !== 'findings') {
                    setActiveFindingId(null)
                  }
                }}
                className={`${role === 'consultant' && item.key === 'expansion-opportunities' ? 'ml-auto ' : ''}rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  screen === item.key
                    ? 'border-[#2E75B6] bg-[#2E75B6] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

        </div>
      </header>

      {demoGuideMounted && activeHintId && (
        <div
          className={`border-y border-[#CE93D8] bg-[#F3E5F5] px-6 py-2 text-center text-[13px] text-slate-700 transition-opacity duration-300 ${
            demoGuideActive ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
            <span>{hintCopy[activeHintId]}</span>
            <button
              type="button"
              onClick={() => {
                setDismissedHints((prev) => ({ ...prev, [activeHintId]: true }))
                setActiveHintId(null)
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              X
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-6">
        {screen === 'dashboard' ? (
          <Dashboard
            role={role}
            criticalFindings={criticalFindings}
            onOpenDomain={openDomain}
            onOpenFinding={openFinding}
            demoGuide={demoGuide}
          />
        ) : screen === 'findings' ? (
          <FindingsWorkspace
            role={role}
            activeDomainId={activeDomainId}
            activeFindingId={activeFindingId}
            questionnaire={questionnaire}
            interviewResponses={interviewResponses}
            observationResponses={observationResponses}
            pendingFindingAnchorId={pendingFindingAnchorId}
            onConsumePendingFindingAnchor={() => setPendingFindingAnchorId(null)}
            onOpenReportSection={openReportSection}
            onChangeInterviewResponse={(findingId, value) =>
              setInterviewResponses((prev) => ({ ...prev, [findingId]: value }))
            }
            onChangeObservationResponse={(promptId, value) =>
              setObservationResponses((prev) => ({ ...prev, [promptId]: value }))
            }
            onOpenDomain={openDomain}
            onOpenFinding={openFinding}
            onBackToDomain={() => setActiveFindingId(null)}
            demoGuide={demoGuide}
          />
        ) : screen === 'questionnaire' ? (
          <QuestionnaireScreen
            questionnaire={questionnaire}
            onChange={setQuestionnaire}
            onOpenFinding={openFinding}
            pendingQuestionnaireQuestionId={pendingQuestionnaireQuestionId}
            pendingQuestionnaireDomainId={pendingQuestionnaireDomainId}
            onConsumePendingQuestionnaireFocus={() => {
              setPendingQuestionnaireQuestionId(null)
              setPendingQuestionnaireDomainId(null)
            }}
            demoGuide={demoGuide}
          />
        ) : screen === 'engagement' ? (
          <EngagementOverviewScreen
            demoGuide={demoGuide}
            onOpenInterviewGuide={() => setScreen('interview-guide')}
          />
        ) : screen === 'expansion-opportunities' ? (
          <ExpansionOpportunitiesScreen
            onOpenFinding={openFinding}
            onOpenFindingAnchor={openFinding}
            onOpenReportSection={openReportSection}
            onOpenQuestionnaireQuestion={openQuestionnaireQuestion}
            demoGuide={demoGuide}
          />
        ) : screen === 'interview-guide' ? (
          <InterviewGuideScreen
            interviewResponses={interviewResponses}
            observationResponses={observationResponses}
            closingResponses={closingResponses}
            onOpenFindingAnchor={openFinding}
            onOpenReportSection={openReportSection}
            onChangeInterviewResponse={(findingId, value) =>
              setInterviewResponses((prev) => ({ ...prev, [findingId]: value }))
            }
            onChangeObservationResponse={(promptId, value) =>
              setObservationResponses((prev) => ({ ...prev, [promptId]: value }))
            }
            onChangeClosingResponse={(promptId, value) =>
              setClosingResponses((prev) => ({ ...prev, [promptId]: value }))
            }
            demoGuide={demoGuide}
          />
        ) : screen === 'report' ? (
          <ReportPreviewScreen role={role} onOpenFinding={openFinding} demoGuide={demoGuide} />
        ) : (
          <PlaceholderScreen screen={screen} role={role} />
        )}
      </main>
    </div>
  )
}

function Dashboard({
  role,
  criticalFindings,
  onOpenDomain,
  onOpenFinding,
  demoGuide,
}: {
  role: UserRole
  criticalFindings: typeof meridianData.findings
  onOpenDomain: (domainId: string) => void
  onOpenFinding: (findingId: string, anchorId?: string) => void
  demoGuide: DemoGuideState
}) {
  const domainChartData = meridianData.domainScores.map((domain) => ({
    ...domain,
    fill: getScoreColor(domain.score),
  }))

  const coverageConfidence = [
    { quadrant: 'Covered + Authenticated', assets: 7050, coverage: 85, authentication: 82 },
    { quadrant: 'Covered + Unauthenticated', assets: 3200, coverage: 65, authentication: 45 },
    { quadrant: 'Known + Unscanned', assets: 1597, coverage: 35, authentication: 42 },
    { quadrant: 'Outside Visibility', assets: 3150, coverage: 20, authentication: 12 },
  ]

  const riskReductionEfficiency = [
    { finding: '4.1 Velocity', effort: 78, impact: 92 },
    { finding: '2.5 Exclusions', effort: 42, impact: 70 },
    { finding: '3.2 VPR Adoption', effort: 28, impact: 84 },
    { finding: '1.4 Tagging', effort: 58, impact: 66 },
    { finding: '6.1 Integration', effort: 83, impact: 88 },
  ]

  const operationalMaturity = meridianData.domainScores.map((d) => ({
    subject: d.name,
    value: d.score,
    fullMark: 5,
  }))

  return (
    <div className="space-y-6">
      <section className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1B3A5C]">Domain Score Cards</h2>
        <p className="mt-1 text-sm text-slate-600">
          Start your exploration here. Each card opens the domain detail view with findings and progression guidance.
        </p>
        <DemoCallout
          id="callout-dashboard-domain-score-cards"
          demoGuide={demoGuide}
          className="right-3 top-3"
          text="Each card represents one of six assessment domains. Click any card to see the findings within that domain. Domains 5 and 6 score lowest because they receive limited data from the API alone and depend heavily on questionnaire input for full assessment."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {domainChartData.map((domain) => (
            <button
              key={domain.id}
              type="button"
              onClick={() => onOpenDomain(domain.id)}
              className="rounded-lg border border-slate-200 p-3 text-left transition hover:border-[#2E75B6] hover:shadow-sm"
            >
              <p className="text-sm font-semibold text-slate-900">{domain.name}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Domain score</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: domain.fill }}
                >
                  {domain.score.toFixed(1)}
                </span>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={domainChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
              <Tooltip />
              <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                {domainChartData.map((entry) => (
                  <Cell key={entry.id} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-1">
        <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1B3A5C]">Critical Findings Summary</h2>
          <p className="mt-1 text-sm text-slate-600">
            These are the highest-priority findings for Meridian. Open any item to view three-layer analysis.
          </p>
          <DemoCallout
            id="callout-dashboard-critical-findings"
            demoGuide={demoGuide}
            className="right-3 top-3"
            text="The top findings by impact, each linking to its full detail view. These are the findings the viewer should explore first to understand the assessment depth."
          />
          <div className="mt-4 space-y-3">
            {criticalFindings.map((finding) => (
              <div
                key={finding.id}
                className="rounded-lg border border-slate-200 p-3 transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {finding.id} — {finding.title}
                    </p>
                    <p className="text-sm text-slate-600">{finding.summary}</p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-sm font-semibold text-white"
                    style={{ backgroundColor: getScoreColor(finding.score) }}
                  >
                    Score {finding.score.toFixed(1)}
                  </span>
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => onOpenFinding(finding.id)}
                    className="text-sm font-medium text-[#2E75B6] hover:text-[#1B3A5C]"
                  >
                    Open finding detail screen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1B3A5C]">Operational Maturity Indicator</h2>
          <DemoCallout
            id="callout-dashboard-overall-score"
            demoGuide={demoGuide}
            className="right-3 top-3"
            text="The overall maturity score combines all 6 domains on a 1-5 scale. The two numbers (2.6 and 2.8) show the score before and after Organizational Context enrichment. The 0.2-point improvement demonstrates how questionnaire input elevates the assessment."
          />
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={operationalMaturity}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar dataKey="value" fill="#2E75B6" fillOpacity={0.4} stroke="#1B3A5C" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1B3A5C]">Coverage-Authentication Matrix</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 24 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="coverage"
                  name="Coverage"
                  unit="%"
                  domain={[0, 100]}
                  ticks={[20, 40, 60, 80, 100]}
                  label={{ value: 'Coverage', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  type="number"
                  dataKey="authentication"
                  name="Authentication"
                  unit="%"
                  domain={[0, 100]}
                  ticks={[20, 40, 60, 80, 100]}
                  width={48}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null
                    const point = payload[0].payload as {
                      quadrant: string
                      coverage: number
                      authentication: number
                      assets: number
                    }
                    return (
                      <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow">
                        <p className="font-semibold text-slate-900">{point.quadrant}</p>
                        <p className="text-slate-700">Coverage: {point.coverage}%</p>
                        <p className="text-slate-700">Authentication: {point.authentication}%</p>
                        <p className="text-slate-500">Assets: {point.assets.toLocaleString()}</p>
                      </div>
                    )
                  }}
                />
                <Scatter data={coverageConfidence} fill="#2E75B6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Points represent Coverage and Authentication clusters for Meridian asset populations.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1B3A5C]">Risk Reduction Efficiency</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="effort"
                  name="Implementation Effort"
                  unit="%"
                  domain={[0, 100]}
                  ticks={[20, 40, 60, 80, 100]}
                />
                <YAxis
                  type="number"
                  dataKey="impact"
                  name="Risk Reduction Impact"
                  unit="%"
                  domain={[0, 100]}
                  ticks={[20, 40, 60, 80, 100]}
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={riskReductionEfficiency} fill="#2E75B6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Findings in the upper-left quadrant are strongest near-term opportunities.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        {role === 'customer' ? (
          <div className="relative rounded-xl border border-teal-200 bg-[#E0F2F1] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#1B3A5C]">Consultant Engagement Summary</h2>
            <DemoCallout
              id="callout-dashboard-engagement-summary"
              demoGuide={demoGuide}
              className="right-3 top-3"
              text="This section appears only in Customer View. It recommends an engagement model (Validation, Guided Assessment, or Strategic Advisory) based on the customer's findings. It communicates consultant value through specific, data-driven messaging rather than generic marketing."
            />
            <AIIndicatorCard
              id={7}
              demoGuide={demoGuide}
              className="right-3 top-36"
              text="AI-refined in production. Currently a heuristic that recommends Validation, Guided Assessment, or Strategic Advisory based on finding count and complexity. AI would produce a more nuanced recommendation considering the full assessment picture, industry context, and organizational maturity indicators."
            />
            <p className="mt-3 text-sm text-slate-700">
              Meridian has 20 baseline findings, with high-impact opportunity in remediation
              velocity, scan exclusions governance, and integration maturity. Recommended model:
              Guided Assessment (3-5 days).
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Top value area: remediation bottleneck analysis and workflow redesign.</li>
              <li>Top value area: exclusion governance and credential architecture hardening.</li>
              <li>Top value area: ITSM/SIEM integration for operationalization.</li>
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-orange-200 bg-[#FFF3E0] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#1B3A5C]">Consultant Tools Preview</h2>
            <p className="mt-3 text-sm text-slate-700">
              In consultant mode, annotations, overrides, and custom findings are editable in the
              dedicated findings and engagement screens.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Add Annotation', 'Override Score', 'Add Custom Finding', 'Generate Report'].map(
                (label) => (
                  <ProductionButton key={label} label={label} />
                ),
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function FindingsWorkspace({
  role,
  activeDomainId,
  activeFindingId,
  questionnaire,
  interviewResponses,
  observationResponses,
  pendingFindingAnchorId,
  onConsumePendingFindingAnchor,
  onOpenReportSection,
  onChangeInterviewResponse,
  onChangeObservationResponse,
  onOpenDomain,
  onOpenFinding,
  onBackToDomain,
  demoGuide,
}: {
  role: UserRole
  activeDomainId: string
  activeFindingId: string | null
  questionnaire: QuestionnaireState
  interviewResponses: InterviewResponseMap
  observationResponses: ObservationResponseMap
  pendingFindingAnchorId: string | null
  onConsumePendingFindingAnchor: () => void
  onOpenReportSection: (sectionId: string) => void
  onChangeInterviewResponse: (findingId: keyof InterviewResponseMap, value: string) => void
  onChangeObservationResponse: (promptId: keyof ObservationResponseMap, value: string) => void
  onOpenDomain: (domainId: string) => void
  onOpenFinding: (findingId: string) => void
  onBackToDomain: () => void
  demoGuide: DemoGuideState
}) {
  const domain = meridianData.domainScores.find((item) => item.id === activeDomainId)
  const finding = activeFindingId
    ? meridianData.findings.find((item) => item.id === activeFindingId)
    : null

  if (!domain) return null

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Domain Selector</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {meridianData.domainScores.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpenDomain(item.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                item.id === activeDomainId
                  ? 'border-[#2E75B6] bg-[#2E75B6] text-white'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      {finding ? (
        <FindingDetailView
          role={role}
          findingId={finding.id}
          questionnaire={questionnaire}
          interviewResponses={interviewResponses}
          observationResponses={observationResponses}
          pendingFindingAnchorId={pendingFindingAnchorId}
          onConsumePendingFindingAnchor={onConsumePendingFindingAnchor}
          onOpenFinding={onOpenFinding}
          onOpenReportSection={onOpenReportSection}
          onChangeInterviewResponse={onChangeInterviewResponse}
          onChangeObservationResponse={onChangeObservationResponse}
          onBack={onBackToDomain}
          demoGuide={demoGuide}
        />
      ) : (
        <DomainDetailView domainId={domain.id} onOpenFinding={onOpenFinding} />
      )}
    </div>
  )
}

function DomainDetailView({
  domainId,
  onOpenFinding,
}: {
  domainId: string
  onOpenFinding: (findingId: string) => void
}) {
  const domain = meridianData.domainScores.find((item) => item.id === domainId)
  const findings = meridianData.findings.filter((item) => item.domainId === domainId)
  const customFindings = meridianData.customFindings.filter((item) => item.domainId === domainId)
  const contextAvailableByFindingId: Record<string, boolean> = {
    '1.1': true,
    '1.2': true,
    '1.3': true,
    '1.4': true,
    '1.5': true,
    '2.1': true,
    '2.2': true,
    '2.3': true,
    '2.4': true,
    '2.5': true,
    '3.1': true,
    '3.2': true,
    '3.3': true,
    '4.1': true,
    '4.2': true,
    '4.3': true,
    '5.1': true,
    '5.2': true,
    '6.1': true,
    '6.2': true,
  }

  if (!domain) return null

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Domain Detail</p>
          <h2 className="text-2xl font-semibold text-[#1B3A5C]">
            {domain.name}
          </h2>
        </div>
        <span
          className="rounded-full px-3 py-1 text-sm font-semibold text-white"
          style={{ backgroundColor: getScoreColor(domain.score) }}
        >
          Domain Score {domain.score.toFixed(1)}
        </span>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Findings in this domain</h3>
        {findings.map((finding) => (
          <button
            key={finding.id}
            type="button"
            onClick={() => onOpenFinding(finding.id)}
            className="w-full rounded-lg border border-slate-200 p-4 text-left transition hover:border-[#2E75B6] hover:shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {finding.id} - {finding.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">{finding.summary}</p>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceBadge confidence={finding.confidence} />
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: getScoreColor(finding.score) }}
                >
                  {finding.score.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-800">
                Organizational Context:{' '}
                {contextAvailableByFindingId[finding.id] ? 'Available' : 'Not available'}
              </span>
              {(meridianData.annotations.some((item) => item.findingId === finding.id) ||
                meridianData.scoreOverride.findingId === finding.id ||
                customFindings.length > 0) && (
                <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-800">
                  Advanced Analysis: Available
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function FindingDetailView({
  role,
  findingId,
  questionnaire,
  interviewResponses,
  observationResponses,
  pendingFindingAnchorId,
  onConsumePendingFindingAnchor,
  onOpenFinding,
  onOpenReportSection,
  onChangeInterviewResponse,
  onChangeObservationResponse,
  onBack,
  demoGuide,
}: {
  role: UserRole
  findingId: string
  questionnaire: QuestionnaireState
  interviewResponses: InterviewResponseMap
  observationResponses: ObservationResponseMap
  pendingFindingAnchorId: string | null
  onConsumePendingFindingAnchor: () => void
  onOpenFinding: (findingId: string) => void
  onOpenReportSection: (sectionId: string) => void
  onChangeInterviewResponse: (findingId: keyof InterviewResponseMap, value: string) => void
  onChangeObservationResponse: (promptId: keyof ObservationResponseMap, value: string) => void
  onBack: () => void
  demoGuide: DemoGuideState
}) {
  const finding = meridianData.findings.find((item) => item.id === findingId)
  const annotations = meridianData.annotations.filter((item) => item.findingId === findingId)
  const override = meridianData.scoreOverride.findingId === findingId ? meridianData.scoreOverride : null

  const contextLayerMap: Record<
    string,
    { headline: string; detail: string; original: string; enriched: string }
  > = {
    '1.1': {
      headline: '3,150 assets are completely invisible to the vulnerability management program',
      detail:
        'The expected environment is 15,000 assets. Tenable tracks 11,847. After removing approximately 800 intentionally excluded OT/ICS assets, the remaining gap is roughly 3,150 systems that should be scanned but are not. These are not assets someone decided to exclude. They are assets no one accounted for. Every one of them could harbor critical vulnerabilities that will never appear in a report.',
      original:
        'Coverage: 78% of tracked assets scanned in 30 days. 11,847 assets in platform. Stale asset ratio: 8%. Assessment: coverage appears acceptable.',
      enriched: '',
    },
    '1.2': {
      headline: '3,200 managed endpoints have no vulnerability coverage',
      detail:
        'The endpoint management platform tracks 11,400 endpoints. Only 8,200 have Nessus Agents. That is 3,200 systems the organization actively manages, patches through SCCM and Jamf, and considers part of its infrastructure, but has no vulnerability data for. Agent deployment is managed independently of the endpoint tools, so every new endpoint provisioned through Intune or SCCM enters the environment without an agent unless someone manually installs one.',
      original:
        'Agents deployed: 8,200. Check-in rate (24h): 87%. Outdated versions: 12%. Ungrouped: 340. Assessment: agent health appears acceptable.',
      enriched: '',
    },
    '1.3': {
      headline: 'Two network segments including a partner-facing DMZ have no scanning capability',
      detail:
        'The organization operates 14 distinct network segments. Six scanners cover 12 of them. Two segments have no scanner and no agent coverage: a partner-facing DMZ zone where external vendors connect, and a secondary data center network segment. The partner DMZ is particularly concerning because it is an external-facing boundary with no vulnerability visibility. The inactive scanner identified in the Automated Baseline serves a decommissioned lab and can be deprovisioned.',
      original:
        'Scanners: 6, all online. Networks without scanners: 2. 1 scanner inactive for 45 days. Assessment: functional with minor gaps.',
      enriched:
        'Network coverage: 12 of 14 segments (86%). Uncovered: partner-facing DMZ and secondary data center. Inactive scanner serves decommissioned lab (can be removed). Assessment: external-facing boundary has zero visibility.',
    },
    '1.4': {
      headline: 'PCI-scoped and SOX-relevant assets are indistinguishable from the general population',
      detail:
        'PCI DSS and SOX compliance require specific assets to be identified, scanned with appropriate policies, and reported on separately. The organization has approximately 1,200 PCI-scoped assets and an undetermined number of SOX-relevant financial systems. None of these are tagged or classifiable in Tenable. Current tags (environment, OS, location) serve basic organization but do not support compliance reporting, risk-based prioritization, or targeted scanning for regulated systems.',
      original:
        'Tag categories: 3 (environment, OS, location). Assets tagged: 41%. Automatic tagging rules: none. ACR: all defaults. Assessment: low-maturity but provides basic structure.',
      enriched:
        'Tags mapping to regulatory scope: zero. Tags mapping to business criticality: zero. PCI-scoped assets (~1,200) and SOX systems: unidentifiable in Tenable. Assessment: classification cannot support compliance obligations.',
    },
    '1.5': {
      headline: '800 Azure instances are unmonitored due to a 6-day connector outage',
      detail:
        'The organization runs approximately 2,800 cloud instances: 2,000 in AWS and 800 in Azure. The AWS connector is functioning normally. The Azure connector has not synced in 6 days. With IaC and auto-scaling provisioning, new Azure instances deployed in the last 6 days are invisible to Tenable. Instances that were launched and terminated within that window were never scanned at all. The longer the outage persists, the wider the gap.',
      original:
        'AWS connector: syncing normally. Azure connector: last sync 6 days ago. Assessment: partially functional with one staleness concern.',
      enriched: '',
    },
    '2.1': {
      headline: 'Achievable auth rate is 85%, not 61%: the gap is narrower than it appeared',
      detail:
        'The raw 61% rate includes approximately 28% of assets that are network devices where credentialed scanning is not technically possible. Removing these from the denominator, the achievable rate is 85%. The real gap is not a widespread credential problem. It is a small number of network scan configurations that either lack credentials for credentialable systems or use ad-hoc shared accounts that intermittently fail. The problem is smaller and more actionable than the raw number suggests.',
      original:
        'Auth scan rate: 61%. Below 85% recommended threshold. Scan configs without credentials: 4. Assessment: significant data quality concern.',
      enriched: '',
    },
    '2.2': {
      headline: "34% of critical assets violate the organization's own weekly scanning policy",
      detail:
        "The organization requires weekly scanning for Tier 1 critical infrastructure and monthly for the general environment. Against this policy, 34% of Tier 1 assets were last scanned over 21 days ago. This is not a gap against industry best practices. It is a violation of the organization's own documented requirements. The 3 missed scan executions in 90 days disproportionately affected Tier 1 targets, compounding the recency problem for the assets that matter most.",
      original:
        'Assets scanned within 14 days: 72%. Missed scans in 90 days: 3. Abandoned configs: 1. Assessment: moderate against industry benchmarks.',
      enriched: '',
    },
    '2.3': {
      headline: 'Scan failures go undetected for a full scan cycle because no one is watching',
      detail:
        'The 91% success rate is not the problem. The problem is that when the 9% fails, no one knows. Scan results are reviewed periodically, not monitored in real time. Failure investigation is ad-hoc with no assigned owner. When the chronic failure scan failed 4 of 5 recent cycles, no alert fired, no ticket was created, and no one investigated until a quarterly review surfaced it. Meanwhile, three scanners routinely run concurrent scans, explaining the long execution times.',
      original:
        'Scan success rate: 91%. Chronic failure scans: 1 (failed 4 of last 5). Scans exceeding 18 hours: 2. Assessment: functional with isolated operational issues.',
      enriched:
        'Scan failure monitoring: none. Failure investigation ownership: no one assigned. Average failure detection time: one full scan cycle. Assessment: systemic monitoring and ownership gap.',
    },
    '2.4': {
      headline: 'Default scan policies are inappropriate for regulated systems and have already disrupted production',
      detail:
        'All 8 scan configurations use the unmodified Basic Network Scan template. The organization operates production databases, financial transaction systems, and customer-facing web applications that need tailored scanning. PCI DSS and SOX obligations require compliance scan policies that are not configured. The organization has already experienced scan-related disruption to a production database, confirming that the default aggressive settings are too much for sensitive systems. Despite that incident, no policy adjustments were made.',
      original:
        'Scan policies: all 8 use default Basic Network Scan template. Custom policies: none. Compliance policies: none. Assessment: functional but unoptimized.',
      enriched:
        'Sensitive systems: scanned with default aggressive policy. Regulated systems (PCI, SOX): no compliance policies configured. Prior production scan disruption: confirmed, no policy adjustment. Assessment: inappropriate for the asset mix and a compliance gap.',
    },
    '2.5': {
      headline: '5 of 7 permanent exclusions have no justification, owner, or review date',
      detail:
        'Two of the 7 permanent exclusions cover the OT/manufacturing network. These are technically justified: active scanning has caused PLC controller resets that halted production. The remaining 5 are legacy exclusions that no one can explain. They cover an estimated 2,800 hosts, have no documented justification, no assigned owner, and have never been reviewed. These 5 exclusions represent undocumented risk acceptance for 2,800 systems that may or may not still need exclusion.',
      original:
        'Total exclusions: 9. Permanent: 7. Broad /16 ranges: 2. Estimated excluded hosts: 4,100. Assessment: weak exclusion governance.',
      enriched:
        'Justified exclusions: 2 of 7 (OT network, confirmed production impact). Unjustified legacy exclusions: 5, covering ~2,800 hosts. Documentation: none. Owner: none. Review process: none. Assessment: 2 legitimate exceptions and 5 ungoverned blind spots.',
    },
    '3.1': {
      headline: '47,200 open vulnerabilities exist in a governance vacuum with no leadership oversight',
      detail:
        'The organization describes a balanced risk appetite, but leadership only acknowledges vulnerability exposure without actively governing it. Vulnerability risk is not quantified in financial or regulatory terms. The risk acceptance process is informal with no defined authority beyond the security team lead. The 312 open Critical vulnerabilities and 67-day mean Critical age represent exposure that no one at the leadership level is tracking, discussing, or making resource decisions about.',
      original:
        'Open vulnerabilities: 47,200. Critical: 312. High: 2,847. Mean Critical age: 67 days. Assessment: significant exposure with aging critical findings.',
      enriched:
        'Leadership visibility into vulnerability exposure: minimal. Risk quantification in business terms: none. Risk acceptance authority: informal, no defined governance. Assessment: exposure exists in a governance vacuum.',
    },
    '3.2': {
      headline: 'CVSS-first prioritization was never chosen, it was inherited by default',
      detail:
        'No one at the organization made a deliberate decision to use CVSS for prioritization. It is the default sort order in the tooling, and it became the de facto methodology without evaluation. The approach is undocumented, inconsistently applied across teams, and the team has only passing familiarity with VPR. The 89 Critical-by-CVSS vulnerabilities with VPR below 5.0 are being treated as urgent despite posing minimal real-world risk. Switching the default dashboard view to VPR-sorted would be a zero-cost improvement.',
      original:
        'Prioritization method: CVSS severity. Critical-by-CVSS with VPR below 5.0: 89 vulnerabilities. ACR: all defaults. AES: not meaningful. Assessment: prioritization is not risk-optimized.',
      enriched:
        'CVSS prioritization: inherited from tooling defaults, never deliberately chosen. Documentation: none. Consistency across teams: inconsistent. Team VPR awareness: passing familiarity only. Assessment: absent methodology, not a flawed one. Quick win to establish.',
    },
    '3.3': {
      headline: 'Base images updated once a year are reintroducing vulnerabilities that were already fixed',
      detail:
        'The 22% recurrence rate traces directly to base images that are updated annually. When systems are reimaged, they receive patches that are up to 12 months old. Every vulnerability fixed in the interim reappears. The Java and Adobe concentration confirms this: these third-party applications are not covered by SCCM-based OS patching, so they are especially vulnerable to image-driven recurrence. Moving to monthly image updates would eliminate the primary driver of nearly a quarter of all recurrence.',
      original:
        'Recurrence rate: 22%. Assets with 5+ reopened vulns: 47. Dominant families: Java, Adobe. Assessment: remediation is not durable.',
      enriched:
        'Root cause: base images updated annually. Reimaged systems reintroduce up to 12 months of vulnerabilities. Java/Adobe recurrence driven by third-party apps outside SCCM scope. Assessment: specific image management practice, fixable with monthly updates.',
    },
    '4.1': {
      headline: "Critical vulnerabilities take 247% longer to fix than the organization's own target",
      detail:
        "The organization targets 15 days for Critical vulnerability remediation. The actual median is 52 days. That is not a marginal miss. It is a 247% overshoot on the metric that matters most. The SLAs are aspirational only, with no enforcement, no escalation, and compliance measured ad-hoc. Accountability is shared across teams, which in practice means no one is accountable. The trend is worsening month over month and no one is tracking it because no one is measuring SLA compliance systematically.",
      original:
        'Median TTR Critical: 52 days. High: 91 days. 6-month trend: worsening. Assessment: slow against industry benchmarks of 15 to 30 days.',
      enriched: '',
    },
    '4.2': {
      headline:
        'Effective fix rate is 68% after accounting for accepted risks, but the acceptance process is ungoverned',
      detail:
        'The raw 58% Critical fix rate includes approximately 120 informally risk-accepted vulnerabilities. Removing these, the effective rate improves to 68%. But the improvement comes with a caveat: the risk acceptance process has no documentation, no expiration dates, and compensating controls are general (network segmentation, enhanced monitoring) rather than mapped to specific vulnerabilities. The remediation team of 4 people handles patching as a small part of their role, with limited maintenance windows and recurring barriers from application compatibility. The growing backlog is a capacity problem, not a prioritization problem.',
      original:
        'Monthly detection: ~1,200. Monthly fix: ~800. Backlog growth: ~400 per month. Critical fix rate: 58%. Assessment: remediation not keeping pace.',
      enriched: '',
    },
    '4.3': {
      headline: 'The 3:1 OS-to-third-party fix ratio exists because no third-party patching process exists at all',
      detail:
        'SCCM handles Windows patching. Jamf handles Mac patching. Both are automated. Third-party applications have no patching process, no tooling, and no ownership. The 3:1 fix ratio is not a team choosing to ignore third-party vulnerabilities. It is the absence of any mechanism to address them. On top of this, remediation tasks are manually entered into ServiceNow by the security team, introducing a 1 to 2 week lag between detection and IT assignment. Formal CAB approval adds additional time that is appropriate for the environment.',
      original:
        'OS-to-third-party fix ratio: 3:1. Configuration vulns fixed: rarely. Top 20% of assets receive 65% of effort. Assessment: unevenly distributed.',
      enriched:
        'OS patching: automated via SCCM and Jamf. Third-party patching: no process, no tool, no owner. Ticket creation: manual, 1 to 2 week handoff lag. Assessment: process absence, not prioritization failure.',
    },
    '5.1': {
      headline: 'The entire VM program depends on one person who lacks the authority to drive remediation',
      detail:
        'The stated team is 2 FTEs, but 82% of all platform activity comes from a single senior security engineer who combines VM with broader security operations. This person is the designated program owner but has no direct reports and sits two management layers below the CISO. When a remediation request requires IT cooperation, there is no escalation path. The 2 inactive admin accounts belong to former employees whose access was never revoked, confirming that access management is not actively governed.',
      original:
        'Active users: 3. Activity concentration: 82% from one user. Inactive admin accounts: 2. Assessment: key-person dependency and access hygiene gaps.',
      enriched:
        'Stated team: 2 FTEs, combined role with broader security ops. Program owner: no direct reports, two layers below CISO. Escalation path for remediation requests: none. Inactive admins: confirmed former employees. Assessment: structural organizational limitation.',
    },
    '5.2': {
      headline: 'The platform was configured once at deployment and has never been optimized',
      detail:
        'The 75% scan config staleness is not neglect. It is the result of a deliberate (or at least accepted) operating model: configure once, let it run, and intervene only when something breaks. Scan policies are reviewed only when issues arise. There is no change management process for Tenable configuration. The team does not track new Tenable features, which means capabilities like VPR-based workflows, automatic tagging, and ACR customization have been available for years but never evaluated. Every gap identified in the Automated Baseline around tagging, prioritization, and policy optimization traces back to this root cause.',
      original:
        'Config changes in 90 days: 3. Scan configs unmodified since creation: 75%. Human-to-automated ratio: 8%. Assessment: platform is on autopilot.',
      enriched:
        'Scan config review process: ad-hoc, only when issues arise. Change management for Tenable: none. New capability tracking: none (VPR, auto-tagging, ACR never evaluated). Assessment: confirmed organizational practice, root cause of multiple other findings.',
    },
    '6.1': {
      headline: 'The ServiceNow integration is manual CSV export, not the automated sync it appears to be',
      detail:
        'The service account detected in the Automated Baseline corresponds to ServiceNow, but the integration is manual CSV export triggered by the security team, not automated API sync. Ticket creation requires someone to select specific vulnerabilities and manually export them. There is no bidirectional sync, so ticket status in ServiceNow is never reflected back in Tenable. Splunk receives periodic vulnerability data exports but uses them only for a dashboard that no one has reported consulting for incident investigation or alert correlation.',
      original:
        'Service accounts: 1 (irregular activity). Automated API patterns: none detected. Assessment: minimal ecosystem connectivity.',
      enriched:
        'ServiceNow integration: manual CSV export, not automated sync. Ticket creation: human-triggered, not rule-based. Bidirectional status updates: none. Splunk: periodic export, dashboard only, no correlation or investigation use. Assessment: integrations exist in name but not in function.',
    },
    '6.2': {
      headline: 'Vulnerability data reaches only the compliance team, only quarterly, and only when manually exported',
      detail:
        'The sporadic export pattern is quarterly manual CSV downloads for compliance review. No other stakeholder receives vulnerability data in any form. The SOC does not have access during incident investigations. IT operations does not see remediation targets. Asset owners are unaware of the vulnerabilities on their systems. Executive leadership has no visibility into the organization\'s vulnerability exposure. The entire flow of vulnerability intelligence depends on one person manually exporting a CSV four times a year.',
      original:
        'Manual exports in 90 days: 4. Automated exports: none. Report downloads: 2. Assessment: sporadic with no consistent pattern.',
      enriched:
        'Export purpose: quarterly compliance CSV downloads only. Stakeholders receiving vuln data: compliance team only. SOC access to vulnerability data: none. IT operations, asset owners, leadership: no visibility. Assessment: near-total data isolation.',
    },
  }

  if (!finding) return null

  const auth = getAuthRecalculation(questionnaire)
  const criticalOvershoot = getSlaOvershoot(52, questionnaire.criticalSlaDays)
  const highOvershoot = getSlaOvershoot(91, questionnaire.highSlaDays)

  const dynamicEnriched: Record<string, string> = {
    '1.1':
      'Coverage: 62% against actual environment (15,000 expected assets). Gap: ~3,150 assets with zero vulnerability visibility. 800 intentionally excluded (OT/ICS) removed from gap calculation. Assessment: significant blind spot.',
    '1.2':
      'Agent coverage: 72% of managed endpoints (8,200 of 11,400). Deployment gap: 3,200 endpoints with no agent. Independent deployment model limits automatic coverage. Assessment: significant deployment gap.',
    '1.5':
      'AWS: ~2,000 instances covered, connector healthy. Azure: ~800 instances, connector stale for 6 days. Auto-scaling provisioning means new Azure instances are invisible. Assessment: active visibility gap affecting 29% of cloud footprint.',
    '2.1': `Achievable auth rate: ${auth.achievableAuth.toFixed(1)}% (after excluding 28% non-credentialable network devices). Remaining gap: small number of configs with missing or failing credentials. Root cause: ad-hoc credential management. Assessment: contained, fixable issue.`,
    '2.2':
      "Tier 1 critical assets meeting weekly policy: 66%. Tier 1 assets exceeding policy by 21+ days: 34%. Missed scans disproportionately affect high-priority targets. Assessment: internal policy violation for the most critical tier.",
    '4.1': `Critical SLA target: ${questionnaire.criticalSlaDays} days. Actual: 52 days. Overshoot: ${criticalOvershoot.toFixed(0)}%. High SLA target: ${questionnaire.highSlaDays} days. Actual: 91 days. Overshoot: ${highOvershoot.toFixed(0)}%. SLA enforcement: none. Compliance tracking: ad-hoc. Accountability: diffused. Assessment: massive, unmeasured violation of own targets.`,
    '4.2':
      'Effective Critical fix rate: 68% (after excluding 120 informally accepted risks). Accepted risks: no documentation, no expiration, no specific compensating controls. Remediation capacity: 4 part-time staff, limited maintenance windows. Assessment: capacity constraint plus ungoverned risk acceptance.',
  }

  const contextLayer = contextLayerMap[finding.id]
  const relatedCustomFindings = meridianData.customFindings.filter((item) => {
    if (item.title === 'Credential Architecture Risk') return finding.id === '2.1'
    if (item.title === 'Executive Sponsorship Gap') return finding.id === '5.1'
    return false
  })
  const recommendationPlaybook = findingRecommendationPlaybook[finding.id]
  const primaryRecommendationBody = normalizeRecommendationBody(
    finding.recommendation,
    finding.summary,
  )
  const renderedAdditionalRecommendations = [
    ...(recommendationPlaybook?.additionalRecommendations ?? []),
    ...buildOverflowRecommendation(finding.recommendation),
  ]
  const findingTriggeredPrompt = findingTriggeredPromptByFindingId[finding.id]
  const findingObservationPrompt = observationPromptByFindingId[finding.id]
  const { usedInByInterviewId, usedInByObservationId } = createUsedInMappings(
    onOpenFinding,
    onOpenReportSection,
  )
  const evidenceEntries: Array<{
    id: string
    title: string
    metricOrTag: string
    questionOrPrompt: string
    responseLabel: string
    responseValue: string
    onResponseChange: (value: string) => void
    usedInDestinations: UsedInDestination[]
  }> = []

  if (findingTriggeredPrompt) {
    const key = finding.id as keyof InterviewResponseMap
    evidenceEntries.push({
      id: `finding-${finding.id}`,
      title: `Finding ${finding.id}`,
      metricOrTag: findingTriggeredPrompt.metric,
      questionOrPrompt: findingTriggeredPrompt.question,
      responseLabel: 'INTERVIEW NOTES',
      responseValue: interviewResponses[key] ?? '',
      onResponseChange: (value: string) => onChangeInterviewResponse(key, value),
      usedInDestinations: usedInByInterviewId[key] ?? [],
    })
  }

  if (findingObservationPrompt) {
    evidenceEntries.push({
      id: `observation-${findingObservationPrompt.promptId}`,
      title: findingObservationPrompt.tag,
      metricOrTag: '',
      questionOrPrompt: findingObservationPrompt.text,
      responseLabel: 'INTERVIEW NOTES',
      responseValue: observationResponses[findingObservationPrompt.promptId] ?? '',
      onResponseChange: (value: string) =>
        onChangeObservationResponse(findingObservationPrompt.promptId, value),
      usedInDestinations: usedInByObservationId[findingObservationPrompt.promptId] ?? [],
    })
  }

  const hasEvidenceContent = evidenceEntries.some((entry) => entry.responseValue.trim().length > 0)
  const shouldAutoExpandEvidence = hasEvidenceContent && annotations.length === 0 && !override
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(shouldAutoExpandEvidence)

  useEffect(() => {
    setIsEvidenceExpanded(shouldAutoExpandEvidence)
  }, [finding.id, shouldAutoExpandEvidence])

  useEffect(() => {
    if (!pendingFindingAnchorId) return
    const target = document.getElementById(pendingFindingAnchorId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      onConsumePendingFindingAnchor()
    }
  }, [pendingFindingAnchorId, finding.id, onConsumePendingFindingAnchor])

  const evidencePreviewText =
    evidenceEntries.find((entry) => entry.responseValue.trim().length > 0)?.responseValue.trim() ?? ''
  const evidencePreview =
    evidencePreviewText.length > 100
      ? `${evidencePreviewText.slice(0, 100)}...`
      : evidencePreviewText || 'No interview evidence captured yet.'

  const getAnnotationAnchorId = (annotation: (typeof annotations)[number], index: number) => {
    if (finding.id === '4.1' && annotation.text.includes('manual ServiceNow ticket creation')) {
      return 'annotation-4.1-bottleneck'
    }
    if (finding.id === '2.5' && annotation.text.includes('OT manufacturing systems')) {
      return 'annotation-2.5-ot'
    }
    if (finding.id === '5.1' && annotation.text.includes('single point of failure')) {
      return 'annotation-5.1-key-person'
    }
    if (finding.id === '4.3' && annotation.text.includes('Full workflow traced through interview')) {
      return 'annotation-4.3-pattern-chain'
    }
    if (finding.id === '4.3' && annotation.text.includes('Reviewed actual ServiceNow ticket INC0047823')) {
      return 'annotation-4.3-ticket-observation'
    }
    return `annotation-${finding.id}-${index}`
  }

  return (
    <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-[#2E75B6] hover:text-[#1B3A5C]"
      >
        Back to domain detail
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Finding Detail</p>
          <div className="mt-1 flex items-start gap-2">
            <h2 className="text-2xl font-semibold text-[#1B3A5C]">
              {finding.id} - {finding.title}
            </h2>
            <StoryBeatInfo storyBeat={finding.storyBeat} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBadge confidence={finding.confidence} />
          <span
            className="rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ backgroundColor: getScoreColor(finding.score) }}
          >
            Score {finding.score.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="relative rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Layer 1 - Automated Baseline</h3>
        <DemoCallout
          id="callout-finding-layer1"
          demoGuide={demoGuide}
          className="right-3 top-3"
          text="Layer 1 is entirely API-driven. No human input. These metrics, scores, and recommendations are produced automatically by connecting to the customer's Tenable tenant. This layer delivers value on its own before any questionnaire or consultant involvement."
        />
        <p className="mt-1 text-sm text-slate-600">{finding.summary}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {finding.metrics.map((metric) => (
            <div key={metric.label} className="rounded border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{metric.value}</p>
              {typeof metric.numericValue === 'number' && metric.numericValue <= 100 ? (
                <div className="mt-2 h-2 overflow-hidden rounded bg-slate-200">
                  <div
                    className="h-full rounded bg-[#2E75B6]"
                    style={{ width: `${metric.numericValue}%` }}
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <div className="rounded border border-slate-200 bg-slate-50 p-3">
            <p className="font-semibold text-slate-900">How to increase confidence in this finding</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
              {(recommendationPlaybook?.confidenceBoosters ?? [
                'Validate underlying metric sources and owner inputs.',
                'Document assumptions and discrepancies during context review.',
              ]).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="relative rounded border border-slate-200 bg-slate-50 p-3">
            <p className="font-semibold text-slate-900">Automated Recommendations</p>
            <AIIndicatorCard
              id={4}
              demoGuide={demoGuide}
              className="right-3 top-8"
              text="AI-tailored in production. Currently template-based recommendations selected by score thresholds. AI would customize the language, specificity, and actionability based on the full context of this customer's environment, team structure, and maturity level."
            />

            <div className="mt-3 rounded border border-slate-200 bg-white p-3">
              <p className="font-medium text-slate-800">Recommendation 1</p>
              <p className="mt-1 text-slate-700">{primaryRecommendationBody}</p>
              <p className="mt-2 text-xs text-slate-600">
                <span className="font-semibold">Why relevant:</span>{' '}
                {recommendationPlaybook?.primaryWhy ?? finding.storyBeat}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                <span className="font-semibold">How to implement:</span>{' '}
                {recommendationPlaybook?.primaryHow ??
                  'Define owners, timeline, and KPI targets for this recommendation, then track progress in recurring review cadence.'}
              </p>
            </div>

            {renderedAdditionalRecommendations.map((recommendation, index) => (
              <div key={`${finding.id}-rec-${index}`} className="mt-2 rounded border border-slate-200 bg-white p-3">
                <p className="font-medium text-slate-800">Recommendation {index + 2}</p>
                <p className="mt-1 text-slate-700">
                  {normalizeRecommendationBody(recommendation.action, finding.summary)}
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  <span className="font-semibold">Why relevant:</span>{' '}
                  {recommendation.why}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  <span className="font-semibold">How to implement:</span>{' '}
                  {recommendation.how}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative rounded-lg border border-green-200 bg-[#E8F5E9] p-4">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Layer 2 - Organizational Context</h3>
        <DemoCallout
          id="callout-finding-layer2"
          demoGuide={demoGuide}
          className="right-3 top-3"
          text="Layer 2 shows how questionnaire input transformed the finding. The two comparison cards show the interpretation before (baseline-only) and after (context-adjusted) organizational context. The headline and detail paragraph explain the insight."
        />
        <AIIndicatorCard
          id={1}
          demoGuide={demoGuide}
          className="right-3 top-32"
          text="AI-generated in production. When the customer completes the questionnaire, AI produces the headline, detail paragraph, and context-adjusted interpretation by combining Automated Baseline metrics with organizational context. Currently static sample content."
        />
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-600">
          Enrichment source: {getContextSource(finding.id)}
        </p>
        {contextLayer ? (
          <>
            <p className="mt-1 text-sm text-slate-700">{contextLayer.headline}</p>
            <p className="mt-1 text-sm text-slate-600">{contextLayer.detail}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded border border-green-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  BASELINE-ONLY INTERPRETATION
                </p>
                <p className="mt-1 text-sm text-slate-800">{contextLayer.original}</p>
              </div>
              <div className="rounded border border-green-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  CONTEXT-ADJUSTED INTERPRETATION
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {dynamicEnriched[finding.id] ?? contextLayer.enriched}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-700">
            Organizational context is available for this finding and contributes confidence and
            recommendation refinement.
          </p>
        )}
      </div>

      <div className="relative rounded-lg border border-orange-200 bg-[#FFF3E0] p-4">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Layer 3 - Advanced Analysis</h3>
        <DemoCallout
          id="callout-finding-layer3"
          demoGuide={demoGuide}
          className="right-3 top-3"
          text="Layer 3 contains consultant contributions: annotations (expert observations), score overrides (judgment-based adjustments), and related custom findings. These are exclusive to consultant engagements. Customers see them read-only after delivery."
        />

        {annotations.length > 0 ? (
          <div className="mt-3 space-y-3">
            {annotations.map((annotation, index) => (
              <div
                key={annotation.text}
                id={getAnnotationAnchorId(annotation, index)}
                className="scroll-mt-24 rounded border border-orange-300 bg-white p-3"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {annotation.type} - {annotation.author}, Senior Security Consultant,{' '}
                  {annotation.date}
                </p>
                <p className="mt-1 text-sm text-slate-700">{annotation.text}</p>
              </div>
            ))}
          </div>
        ) : relatedCustomFindings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-700">
            No consultant annotations are currently attached to this finding.
          </p>
        ) : null}

        {override ? (
          <div
            id={`score-override-${finding.id}`}
            className="scroll-mt-24 mt-3 rounded border border-orange-300 bg-white p-3"
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">Score Override</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              Sarah Chen, Senior Security Consultant, Feb 12, 2026
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-4xl font-bold text-slate-900">{override.fromScore.toFixed(1)}</span>
              <span className="text-2xl text-slate-400">--&gt;</span>
              <span className="text-4xl font-bold text-slate-900">{override.toScore.toFixed(1)}</span>
            </div>
            <p
              className={`mt-1 text-sm font-medium ${
                override.toScore >= override.fromScore ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {override.toScore >= override.fromScore ? '▲ Upward override' : '▼ Downward override'}
            </p>
            <p className="mt-1 text-sm text-slate-700">{override.justification}</p>
          </div>
        ) : null}

        {relatedCustomFindings.length > 0 && (
          <div className="mt-3 rounded border border-orange-300 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Related custom findings</p>
            <ul className="mt-1 space-y-1 text-sm text-slate-700">
              {relatedCustomFindings.map((item) => (
                <li key={item.id}>
                  <span className="font-medium">{item.title}</span> ({item.severity}) - {item.summary}
                </li>
              ))}
            </ul>
          </div>
        )}

        {role === 'consultant' && evidenceEntries.length > 0 && (
          <div className="mt-3 rounded border border-orange-300 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Supporting Interview Evidence
              </p>
              <button
                type="button"
                onClick={() => setIsEvidenceExpanded((prev) => !prev)}
                className="text-xs font-medium text-[#2E75B6] hover:underline"
              >
                {isEvidenceExpanded ? '▾ Hide details' : '▸ Show details'}
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">"{evidencePreview}"</p>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                isEvidenceExpanded ? 'mt-3 max-h-[1400px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-3">
                {evidenceEntries.map((entry) => (
                  <div key={entry.id} className="rounded border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[#2E75B6]/40 bg-[#2E75B6]/10 px-2 py-0.5 text-xs font-semibold text-[#1B3A5C]">
                        {entry.title}
                      </span>
                      {entry.metricOrTag ? (
                        <span className="text-xs text-slate-500">({entry.metricOrTag})</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{entry.questionOrPrompt}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {entry.responseLabel}
                    </p>
                    <textarea
                      rows={3}
                      value={entry.responseValue}
                      onChange={(event) => entry.onResponseChange(event.target.value)}
                      className={`mt-1 w-full resize-none overflow-hidden rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 ${
                        entry.responseValue.trim() ? 'bg-[#F7FAFF]' : 'bg-white'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {role !== 'consultant' && interviewResponses[finding.id as keyof InterviewResponseMap]?.trim() ? (
          <div className="mt-3 rounded border border-orange-300 bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Interview response</p>
            <p className="mt-1 text-sm text-slate-700">
              {interviewResponses[finding.id as keyof InterviewResponseMap]}
            </p>
          </div>
        ) : null}

        {role === 'consultant' && (
          <div className="mt-3 flex flex-wrap gap-2">
            {['Add Annotation', 'Edit', 'Override Score', 'Add Custom Finding'].map((label) => (
              <ProductionButton key={label} label={label} />
            ))}
          </div>
        )}

        <p className="relative mt-3 text-sm text-slate-700">
          <span className="font-semibold">Potential Consultant Value:</span>{' '}
          {role === 'customer' ? (
            <AIIndicatorCard
              id={5}
              demoGuide={demoGuide}
              className="right-3 top-8"
              text="AI-generated in production. Currently template-based with dynamic data insertion. AI would produce more contextually aware messages that reference relationships between multiple findings, not just individual thresholds."
            />
          ) : null}
          {finding.consultantValueIndicator}
        </p>
      </div>
    </section>
  )
}

function QuestionnaireScreen({
  questionnaire,
  onChange,
  onOpenFinding,
  pendingQuestionnaireQuestionId,
  pendingQuestionnaireDomainId,
  onConsumePendingQuestionnaireFocus,
  demoGuide,
}: {
  questionnaire: QuestionnaireState
  onChange: (next: QuestionnaireState) => void
  onOpenFinding: (findingId: string) => void
  pendingQuestionnaireQuestionId: string | null
  pendingQuestionnaireDomainId: 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | null
  onConsumePendingQuestionnaireFocus: () => void
  demoGuide: DemoGuideState
}) {
  const coverage = getCoverageRecalculation(questionnaire)
  const auth = getAuthRecalculation(questionnaire)
  const criticalOvershoot = getSlaOvershoot(52, questionnaire.criticalSlaDays)
  const highOvershoot = getSlaOvershoot(91, questionnaire.highSlaDays)
  const [activeDomain, setActiveDomain] = useState<'d1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6'>('d1')
  const [excludedPopulations, setExcludedPopulations] = useState<string[]>([])
  const [remediationSlaModel, setRemediationSlaModel] = useState<
    'formal' | 'informal' | 'none'
  >('informal')
  const exclusionOptions = [
    'OT/ICS',
    'Air-gapped',
    'Third-party managed',
    'Contractor devices',
    'IoT',
    'None',
    'Other',
  ]

  const setField = <K extends keyof QuestionnaireState>(key: K, value: QuestionnaireState[K]) => {
    onChange({ ...questionnaire, [key]: value })
  }

  const toggleExcludedPopulation = (option: string) => {
    const isSelected = excludedPopulations.includes(option)
    const nextSelection = isSelected
      ? excludedPopulations.filter((item) => item !== option)
      : option === 'None'
        ? ['None']
        : [...excludedPopulations.filter((item) => item !== 'None'), option]

    setExcludedPopulations(nextSelection)

    const hasExclusions = nextSelection.some((item) => item !== 'None')
    setField('excludedPopulationMode', hasExclusions ? 'some' : 'none')
    if (!hasExclusions) {
      setField('excludedPopulationCount', 0)
    }
  }

  const questionnaireDomains = meridianData.domainScores

  useEffect(() => {
    if (!pendingQuestionnaireDomainId) return
    setActiveDomain(pendingQuestionnaireDomainId)
  }, [pendingQuestionnaireDomainId])

  useEffect(() => {
    if (!pendingQuestionnaireQuestionId) return
    window.setTimeout(() => {
      const target = document.getElementById(pendingQuestionnaireQuestionId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      onConsumePendingQuestionnaireFocus()
    }, 80)
  }, [pendingQuestionnaireQuestionId, onConsumePendingQuestionnaireFocus])

  return (
    <section className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Domain Selector
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {questionnaireDomains.map((domain) => (
            <button
              key={domain.id}
              type="button"
              onClick={() =>
                setActiveDomain(domain.id as 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6')
              }
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                activeDomain === domain.id
                  ? 'border-[#2E75B6] bg-[#2E75B6] text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              {domain.name}
            </button>
          ))}
        </div>
      </section>

      {activeDomain === 'd1' && (
        <DomainQuestionSection
        title="Asset Visibility & Inventory"
      >
        <div
          id="questionnaire-q1-1"
          className="relative scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <DemoCallout
            id="callout-questionnaire-interactive"
            demoGuide={demoGuide}
            className="right-3 top-3"
            text="Try changing a value in this section. The finding metrics recalculate in real time, demonstrating how organizational context transforms the assessment. This is the most interactive element in the demo."
          />
          <h3 className="text-lg font-semibold text-[#1B3A5C]">
            Q1.1 Expected Environment Size
          </h3>
          <div className="mt-3 space-y-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Approximate total assets in your environment?
                </span>
                <input
                  type="number"
                  min={1}
                  value={questionnaire.expectedAssetCount}
                  onChange={(event) =>
                    setField('expectedAssetCount', Number(event.target.value) || 1)
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                />
              </label>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="block">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Populations intentionally excluded from Tenable?
                </span>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {exclusionOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={excludedPopulations.includes(option)}
                        onChange={() => toggleExcludedPopulation(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Source of this number?
                </span>
                <select
                  defaultValue="CMDB"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  <option>CMDB</option>
                  <option>Asset management tool</option>
                  <option>Network discovery</option>
                  <option>Estimate</option>
                  <option>Other</option>
                </select>
              </label>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-500">Confidence?</span>
                <select
                  defaultValue="Medium"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
            </div>
          </div>

          {questionnaire.excludedPopulationMode === 'some' && (
            <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  Approximate excluded count?
                </span>
                <input
                  type="number"
                  min={0}
                  value={questionnaire.excludedPopulationCount}
                  onChange={(event) =>
                    setField('excludedPopulationCount', Number(event.target.value) || 0)
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                />
              </label>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-green-200 bg-[#E8F5E9] p-4">
            <p className="text-sm text-slate-700">
              Coverage recalculation: <strong>78%</strong> baseline to{' '}
              <strong>{coverage.coverage.toFixed(1)}%</strong> with context against{' '}
              {coverage.adjustedExpected.toLocaleString()} expected assets.
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Estimated assets outside visibility: <strong>{coverage.invisibleAssets.toLocaleString()}</strong>
            </p>
            <button
              type="button"
              onClick={() => onOpenFinding('1.1')}
              className="mt-2 text-sm font-medium text-[#2E75B6] hover:text-[#1B3A5C]"
            >
              Open Finding 1.1 detail
            </button>
          </div>
        </div>

        <StaticQuestionCard
          title="Q1.2 Endpoint Management Baseline"
          previewQuestionId="Q1.2"
          onOpenFinding={onOpenFinding}
          items={[
            { prompt: 'Endpoint management tools? (Multi-select: SCCM/MECM / Intune / Jamf / CrowdStrike / SentinelOne / Tanium / Other)', value: 'SCCM/MECM, Jamf' },
            { prompt: 'Managed endpoint count? (Numeric)', value: '~12,000' },
            { prompt: 'Agent deployment managed through endpoint tool or independently? (Single-select: Through endpoint tool / Independent / Mix / Not sure)', value: 'Mix' },
          ]}
        />
        <StaticQuestionCard
          title="Q1.3 Network Architecture Context"
          previewQuestionId="Q1.3"
          onOpenFinding={onOpenFinding}
          items={[
            { prompt: 'Distinct network segments or VLANs? (Numeric)', value: '12 locations, multi-segment network' },
            { prompt: 'Segments scanners cannot reach? (Single-select: Yes, documented / Yes, undocumented / No / Not sure)', value: 'Yes, partially documented' },
            { prompt: '[If yes] Describe unreachable segments. (Free-text short)', value: 'Selected operational and partner-managed network ranges' },
            { prompt: 'Assets in DMZ, cloud, or partner zones? (Multi-select: DMZ / AWS / Azure / GCP / Other cloud / Partner zones / None)', value: 'AWS + Azure + partner zones' },
            { prompt: 'Geographically distributed sites requiring local scanners? (Single-select: Yes / No / N/A)', value: 'Yes' },
          ]}
        />
        <StaticQuestionCard
          title="Q1.4 Asset Classification Framework"
          previewQuestionId="Q1.4"
          onOpenFinding={onOpenFinding}
          items={[
            { prompt: 'Formal asset classification framework? (Single-select: Yes, enforced / Yes, inconsistent / Informal / No)', value: 'Yes, inconsistent' },
            { prompt: 'Most important classification dimensions? (Multi-select: Business criticality / Data sensitivity / Regulatory scope / Environment type / Business unit / Geographic location / Other)', value: 'Business criticality, regulatory scope, environment type' },
            { prompt: 'Applicable regulatory frameworks? (Multi-select: PCI DSS / HIPAA / SOX / GDPR / NIST CSF / CIS Controls / ISO 27001 / FedRAMP / CMMC / SOC 2 / None / Other)', value: 'PCI DSS, SOX, NIST CSF' },
            { prompt: 'Business-critical systems formally identified? (Single-select: Yes, with register / Partially / No)', value: 'Partially' },
          ]}
        />
        <StaticQuestionCard
          title="Q1.5 Cloud Environment Profile"
          anchorId="questionnaire-q1-5"
          previewQuestionId="Q1.5"
          onOpenFinding={onOpenFinding}
          items={[
            { prompt: 'Cloud infrastructure use? (Single-select: Extensively / Limited / In migration / No / Not sure)', value: 'Extensively' },
            { prompt: '[Condition: cloud] Providers? (Multi-select: AWS / Azure / GCP / Oracle Cloud / Other)', value: 'AWS primary, Azure secondary' },
            { prompt: '[Condition: cloud] Approximate instances? (Numeric)', value: '~2,800' },
            { prompt: '[Condition: cloud] Provisioning model? (Multi-select: Manual / IaC / Auto-scaling / Containers / Other)', value: 'Mix of manual, IaC, and auto-scaling' },
            { prompt: '[Condition: cloud] Cloud VM ownership? (Single-select: Dedicated cloud security / Shared with general VM / Cloud team independently / No clear ownership)', value: 'Shared with general VM' },
          ]}
        />
        </DomainQuestionSection>
      )}

      {activeDomain === 'd2' && (
        <DomainQuestionSection
        title="Scanning Operations & Data Quality"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B3A5C]">
            Q2.1 Credential and Authentication Context
          </h3>
          <label className="mt-3 block">
            <span className="text-sm font-medium text-slate-700">
              [If selected] Approximate percentage?
            </span>
            <input
              type="range"
              min={0}
              max={60}
              value={questionnaire.nonCredentialablePercent}
              onChange={(event) => setField('nonCredentialablePercent', Number(event.target.value))}
              className="mt-2 w-full"
            />
            <p className="mt-1 text-sm text-slate-600">
              Current input: {questionnaire.nonCredentialablePercent}%
            </p>
          </label>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Credential management approach?</span>
              <select defaultValue="Dedicated service accounts" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option>Centralized vault</option>
                <option>Dedicated service accounts</option>
                <option>Shared accounts</option>
                <option>Ad-hoc</option>
                <option>Other</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Credential rotation frequency?</span>
              <select defaultValue="Quarterly" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option>Automatic</option>
                <option>Quarterly</option>
                <option>Annually</option>
                <option>Only when broken</option>
                <option>Never</option>
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-lg border border-green-200 bg-[#E8F5E9] p-4">
            <p className="text-sm text-slate-700">
              Auth rate recalculation: <strong>{auth.baselineAuthRate}%</strong> baseline to{' '}
              <strong>{auth.achievableAuth.toFixed(1)}%</strong> achievable with context.
            </p>
            <button
              type="button"
              onClick={() => onOpenFinding('2.1')}
              className="mt-2 text-sm font-medium text-[#2E75B6] hover:text-[#1B3A5C]"
            >
              Open Finding 2.1 detail
            </button>
          </div>
        </div>

        <StaticQuestionCard
          title="Q2.2 Target Scan Cadence"
          previewQuestionId="Q2.2"
          onOpenFinding={onOpenFinding}
          items={[
            { prompt: 'Defined scanning frequency requirements? (Single-select: Yes, formal / Yes, informal / No)', value: 'Yes, formal by asset tier' },
            { prompt: '[If yes] Target frequency per tier? (Table input)', value: 'Tier 1 weekly; Tier 2 bi-weekly; Tier 3 monthly' },
            { prompt: 'Requirements driven by compliance? (Single-select: Yes, primarily / Partially / No)', value: 'Partially' },
            { prompt: '[Condition: compliance] Which frameworks? (Multi-select: PCI DSS / NIST / CIS / Organizational policy / Other)', value: 'PCI DSS, organizational policy' },
          ]}
        />
        <StaticQuestionCard
          title="Q2.3 Scan Operations Management"
          anchorId="questionnaire-q2-3"
          previewQuestionId="Q2.3"
          onOpenFinding={onOpenFinding}
          items={[
            {
              prompt:
                'Are scan results and completion status actively monitored? (Single-select: Yes, automated alerts on failures / Yes, manual review after each cycle / Reviewed periodically / Not monitored)',
              value: 'Reviewed periodically',
            },
            {
              prompt:
                'Who is responsible for investigating and resolving scan failures? (Single-select: Dedicated VM team member / Shared responsibility / Ad-hoc / No one assigned)',
              value: 'Ad-hoc',
            },
            {
              prompt:
                'When a scan fails, what is the typical response time? (Single-select: Same day / Within a week / Next scan cycle / Only when someone notices / Not tracked)',
              value: 'Next scan cycle',
            },
            {
              prompt:
                'Are scan maintenance windows formally defined and coordinated with IT operations? (Single-select: Yes, formally scheduled / Yes, informal / Scans run without defined windows / Not sure)',
              value: 'Scans run without defined windows',
            },
            {
              prompt:
                'Are multiple scans scheduled to run concurrently on the same scanner? (Single-select: Yes, routinely / Sometimes / No, serialized / Not sure)',
              value: 'Yes, routinely',
            },
            {
              prompt:
                'Have you experienced scanner performance issues (slow scans, timeouts, resource exhaustion)? (Single-select: Yes, frequently / Occasionally / No / Not sure)',
              value: 'Occasionally',
            },
          ]}
        />
        <StaticQuestionCard
          title="Q2.4 Asset Sensitivity and Policy Alignment"
          anchorId="questionnaire-q2-4"
          previewQuestionId="Q2.4"
          onOpenFinding={onOpenFinding}
          items={[
            { prompt: 'Assets requiring restricted scanning? (Single-select: Yes / No / Not sure)', value: 'Yes' },
            { prompt: '[If yes] Types? (Multi-select: Production databases / Medical devices / ICS / Financial systems / Web apps / Real-time systems / Other)', value: 'Production databases, ICS, financial systems' },
            { prompt: '[If yes] Scan-related disruptions? (Single-select: Yes, multiple / Yes, once / No / Not sure)', value: 'Yes, once to multiple' },
            { prompt: 'Web app scanning through Tenable or separately? (Single-select: Through Tenable / Separate tool / Both / No)', value: 'Both / separate for some scopes' },
          ]}
        />
        <StaticQuestionCard
          title="Q2.5 Exclusion Justifications"
          previewQuestionId="Q2.5"
          onOpenFinding={onOpenFinding}
          items={[
            { prompt: 'Exclusions formally approved? (Single-select: Yes, with workflow / Informal / No process / Not sure)', value: 'Informal / partially documented' },
            { prompt: 'Exclusions reviewed periodically? (Single-select: Quarterly / Semi-annually / Annually / Only when issues / Never)', value: 'Only when issues to annual' },
            { prompt: 'For each permanent exclusion, provide justification. (Dynamic form: per-exclusion free-text)', value: 'Partial coverage' },
            { prompt: 'Dynamic per-exclusion free-text entries', value: 'Configured for permanent exclusions' },
          ]}
        />
        </DomainQuestionSection>
      )}

      {activeDomain === 'd3' && (
        <DomainQuestionSection
        title="Risk Prioritization & Analysis"
      >
        <StaticQuestionCard
          title="Q3.1 Risk Appetite and Vulnerability Context"
          previewQuestionId="Q3.1"
          onOpenFinding={onOpenFinding}
          items={[
            {
              prompt:
                "What is your organization's general risk appetite for vulnerability exposure? (Single-select: Aggressive — minimize all exposure quickly / Balanced — risk-based prioritization / Conservative — focus on critical and regulatory / Resource-constrained — address what we can)",
              value: 'Balanced — risk-based prioritization',
            },
            {
              prompt:
                'How does leadership view vulnerability exposure? (Single-select: Actively tracked as a business risk / Acknowledged but not regularly discussed / Delegated to the security team without oversight / Not a topic of leadership discussion)',
              value: 'Acknowledged but not regularly discussed',
            },
            {
              prompt:
                'Is vulnerability risk quantified in business terms (financial exposure, regulatory impact)? (Single-select: Yes, regularly / Occasionally / No / Not sure)',
              value: 'No',
            },
            {
              prompt:
                'Does your organization have a formal risk acceptance or exception process for vulnerabilities that cannot be remediated within SLA? (Single-select: Yes, with documented approvals and expiration dates / Yes, informal / No)',
              value: 'Yes, informal',
            },
            {
              prompt:
                'Who has authority to accept vulnerability risk? (Single-select: CISO or equivalent / Security team lead / Asset owner / IT management / No defined authority)',
              value: 'Security team lead',
            },
          ]}
        />

        <StaticQuestionCard
          title="Q3.2 Prioritization Methodology"
          previewQuestionId="Q3.2"
          onOpenFinding={onOpenFinding}
          items={[
            {
              prompt:
                'How does your organization prioritize vulnerability remediation? (Single-select: CVSS severity / VPR / Asset criticality combined with severity / Custom risk scoring model / Compliance-driven / No formal prioritization)',
              value: 'CVSS severity',
            },
            {
              prompt:
                'Is your prioritization methodology documented? (Single-select: Yes, in a formal policy / Yes, in informal guidelines / No)',
              value: 'No',
            },
            {
              prompt:
                'Is the methodology consistently applied across all teams and asset types? (Single-select: Yes, uniformly / Mostly, with some exceptions / Inconsistent across teams / Not sure)',
              value: 'Inconsistent across teams',
            },
            {
              prompt:
                'Who defines the prioritization criteria? (Single-select: Security leadership / VM team / IT management / Inherited from tooling defaults / No one — it evolved organically)',
              value: 'Inherited from tooling defaults',
            },
            {
              prompt:
                "Are you aware of Tenable's VPR (Vulnerability Priority Rating) and how it differs from CVSS? (Single-select: Yes, and we use it actively / Yes, but we don't use it / Somewhat familiar / No)",
              value: 'Somewhat familiar',
            },
          ]}
        />

        <StaticQuestionCard
          title="Q3.3 Configuration Management and Image Practices"
          previewQuestionId="Q3.3"
          onOpenFinding={onOpenFinding}
          items={[
            {
              prompt:
                'Do you use configuration management tools? (Multi-select: Group Policy / Ansible / Puppet / Chef / Terraform / SCCM baselines / CIS-CAT / None / Other)',
              value: 'Group Policy, SCCM baselines',
            },
            {
              prompt:
                'Do you maintain hardened base images for system deployment? (Single-select: Yes, regularly updated / Yes, but infrequently updated / No)',
              value: 'Yes, but infrequently updated',
            },
            {
              prompt:
                '[Condition: hardened images = yes] How frequently are base images updated with security patches? (Single-select: Monthly / Quarterly / Annually / When convenient / Not tracked)',
              value: 'Annually',
            },
            {
              prompt:
                'Are there systems that are regularly reimaged or rebuilt from templates? (Single-select: Yes, frequently / Yes, occasionally / No)',
              value: 'Yes, occasionally',
            },
          ]}
        />
        </DomainQuestionSection>
      )}

      {activeDomain === 'd4' && (
        <DomainQuestionSection
        title="Remediation & Response"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B3A5C]">
            Q4.1 Remediation SLAs and Enforcement
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Does your organization have defined remediation SLAs by vulnerability severity?
              </span>
              <select
                value={
                  remediationSlaModel === 'formal'
                    ? 'Yes, formally defined and tracked'
                    : remediationSlaModel === 'informal'
                      ? 'Yes, informal targets'
                      : 'No'
                }
                onChange={(event) => {
                  const selected = event.target.value
                  if (selected === 'Yes, formally defined and tracked') {
                    setRemediationSlaModel('formal')
                    return
                  }
                  if (selected === 'Yes, informal targets') {
                    setRemediationSlaModel('informal')
                    return
                  }
                  setRemediationSlaModel('none')
                }}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option>Yes, formally defined and tracked</option>
                <option>Yes, informal targets</option>
                <option>No</option>
              </select>
            </label>
            {remediationSlaModel !== 'none' && (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    What are your remediation SLAs? (Critical days)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={questionnaire.criticalSlaDays}
                    onChange={(event) =>
                      setField('criticalSlaDays', Number(event.target.value) || 1)
                    }
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    What are your remediation SLAs? (High days)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={questionnaire.highSlaDays}
                    onChange={(event) => setField('highSlaDays', Number(event.target.value) || 1)}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    What are your remediation SLAs? (Medium days)
                  </span>
                  <input
                    type="number"
                    min={1}
                    defaultValue={90}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    What are your remediation SLAs? (Low days)
                  </span>
                  <input
                    type="number"
                    min={1}
                    defaultValue={180}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
              </>
            )}
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Are remediation SLAs enforced or aspirational?
              </span>
              <select
                defaultValue="Aspirational only"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option>Enforced with escalation</option>
                <option>Tracked but not enforced</option>
                <option>Aspirational only</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                How is SLA compliance measured and reported?
              </span>
              <select
                defaultValue="Ad-hoc"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option>Automated dashboards</option>
                <option>Manual periodic reports</option>
                <option>Ad-hoc</option>
                <option>Not measured</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Who is accountable for meeting remediation SLAs?
              </span>
              <select
                defaultValue="Shared accountability"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option>Asset owners</option>
                <option>IT operations</option>
                <option>Security team</option>
                <option>Shared accountability</option>
                <option>No clear accountability</option>
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-lg border border-green-200 bg-[#E8F5E9] p-4">
            <p className="text-sm text-slate-700">
              Critical TTR overshoot: <strong>{criticalOvershoot.toFixed(0)}%</strong> (52 days vs{' '}
              {questionnaire.criticalSlaDays}-day SLA)
            </p>
            <p className="mt-1 text-sm text-slate-700">
              High TTR overshoot: <strong>{highOvershoot.toFixed(0)}%</strong> (91 days vs{' '}
              {questionnaire.highSlaDays}-day SLA)
            </p>
            <button
              type="button"
              onClick={() => onOpenFinding('4.1')}
              className="mt-2 text-sm font-medium text-[#2E75B6] hover:text-[#1B3A5C]"
            >
              Open Finding 4.1 detail
            </button>
          </div>
        </div>
        <StaticQuestionCard
          title="Q4.2 Remediation Capacity, Risk Acceptance, and Compensating Controls"
          previewQuestionId="Q4.2"
          onOpenFinding={onOpenFinding}
          items={[
            {
              prompt:
                'How many people are directly involved in vulnerability remediation (patching, configuration changes)? (Numeric)',
              value: '4',
            },
            {
              prompt:
                'Is vulnerability remediation a primary responsibility for these individuals or one of many duties? (Single-select: Primary focus / Significant part of role / Small part of role / Ad-hoc)',
              value: 'Small part of role',
            },
            {
              prompt:
                'Do you have sufficient maintenance windows for patching? (Single-select: Yes, regular scheduled windows / Yes, but limited / Rarely / No defined windows)',
              value: 'Yes, but limited',
            },
            {
              prompt:
                'What percentage of your environment can be patched without downtime (rolling updates, blue-green, etc.)? (Single-select: >75% / 50-75% / 25-50% / <25% / Not sure)',
              value: '25-50%',
            },
            {
              prompt:
                'Are there recurring barriers to remediation? (Multi-select: Application compatibility concerns / Change management process delays / Insufficient maintenance windows / Staffing constraints / Asset owner pushback / Testing environment unavailable / No significant barriers / Other)',
              value: 'Application compatibility concerns, Staffing constraints',
            },
            {
              prompt:
                'Do you have vulnerabilities that have been formally risk-accepted? (Single-select: Yes, with documented approvals / Yes, informally / No / Not sure)',
              value: 'Yes, informally',
            },
            {
              prompt:
                '[Condition: risk-accepted = yes] Approximately how many risk-accepted vulnerabilities exist? (Numeric)',
              value: '120',
            },
            {
              prompt:
                '[Condition: risk-accepted = yes] Do risk acceptances have expiration dates that trigger re-evaluation? (Single-select: Yes, all have expiration / Some do / No)',
              value: 'No',
            },
            {
              prompt:
                'Do you use compensating controls for vulnerabilities that cannot be remediated? (Single-select: Yes, documented per vulnerability / Yes, general compensating controls / No / Not sure)',
              value: 'Yes, general compensating controls',
            },
            {
              prompt:
                '[Condition: compensating controls = yes] Examples of compensating controls used? (Multi-select: Network segmentation / WAF rules / EDR detection rules / Enhanced monitoring / Access restrictions / Virtual patching / Other)',
              value: 'Network segmentation, Enhanced monitoring',
            },
          ]}
        />
        <StaticQuestionCard
          title="Q4.3 Remediation Workflow and Tooling"
          anchorId="questionnaire-q4-3"
          previewQuestionId="Q4.3"
          onOpenFinding={onOpenFinding}
          items={[
            {
              prompt: 'Describe the workflow from vulnerability detection to remediation. (Free-text long)',
              value:
                'Security team reviews Tenable findings weekly. Critical and high vulnerabilities are manually entered into ServiceNow. IT operations picks up tickets during their regular sprint cycle. Third-party patching is handled ad-hoc when someone notices an update is available.',
            },
            {
              prompt:
                'What patching tools does your organization use? (Multi-select: WSUS / SCCM/MECM / Intune / Ansible / Puppet / Chef / JAMF / Manual patching / Third-party patch management - Ivanti or ManageEngine / Other)',
              value: 'SCCM/MECM, JAMF',
            },
            {
              prompt:
                'Do you have a separate process for third-party application patching? (Single-select: Yes, automated / Yes, manual / No, same as OS patching / No third-party patching process)',
              value: 'No third-party patching process',
            },
            {
              prompt:
                'How are remediation tasks assigned to responsible parties? (Single-select: Automated ticketing from Tenable / Manual ticket creation / Email notifications / Verbal communication / Other)',
              value: 'Manual ticket creation',
            },
            {
              prompt:
                'What is the typical handoff time from vulnerability detection to ticket creation? (Single-select: Automatic (same day) / 1-3 days / 1-2 weeks / Varies widely / Not tracked)',
              value: '1-2 weeks',
            },
            {
              prompt:
                'Is there an established change management process for applying patches? (Single-select: Yes, with formal CAB approval / Yes, lightweight process / Emergency patches bypass process / No formal process)',
              value: 'Yes, with formal CAB approval',
            },
          ]}
        />
        </DomainQuestionSection>
      )}

      {activeDomain === 'd5' && (
        <DomainQuestionSection
        title="Program Governance & Operations"
      >
        <StaticQuestionCard
          title="Q5.1 VM Team Structure and Ownership"
          anchorId="questionnaire-q5-1"
          previewQuestionId="Q5.1"
          onOpenFinding={onOpenFinding}
          items={[
            {
              prompt:
                'Is there a formally designated owner of the vulnerability management program? (Single-select: Yes, named individual / Yes, a team / Shared across teams / No clear owner)',
              value: 'Yes, named individual',
            },
            {
              prompt:
                'What team or function owns VM? (Single-select: Security operations / IT security / IT operations / Risk management / Shared / Other)',
              value: 'IT security',
            },
            {
              prompt:
                'How many FTEs are dedicated to vulnerability management (scanning, analysis, reporting — not remediation)? (Numeric)',
              value: '2',
            },
            {
              prompt:
                'Is VM a dedicated function or combined with other responsibilities? (Single-select: Dedicated / Combined with broader security operations / Combined with IT operations / Part-time responsibility)',
              value: 'Combined with broader security operations',
            },
            {
              prompt:
                'Is there a documented vulnerability management policy or standard? (Single-select: Yes, reviewed within last year / Yes, but outdated / In development / No)',
              value: 'In development',
            },
            {
              prompt:
                'Does the VM program have a defined charter or scope statement? (Single-select: Yes / No / Not sure)',
              value: 'No',
            },
          ]}
        />
        <StaticQuestionCard
          title="Q5.2 Platform Management Practices"
          previewQuestionId="Q5.2"
          onOpenFinding={onOpenFinding}
          items={[
            {
              prompt:
                'Is there a defined process for reviewing and updating scan configurations? (Single-select: Yes, scheduled reviews (quarterly or more frequent) / Yes, but reviews are ad-hoc / No defined process / Not sure)',
              value: 'Yes, but reviews are ad-hoc',
            },
            {
              prompt:
                'How often are scan policies reviewed and updated? (Single-select: Quarterly / Semi-annually / Annually / Only when issues arise / Never since initial setup)',
              value: 'Only when issues arise',
            },
            {
              prompt:
                'Is there a change management process for Tenable platform configuration changes? (Single-select: Yes, documented process / Informal approval / No process / Not sure)',
              value: 'No process',
            },
            {
              prompt:
                "How does your team stay informed about new Tenable features and capabilities? (Single-select: Regular vendor briefings or training / Release notes review / Community forums / We don't actively track updates / Other)",
              value: "We don't actively track updates",
            },
          ]}
        />
        <StaticQuestionCard
          title="Q5.3 Reporting and Metrics"
          items={[
            {
              prompt:
                'Do you produce regular vulnerability management reports? (Single-select: Yes, automated / Yes, manual / Ad-hoc only / No)',
              value: 'Ad-hoc only',
            },
            {
              prompt:
                '[Condition: reports = yes] What is the reporting cadence? (Single-select: Weekly / Monthly / Quarterly / Ad-hoc)',
              value: 'Ad-hoc',
            },
            {
              prompt:
                'Who receives vulnerability management reports? (Multi-select: CISO / CIO / IT management / Security team / Asset owners / Board or executive committee / Compliance team / No regular distribution)',
              value: 'Security team',
            },
            {
              prompt:
                'What metrics are included in your reports? (Multi-select: Vulnerability counts by severity / Remediation SLA compliance / Scan coverage percentage / Risk score trends / Mean time to remediate / Exception/acceptance count / Asset coverage / Comparison against prior periods / None formally defined)',
              value: 'Vulnerability counts by severity',
            },
            {
              prompt:
                'Are vulnerability management metrics included in security program KPIs or executive dashboards? (Single-select: Yes / Partially / No)',
              value: 'No',
            },
            {
              prompt:
                'Do you benchmark your VM performance against industry standards or peers? (Single-select: Yes / No / Planning to)',
              value: 'No',
            },
          ]}
        />
        <StaticQuestionCard
          title="Q5.4 Continuous Improvement"
          items={[
            {
              prompt:
                'When was the last time the VM program was reviewed or updated? (Single-select: Within last 6 months / Within last year / Over a year ago / Never formally reviewed)',
              value: 'Over a year ago',
            },
            {
              prompt:
                'Do you conduct post-incident reviews that include vulnerability management findings? (Single-select: Yes, systematically / Sometimes / No)',
              value: 'Sometimes',
            },
            {
              prompt:
                'Has the VM program scope or approach changed in response to new threats, technologies, or organizational changes in the past year? (Single-select: Yes, proactively / Yes, reactively / No changes made)',
              value: 'Yes, reactively',
            },
            {
              prompt:
                'Are there known gaps or improvement areas that have been identified but not yet addressed? (Free-text long)',
              value:
                "We know we need better third-party patching and our tagging is weak, but haven't had time to address either.",
            },
            {
              prompt:
                'Does the VM team participate in security training or industry events? (Single-select: Regularly / Occasionally / Rarely / Never)',
              value: 'Occasionally',
            },
          ]}
        />
        <StaticQuestionCard
          title="Q5.5 Training and Knowledge Management"
          items={[
            {
              prompt:
                'Has the team operating Tenable received formal training on the platform? (Single-select: Yes, certified / Yes, vendor training / Self-taught / No training)',
              value: 'Self-taught',
            },
            {
              prompt:
                'Are there documented standard operating procedures for VM activities? (Single-select: Yes, comprehensive / Yes, partial / No)',
              value: 'No',
            },
            {
              prompt:
                'Do remediation teams receive guidance on how to interpret vulnerability findings? (Single-select: Yes, with context and prioritization / Basic severity information only / Raw scan output / Varies by team)',
              value: 'Basic severity information only',
            },
            {
              prompt:
                'Is there a knowledge transfer plan in case key VM personnel leave? (Single-select: Yes, documented / Partial / No)',
              value: 'No',
            },
          ]}
        />
        </DomainQuestionSection>
      )}

      {activeDomain === 'd6' && (
        <DomainQuestionSection
        title="Ecosystem Integration & Security Posture"
      >
        <StaticQuestionCard
          title="Q6.1 Integration Architecture and Status"
          previewQuestionId="Q6.1"
          onOpenFinding={onOpenFinding}
          items={[
            {
              prompt:
                'What ticketing or ITSM system does your organization use? (Multi-select: ServiceNow / Jira / BMC Remedy / Freshservice / Azure DevOps / None / Other)',
              value: 'ServiceNow',
            },
            {
              prompt:
                'Is Tenable integrated with your ticketing system? (Single-select: Yes, automated bidirectional / Yes, automated one-way / Yes, manual export / No)',
              value: 'Yes, manual export',
            },
            {
              prompt:
                '[Condition: integrated] What triggers ticket creation? (Multi-select: All above threshold / Critical and High only / VPR-based threshold / Manual selection / Compliance findings only)',
              value: 'Manual selection',
            },
            {
              prompt:
                '[Condition: integrated] Are ticket status updates reflected back in Tenable? (Single-select: Yes, automatically / Manually / No)',
              value: 'No',
            },
            {
              prompt:
                'What SIEM or security analytics platform does your organization use? (Multi-select: Splunk / Microsoft Sentinel / IBM QRadar / Google Chronicle / Elastic / Sumo Logic / None / Other)',
              value: 'Splunk',
            },
            {
              prompt:
                'Is Tenable vulnerability data sent to your SIEM? (Single-select: Yes, real-time / Yes, periodic export / No)',
              value: 'Yes, periodic export',
            },
            {
              prompt:
                '[Condition: SIEM integration] How is vulnerability data used in the SIEM? (Multi-select: Alert enrichment / Correlation rules / Dashboard visualization / Compliance reporting / Incident investigation / Not actively used after ingestion)',
              value: 'Dashboard visualization',
            },
          ]}
        />
        <StaticQuestionCard
          title="Q6.2 Data Consumption and Reporting Workflows"
          previewQuestionId="Q6.2"
          onOpenFinding={onOpenFinding}
          items={[
            {
              prompt:
                'How is vulnerability data shared with stakeholders outside the security team? (Single-select: Automated reports/dashboards / Manual periodic reports / Shared on request / Not shared outside security team)',
              value: 'Shared on request',
            },
            {
              prompt:
                'Who regularly consumes vulnerability data or reports? (Multi-select: CISO / security leadership / IT operations / Asset owners / Compliance team / Executive leadership / SOC analysts / No one outside the VM team)',
              value: 'Compliance team',
            },
            {
              prompt:
                'Is vulnerability data available to your SOC analysts during incident investigations? (Single-select: Yes, integrated into SOC workflow / Yes, but requires separate lookup / No)',
              value: 'No',
            },
            {
              prompt:
                'Are vulnerability exports or data feeds automated or manual? (Single-select: Fully automated / Mix of automated and manual / Entirely manual / No exports)',
              value: 'Entirely manual',
            },
            {
              prompt:
                'How frequently is vulnerability data updated in downstream systems? (Single-select: Real-time or near-real-time / Daily / Weekly / Monthly / Ad-hoc / Not applicable)',
              value: 'Ad-hoc',
            },
          ]}
        />
        <StaticQuestionCard
          title="Q6.3 Compliance and Audit Alignment"
          items={[
            { prompt: 'Compliance frameworks? (Multi-select: PCI DSS / HIPAA / SOX / NIST CSF / NIST 800-53 / CIS Controls / ISO 27001 / FedRAMP / CMMC / SOC 2 / None / Other)', value: 'PCI DSS, SOX' },
            { prompt: 'Tenable for audit evidence? (Single-select: Primary / Supplementary / No)', value: 'Supplementary' },
            { prompt: 'Compliance policies configured? (Single-select: Yes, across systems / Limited / No / Not sure)', value: 'No' },
            { prompt: 'Auditors identified gaps? (Single-select: Significant / Minor / No gaps / No recent audit)', value: 'Minor' },
            { prompt: '[If gaps] Primary gaps? (Free-text short)', value: 'Policy coverage and evidence consistency' },
          ]}
        />
        <StaticQuestionCard
          title="Q6.4 Threat Intelligence and IR Alignment"
          anchorId="questionnaire-q6-4"
          items={[
            { prompt: 'Consume threat intelligence? (Single-select: Commercial / Open source / Both / No)', value: 'Open source' },
            { prompt: '[If yes] Used for prioritization? (Single-select: Systematically / Ad-hoc / No)', value: 'No' },
            { prompt: 'During incidents, vuln data consulted? (Single-select: Standard step / Sometimes / No / No IR process)', value: 'Sometimes' },
            { prompt: 'IR lessons fed back? (Single-select: Systematically / Ad-hoc / No)', value: 'No' },
            { prompt: 'Threat sharing? (Single-select: Active / Passive / No)', value: 'No' },
          ]}
        />
        <StaticQuestionCard
          title="Q6.5 Broader Security Program Alignment"
          anchorId="questionnaire-q6-5"
          items={[
            { prompt: 'Documented security strategy? (Single-select: Yes, current / Yes, outdated / In development / No)', value: 'In development / partially current' },
            { prompt: 'VM referenced? (Single-select: Key function / Mentioned briefly / Not referenced)', value: 'Not referenced' },
            { prompt: 'VM interaction with other functions? (Multi-select: SOC data sharing / Risk register / Compliance / Asset mgmt / Security architecture / Operates independently)', value: 'Operates independently' },
            { prompt: 'Vulnerability risk in enterprise risk register? (Single-select: Regularly / Occasionally / No)', value: 'No' },
            { prompt: 'VM objectives aligned with security goals? (Single-select: Yes / Partially / No)', value: 'No' },
            { prompt: 'Security program maturity? (Single-select: Mature / Developing / Early stage / Minimal)', value: 'Developing' },
          ]}
        />
        </DomainQuestionSection>
      )}
    </section>
  )
}

function DomainQuestionSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-xl font-semibold text-[#1B3A5C]">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function StaticQuestionCard({
  title,
  items,
  previewQuestionId,
  onOpenFinding,
  anchorId,
}: {
  title: string
  items: Array<{ prompt: string; value: string }>
  previewQuestionId?: string
  onOpenFinding?: (findingId: string) => void
  anchorId?: string
}) {
  const parsedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        parsed: parseQuestionField(item.prompt),
      })),
    [items],
  )

  const [responses, setResponses] = useState<Record<string, string | string[]>>(() => {
    const seededResponses: Record<string, string | string[]> = {}

    parsedItems.forEach((item) => {
      const { fieldType, options } = item.parsed
      if (fieldType === 'multi-select') {
        const selected = item.value
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
        seededResponses[item.prompt] = options.filter((option) => selected.includes(option))
        return
      }

      if (fieldType === 'single-select') {
        seededResponses[item.prompt] = options.includes(item.value) ? item.value : (options[0] ?? '')
        return
      }

      if (fieldType === 'numeric') {
        seededResponses[item.prompt] = String(getNumericSeed(item.value))
        return
      }

      seededResponses[item.prompt] = item.value
    })

    return seededResponses
  })

  const setResponse = (prompt: string, value: string | string[]) => {
    setResponses((prev) => ({ ...prev, [prompt]: value }))
  }

  const isItemVisible = (itemIndex: number) => {
    const current = parsedItems[itemIndex]
    const conditionTag = current.parsed.conditionTag?.toLowerCase()
    if (!conditionTag) return true

    const controllingIndex = (() => {
      for (let i = itemIndex - 1; i >= 0; i -= 1) {
        if (!parsedItems[i].parsed.conditionTag) return i
      }
      return itemIndex - 1
    })()

    if (controllingIndex < 0) return true

    const controllingItem = parsedItems[controllingIndex]
    const controllingResponse = responses[controllingItem.prompt]
    const controllingText = responseAsText(controllingResponse).toLowerCase()

    if (conditionTag.startsWith('condition:')) {
      const token = conditionTag.replace('condition:', '').trim()
      if (!token) return true
      return (
        controllingText.includes(token) ||
        isAffirmativeResponse(controllingResponse)
      )
    }

    if (conditionTag === 'if yes') {
      return isAffirmativeResponse(controllingResponse)
    }

    if (conditionTag === 'if not') {
      return !isAffirmativeResponse(controllingResponse)
    }

    if (conditionTag === 'if selected') {
      return hasMeaningfulSelection(controllingResponse)
    }

    if (conditionTag === 'if excluded') {
      return hasMeaningfulSelection(controllingResponse)
    }

    if (conditionTag.startsWith('if ')) {
      const token = conditionTag.replace('if ', '').trim()
      if (!token) return true
      return controllingText.includes(token)
    }

    return true
  }

  return (
    <div
      id={anchorId}
      className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h4 className="text-base font-semibold text-[#1B3A5C]">{title}</h4>
      <div className="mt-3 space-y-2">
        {parsedItems.map((item, itemIndex) => {
          if (!isItemVisible(itemIndex)) return null
          const response = responses[item.prompt]

          return (
            <div
              key={item.prompt}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {item.parsed.questionText}
              </p>

              {item.parsed.fieldType === 'single-select' && (
                <select
                  value={typeof response === 'string' ? response : item.parsed.options[0] ?? ''}
                  onChange={(event) => setResponse(item.prompt, event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  {item.parsed.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {item.parsed.fieldType === 'multi-select' && (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {item.parsed.options.map((option) => {
                    const selectedValues = Array.isArray(response) ? response : []
                    const checked = selectedValues.includes(option)
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const nextSelected = checked
                              ? selectedValues.filter((value) => value !== option)
                              : [...selectedValues, option]
                            setResponse(item.prompt, nextSelected)
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {item.parsed.fieldType === 'numeric' && (
                <input
                  type="number"
                  value={typeof response === 'string' ? response : '0'}
                  onChange={(event) => setResponse(item.prompt, event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                />
              )}

              {item.parsed.fieldType === 'free-text-short' && (
                <input
                  type="text"
                  value={typeof response === 'string' ? response : ''}
                  onChange={(event) => setResponse(item.prompt, event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                />
              )}

              {item.parsed.fieldType === 'free-text-long' && (
                <textarea
                  rows={3}
                  value={typeof response === 'string' ? response : ''}
                  onChange={(event) => setResponse(item.prompt, event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                />
              )}

              {(item.parsed.fieldType === 'table-input' ||
                item.parsed.fieldType === 'dynamic-form') && (
                <textarea
                  rows={3}
                  value={typeof response === 'string' ? response : ''}
                  onChange={(event) => setResponse(item.prompt, event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                />
              )}

              {item.parsed.fieldType === 'unknown' && (
                <p className="mt-1 text-sm text-slate-800">{item.value}</p>
              )}
            </div>
          )
        })}
      </div>
      {previewQuestionId && onOpenFinding ? (
        <div className="mt-3">
          <EnrichmentPreviewBox questionId={previewQuestionId} onOpenFinding={onOpenFinding} />
        </div>
      ) : null}
    </div>
  )
}

function EngagementOverviewScreen({
  demoGuide,
  onOpenInterviewGuide,
}: {
  demoGuide: DemoGuideState
  onOpenInterviewGuide: () => void
}) {
  const [showFullBriefing, setShowFullBriefing] = useState(false)
  const [showUnavailableGuideTip, setShowUnavailableGuideTip] = useState<string | null>(null)
  const interviewLogEntries = [
    {
      stakeholder: 'VM Program Owner',
      date: 'Feb 11, 2026',
      topics: 'Program operations, capacity, workflow',
      availableInDemo: true,
    },
    {
      stakeholder: 'IT Operations Manager',
      date: 'Feb 11, 2026',
      topics: 'Remediation process, patching, change management',
      availableInDemo: false,
    },
    {
      stakeholder: 'CISO',
      date: 'Feb 12, 2026',
      topics: 'Strategy, risk appetite, executive priorities',
      availableInDemo: false,
    },
    {
      stakeholder: 'Compliance Analyst',
      date: 'Feb 12, 2026',
      topics: 'Regulatory requirements, audit findings, evidence gaps',
      availableInDemo: false,
    },
  ] as const

  return (
    <section className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-[#1B3A5C]">Engagement metadata</h3>
          <DemoCallout
            id="callout-engagement-overview"
            demoGuide={demoGuide}
            className="right-3 top-3"
            text="The consultant's workspace for managing the engagement. Shows metadata, activity summary, key decisions, delivery timeline, and the Pre-Engagement Briefing that was auto-generated before the consultant met the customer."
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MetaItem label="Customer" value={meridianData.companyName} />
            <MetaItem label="Model" value={meridianData.engagement.model} />
            <MetaItem label="Consultant" value={meridianData.engagement.consultant} />
            <MetaItem label="Duration" value={meridianData.engagement.duration} />
            <MetaItem label="Status" value={meridianData.engagement.status} />
            <MetaItem
              label="Interview count"
              value={`${meridianData.engagement.interviewsConducted.length}`}
            />
          </div>
        </div>

        <div className="rounded-xl border border-orange-200 bg-[#FFF3E0] p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B3A5C]">Activity Summary</h3>
          <p className="mt-2 text-xs text-slate-600">
            Interview: 9 of 39 questions answered, 8 promoted to assessment outputs.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>20 baseline findings reviewed</li>
            <li>6 annotations added</li>
            <li>1 score override applied</li>
            <li>2 custom findings created</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Key Decisions Made</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              Score override on Finding 2.5 (Scan Exclusions): 2.0 to 3.0
            </p>
            <p className="mt-1">
              OT exclusions validated as technically necessary. Remaining exclusions need governance,
              but true posture is better than automated score implies.
            </p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              Custom Finding: Executive Sponsorship Gap (High severity)
            </p>
            <p className="mt-1">
              VM program lacks organizational authority to drive remediation. Program owner reports
              through two layers of management with no escalation path.
            </p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              Custom Finding: Credential Architecture Risk (Medium severity)
            </p>
            <p className="mt-1">
              Domain admin credentials used for Windows network scans. Compromise would provide full
              domain access.
            </p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              Key Recommendation: Immediate ServiceNow automation
            </p>
            <p className="mt-1">
              Manual ticket creation introduces 1-2 week handoff lag. Automating this single step
              would have the largest impact on remediation velocity.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Engagement Timeline</h3>
        <div className="mt-4 space-y-4">
          <div className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500" />
            <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Feb 10</p>
              <p>
                Engagement initialized. Automated Baseline data collection completed (45 minutes).
                Pre-Engagement Briefing auto-generated.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500" />
            <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Feb 11</p>
              <p>
                Interviews: VM Program Owner (morning), IT Operations Manager (afternoon).
                Organizational Context questionnaire completed with program owner input. Initial
                finding review and annotation begun.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500" />
            <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Feb 12</p>
              <p>
                Interviews: CISO (morning), Compliance Analyst (afternoon). Finding review completed.
                Score override applied to Finding 2.5. Custom findings drafted (Credential
                Architecture Risk, Executive Sponsorship Gap).
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-green-500" />
            <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Feb 13</p>
              <p>
                Report narrative drafted and refined. Roadmap finalized. Deliverables prepared.
                Report delivered to Meridian Financial Services.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Interview Log</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          {interviewLogEntries.map((entry) => (
            <div key={entry.stakeholder} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              {entry.availableInDemo ? (
                <button
                  type="button"
                  onClick={onOpenInterviewGuide}
                  className="text-left text-[#2E75B6] hover:underline"
                >
                  {entry.stakeholder}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowUnavailableGuideTip(entry.stakeholder)
                    window.setTimeout(() => setShowUnavailableGuideTip(null), 1800)
                  }}
                  className="text-left text-[#2E75B6] hover:underline"
                >
                  {entry.stakeholder}
                </button>
              )}
              <span className="text-slate-500"> - {entry.date} - {entry.topics}</span>
              {showUnavailableGuideTip === entry.stakeholder && !entry.availableInDemo && (
                <p className="mt-1 text-xs text-slate-500">
                  Interview guide available in production. This demo includes the VM Program Owner
                  guide.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-orange-200 bg-[#FFF3E0] p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Pre-Engagement Briefing</h3>
        {!showFullBriefing ? (
          <>
            <p className="mt-3 text-sm text-slate-700">
              Meridian Financial Services. 15,000-asset environment, 12,000 licensed in Tenable VM,
              deployed 2.5 years ago. Financial services, PCI DSS and SOX obligations.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Key data points before your first conversation: True environment coverage is 62%...
            </p>
            <button
              type="button"
              onClick={() => setShowFullBriefing(true)}
              className="mt-2 text-sm font-medium text-[#2E75B6] hover:underline"
            >
              Show full briefing
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-700">
              Meridian Financial Services. 15,000-asset environment, 12,000 licensed in Tenable VM,
              deployed 2.5 years ago. Financial services, PCI DSS and SOX obligations.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Key data points before your first conversation: True environment coverage is 62%
              (approximately 3,150 invisible assets). Authenticated scan rate is 61% but achievable
              rate may be higher if network devices are factored out. Median Critical TTR is 52 days
              and worsening. Vulnerability backlog growing by approximately 400 per month. 7
              permanent scan exclusions, 2 covering OT. All scan policies are default templates. 82%
              of platform activity from one user. No compliance scan policies despite PCI/SOX.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Recommended interview focus: Why has the platform not evolved since deployment? What
              is the remediation workflow end-to-end? Who owns the program and do they have authority
              to drive remediation? What is the third-party patching situation?
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Priority hypotheses to test: Manual ServiceNow workflow is the primary remediation
              bottleneck. CVSS-first prioritization is inherited, not deliberate. The program owner is
              a single point of failure without organizational support.
            </p>
            <button
              type="button"
              onClick={() => setShowFullBriefing(false)}
              className="mt-2 text-sm font-medium text-[#2E75B6] hover:underline"
            >
              Show less
            </button>
          </>
        )}
      </div>
    </section>
  )
}

function InterviewGuideScreen({
  interviewResponses,
  observationResponses,
  closingResponses,
  onOpenFindingAnchor,
  onOpenReportSection,
  onChangeInterviewResponse,
  onChangeObservationResponse,
  onChangeClosingResponse,
  demoGuide,
}: {
  interviewResponses: InterviewResponseMap
  observationResponses: ObservationResponseMap
  closingResponses: ClosingResponseMap
  onOpenFindingAnchor: (findingId: string, anchorId: string) => void
  onOpenReportSection: (sectionId: string) => void
  onChangeInterviewResponse: (findingId: keyof InterviewResponseMap, value: string) => void
  onChangeObservationResponse: (promptId: keyof ObservationResponseMap, value: string) => void
  onChangeClosingResponse: (promptId: keyof ClosingResponseMap, value: string) => void
  demoGuide: DemoGuideState
}) {
  const findingQuestionGroups: Array<{
    domainLabel: string
    items: Array<{
      findingId: keyof InterviewResponseMap
      metric: string
      question: string
    }>
  }> = [
    {
      domainLabel: 'Asset Visibility',
      items: [
        {
          findingId: '1.1',
          metric: 'True coverage: 62%, ~3,150 assets invisible',
          question:
            'Your environment has approximately 3,150 assets that Tenable has no visibility into. Do you know where these are? Are they in network segments your scanners cannot reach, or are they systems that were never onboarded?',
        },
        {
          findingId: '1.2',
          metric: 'Agent coverage: 72% of managed endpoints, 3,200 without agents',
          question:
            'Your endpoint management tools track 11,400 endpoints but only 8,200 have Nessus Agents. Is there a reason agents were not deployed to the remaining 3,200? Is it a technical barrier, a resourcing issue, or were those systems not identified?',
        },
        {
          findingId: '1.4',
          metric: 'Zero tags map to regulatory scope, PCI/SOX assets unidentifiable',
          question:
            "Your PCI-scoped assets and SOX-relevant systems are not identifiable in Tenable. Has there been a discussion about aligning Tenable's asset tagging with your compliance scope, and if so, what prevented it?",
        },
      ],
    },
    {
      domainLabel: 'Scanning Operations',
      items: [
        {
          findingId: '2.1',
          metric: 'Achievable auth rate: 85%, but 4 scan configs have no credentials',
          question:
            'I see 4 scan configurations running without credentials. Which asset types do these target, and what has prevented adding credentials to them?',
        },
        {
          findingId: '2.3',
          metric: 'Chronic failure scan: failed 4 of last 5 cycles, no monitoring',
          question:
            'One of your scans has failed 4 of its last 5 executions. Were you aware of this before this assessment? How do you currently find out when a scan fails?',
        },
        {
          findingId: '2.4',
          metric: 'All 8 scans use default template, prior production disruption',
          question:
            'All your scans use the default Basic Network Scan template, and there was a scan-related disruption to a production database. After that incident, was there a discussion about adjusting scan policies for sensitive systems?',
        },
        {
          findingId: '2.5',
          metric: '5 of 7 permanent exclusions unjustified, covering ~2,800 hosts',
          question:
            'Five of your permanent scan exclusions have no documented justification. Do you know the history behind these? Are the systems they cover still in the environment?',
        },
      ],
    },
    {
      domainLabel: 'Risk Prioritization',
      items: [
        {
          findingId: '3.2',
          metric: 'CVSS prioritization inherited from defaults, team unaware of VPR',
          question:
            "Your prioritization follows CVSS severity, which appears to be the default rather than a deliberate choice. Has your team evaluated Tenable's VPR as an alternative, and if not, would you be open to seeing how it would change your prioritization?",
        },
        {
          findingId: '3.3',
          metric: '22% recurrence rate, base images updated annually',
          question:
            'About a fifth of your remediated vulnerabilities are reappearing. Your base images are updated annually. Has the team connected these two issues, and is there a plan to update images more frequently?',
        },
      ],
    },
    {
      domainLabel: 'Remediation',
      items: [
        {
          findingId: '4.1',
          metric: 'Median Critical TTR: 52 days vs. 15-day SLA, worsening trend',
          question:
            'Your team targets 15 days for Critical remediation but the actual median is 52 days. Where in the workflow does the time go? Is it detection-to-ticket, ticket-to-assignment, or assignment-to-patching?',
        },
        {
          findingId: '4.2',
          metric: '~120 informally accepted risks, no expiration, backlog growing by 400/month',
          question:
            'Your backlog is growing by about 400 vulnerabilities per month. Of the open vulnerabilities, roughly 120 appear to be informally accepted. Is there a process for deciding which vulnerabilities to accept, and who has that authority?',
        },
        {
          findingId: '4.3',
          metric: 'OS-to-third-party fix ratio 3:1, no third-party patching process',
          question:
            'Your OS patching is automated through SCCM, but there is no process for third-party applications like Java and Adobe. Has this been raised as a gap, and what would be needed to establish a process?',
        },
      ],
    },
    {
      domainLabel: 'Program Governance',
      items: [
        {
          findingId: '5.1',
          metric: '82% activity from one user, primary owner two layers below CISO',
          question:
            'The data shows 82% of all platform activity comes from your account. If you were unavailable for an extended period, who would manage the program? And when you need IT to remediate something, what happens when they push back?',
        },
        {
          findingId: '5.2',
          metric: '75% of scan configs unmodified since creation, no capability tracking',
          question:
            'Most of your scan configurations have not been changed since initial deployment. Has there been a deliberate review of whether the original setup still matches your current environment?',
        },
      ],
    },
    {
      domainLabel: 'Ecosystem Integration',
      items: [
        {
          findingId: '6.1',
          metric: 'ServiceNow: manual CSV export, Splunk: dashboard only',
          question:
            'Your ServiceNow integration operates through manual CSV export rather than automated sync. Was automated integration ever explored? And the data sent to Splunk does not appear to be used for alert correlation. Is the SOC aware they have vulnerability data available?',
        },
      ],
    },
  ]

  const patternQuestions: Array<{
    id: keyof InterviewResponseMap
    name: string
    detected: string
    question: string
  }> = [
    {
      id: 'pattern-1',
      name: 'Platform Under-Optimization',
      detected:
        'Low tagging maturity (Finding 1.4: 41% tagged, no auto-rules) combined with default ACR (Finding 1.4: all defaults) and inherited CVSS-first prioritization (Finding 3.2: never deliberately chosen). Together these indicate the platform is technically deployed but has never been strategically configured. Multiple operational findings trace back to this single root pattern.',
      question:
        'Your Tenable deployment appears to be running on its original configuration without optimization. Several findings in this assessment, from tagging gaps to prioritization to compliance scanning, trace back to this. What has prevented the team from evolving the setup? Is it a resource constraint, a knowledge gap, or has it simply not been a priority?',
    },
    {
      id: 'pattern-2',
      name: 'Single Point of Failure Compounding',
      detected:
        "Platform activity concentrated in one person (Finding 5.1: 82% from one user) combined with platform on autopilot (Finding 5.2: 75% configs stale, 8% human activity ratio) and no knowledge management (Q5.5: self-taught, no SOPs, no knowledge transfer plan). Together these indicate the program's continuity depends entirely on one individual with no documentation, no backup, and no formal training. This is not just a key-person dependency. It is an organizational fragility that affects every aspect of the program.",
      question:
        'The data shows that your VM program effectively runs through one person, with no documented procedures and no cross-training. If that person were unavailable tomorrow, what would happen? And is the organization aware of this concentration risk, or is it something that has developed gradually without anyone noticing?',
    },
    {
      id: 'pattern-3',
      name: 'Detection-to-Action Disconnect',
      detected:
        'Manual ServiceNow integration (Finding 6.1: CSV export, not automated sync) combined with data reaching only compliance quarterly (Finding 6.2: no other stakeholders) combined with manual ticket creation lag (Finding 4.3: 1 to 2 week handoff) combined with slow remediation velocity (Finding 4.1: 52-day Critical TTR). Together these indicate that vulnerability data is being generated but is not flowing to the people who need to act on it. The remediation velocity problem is not a patching capacity problem at its root. It is a data flow and workflow automation problem.',
      question:
        'Your vulnerability data goes through several manual handoff points before it reaches the people who patch systems. The 52-day time-to-remediate for Critical vulnerabilities likely includes significant time just waiting in queues between manual steps. If you could automate one handoff in the chain from detection to remediation, which one would remove the most time?',
    },
    {
      id: 'pattern-4',
      name: 'Remediation Futility Loop',
      detected:
        'Vulnerability recurrence from annual base images (Finding 3.3: 22% recurrence rate) combined with no third-party patching process (Finding 4.3: OS automated but third-party has no process) combined with growing backlog (Finding 4.2: +400/month) combined with worsening velocity trend (Finding 4.1: trend degrading over 6 months). Together these indicate remediation capacity is being consumed from two directions simultaneously: new vulnerabilities arriving faster than they are fixed, and old vulnerabilities reappearing because fixes do not persist. Roughly 20% of remediation effort is being spent on vulnerabilities that were already fixed once.',
      question:
        'Your team is fighting a two-front battle: new vulnerabilities are arriving faster than they are fixed, and about a fifth of what you do fix comes back because of outdated base images. Has the team connected the recurrence problem to the image update cadence? If you could stop the recurrence, that would free up roughly 20% of your remediation capacity to address the backlog. Is updating base images monthly something that is feasible for your team?',
    },
    {
      id: 'pattern-5',
      name: 'Governance Vacuum',
      detected:
        'Leadership not actively governing vulnerability risk (Finding 3.1: acknowledged but not discussed, no business-terms quantification) combined with no regular reporting to leadership (Q5.3: ad-hoc only, security team only) combined with aspirational SLAs with no enforcement (Finding 4.1: no escalation, no tracking) combined with informal risk acceptance (Finding 4.2: no documentation, no expiration) combined with VM not referenced in security strategy (Q6.5: operates independently). Together these indicate the VM program has no organizational mandate. Every operational gap in the assessment persists because there is no governance pressure to close it. Individual contributors cannot fix this alone because the problem is above their level.',
      question:
        "Many of the findings in this assessment are not technical problems. They are organizational ones: no SLA enforcement, no executive reporting, no formal risk acceptance process, no place in the security strategy. These are things that require leadership support to change. Has the CISO been presented with a clear picture of the VM program's current state, and if so, what was the response? If not, what has prevented that conversation from happening?",
    },
  ]

  const observationPromptGroups: Array<{
    domainLabel: string
    items: Array<{ id: keyof ObservationResponseMap; tag: string; text: string }>
  }> = [
    {
      domainLabel: 'Asset Visibility',
      items: [
        {
          id: 'obs-1',
          tag: 'Finding 1.2',
          text: 'Ask the stakeholder to show how a new endpoint gets a Nessus Agent installed. Walk through the process for a server just provisioned through SCCM. Note whether agent deployment is part of the standard build process or a separate manual step that someone has to remember to do.',
        },
        {
          id: 'obs-2',
          tag: 'Finding 1.4',
          text: 'Open the Tenable asset view together and search for a known PCI-scoped system by IP or hostname. Note whether it has any tags, whether the stakeholder can identify which assets are in PCI scope without leaving Tenable, and how long it takes them to answer.',
        },
        {
          id: 'obs-3',
          tag: 'Finding 1.5',
          text: 'Ask to see the Azure connector configuration in Tenable. Check whether the 6-day sync outage has generated any alert or notification. Note whether the stakeholder was aware the connector had stopped syncing before this assessment surfaced it.',
        },
      ],
    },
    {
      domainLabel: 'Scanning Operations',
      items: [
        {
          id: 'obs-4',
          tag: 'Finding 2.1',
          text: 'Ask to see how scan credentials are stored and managed. Note whether they use a vault, a spreadsheet, or individual knowledge. Ask who knows the credentials for the 4 uncredentialed scan configurations and what would happen if that person were unavailable.',
        },
        {
          id: 'obs-5',
          tag: 'Finding 2.3',
          text: 'Ask to view the current Tenable scan schedules and the scan history for the scan that has failed 4 of its last 5 executions. Note whether the stakeholder can navigate to this information easily, and watch their reaction when shown the failure pattern. Were they aware?',
        },
        {
          id: 'obs-6',
          tag: 'Finding 2.5',
          text: 'Ask to see the list of the 5 permanent exclusions that have no documented justification. Ask the stakeholder to walk through each one on the spot and explain whether the excluded systems still exist and whether exclusion is still necessary. Note which ones they can explain and which ones they cannot.',
        },
      ],
    },
    {
      domainLabel: 'Risk Prioritization',
      items: [
        {
          id: 'obs-7',
          tag: 'Finding 3.2',
          text: 'Ask the stakeholder to walk through how they decided which vulnerabilities to remediate this week or this month. Watch the actual process, not the description of it. Note whether they reference VPR, CVSS, asset criticality, or simply work from a list sorted by whatever the default view is.',
        },
        {
          id: 'obs-8',
          tag: 'Finding 3.3',
          text: 'Ask to see the current base image for the most commonly deployed server operating system. Check the patch date on the image. Note whether it confirms the annual update cadence described in the questionnaire, and whether the team has visibility into how outdated their images are.',
        },
      ],
    },
    {
      domainLabel: 'Remediation',
      items: [
        {
          id: 'obs-9',
          tag: 'Finding 4.2',
          text: 'Ask to see documentation for any of the approximately 120 informally accepted risks. Note whether any written record exists at all, whether there is an approval signature or email, and whether anyone can explain the specific compensating controls for a single accepted vulnerability picked at random.',
        },
        {
          id: 'obs-10',
          tag: 'Finding 4.3',
          text: 'Request a recent ServiceNow ticket that was created from a Tenable vulnerability finding. Check when the vulnerability was first detected versus when the ticket was created (confirming or disproving the 1 to 2 week handoff lag). Note how much context from Tenable made it into the ticket: just the CVE number, or full asset details, severity, and remediation guidance?',
        },
      ],
    },
    {
      domainLabel: 'Program Governance',
      items: [
        {
          id: 'obs-11',
          tag: 'Q5.3',
          text: 'Ask to see the most recent vulnerability management report that was shared with the CISO or any leadership audience. Note whether it exists, when it was last produced, what metrics it contains, and whether it includes remediation SLA compliance or just vulnerability counts. If no report exists, note the reaction when asked.',
        },
        {
          id: 'obs-12',
          tag: 'Finding 5.2',
          text: 'Ask the stakeholder to show their actual day-to-day workflow for reviewing new vulnerability findings in Tenable. Watch them do it live rather than describe it. Note which dashboard or view they open, how they sort or filter results, whether they use saved views or start from scratch each time, and how long it takes them to identify the most important items.',
        },
      ],
    },
  ]

  const closingPrompts: Array<{
    id: keyof ClosingResponseMap
    question: string
    purpose: string
  }> = [
    {
      id: 'close-1',
      question: 'What is the biggest VM challenge we have not discussed yet?',
      purpose: 'Universal opener that catches issues structured questions may have missed.',
    },
    {
      id: 'close-2',
      question: 'What is the most frustrating part of your day-to-day vulnerability management work?',
      purpose:
        'Surfaces pain points that data cannot show, often revealing the highest-impact operational blocker.',
    },
    {
      id: 'close-3',
      question:
        'Which team or individual outside the security team has the most impact on whether vulnerabilities actually get fixed?',
      purpose:
        'Reveals informal power structures and identifies where the real remediation bottleneck lives.',
    },
    {
      id: 'close-4',
      question:
        'What has changed about the VM program since the CISO was hired 18 months ago, and what has not changed that should have?',
      purpose: 'Tests whether leadership attention has translated into real program momentum.',
    },
    {
      id: 'close-5',
      question:
        'If the VM program were working the way you want it to in 12 months, what would be different from today?',
      purpose:
        "Captures the stakeholder's success definition to align recommendations with what the customer values most.",
    },
    {
      id: 'close-6',
      question: 'Where would executive support have the greatest impact?',
      purpose:
        'Opens governance discussion and clarifies whether the constraint is authority, resources, visibility, or priority.',
    },
  ]

  const { usedInByInterviewId, usedInByObservationId, usedInByClosingId } = createUsedInMappings(
    onOpenFindingAnchor,
    onOpenReportSection,
  )

  const interviewSections = [
    { id: 'context', label: 'Context' },
    { id: 'finding', label: 'Finding-triggered questions' },
    { id: 'pattern', label: 'Pattern-triggered questions' },
    { id: 'observation', label: 'Observation prompts' },
    { id: 'closing', label: 'Closing prompts' },
  ] as const
  const [activeInterviewSection, setActiveInterviewSection] =
    useState<(typeof interviewSections)[number]['id']>('context')

  return (
    <section className="space-y-6">
      <section className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-[#1B3A5C]">Interview Guide</h2>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Interview Guide Sections
        </p>
        <DemoCallout
          id="callout-interview-main"
          demoGuide={demoGuide}
          className="right-3 top-3"
          text="This entire guide is generated from the customer's assessment data. Every question includes the specific metric that triggered it. Click through the 5 sections (Context, Finding-triggered, Pattern-triggered, Observation, Closing) to see the full interview preparation."
        />
        <AIIndicatorCard
          id={6}
          demoGuide={demoGuide}
          className="right-3 top-28"
          text="AI-personalized in production. The entire guide is generated from assessment data. Currently rule-based question selection with hand-crafted phrasing. AI would personalize question wording based on questionnaire answers, finding combinations, and stakeholder type. The guide adapts to each customer and each stakeholder."
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {interviewSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveInterviewSection(section.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                section.id === activeInterviewSection
                  ? 'border-[#2E75B6] bg-[#2E75B6] text-white'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </section>

      {activeInterviewSection === 'context' && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1B3A5C]">Opening context</h3>
            <p className="mt-3 text-sm text-slate-700">
              Meridian deployed Tenable 2.5 years ago. Scans are running but the program has not been
              actively managed since initial setup. The entire operation runs through one person who lacks
              organizational authority to drive remediation.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Key data points going into this conversation: 3,150 assets with no vulnerability visibility
              (62% true environment coverage), 52-day median TTR for Critical vulnerabilities against a
              15-day internal SLA, no third-party patching process, 22% vulnerability recurrence rate tied
              to annual base image updates, and 5 permanent scan exclusions with no documented
              justification.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              This interview should explore why the program stalled after initial deployment, what the VM
              stakeholders need in terms of resources and authority, and where the biggest quick wins are
              from their perspective.
            </p>
          </div>
        </>
      )}

      {activeInterviewSection === 'finding' && (
        <div className="rounded-xl border border-orange-200 bg-[#FFF3E0] p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B3A5C]">Finding-triggered questions</h3>
          <div className="mt-3 space-y-5">
            {findingQuestionGroups.map((group) => (
              <div key={group.domainLabel} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-[#1B3A5C]">
                    {group.domainLabel}
                  </h4>
                  <span className="rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {group.items.length} {group.items.length === 1 ? 'question' : 'questions'}
                  </span>
                </div>

                <div className="grid gap-3">
                  {group.items.map((item) => (
                    <div
                      key={item.findingId}
                      className="grid gap-3 rounded border border-slate-200 bg-white p-3 lg:grid-cols-2"
                    >
                      <div>
                        <span className="mr-2 rounded-full border border-[#2E75B6]/40 bg-[#2E75B6]/10 px-2 py-0.5 text-xs font-semibold text-[#1B3A5C]">
                          Finding {item.findingId}
                        </span>
                        <span className="text-xs text-slate-500">({item.metric})</span>
                        <p className="mt-2 text-[15px] font-medium text-slate-800">{item.question}</p>
                      </div>
                      <div>
                      <InterviewGuideNotesField
                        value={interviewResponses[item.findingId]}
                        onChange={(value) => onChangeInterviewResponse(item.findingId, value)}
                        usedInDestinations={usedInByInterviewId[item.findingId] ?? []}
                      />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeInterviewSection === 'pattern' && (
        <div className="relative rounded-xl border border-orange-200 bg-[#FFF3E0] p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B3A5C]">Pattern-triggered questions</h3>
          <AIIndicatorCard
            id={2}
            demoGuide={demoGuide}
            className="right-3 top-3"
            text="AI-detected in production. The model analyzes all findings together to identify systemic patterns that no single finding reveals. Currently 5 hard-coded patterns. AI would discover additional patterns unique to each customer's data."
          />
          <div className="mt-3 rounded border border-orange-200 bg-white p-3">
            <div className="grid gap-3">
              {patternQuestions.map((item, index) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded border border-slate-200 bg-white p-3 lg:grid-cols-2"
                >
                  <div className="border-b border-slate-200 pb-2 lg:col-span-2">
                    <span className="mr-2 rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-xs font-semibold text-[#1B3A5C]">
                      Pattern {index + 1}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-xs italic text-slate-600">Pattern detected: {item.detected}</p>
                  </div>
                  <div>
                    <p className="mt-2 text-[15px] font-medium text-slate-800">{item.question}</p>
                  </div>
                  <div>
                    <InterviewGuideNotesField
                      value={interviewResponses[item.id]}
                      onChange={(value) => onChangeInterviewResponse(item.id, value)}
                      usedInDestinations={usedInByInterviewId[item.id] ?? []}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeInterviewSection === 'observation' && (
        <div className="rounded-xl border border-orange-200 bg-[#FFF3E0] p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B3A5C]">Observation prompts</h3>
          <p className="mt-2 text-sm text-slate-600">
            Things to ask to see during the interview. Direct observation reveals the gap between
            stated and actual practice.
          </p>
          <div className="mt-3 space-y-4">
            {observationPromptGroups.map((group) => (
              <div key={group.domainLabel} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 border-b border-slate-200 pb-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-[#1B3A5C]">
                    {group.domainLabel}
                  </h4>
                </div>
                <div className="grid gap-3">
                  {group.items.map((item) => (
                    <div key={item.id} className="grid gap-3 rounded border border-slate-200 bg-white p-3 lg:grid-cols-2">
                      <div>
                        <span className="rounded-full border border-[#2E75B6]/40 bg-[#2E75B6]/10 px-2 py-0.5 text-xs font-semibold text-[#1B3A5C]">
                          {item.tag}
                        </span>
                        <p className="mt-2 text-sm text-slate-700">{item.text}</p>
                      </div>
                      <div>
                      <InterviewGuideNotesField
                        value={observationResponses[item.id]}
                        onChange={(value) => onChangeObservationResponse(item.id, value)}
                        usedInDestinations={usedInByObservationId[item.id] ?? []}
                      />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeInterviewSection === 'closing' && (
        <div className="relative rounded-xl border border-orange-200 bg-[#FFF3E0] p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B3A5C]">Closing prompts</h3>
          <DemoCallout
            id="callout-interview-prepopulated"
            demoGuide={demoGuide}
            className="right-3 top-3"
            text="Some questions have pre-populated answers from the Meridian engagement. Look for the 'Used in:' links below answers showing where interview notes became annotations, score overrides, or custom findings in the assessment. This demonstrates the complete chain from interview to deliverable."
          />
          <p className="mt-2 text-sm text-slate-600">
            Open-ended questions to close the interview. Select 2 to 3 based on the conversation.
            These surface what structured questions miss.
          </p>
          <div className="mt-3 grid gap-3">
            {closingPrompts.map((item, index) => (
              <div key={item.id} className="grid gap-3 rounded border border-slate-200 bg-slate-50 p-3 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {index + 1}. {item.question}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">Purpose: {item.purpose}</p>
                </div>
                <div>
                  <InterviewGuideNotesField
                    value={closingResponses[item.id]}
                    onChange={(value) => onChangeClosingResponse(item.id, value)}
                    usedInDestinations={usedInByClosingId[item.id] ?? []}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function ExpansionOpportunitiesScreen({
  onOpenFinding,
  onOpenFindingAnchor,
  onOpenReportSection,
  onOpenQuestionnaireQuestion,
  demoGuide,
}: {
  onOpenFinding: (findingId: string) => void
  onOpenFindingAnchor: (findingId: string, anchorId: string) => void
  onOpenReportSection: (sectionId: string) => void
  onOpenQuestionnaireQuestion: (
    domainId: 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6',
    questionAnchorId: string,
  ) => void
  demoGuide: DemoGuideState
}) {
  type EvidenceTarget =
    | { type: 'finding'; id: string }
    | { type: 'finding-anchor'; id: string; anchorId: string }
    | { type: 'questionnaire-question'; domainId: 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6'; questionAnchorId: string }
    | { type: 'report-section'; id: string }

  interface EvidenceItem {
    lead: string
    linkLabel?: string
    tail?: string
    target?: EvidenceTarget
  }

  const openEvidenceTarget = (target: EvidenceTarget) => {
    if (target.type === 'finding') {
      onOpenFinding(target.id)
      return
    }
    if (target.type === 'finding-anchor') {
      onOpenFindingAnchor(target.id, target.anchorId)
      return
    }
    if (target.type === 'questionnaire-question') {
      onOpenQuestionnaireQuestion(target.domainId, target.questionAnchorId)
      return
    }
    onOpenReportSection(target.id)
  }

  const questionnaireToTarget: Record<string, EvidenceTarget> = {
    'Q1.1': { type: 'questionnaire-question', domainId: 'd1', questionAnchorId: 'questionnaire-q1-1' },
    'Q1.5': { type: 'questionnaire-question', domainId: 'd1', questionAnchorId: 'questionnaire-q1-5' },
    'Q2.3': { type: 'questionnaire-question', domainId: 'd2', questionAnchorId: 'questionnaire-q2-3' },
    'Q2.4': { type: 'questionnaire-question', domainId: 'd2', questionAnchorId: 'questionnaire-q2-4' },
    'Q4.3': { type: 'questionnaire-question', domainId: 'd4', questionAnchorId: 'questionnaire-q4-3' },
    'Q5.1': { type: 'questionnaire-question', domainId: 'd5', questionAnchorId: 'questionnaire-q5-1' },
    'Q6.4': { type: 'questionnaire-question', domainId: 'd6', questionAnchorId: 'questionnaire-q6-4' },
    'Q6.5': { type: 'questionnaire-question', domainId: 'd6', questionAnchorId: 'questionnaire-q6-5' },
  }

  const signals: Array<{
    product: string
    strength: 'Strong' | 'Moderate' | 'Exploratory'
    evidence: EvidenceItem[]
    customerNeed: string
    conversationApproach: string
  }> = [
    {
      product: 'Tenable VM License Expansion',
      strength: 'Strong',
      evidence: [
        {
          lead: '',
          linkLabel: 'Finding 1.1',
          tail: ': 15,000 expected assets vs. 12,000 licensed (~3,000 gap)',
          target: { type: 'finding', id: '1.1' },
        },
        {
          lead: '',
          linkLabel: 'Finding 1.2',
          tail: ': 3,200 managed endpoints without agents',
          target: { type: 'finding', id: '1.2' },
        },
        {
          lead: '',
          linkLabel: 'Q1.1',
          tail: ': questionnaire response confirming environment size',
          target: questionnaireToTarget['Q1.1'],
        },
      ],
      customerNeed:
        'Approximately 3,150 assets have zero vulnerability visibility. Closing this gap is the highest-priority recommendation and requires additional licensed capacity.',
      conversationApproach:
        'Surface this during roadmap planning: onboarding the missing asset population and deploying agents naturally leads to license right-sizing.',
    },
    {
      product: 'Tenable OT Security',
      strength: 'Strong',
      evidence: [
        {
          lead: '',
          linkLabel: 'Finding 2.5',
          tail: ': two permanent OT exclusions',
          target: { type: 'finding', id: '2.5' },
        },
        {
          lead: '',
          linkLabel: 'Finding 2.5',
          tail: ': Layer 3 annotation: PLC disruption from active scanning',
          target: { type: 'finding-anchor', id: '2.5', anchorId: 'annotation-2.5-ot' },
        },
        {
          lead: '',
          linkLabel: 'Q2.4',
          tail: ': context: no alternative OT visibility approach',
          target: questionnaireToTarget['Q2.4'],
        },
      ],
      customerNeed:
        'OT/manufacturing has zero vulnerability visibility. Active scanning is rightly excluded, but no compensating visibility control exists.',
      conversationApproach:
        'Lead with trust: keep the exclusion. Then frame the gap: passive monitoring can provide vulnerability awareness without production disruption.',
    },
    {
      product: 'Tenable Web App Scanning',
      strength: 'Moderate',
      evidence: [
        {
          lead: '',
          linkLabel: 'Finding 2.4',
          tail: ': all scans use default Basic Network Scan template',
          target: { type: 'finding', id: '2.4' },
        },
        {
          lead: '',
          linkLabel: 'Q2.3',
          tail: ': context: customer-facing web applications in scope',
          target: questionnaireToTarget['Q2.3'],
        },
        {
          lead: 'Prior scan disruption on production database indicates sensitive app stack',
        },
      ],
      customerNeed:
        'Application-layer vulnerabilities are not assessed through current network scanning workflows.',
      conversationApproach:
        'Raise this in scan-policy tuning: infrastructure scans do not test app-layer weaknesses; ask how customer-facing applications are being assessed.',
    },
    {
      product: 'Tenable Cloud Security (CNAPP)',
      strength: 'Moderate',
      evidence: [
        {
          lead: '',
          linkLabel: 'Finding 1.5',
          tail: ': 2,800 cloud instances across AWS/Azure',
          target: { type: 'finding', id: '1.5' },
        },
        {
          lead: '',
          linkLabel: 'Q1.5',
          tail: ': IaC and auto-scaling provisioning model',
          target: questionnaireToTarget['Q1.5'],
        },
        {
          lead: 'Azure outage left ~800 instances unmonitored for 6 days',
        },
      ],
      customerNeed:
        'Connector and agent workflows may not fully cover ephemeral cloud workloads, IaC risk, and cloud-native configuration exposure.',
      conversationApproach:
        'After connector stabilization, ask whether current controls keep pace with cloud velocity and whether cloud-native misconfiguration risk is being assessed.',
    },
    {
      product: 'Tenable Attack Surface Management',
      strength: 'Exploratory',
      evidence: [
        {
          lead: '',
          linkLabel: 'Finding 6.2',
          tail: ': vulnerability sharing is internally focused',
          target: { type: 'finding', id: '6.2' },
        },
        {
          lead: '',
          linkLabel: 'Finding 1.3',
          tail: ': partner-facing DMZ coverage gap',
          target: { type: 'finding', id: '1.3' },
        },
        {
          lead: '',
          linkLabel: 'Q6.5',
          tail: ': broader security alignment still developing',
          target: questionnaireToTarget['Q6.5'],
        },
      ],
      customerNeed:
        'Internal scanning is mature enough to act on, but outside-in exposure visibility is limited.',
      conversationApproach:
        'Position as follow-on advisory: ask what an external attacker currently sees and whether internet-facing asset discovery is continuously monitored.',
    },
    {
      product: 'Tenable Identity Exposure',
      strength: 'Exploratory',
      evidence: [
        {
          lead: 'Custom finding: ',
          linkLabel: 'Credential Architecture Risk',
          tail: ' (domain admin used for scans)',
          target: { type: 'report-section', id: 'custom-finding-credential-architecture-risk' },
        },
        {
          lead: '',
          linkLabel: 'Q4.3',
          tail: ': Group Policy is central to configuration operations',
          target: questionnaireToTarget['Q4.3'],
        },
        {
          lead: '',
          linkLabel: 'Q6.4',
          tail: ': threat-intelligence/IR alignment is weak',
          target: questionnaireToTarget['Q6.4'],
        },
      ],
      customerNeed:
        'Credential governance and AD-centric attack-path risk likely extend beyond server patch visibility.',
      conversationApproach:
        'Use credential architecture as the entry point: ask whether AD configuration and identity attack paths have been assessed beyond infrastructure vulnerability scans.',
    },
  ]

  const strengthBadge = (strength: 'Strong' | 'Moderate' | 'Exploratory') => {
    if (strength === 'Strong') return 'bg-green-100 text-green-800 border-green-200'
    if (strength === 'Moderate') return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return (
    <section className="space-y-6">
      <div className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-[#1B3A5C]">Expansion Opportunities</h2>
        <DemoCallout
          id="callout-expansion-opportunities"
          demoGuide={demoGuide}
          className="right-3 top-3"
          text="This page is visible only in Consultant View. It surfaces product expansion signals detected from assessment data, giving the consultant intelligence for account planning conversations. Customers never see this content."
        />
        <p className="mt-2 text-sm text-slate-600">
          Product expansion signals detected from assessment data. Consultant-only intelligence
          brief for account planning.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Based on Meridian Financial Services assessment data. Signals are derived from Automated
          Baseline findings, Organizational Context questionnaire responses, and Advanced Analysis
          observations.
        </p>
      </div>

      <div className="relative space-y-4">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Product Expansion Signals</h3>
        <AIIndicatorCard
          id={9}
          demoGuide={demoGuide}
          className="right-3 top-3"
          text="AI-detected in production. Currently 6 hard-coded signals derived from known Tenable product alignments. AI would analyze findings and questionnaire responses to detect expansion signals dynamically, including signals not anticipated in the design, and would refine signal strength and conversation approaches based on the full customer context."
        />
        {signals.map((signal) => (
          <div key={signal.product} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-base font-semibold text-slate-900">{signal.product}</h4>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${strengthBadge(signal.strength)}`}>
                {signal.strength}
              </span>
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold text-slate-900">Assessment evidence:</span>
              </p>
              <ul className="list-disc space-y-1 pl-5">
                {signal.evidence.map((item) => (
                  <li key={`${signal.product}-${item.lead}-${item.linkLabel ?? ''}`}>
                    {item.lead}
                    {item.linkLabel && item.target ? (
                      <button
                        type="button"
                        onClick={() => openEvidenceTarget(item.target as EvidenceTarget)}
                        className="text-[#2E75B6] hover:underline"
                      >
                        {item.linkLabel}
                      </button>
                    ) : null}
                    {item.tail ?? ''}
                  </li>
                ))}
              </ul>
              <p>
                <span className="font-semibold text-slate-900">Customer security need:</span>{' '}
                {signal.customerNeed}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Conversation approach:</span>{' '}
                {signal.conversationApproach}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReportPreviewScreen({
  role,
  onOpenFinding,
  demoGuide,
}: {
  role: UserRole
  onOpenFinding: (findingId: string) => void
  demoGuide: DemoGuideState
}) {
  const sectionLinks = [
    { id: 'report-executive-summary', label: 'Executive Summary' },
    { id: 'report-score-dashboard', label: 'Score Dashboard' },
    { id: 'report-domain-findings', label: 'Domain Findings' },
    { id: 'report-consultant-annotations', label: 'Consultant Annotations' },
    { id: 'report-consultant-findings', label: 'Consultant Findings' },
    { id: 'report-prioritized-roadmap', label: 'Prioritized Roadmap' },
  ] as const

  const domainScoreBreakdown = [
    { domain: 'Asset Visibility', baseline: 2.8, context: 2.6 },
    { domain: 'Scanning Operations', baseline: 2.6, context: 2.8 },
    { domain: 'Risk Prioritization', baseline: 2.3, context: 2.5 },
    { domain: 'Remediation', baseline: 2.3, context: 2.5 },
    { domain: 'Program Governance', baseline: 2.0, context: 2.2 },
    { domain: 'Ecosystem Integration', baseline: 1.5, context: 1.8 },
  ]
  const highestReportScore = Math.max(
    meridianData.overallScoreBaseline,
    meridianData.overallScoreWithContext,
  )

  return (
    <section className="space-y-6 text-[13.5px] leading-7">
      <div className="relative flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <span className="font-semibold">Sections:</span>
        {sectionLinks.map((section, index) => (
          <span key={section.id}>
            <a href={`#${section.id}`} className="font-medium text-[#2E75B6] hover:text-[#1B3A5C]">
              {section.label}
            </a>
            {index < sectionLinks.length - 1 ? <span className="mx-1 text-slate-400">|</span> : null}
          </span>
        ))}
        <DemoCallout
          id="callout-report-preview"
          demoGuide={demoGuide}
          className="right-3 top-10"
          text="This preview shows how the final consultant deliverable would look. It includes the executive summary, domain scores, annotated findings, custom findings, and the prioritized roadmap. In production, the application generates DOCX, PDF, and PPTX files."
        />
      </div>

      <div
        id="report-executive-summary"
        className="relative scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Executive Summary</h3>
        <AIIndicatorCard
          id={3}
          demoGuide={demoGuide}
          className="right-3 top-3"
          text="AI-generated in production. The model drafts the full narrative from all assessment data: findings, enrichments, annotations, custom findings, interview notes, and roadmap. The consultant refines the draft rather than writing from scratch. Saves approximately 2 hours per engagement."
        />
        <div className="mt-3 space-y-3 text-sm text-slate-700">
          <p>
            Meridian has a vulnerability management program that is running but not thriving. Scans
            execute on schedule, agents cover most endpoints, and the team is dedicated. But the
            program has not evolved since its initial deployment 2.5 years ago, and several critical
            gaps are limiting its effectiveness.
          </p>
          <p>
            Three issues require immediate attention. First, remediation is falling behind: the
            median time to fix Critical vulnerabilities is 52 days against a 15-day internal target,
            and the vulnerability backlog is growing by approximately 400 per month. Second,
            approximately 3,150 assets have no vulnerability visibility at all, meaning risk
            decisions are being made with an incomplete picture of the environment. Third, the
            entire program depends on one person who lacks the organizational authority to drive
            remediation across IT operations.
          </p>
          <p>
            Beyond these urgent issues, the assessment revealed systemic patterns that explain why
            the program stalled. The Tenable platform was configured once at deployment and never
            optimized. Features like VPR-based prioritization, automatic asset tagging, ACR
            customization, and compliance scan policies have been available for years but never
            activated. The ServiceNow integration operates through manual CSV export rather than
            automated sync, introducing a 1 to 2 week lag between vulnerability detection and
            remediation assignment. Vulnerability data does not reach the SOC, IT operations, asset
            owners, or executive leadership in any regular or automated form.
          </p>
          <p>
            The good news is that most of these gaps are fixable without new technology. The Tenable
            platform is capable of significantly more than it is currently being asked to do. The
            recommended roadmap focuses on unlocking existing capabilities, automating manual
            workflows, and establishing the governance structure needed to sustain improvement over
            time.
          </p>
        </div>
      </div>

      <div id="report-score-dashboard" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Score Dashboard</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Overall score snapshot</h4>
            <div className="mt-3">
              <p className="text-4xl font-bold text-[#1B3A5C]">{highestReportScore.toFixed(1)}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Domain score breakdown</h4>
            <div className="mt-3 space-y-2">
              {domainScoreBreakdown.map((row) => (
                <div key={row.domain} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-800">{row.domain}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: getScoreColor(Math.max(row.baseline, row.context)) }}
                  >
                    {Math.max(row.baseline, row.context).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        id="report-domain-findings"
        className="relative scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Domain Findings</h3>
        <AIIndicatorCard
          id={8}
          demoGuide={demoGuide}
          className="right-3 top-3"
          text="AI-generated in production. The model drafts a 2-3 paragraph narrative for each of the 6 domains combining automated findings, questionnaire enrichments, and consultant observations. The consultant reviews and refines. Currently a one-line summary per domain."
        />
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Domain 1 - Asset Visibility &amp; Inventory</p>
            <p className="mt-1 text-sm text-slate-700">
              True environment coverage at 62% with 3,150 invisible assets. Agent deployment gap of
              3,200 endpoints. Tagging does not support compliance scope.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <button type="button" onClick={() => onOpenFinding('1.1')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 1.1</button>
              <span className="text-slate-400">|</span>
              <button type="button" onClick={() => onOpenFinding('1.2')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 1.2</button>
              <span className="text-slate-400">|</span>
              <button type="button" onClick={() => onOpenFinding('1.4')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 1.4</button>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
                Expand domain narrative
              </summary>
              <p className="mt-2 text-sm text-slate-700">
                Coverage and classification control are not yet reliable enough for leadership-grade
                risk reporting. Domain 1 requires visibility closure and compliance-aligned tagging.
              </p>
            </details>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">Domain 2 - Scanning Operations</p>
            <p className="mt-1 text-sm text-slate-700">
              Highlights credentialed scanning gaps, exclusion governance issues, scan failure
              monitoring absence, and policy standardization opportunities.
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Four scan configurations currently execute without credentials, one key scan failed 4
              of its last 5 runs without proactive alerting, and five permanent exclusions remain
              unjustified. All eight scans still use the default template despite a prior
              production-impact incident, indicating policy maturity has not kept pace with
              environment risk.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <button type="button" onClick={() => onOpenFinding('2.1')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 2.1</button>
              <span className="text-slate-400">|</span>
              <button type="button" onClick={() => onOpenFinding('2.3')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 2.3</button>
              <span className="text-slate-400">|</span>
              <button type="button" onClick={() => onOpenFinding('2.5')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 2.5</button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Domain 3 - Risk Prioritization</p>
            <p className="mt-1 text-sm text-slate-700">
              CVSS-first prioritization inherited by default, not deliberately chosen. 22%
              vulnerability recurrence from annual base images. 89 Critical-by-CVSS vulnerabilities
              with low real-world risk consuming remediation effort.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <button type="button" onClick={() => onOpenFinding('3.2')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 3.2</button>
              <span className="text-slate-400">|</span>
              <button type="button" onClick={() => onOpenFinding('3.3')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 3.3</button>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
                Expand domain narrative
              </summary>
              <p className="mt-2 text-sm text-slate-700">
                Prioritization logic is currently tool-default rather than risk-intentional. This
                drives effort into low-value remediation and allows preventable recurrence.
              </p>
            </details>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">Domain 4 - Remediation</p>
            <p className="mt-1 text-sm text-slate-700">
              Shows SLA variance (247% overshoot on Critical), backlog growth (400/month), and
              consultant-validated process bottlenecks (manual ticketing, no third-party patching).
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Interview validation confirms remediation execution is not the primary delay once IT
              receives work. The dominant friction point is the detection-to-ticket handoff window.
              This is compounded by absent third-party patch governance and informal risk acceptance
              without expiration controls.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <button type="button" onClick={() => onOpenFinding('4.1')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 4.1</button>
              <span className="text-slate-400">|</span>
              <button type="button" onClick={() => onOpenFinding('4.2')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 4.2</button>
              <span className="text-slate-400">|</span>
              <button type="button" onClick={() => onOpenFinding('4.3')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 4.3</button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Domain 5 - Program Governance</p>
            <p className="mt-1 text-sm text-slate-700">
              Program depends on one person with no organizational authority. Platform on autopilot
              since deployment. No regular reporting to leadership. Self-taught team with no SOPs.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <button type="button" onClick={() => onOpenFinding('5.1')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 5.1</button>
              <span className="text-slate-400">|</span>
              <button type="button" onClick={() => onOpenFinding('5.2')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 5.2</button>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
                Expand domain narrative
              </summary>
              <p className="mt-2 text-sm text-slate-700">
                Governance weakness is the central blocker to sustained improvement. Without explicit
                sponsorship and authority, technical improvements do not persist.
              </p>
            </details>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">Domain 6 - Ecosystem Integration</p>
            <p className="mt-1 text-sm text-slate-700">
              ServiceNow integration is manual CSV export. Splunk receives data but does not use it
              for correlation. Vulnerability data reaches only the compliance team, quarterly. VM not
              referenced in security strategy.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <button type="button" onClick={() => onOpenFinding('6.1')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 6.1</button>
              <span className="text-slate-400">|</span>
              <button type="button" onClick={() => onOpenFinding('6.2')} className="text-[#2E75B6] hover:text-[#1B3A5C]">View Finding 6.2</button>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500">
                Expand domain narrative
              </summary>
              <p className="mt-2 text-sm text-slate-700">
                Integration maturity is currently reporting-oriented rather than operational. The
                workflow does not yet route vulnerability intelligence to response teams in time.
              </p>
            </details>
          </div>
        </div>
      </div>

      <div id="report-consultant-annotations" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Consultant Annotations</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border-l-4 border-orange-300 bg-[#FFF7ED] p-4">
            <h4 className="text-base font-semibold text-[#1B3A5C]">Annotated finding excerpt</h4>
            <p className="mt-2 text-sm font-medium text-slate-900">Finding 4.1: Remediation Velocity</p>
            <p className="mt-1 text-sm text-slate-700">
              Score: 2 (Automated Baseline) | 2 (unchanged by consultant)
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Annotation by Sarah Chen, Senior Security Consultant - February 12, 2026
            </p>
            <p className="mt-2 text-sm text-slate-700">
              "Confirmed through interview with the IT operations manager that the primary bottleneck
              is the manual ServiceNow ticket creation process. Vulnerabilities are detected by
              Tenable automatically, but tickets are created manually by the security team after a
              weekly review cycle. This introduces a 5 to 7 day lag before IT operations even sees
              the remediation request. The actual patching time once IT receives the ticket is
              reasonable (7 to 10 days for Critical). The velocity problem is almost entirely in the
              handoff, not in the remediation execution."
            </p>
          </div>

          <div className="rounded-lg border-l-4 border-orange-300 bg-[#FFF7ED] p-4">
            <h4 className="text-base font-semibold text-[#1B3A5C]">Score override excerpt</h4>
            <p className="mt-2 text-sm font-medium text-slate-900">Finding 2.5: Scan Exclusions</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <span>Original Score: 2 (Automated)</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                Increase
              </span>
              <span>Override Score: 3 (Consultant)</span>
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Override by Sarah Chen, Senior Security Consultant - February 12, 2026
            </p>
            <p className="mt-2 text-sm text-slate-700">
              "Two of the seven permanent exclusions cover the OT/manufacturing network and are
              appropriately documented and technically necessary. Active scanning of PLC controllers
              has caused production disruptions in the past, and passive monitoring is a more
              appropriate approach for this environment. The remaining five exclusions are legacy
              items that need review but are not as severe as the automated score suggests because
              the excluded ranges partially overlap with decommissioned network segments. The
              effective exclusion posture is better than it appears, though governance is still
              needed. Recommend establishing a formal exclusion review process with quarterly
              cadence."
            </p>
          </div>

          <div className="rounded-lg border-l-4 border-orange-300 bg-[#FFF7ED] p-4">
            <h4 className="text-base font-semibold text-[#1B3A5C]">Annotated finding excerpt</h4>
            <p className="mt-2 text-sm font-medium text-slate-900">Finding 6.1: Integration Maturity</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Annotation by Sarah Chen, Senior Security Consultant - February 13, 2026
            </p>
            <p className="mt-2 text-sm text-slate-700">
              "Confirmed with security operations that the ServiceNow export is performed manually
              once per week, creating a predictable delay window between detection and assignment.
              No exception process exists for urgent vulnerabilities discovered mid-cycle. Recommend
              immediate move to automated ticket creation and priority-based routing to close the
              current latency gap."
            </p>
          </div>

          <div className="rounded-lg border-l-4 border-orange-300 bg-[#FFF7ED] p-4">
            <h4 className="text-base font-semibold text-[#1B3A5C]">Annotated finding excerpt</h4>
            <p className="mt-2 text-sm font-medium text-slate-900">Finding 1.2: Agent Coverage</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Annotation by Sarah Chen, Senior Security Consultant - February 13, 2026
            </p>
            <p className="mt-2 text-sm text-slate-700">
              "Observed that agent deployment is not embedded in the standard server provisioning
              process. Teams rely on follow-up requests after build completion, which explains the
              3,200-endpoint gap. Recommend integrating agent installation directly into SCCM build
              templates and adding a weekly variance report for unmanaged systems."
            </p>
          </div>
        </div>
      </div>

      <div id="report-consultant-findings" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Consultant Findings</h3>
        <div className="mt-4 space-y-4">
          <div
            id="custom-finding-credential-architecture-risk"
            className="scroll-mt-24 rounded-lg border-l-4 border-orange-300 bg-[#FFF7ED] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-slate-900">Credential Architecture Risk (Domain 2)</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Medium</span>
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Added by Sarah Chen, Senior Security Consultant - February 12, 2026
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Observation:</span> Scan credentials for Windows network scans use a domain admin account rather than a dedicated scan service account with least-privilege access. This was discovered during a review of scan configurations with the program owner, who confirmed the credentials were set up during initial deployment using an existing admin account for convenience.</p>
              <p><span className="font-semibold text-slate-900">Impact:</span> If this credential is compromised through a scanner vulnerability or network interception, it provides full domain administrative access. The scan credential itself is a security risk that the scanning infrastructure is introducing into the environment.</p>
              <p><span className="font-semibold text-slate-900">Recommendation:</span> Create a dedicated scan service account with only the permissions Nessus requires for credentialed scanning. Remove the domain admin credential from all scan configurations. Document the required permissions and integrate credential management with the organization's vault or privileged access management system.</p>
            </div>
          </div>

          <div
            id="custom-finding-sla-governance-drift"
            className="scroll-mt-24 rounded-lg border-l-4 border-orange-300 bg-[#FFF7ED] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-slate-900">SLA Governance Drift (Domain 4)</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Medium</span>
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Added by Sarah Chen, Senior Security Consultant - February 13, 2026
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Observation:</span> Meridian has written remediation SLAs, but no automated breach alerts, no named escalation owner, and no monthly leadership review of SLA performance.</p>
              <p><span className="font-semibold text-slate-900">Impact:</span> SLA targets operate as guidance rather than controls, allowing Critical remediation timelines to drift without corrective action.</p>
              <p><span className="font-semibold text-slate-900">Recommendation:</span> Implement SLA breach notifications, define accountable escalation owners in IT operations and security leadership, and review SLA compliance monthly with the CISO.</p>
            </div>
          </div>

          <div
            id="custom-finding-executive-sponsorship-gap"
            className="scroll-mt-24 rounded-lg border-l-4 border-orange-300 bg-[#FFF7ED] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-slate-900">Executive Sponsorship Gap (Domain 5)</p>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">High</span>
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Added by Sarah Chen, Senior Security Consultant - February 13, 2026
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Observation:</span> The CISO is supportive of the VM program but has not formally designated it as a priority initiative. The VM program owner reports to a manager who reports to the CISO, creating two layers of indirection. Remediation requests that require IT cooperation have no executive escalation path. When the IT operations team pushes back on patching timelines, the security team has no organizational leverage.</p>
              <p><span className="font-semibold text-slate-900">Impact:</span> Without executive sponsorship, the VM program cannot compel remediation, cannot secure dedicated resources, and cannot establish the governance structures (SLA enforcement, risk acceptance authority, reporting cadence) needed to mature. Every governance finding in this assessment traces back to this gap.</p>
              <p><span className="font-semibold text-slate-900">Recommendation:</span> The CISO should formally designate the VM program as a security priority, establish a direct reporting line for the program owner, and define an escalation path for remediation requests that are not addressed within SLA.</p>
            </div>
          </div>

          <div
            id="custom-finding-soc-visibility-blind-spot"
            className="scroll-mt-24 rounded-lg border-l-4 border-orange-300 bg-[#FFF7ED] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-slate-900">SOC Visibility Blind Spot (Domain 6)</p>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">High</span>
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Added by Sarah Chen, Senior Security Consultant - February 13, 2026
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Observation:</span> Splunk receives vulnerability exports, but the SOC confirmed that these data sets are not referenced in correlation rules, alert triage playbooks, or threat hunting workflows.</p>
              <p><span className="font-semibold text-slate-900">Impact:</span> During incident response, analysts lack vulnerability context that could rapidly prioritize exposed assets and reduce containment time.</p>
              <p><span className="font-semibold text-slate-900">Recommendation:</span> Integrate Tenable asset and vulnerability attributes into Splunk correlation logic and SOC triage views, starting with internet-exposed assets and actively exploited CVEs.</p>
            </div>
          </div>
        </div>
      </div>

      <div
        id="report-prioritized-roadmap"
        className="relative scroll-mt-24 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-[#1B3A5C]">Prioritized Roadmap</h3>
        <AIIndicatorCard
          id={10}
          demoGuide={demoGuide}
          className="right-3 top-3"
          text="AI-sequenced in production. Currently a static list ordered by time horizon. AI would analyze interdependencies between recommendations and suggest optimal implementation order with estimated impact for each item."
        />
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border-l-4 border-red-300 bg-red-50 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-red-800">Immediate (0-30 days)</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Automate ServiceNow ticket creation from Tenable to eliminate the 1 to 2 week manual handoff lag.</li>
              <li>Investigate and resolve the 5 unjustified permanent scan exclusions covering approximately 2,800 hosts.</li>
              <li>Fix the Azure connector sync outage to restore visibility into approximately 800 cloud instances.</li>
              <li>Disable or remove the 2 inactive admin accounts belonging to former employees.</li>
            </ul>
          </div>

          <div className="rounded-lg border-l-4 border-amber-300 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-amber-800">Short-Term (1-3 months)</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Establish a third-party application patching process to address the 3:1 OS-to-third-party fix ratio gap.</li>
              <li>Update base images to monthly cadence to eliminate the 22% vulnerability recurrence rate.</li>
              <li>Configure VPR-based default dashboard views and train the team on risk-based prioritization.</li>
              <li>Create PCI DSS and SOX asset tags with automatic tagging rules for the approximately 1,200 in-scope assets.</li>
            </ul>
          </div>

          <div className="rounded-lg border-l-4 border-blue-300 bg-blue-50 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-800">Medium-Term (3-6 months)</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Deploy Nessus Agents to the 3,200 managed endpoints currently without vulnerability coverage.</li>
              <li>Configure compliance scan policies (CIS benchmarks) for PCI-scoped assets and SOX-relevant systems.</li>
              <li>Implement bidirectional ServiceNow integration with automated ticket status sync back to Tenable.</li>
              <li>Establish monthly VM reporting to the CISO with SLA compliance metrics, backlog trend, and risk exposure summary.</li>
            </ul>
          </div>

          <div className="rounded-lg border-l-4 border-slate-300 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Long-Term (6-12 months)</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Integrate Tenable vulnerability data into Splunk correlation rules to give the SOC vulnerability context during incident investigations.</li>
              <li>Establish formal risk acceptance governance with documented approvals, defined authority, and expiration dates for all accepted risks.</li>
              <li>Formalize the VM program charter with executive sponsorship and dedicated staffing.</li>
              <li>Implement ACR customization for business-critical assets to enable meaningful Asset Exposure Score prioritization.</li>
            </ul>
          </div>
        </div>
      </div>

      {role === 'consultant' && (
        <div className="rounded-xl border border-orange-200 bg-[#FFF3E0] p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1B3A5C]">Consultant report actions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Edit Executive Summary', 'Generate Report', 'Download PPTX'].map((label) => (
              <ProductionButton key={label} label={label} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  )
}

function ProductionButton({ label }: { label: string }) {
  const [showTip, setShowTip] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setShowTip(true)
          window.setTimeout(() => setShowTip(false), 1400)
        }}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400"
      >
        {label}
      </button>
      {showTip && (
        <div className="absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white shadow">
          Available in production
        </div>
      )}
    </div>
  )
}

function PlaceholderScreen({ screen, role }: { screen: ScreenKey; role: UserRole }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-[#1B3A5C]">
        {navItems.find((item) => item.key === screen)?.label}
      </h2>
      <p className="mt-2 max-w-3xl text-slate-600">
        This screen scaffold is active and connected to navigation and role visibility. Next
        iteration will implement the full specification for this view (including three-layer finding
        rendering, questionnaire reactivity, and consultant workflows).
      </p>
      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Active role: <strong>{role === 'customer' ? 'Customer View' : 'Consultant View'}</strong>
      </div>
    </section>
  )
}

export default App
