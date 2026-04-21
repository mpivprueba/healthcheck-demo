# Tenable HealthCheck Demo - Pre-Demo Checklist

Use this right before presenting to Tenable Professional Services leadership.

## 1) Pre-Flight (5-10 minutes before meeting)

- [ ] Start app locally:
  - `cd "C:\Users\danie\OneDrive\Documents\1 Tenable\Consultant AI Copilot\Cursor Tenable AI Copilot\healthcheck-demo"`
  - `npm run dev`
- [ ] Open app in browser and hard refresh.
- [ ] Confirm header shows:
  - `Tenable HealthCheck`
  - `Meridian Financial Services`
  - `Demo Environment - Meridian Financial Services (Sample Data)`
- [ ] Verify role toggle works and changes visible content:
  - Customer View: Consultant Value Indicators visible
  - Consultant View: Engagement and Interview Guide nav visible
- [ ] Click through all key screens once:
  - Dashboard
  - Findings -> Domain Detail -> Finding Detail
  - Questionnaire
  - Engagement (Consultant View)
  - Interview Guide (Consultant View)
  - Report Preview
- [ ] On Questionnaire, change values and verify Finding Layer 2 recalculates for:
  - Finding `1.1`
  - Finding `2.1`
  - Finding `4.1`
- [ ] Confirm production-only action buttons show click tooltip:
  - `Available in production`
- [ ] Zoom level check:
  - Browser zoom at 100%
  - Window wide enough for full layout (avoid cramped chart labels)

## 2) Demo Goal Reminder (say this up front)

"This is a functional UI demo built with realistic sample data for a fictional customer (Meridian Financial Services). The goal is to show the product experience and engagement value model, not backend/API integration."

## 3) 3-5 Minute Walkthrough Script

## Minute 0:00-0:30 - Frame the story

- "This demo is designed for independent click-through, so each screen explains itself."
- "Everything here uses curated sample data representing a typical HealthCheck engagement profile."

## Minute 0:30-1:30 - Dashboard first impression

- Stay on `Dashboard`.
- Call out:
  - overall score shift (`2.6` baseline -> `2.8` with context)
  - domain score cards
  - critical findings list
  - cross-domain insights (Coverage-Confidence, Risk Reduction Efficiency, Operational Maturity)
- Say:
  - "In under 10 seconds, leadership can see current maturity, urgency, and where consultant depth adds value."

## Minute 1:30-2:30 - Three-layer finding model

- Click a low-score domain card (for example `Remediation`), then open `Finding 4.1`.
- Narrate the three layers:
  - Layer 1: Automated Baseline (API-derived posture)
  - Layer 2: Organizational Context (customer inputs change interpretation)
  - Layer 3: Advanced Analysis (consultant annotations, overrides, custom findings)
- In Customer View, point out:
  - Consultant Value Indicator
  - consultant content visible in read-only mode

## Minute 2:30-3:30 - Live recalculation moment

- Go to `Questionnaire`.
- Change:
  - expected asset count
  - non-credentialable percentage
  - SLA days
- Open linked findings (`1.1`, `2.1`, or `4.1`) and show Layer 2 updates.
- Say:
  - "This is the intelligence moment: context inputs materially transform conclusions and priority."

## Minute 3:30-4:30 - Consultant workflow and deliverable quality

- Toggle to `Consultant View`.
- Open `Engagement Overview` and `Interview Guide`.
- Call out:
  - pre-engagement briefing value
  - finding-triggered and pattern-triggered interview prompts
- Open `Report Preview` and show:
  - executive summary
  - roadmap
  - annotated finding excerpt
  - score override excerpt

## Minute 4:30-5:00 - Close

- "This demonstrates a complete advisory experience: automated baseline, context enrichment, and consultant-led depth in one product flow."
- "If this aligns with Tenable PS direction, the next step is co-development scope and implementation planning."

## 4) Backup Navigation (if someone asks to click around)

- "Show me where this starts" -> `Dashboard`
- "Show me data transformation" -> `Questionnaire` -> open `1.1` or `2.1`
- "Show me consultant-specific value" -> toggle `Consultant View` -> `Engagement` / `Interview Guide`
- "Show me client-facing output" -> `Report Preview`

## 5) Common Questions and Suggested Answers

- Q: "Is this connected to Tenable APIs right now?"
  - A: "Not in this demo. The UI is functional with embedded sample data to validate product flow and value model."
- Q: "Can customers see consultant contributions after delivery?"
  - A: "Yes, read-only visibility is preserved post-engagement, while authoring remains consultant-only."
- Q: "What is intentionally not built here?"
  - A: "No backend/API/database/auth/file generation. This is a production-style UI prototype for workflow validation."

## 6) Last-Second Troubleshooting

- If styles look off:
  - hard refresh browser
  - confirm dev server is still running
- If page is blank:
  - check terminal for compile errors
  - restart with `npm run dev`
- If layout is cramped:
  - reset browser zoom to 100%
  - widen window

