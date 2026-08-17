# spec.md — <Product Name> · <Team Name>
<!-- BUSINESS SPEC: the WHAT and WHY. Keep implementation decisions in plan.md.
     Aim for clarity and testability, not length. -->

## 1. Overview
**Problem statement:** <who has what problem today — 2 sentences max>

**Target user:** <one specific user/persona>

**Outcome:** <what should be meaningfully better for that user?>

**Demo definition of done:** <one sentence the whole team can recite>

## 2. User Stories & Acceptance Criteria
<!-- Keep scope tight. P1 = the demo fails without it. P2 = only after P1 works. -->

### US-1 — <name> (P1)
As a <role>, I want <capability> so that <benefit>.
- **Given** <state> **when** <action> **then** <observable outcome>
- **Given** <state> **when** <action> **then** <observable outcome>

### US-2 — <name> (P1)
As a <role>, I want <capability> so that <benefit>.
- **Given** <state> **when** <action> **then** <observable outcome>

### US-3 — <name> (P2)
As a <role>, I want <capability> so that <benefit>.
- **Given** <state> **when** <action> **then** <observable outcome>

## 3. Business Rules & Constraints
- <rule the product must not break>
- <known business/data/privacy constraint>

## 4. UX / Experience Notes
- **Primary flow:** <...>
- **Important states:** <empty / error / success / other>
- **Known experience constraints:** <...>

## 5. Edge Cases
- <...>

## 6. Out of Scope
<!-- Aim for at least five real exclusions. Adding one back requires changing this spec first. -->
- ❌ <...>
- ❌ <...>
- ❌ <...>
- ❌ <...>
- ❌ <...>

## 7. Open Questions & Named Assumptions
<!-- Never fabricate an answer just to make the document look complete. -->
- **Question / assumption:** <...>
  - **Owner:** <name>
  - **Tripwire:** <what evidence would prove the assumption wrong?>

## 8. Ready Check
- [ ] The problem and target user are specific.
- [ ] The outcome is stated as an outcome, not a solution.
- [ ] Every P1 acceptance criterion is observable and testable by a non-author.
- [ ] Out of Scope contains at least five meaningful exclusions.
- [ ] Shape-changing unknowns are resolved or recorded as named assumptions with owner + tripwire.
- [ ] This document contains no implementation design masquerading as a requirement.

**Ready verdict:** READY / READY WITH NAMED ASSUMPTIONS / NOT READY

## 9. Verify Table
<!-- Fill at feature freeze by re-testing every acceptance criterion. -->
| AC | Scenario | Verdict | Notes |
|---|---|---|---|
| US-1.1 | | PASS / FAIL | |
