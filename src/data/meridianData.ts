import type { DemoData } from '../types'

export const meridianData: DemoData = {
  companyName: 'Meridian Financial Services',
  overallScoreBaseline: 2.6,
  overallScoreWithContext: 2.8,
  maturityLabel: 'Developing',
  domainScores: [
    { id: 'd1', name: 'Asset Visibility', score: 2.8 },
    { id: 'd2', name: 'Scanning Operations', score: 2.6 },
    { id: 'd3', name: 'Risk Prioritization', score: 2.3 },
    { id: 'd4', name: 'Remediation', score: 2.3 },
    { id: 'd5', name: 'Program Governance', score: 2.0 },
    { id: 'd6', name: 'Ecosystem Integration', score: 1.5 },
  ],
  findings: [
    {
      id: '1.1',
      domainId: 'd1',
      title: 'Overall Asset Coverage',
      score: 3,
      confidence: 'Medium',
      summary: '11,847 assets in Tenable, 78% scanned in 30 days, 8% stale.',
      storyBeat:
        "Organizations cannot protect what they cannot see. Every asset outside the vulnerability management platform's visibility is an asset where vulnerabilities go undetected, patches go unverified, and risk goes unmeasured. Coverage gaps do not just mean missing data. They mean that security decisions are being made with an incomplete picture of the environment.",
      recommendation:
        'Investigate why unscanned assets are outside visibility, reconcile inventory sources, and prioritize onboarding for missing populations.',
      metrics: [
        { label: 'Assets In Tenable', value: '11,847', numericValue: 11847 },
        { label: 'Scanned In 30 Days', value: '78%', numericValue: 78 },
        { label: 'Stale Assets (90+ Days)', value: '8%', numericValue: 8 },
      ],
      consultantValueIndicator:
        'Approximately 3,150 assets may be outside visibility. A consultant can reconcile CMDB and discovery data to close coverage gaps.',
    },
    {
      id: '1.2',
      domainId: 'd1',
      title: 'Agent Deployment Health',
      score: 3,
      confidence: 'High',
      summary: '8,200 agents deployed; 87% checked in within 24h; 12% outdated.',
      storyBeat:
        'Agents that are deployed but not functioning create a false sense of security. Records show coverage, but data is not flowing. An unhealthy agent population means portions of the environment silently drop out of vulnerability assessment without anyone noticing. This is worse than having no agent at all, because the gap is hidden.',
      recommendation:
        'Remediate stale agent communication, enforce version currency, and ensure every agent is assigned to an operational group.',
      metrics: [
        { label: 'Agents Deployed', value: '8,200', numericValue: 8200 },
        { label: '24h Check-In Rate', value: '87%', numericValue: 87 },
        { label: 'Outdated Agents', value: '12%', numericValue: 12 },
      ],
      consultantValueIndicator:
        'A consultant can identify unmanaged endpoint populations and build an automated deployment plan with endpoint tooling.',
    },
    {
      id: '1.3',
      domainId: 'd1',
      title: 'Scanner Infrastructure',
      score: 3,
      confidence: 'High',
      summary: '6 scanners online; 1 inactive for 45 days; 2 networks unassigned.',
      storyBeat:
        'Scanners are the eyes of a vulnerability management program. Their placement, health, and coverage determine which parts of the network are visible. A scanner that is offline, misconfigured, or positioned in the wrong network segment creates a blind spot that persists until someone investigates, and without monitoring, that can be months.',
      recommendation:
        'Review scanner activity and network assignments, then close uncovered segment gaps with scanner placement or agent alternatives.',
      metrics: [
        { label: 'Scanners Online', value: '6', numericValue: 6 },
        { label: 'Inactive Scanner', value: '1', numericValue: 1 },
        { label: 'Networks Without Scanner', value: '2', numericValue: 2 },
      ],
      consultantValueIndicator:
        'A consultant can validate scanner placement against network topology and redesign coverage for inaccessible segments.',
    },
    {
      id: '1.4',
      domainId: 'd1',
      title: 'Asset Tagging',
      score: 2,
      confidence: 'Medium',
      summary: 'Only 41% assets tagged; no automatic tagging; ACR defaults.',
      storyBeat:
        'Without classification, every asset is treated equally. A development workstation and a payment processing server contribute the same weight to risk scores. Tagging is what allows a vulnerability management program to prioritize by business impact, target scans by asset type, and report by organizational structure. It is the foundation of intelligent prioritization.',
      recommendation:
        'Establish core tag taxonomy (environment, business criticality, compliance scope), automate tag assignment, and customize ACR.',
      metrics: [
        { label: 'Tagged Assets', value: '41%', numericValue: 41 },
        { label: 'Tag Categories', value: '3', numericValue: 3 },
        { label: 'Auto-Tag Rules', value: '0', numericValue: 0 },
      ],
      consultantValueIndicator:
        'A consultant can map compliance and business criticality into a scalable tagging taxonomy with auto-tagging rules.',
    },
    {
      id: '1.5',
      domainId: 'd1',
      title: 'Cloud Connectors',
      score: 3,
      confidence: 'Medium',
      summary: 'AWS connector healthy; Azure connector stale at 6 days.',
      storyBeat:
        'Cloud environments change constantly. Instances are launched, scaled, and terminated in minutes. Without connectors, new cloud assets exist in a window of invisibility between deployment and the next scheduled scan. In auto-scaling environments, some assets may live and die entirely within that window, never scanned at all.',
      recommendation:
        'Validate cloud footprint and restore connector sync reliability to prevent stale cloud asset visibility. As cloud adoption grows and workloads become more ephemeral, connector-based discovery and agent-based scanning may not provide sufficient coverage for containerized workloads, infrastructure-as-code misconfigurations, or cloud-native attack surfaces. Organizations with maturing cloud environments should evaluate whether cloud-native application protection capabilities (CNAPP) are needed to complement traditional VM scanning in the cloud.',
      metrics: [
        { label: 'AWS Connector', value: 'Configured + Syncing' },
        { label: 'Azure Connector', value: 'Configured, Sync Delayed' },
        { label: 'Last Azure Sync', value: '6 days ago', numericValue: 6 },
      ],
      consultantValueIndicator:
        'A consultant can evaluate cloud-account coverage and harden connector configuration for autoscaling environments.',
    },
    {
      id: '2.1',
      domainId: 'd2',
      title: 'Authenticated vs Unauthenticated Scanning',
      score: 2,
      confidence: 'High',
      summary: 'Auth scan rate 61%; 4 scan configs missing credentials.',
      storyBeat:
        'An unauthenticated scan sees the environment the way an external attacker does, from the outside. It typically detects only 10 to 20 percent of what an authenticated scan reveals. When the majority of scans are unauthenticated, vulnerability data significantly understates actual exposure. Decisions made on this data are decisions made on incomplete information.',
      recommendation:
        'Increase credentialed scan coverage where feasible and tune denominator assumptions using non-credentialable asset context.',
      metrics: [
        { label: 'Authenticated Scan Rate', value: '61%', numericValue: 61 },
        { label: 'Configs Without Credentials', value: '4', numericValue: 4 },
        { label: 'Context Adjusted Rate', value: '85%', numericValue: 85 },
      ],
      consultantValueIndicator:
        'A consultant can audit credential architecture and tune per-scan authentication strategy to increase data confidence.',
    },
    {
      id: '2.2',
      domainId: 'd2',
      title: 'Scan Frequency',
      score: 3,
      confidence: 'High',
      summary: '72% scanned within 14 days; 3 missed schedules; 1 abandoned config.',
      storyBeat:
        'The time between scans is the time during which newly published vulnerabilities go undetected. A vulnerability disclosed today that affects a system will not appear in the data until the next scan runs. The longer the gap, the longer the exposure window, and attackers move faster than monthly scan cycles.',
      recommendation:
        'Improve schedule adherence, remove abandoned scan configurations, and align scan cadence to customer-defined asset tiers.',
      metrics: [
        { label: 'Scanned Within 14 Days', value: '72%', numericValue: 72 },
        { label: 'Missed Scheduled Executions', value: '3', numericValue: 3 },
        { label: 'Abandoned Configs', value: '1', numericValue: 1 },
      ],
      consultantValueIndicator:
        'A consultant can align scan cadence to policy and asset criticality while reducing schedule misses.',
    },
    {
      id: '2.3',
      domainId: 'd2',
      title: 'Scan Health and Failure Analysis',
      score: 3,
      confidence: 'High',
      summary: 'Scan success rate 91%; 1 chronic failure; 2 scans exceed 18h.',
      storyBeat:
        'A scan that is configured and scheduled but fails to complete is more dangerous than a scan that does not exist. Failed scans create the illusion of coverage. The schedule shows scanning is happening, but the data is not being produced. Without monitoring scan health, these silent failures can persist for weeks or months.',
      recommendation:
        'Establish automated scan failure alerting, assign scan operations ownership to a specific team member, stagger scan schedules to eliminate concurrent execution on shared scanners, and define formal maintenance windows coordinated with IT operations.',
      metrics: [
        { label: 'Scan Success Rate', value: '91%', numericValue: 91 },
        { label: 'Chronic Failure Scans', value: '1', numericValue: 1 },
        { label: 'Long-Running Scans', value: '2', numericValue: 2 },
      ],
      consultantValueIndicator:
        'Your scan health has operational gaps in monitoring, ownership, response, and resource capacity. A consultant can review your scanner infrastructure, optimize scan scheduling to eliminate contention, and establish a monitoring and response process that catches failures before they create coverage gaps.',
    },
    {
      id: '2.4',
      domainId: 'd2',
      title: 'Scan Policy Analysis',
      score: 3,
      confidence: 'Medium',
      summary: 'All 8 scans use default Basic Network Scan; no custom policies.',
      storyBeat:
        'Scan policies determine what the scanner looks for and how aggressively it searches. A policy that is too generic misses vulnerability categories relevant to the specific environment. A policy that is too aggressive disrupts production systems. The right policy matches the scan depth to the sensitivity and criticality of the target assets.',
      recommendation:
        'Adopt tiered scan policies by asset sensitivity and validate plugin-family coverage for business-critical systems. For customer-facing web applications, standard network vulnerability scanning does not assess application-layer vulnerabilities such as SQL injection, cross-site scripting, or authentication weaknesses. If web applications are a significant part of the attack surface, a dedicated web application scanning capability should be evaluated to provide coverage the current platform does not deliver.',
      metrics: [
        { label: 'Total Scan Configs', value: '8', numericValue: 8 },
        { label: 'Using Default Template', value: '8', numericValue: 8 },
        { label: 'Custom Compliance Policies', value: '0', numericValue: 0 },
      ],
      consultantValueIndicator:
        'A consultant can design tiered policy strategy for critical, standard, and sensitive assets.',
    },
    {
      id: '2.5',
      domainId: 'd2',
      title: 'Scan Exclusions',
      score: 2,
      confidence: 'Medium',
      summary: '9 exclusions total; 7 permanent; 2 broad /16 rules; ~4,100 hosts excluded.',
      storyBeat:
        'Every exclusion is a deliberate decision to not look at something. That decision may be justified, as some systems genuinely cannot tolerate active scanning. But exclusions that are undocumented, permanent, or overly broad become forgotten blind spots where vulnerabilities accumulate unseen. Exclusions require governance because their cost is invisible.',
      recommendation:
        'Implement formal exclusion governance with documented justification, ownership, and periodic review/expiration. The OT/manufacturing network exclusion is technically appropriate because active scanning disrupts PLC controllers. However, the absence of any scanning means this environment has zero vulnerability visibility. Passive monitoring technologies can observe OT network traffic and identify vulnerabilities without sending any packets to the controllers. This approach provides vulnerability awareness for the OT environment without the production disruption risk that necessitated the exclusion.',
      metrics: [
        { label: 'Total Exclusions', value: '9', numericValue: 9 },
        { label: 'Permanent Exclusions', value: '7', numericValue: 7 },
        { label: 'Estimated Hosts Excluded', value: '4,100', numericValue: 4100 },
      ],
      consultantValueIndicator:
        'A consultant can review each exclusion and establish risk-based governance with ownership and expiration.',
    },
    {
      id: '3.1',
      domainId: 'd3',
      title: 'Vulnerability Landscape',
      score: 3,
      confidence: 'High',
      summary: '47,200 open vulns; 312 Critical; 2,847 High; critical age 67 days.',
      storyBeat:
        'Raw vulnerability counts are noise. What matters is what the numbers mean in context: which vulnerabilities represent real exploitable risk, which assets concentrate the most exposure, and whether the situation is improving or deteriorating. Without interpreting the landscape through a risk lens, teams drown in data while the highest-risk issues hide in plain sight.',
      recommendation:
        'Prioritize remediation by exploitability and blast radius, with focused action on aging critical exposures.',
      metrics: [
        { label: 'Open Vulnerabilities', value: '47,200', numericValue: 47200 },
        { label: 'Critical', value: '312', numericValue: 312 },
        { label: 'Mean Critical Age', value: '67 days', numericValue: 67 },
      ],
      consultantValueIndicator:
        'A consultant can convert landscape volume into prioritized remediation waves aligned to exploitability and business impact.',
    },
    {
      id: '3.2',
      domainId: 'd3',
      title: 'VPR Adoption',
      score: 2,
      confidence: 'Medium',
      summary: 'CVSS-driven prioritization; 89 CVSS-critical vulns below 5.0 VPR.',
      storyBeat:
        'Not all critical vulnerabilities are equally dangerous. A vulnerability with a Critical CVSS rating but no known exploit in the wild poses far less immediate risk than a High-rated vulnerability with active exploitation. How an organization decides what to fix first determines whether remediation effort reduces the most risk or merely addresses the highest theoretical severity.',
      recommendation:
        'Shift triage and workflow defaults toward VPR-informed prioritization and reinforce with ACR/tagging improvements.',
      metrics: [
        { label: 'CVSS-Critical / Low-VPR Mismatch', value: '89', numericValue: 89 },
        { label: 'ACR Status', value: 'Default' },
        { label: 'Priority Model', value: 'CVSS-first' },
      ],
      consultantValueIndicator:
        'A consultant can redesign prioritization governance and operational dashboards around VPR and asset context.',
    },
    {
      id: '3.3',
      domainId: 'd3',
      title: 'Vulnerability Recurrence',
      score: 2,
      confidence: 'Medium',
      summary: '22% recurrence; 47 assets with 5+ reopened vulnerabilities.',
      storyBeat:
        'A vulnerability that is fixed and then reappears represents wasted effort. The remediation work was done but the result did not persist. Recurrence typically signals a deeper problem: systems rebuilt from outdated images, configuration management overriding security hardening, or patches rolled back for compatibility. Fixing the recurrence root cause multiplies the return on every future remediation action.',
      recommendation:
        'Identify recurrence root causes in image management and change control, then implement recurring controls.',
      metrics: [
        { label: 'Recurrence Rate', value: '22%', numericValue: 22 },
        { label: 'Assets with 5+ Reopened', value: '47', numericValue: 47 },
        { label: 'Top Recurring Families', value: 'Java, Adobe Plugins' },
      ],
      consultantValueIndicator:
        'A consultant can trace recurrence to base-image hygiene and configuration management issues.',
    },
    {
      id: '4.1',
      domainId: 'd4',
      title: 'Remediation Velocity',
      score: 2,
      confidence: 'High',
      summary: 'Median TTR: Critical 52 days, High 91 days; trend worsening 6 months.',
      storyBeat:
        'The time between detecting a vulnerability and fixing it is the window during which the organization is knowingly exposed. Every day a critical vulnerability remains open after detection is a day an attacker could exploit it. Remediation velocity is the single most direct measure of whether a vulnerability management program translates awareness into action.',
      recommendation:
        'Map detection-to-remediation workflow end to end, remove handoff delays, and enforce SLA-oriented escalation.',
      metrics: [
        { label: 'Median TTR (Critical)', value: '52 days', numericValue: 52 },
        { label: 'Median TTR (High)', value: '91 days', numericValue: 91 },
        { label: 'SLA Overshoot', value: '247%', numericValue: 247 },
      ],
      consultantValueIndicator:
        'A consultant can map workflow bottlenecks and improve ticketing, triage, and escalation to cut TTR.',
    },
    {
      id: '4.2',
      domainId: 'd4',
      title: 'Remediation Coverage',
      score: 2,
      confidence: 'High',
      summary: 'Monthly detection ~1,200 vs fixes ~800; backlog growing by ~400/month.',
      storyBeat:
        'Scanning without fixing is expensive awareness. If an organization detects vulnerabilities faster than it remediates them, the backlog grows indefinitely, and a growing backlog means risk exposure is increasing despite having a vulnerability management program. The fix rate reveals whether the program is keeping pace with the threat landscape or falling behind.',
      recommendation:
        'Increase remediation throughput, formalize risk acceptance governance, and reverse backlog growth trend.',
      metrics: [
        { label: 'Monthly New Findings', value: '~1,200', numericValue: 1200 },
        { label: 'Monthly Fixes', value: '~800', numericValue: 800 },
        { label: 'Backlog Growth', value: '~400 / month', numericValue: 400 },
      ],
      consultantValueIndicator:
        'A consultant can establish capacity planning, fix-rate targets, and risk acceptance governance.',
    },
    {
      id: '4.3',
      domainId: 'd4',
      title: 'Remediation Concentration',
      score: 3,
      confidence: 'Medium',
      summary: 'OS patched 3x faster than third-party; top 20% assets receive 65% effort.',
      storyBeat:
        'Where remediation effort goes matters as much as how much effort is spent. If patching is concentrated on operating system updates while third-party applications and configuration vulnerabilities are ignored, the highest-risk attack vectors may be the ones receiving the least attention. Effective remediation distributes effort in proportion to risk, not in proportion to convenience.',
      recommendation:
        'Establish third-party patch process and rebalance effort toward high-risk findings with stronger risk-reduction yield.',
      metrics: [
        { label: 'OS vs Third-Party Fix Velocity', value: '3x' },
        { label: 'Top 20% Asset Effort Share', value: '65%', numericValue: 65 },
        { label: 'Config Vulns Fix Rate', value: 'Low' },
      ],
      consultantValueIndicator:
        'A consultant can rebalance remediation portfolio toward highest risk-reduction opportunities.',
    },
    {
      id: '5.1',
      domainId: 'd5',
      title: 'Platform User Engagement',
      score: 2,
      confidence: 'Medium',
      summary: '3 active users; 82% activity from one user; 2 inactive admin accounts.',
      storyBeat:
        'A vulnerability management platform is only as effective as the people operating it. When platform activity is concentrated in one or two individuals, the program is one resignation or illness away from halting. The pattern of who uses the platform, how often, and for what purpose reveals whether vulnerability management is an organizational function or a personal effort.',
      recommendation:
        'Platform activity is concentrated in 3 users. If these individuals are unavailable, vulnerability management operations halt. Cross-train additional team members and ensure multiple people can manage scanning, review results, and maintain the platform. You also have 2 admin accounts that have not logged in recently; disable or remove accounts no longer needed and review admin privilege requirements. Organizations managing complex Tenable deployments across multiple network segments, cloud environments, and compliance frameworks may benefit from a centralized management layer that provides role-based access, distributed scan management, and consolidated reporting. If data residency requirements or on-premises management preferences exist, evaluate whether the current cloud-based management model is the best fit or whether an on-premises management console would better serve operational needs.',
      metrics: [
        { label: 'Active Users', value: '3', numericValue: 3 },
        { label: 'Operational Concentration', value: '82%', numericValue: 82 },
        { label: 'Inactive Admin Accounts', value: '2', numericValue: 2 },
        { label: 'Role Distribution', value: '2 admins, 1 standard user' },
      ],
      consultantValueIndicator:
        'Your platform activity is concentrated in 3 users, with 82% of all actions from a single account. A consultant can interview your VM team, assess whether the stated team structure matches actual operational reality, and recommend organizational improvements including role definitions and cross-training plans.',
    },
    {
      id: '5.2',
      domainId: 'd5',
      title: 'Operational Activity Patterns',
      score: 2,
      confidence: 'Medium',
      summary:
        '3 config changes in 90 days; 7 report/dashboard activities; 8% human-initiated ratio; 34 days since last config change; 75% stale configs.',
      storyBeat:
        'A platform that runs on autopilot, with scans executing on schedule but no human review, no configuration updates, and no policy adjustments, is a platform that was configured once and never revisited. Environments change. New assets are deployed, network segments shift, and scan policies that were appropriate two years ago may miss entire categories of current risk. Active management is what keeps the platform aligned with reality.',
      recommendation:
        'Your Tenable platform has had limited configuration evolution and low human oversight. Schedule regular reviews of scan configurations, target ranges, and policies; and establish regular data-consumption cadence so scan output drives action.',
      metrics: [
        { label: 'Config Changes (90 Days)', value: '3', numericValue: 3 },
        { label: 'Report Activity (90 Days)', value: '7', numericValue: 7 },
        { label: 'Human-to-Automated Ratio', value: '8%', numericValue: 8 },
        { label: 'Days Since Last Config Change', value: '34', numericValue: 34 },
        { label: 'Scan Config Staleness', value: '75%', numericValue: 75 },
      ],
      consultantValueIndicator:
        'Your platform shows signs of operating on autopilot - 34 days since the last configuration change and minimal human-initiated activity. A consultant can assess whether your scan configurations still match your environment, identify optimization opportunities accumulated since initial deployment, and establish an ongoing platform management cadence.',
    },
    {
      id: '6.1',
      domainId: 'd6',
      title: 'Integration Activity Indicators',
      score: 2,
      confidence: 'Medium',
      summary:
        '1 service account (ServiceNow), active but irregular; no stale service accounts; low integration regularity.',
      storyBeat:
        'Vulnerability management data that stays inside the scanning platform is data that does not reach the people and systems that need it. Ticketing systems need it to track remediation. SIEMs need it to correlate threats with known vulnerabilities. Leadership dashboards need it to communicate risk. Every missing integration is a break in the chain between detection and action.',
      recommendation:
        'Integration indicators suggest partially functioning architecture. Validate service-account behavior, investigate irregular integration cadence, and prioritize durable automation for ITSM and SIEM flows.',
      metrics: [
        { label: 'Service Account Count', value: '1', numericValue: 1 },
        { label: 'Active Service Accounts (30d)', value: '1', numericValue: 1 },
        { label: 'Stale Service Accounts', value: '0', numericValue: 0 },
        { label: 'Integration Activity Regularity', value: 'Low' },
      ],
      consultantValueIndicator:
        'Your integration indicators suggest partially functioning integrations with low regularity. A consultant can assess your integration architecture, identify broken or manual links, and design a strategy connecting Tenable to your ticketing, SIEM, and reporting ecosystem.',
    },
    {
      id: '6.2',
      domainId: 'd6',
      title: 'Data Export and Sharing Patterns',
      score: 2,
      confidence: 'Medium',
      summary:
        '4 manual exports in 90 days; 0 automated exports; 2 report downloads; 18 days since last export; sporadic pattern.',
      storyBeat:
        'How vulnerability data flows out of the platform determines who knows about the organization\'s exposure and how current their information is. Manual, sporadic exports mean downstream systems work with stale data and stakeholders are unaware of current risk. Automated, regular data flows ensure that everyone who needs vulnerability information has it when they need it.',
      recommendation:
        'Establish automated exports and reporting workflows so vulnerability data consistently reaches downstream systems and stakeholders at operational cadence. Beyond internal data flows, organizations should assess whether their external attack surface is monitored. Internal vulnerability scanning reveals what is vulnerable inside the network. It does not reveal what is exposed to the internet: forgotten subdomains, misconfigured cloud services, exposed development environments, or third-party hosted assets. External attack surface monitoring provides the outside-in view that complements the inside-out vulnerability assessment.',
      metrics: [
        { label: 'Manual Exports (90 Days)', value: '4', numericValue: 4 },
        { label: 'Automated Exports (90 Days)', value: '0', numericValue: 0 },
        { label: 'Report Downloads (90 Days)', value: '2', numericValue: 2 },
        { label: 'Days Since Last Export', value: '18', numericValue: 18 },
        { label: 'Export Regularity', value: 'Sporadic' },
      ],
      consultantValueIndicator:
        'Your data export patterns suggest vulnerability data is shared manually and inconsistently. A consultant can design automated export workflows ensuring the right data reaches the right stakeholders at the right cadence.',
    },
  ],
  questionnaireOnlyFindings: [
    {
      id: 'Q5.3',
      title: 'Reporting and Metrics',
      storyBeat:
        'A vulnerability management program that does not measure and report its performance cannot demonstrate its value, cannot identify trends that require intervention, and cannot justify the resources it needs. When leadership has no visibility into vulnerability exposure, the program competes for attention and budget without evidence, and usually loses.',
    },
    {
      id: 'Q5.4',
      title: 'Continuous Improvement',
      storyBeat:
        'The threat landscape, the technology environment, and the organization itself are constantly changing. A vulnerability management program that was well-designed two years ago may be poorly aligned today. Without a structured process for reviewing and improving the program, it drifts from organizational needs and accumulates technical and process debt that compounds over time.',
    },
    {
      id: 'Q5.5',
      title: 'Training and Knowledge Management',
      storyBeat:
        "The gap between what a platform can do and what the team knows how to do is the gap between potential and realized value. Teams that learn a platform through trial and error typically use a fraction of available capabilities, and undocumented procedures mean the program's effectiveness depends on individual memory rather than organizational knowledge. When key people leave, the knowledge leaves with them.",
    },
    {
      id: 'Q6.3',
      title: 'Compliance and Audit Alignment',
      storyBeat:
        'Vulnerability management is a control required or implied by virtually every compliance framework. When a VM program cannot produce evidence that satisfies auditors, including scanning coverage for in-scope systems, remediation within required timeframes, and documented exception processes, the organization faces audit findings that are entirely preventable with proper configuration and process alignment. For identity infrastructure, standard vulnerability scanning assesses the servers running Active Directory but does not assess the AD configuration itself: misconfigurations in privilege delegation, Kerberoastable accounts, stale admin credentials, or attack paths through nested group memberships. Organizations where Active Directory is the backbone of authentication and authorization should evaluate dedicated identity exposure assessment to cover this critical attack surface.',
    },
    {
      id: 'Q6.4',
      title: 'Threat Intelligence and IR Alignment',
      storyBeat:
        'Vulnerability management and incident response are two sides of the same coin. One identifies weaknesses before they are exploited, the other responds after exploitation occurs. When these functions operate in isolation, incident response cannot assess whether a compromised system had known vulnerabilities, and vulnerability management does not learn from incidents to improve its prioritization. The feedback loop between them multiplies the effectiveness of both.',
    },
    {
      id: 'Q6.5',
      title: 'Broader Security Program Alignment',
      storyBeat:
        'A vulnerability management program operating in isolation is a cost center. A vulnerability management program integrated into the security strategy is a force multiplier. When vulnerability data informs the risk register, shapes security architecture decisions, supports compliance, and feeds the SOC, every dollar spent on scanning produces returns across multiple security functions. Without this alignment, vulnerability management competes for relevance instead of contributing to it.',
    },
  ],
  enrichments: [
    {
      input: 'Expected asset count: 15,000',
      enrichmentEffect: 'Coverage recalculates from 78% to 62%; ~3,150 assets become a headline gap.',
      demoImpact: 'Dramatic visual change in Finding 1.1.',
    },
    {
      input: '28% non-credentialable network devices',
      enrichmentEffect: 'Auth rate recalculates from 61% to 85% achievable.',
      demoImpact: 'Finding 2.1 shifts from red to green.',
    },
    {
      input:
        'Q2.3 Scan Operations Management: monitored periodically, ad-hoc ownership, response by next cycle, no defined maintenance windows, concurrent scheduling, occasional performance issues',
      enrichmentEffect:
        'Finding 2.3 upgrades from failure-rate flagging to root-cause diagnosis across monitoring, ownership, response, and scanner contention.',
      demoImpact: 'Operational discipline gaps become explicit and recommendations become prescriptive.',
    },
    {
      input: 'Remediation SLAs: Critical 15d, High 30d',
      enrichmentEffect: 'Finding 4.1 reframed as 247% SLA overshoot (52 days vs 15 days).',
      demoImpact: 'SLA compliance becomes a KPI.',
    },
    {
      input: 'No formal third-party patching process',
      enrichmentEffect: 'Confirms root cause for third-party remediation gap in Finding 4.3.',
      demoImpact: 'Transitions to process diagnosis.',
    },
    {
      input: 'Q5.1 VM Team Structure and Ownership',
      enrichmentEffect:
        'Finding 5.1 compares stated ownership/FTE model with observed user activity concentration.',
      demoImpact: 'Key-person dependency and governance mismatch become explicit.',
    },
    {
      input: 'Q5.2 Platform Management Practices',
      enrichmentEffect:
        'Finding 5.2 explains autopilot patterns through absent review cadence and weak change process.',
      demoImpact: 'Operational activity findings shift from symptoms to process diagnosis.',
    },
    {
      input: 'Q6.1 Integration Architecture and Status',
      enrichmentEffect:
        'Finding 6.1 confirms whether service-account indicators represent functioning integrations or manual workflows.',
      demoImpact: 'Integration architecture gaps become specific and actionable.',
    },
    {
      input: 'Q6.2 Data Consumption and Reporting Workflows',
      enrichmentEffect:
        'Finding 6.2 clarifies who consumes exported data, how it is shared, and whether cadence is fit for purpose.',
      demoImpact: 'Data-flow utility and staleness risks become visible to leadership.',
    },
  ],
  annotations: [
    {
      findingId: '2.5',
      type: 'Context note',
      author: 'Sarah Chen',
      date: 'Feb 12, 2026',
      text: 'The 10.50.0.0/16 exclusion covers OT manufacturing systems where prior active scans caused PLC resets. Keep this exclusion and adopt passive monitoring for OT.',
    },
    {
      findingId: '4.1',
      type: 'Validation note',
      author: 'Sarah Chen',
      date: 'Feb 12, 2026',
      text: 'Interview validation identified manual ServiceNow ticket creation as primary bottleneck, introducing 5-7 days of delay before IT action begins.',
    },
    {
      findingId: '1.4',
      type: 'Recommendation refinement',
      author: 'Sarah Chen',
      date: 'Feb 12, 2026',
      text: 'Prioritize PCI-scoped assets first (~1,200 assets across 3 segments), configure compliance scan policies, then scale taxonomy approach to the full estate.',
    },
    {
      findingId: '3.2',
      type: 'Context note',
      author: 'Sarah Chen',
      date: 'Feb 12, 2026',
      text: 'CVSS-first behavior appears accidental rather than intentional. Quick win: set default dashboards and workflows to VPR-sorted views.',
    },
    {
      findingId: '6.1',
      type: 'Validation note',
      author: 'Sarah Chen',
      date: 'Feb 13, 2026',
      text: 'Confirmed with the program owner that the ServiceNow integration operates through manual weekly CSV export, not automated API sync. The service account detected in the Automated Baseline is used for manual data pulls, not for automated ticket creation. No exception process exists for urgent vulnerabilities discovered between weekly review cycles. The Splunk integration sends periodic data but the SOC has never been trained to use it for correlation or investigation.',
    },
    {
      findingId: '1.2',
      type: 'Recommendation refinement',
      author: 'Sarah Chen',
      date: 'Feb 13, 2026',
      text: 'Agent deployment can be accelerated by embedding installation in SCCM golden-image and onboarding workflows, then enforcing a weekly exception report for unmanaged endpoints.',
    },
    {
      findingId: '5.1',
      type: 'Validation note',
      author: 'Sarah Chen',
      date: 'Feb 13, 2026',
      text: 'Program owner confirmed single point of failure. No cross-training, no SOPs, no documentation of platform configuration or processes. Manager knows the login but has never operated the platform. If the program owner is unavailable, vulnerability management operations stop completely.',
    },
    {
      findingId: '4.3',
      type: 'Validation note',
      author: 'Sarah Chen',
      date: 'Feb 13, 2026',
      text: 'Full workflow traced through interview: Tenable detection -> weekly security team review -> manual CSV export -> manual ServiceNow ticket creation -> IT ops sprint triage. End-to-end time from detection to IT awareness averages 12-14 days. The program owner spends approximately 4 hours per week on manual ticket creation alone. Automated ticket creation would eliminate the largest single time block in the workflow.',
    },
    {
      findingId: '4.3',
      type: 'Validation note',
      author: 'Sarah Chen',
      date: 'Feb 12, 2026',
      text: 'Reviewed actual ServiceNow ticket INC0047823. Created 9 days after Tenable first detected the vulnerability. Ticket contains only CVE number and hostname - no severity context, no VPR score, no asset criticality, no remediation guidance. Ticket was unassigned for 4 additional days after creation. Total time from detection to first human action by IT: 13 days. Program owner was visibly surprised by the gap when shown the timeline.',
    },
  ],
  scoreOverride: {
    findingId: '2.5',
    fromScore: 2,
    toScore: 3,
    justification:
      'Two permanent exclusions are justified and documented OT protections. Remaining exclusions need governance, but true posture is better than automated score implies.',
  },
  customFindings: [
    {
      id: 'cf-1',
      domainId: 'd5',
      title: 'Executive Sponsorship Gap',
      severity: 'High',
      summary:
        'VM owner lacks escalation authority due to two reporting layers below CISO, limiting cross-functional remediation execution.',
    },
    {
      id: 'cf-2',
      domainId: 'd2',
      title: 'Credential Architecture Risk',
      severity: 'Medium',
      summary:
        'Windows scans use domain admin credentials instead of least-privilege service accounts, increasing compromise blast radius.',
    },
    {
      id: 'cf-3',
      domainId: 'd6',
      title: 'SOC Visibility Blind Spot',
      severity: 'High',
      summary:
        'Vulnerability data is present in Splunk dashboards but not integrated into active correlation rules, reducing incident triage fidelity.',
    },
    {
      id: 'cf-4',
      domainId: 'd4',
      title: 'SLA Governance Drift',
      severity: 'Medium',
      summary:
        'Critical remediation SLA exists as policy text but is not operationally enforced through escalation triggers, owner accountability, or periodic executive review.',
    },
  ],
  engagement: {
    model: 'Guided Assessment (Model B)',
    consultant: 'Sarah Chen, Senior Security Consultant',
    duration: '4 days',
    interviewsConducted: [
      'VM Program Owner',
      'IT Operations Manager',
      'CISO',
      'Compliance Analyst',
    ],
    status: 'Delivered',
  },
}
