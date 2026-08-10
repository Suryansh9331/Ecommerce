# Merchant Reel Campaigns — Phase-wise UI Implementation Plan (Mock Data, Safe Integration)

This plan explains how to implement the **merchant-side `Reel Campaigns` module UI** using **mock data first**, while ensuring **zero disruption** to existing merchant portal routes and functionality under `/business/*`.

Reference spec: `Ecommerce/MERCHANT_REEL_CAMPAIGNS_MODULE.md`

---

## Non-negotiables (safety constraints)

- **Route isolation**: Everything new must live under **`/business/reel-campaigns`** only.
- **Minimal touching existing code**:
  - Allowed edits: add **1 sidebar item** and **1 route**.
  - Avoid modifying existing dashboard/catalog/orders/report flows.
- **Mock-first**: No API wiring until UI and navigation are stable.
- **URL-driven state**: tabs + open drawers must be reproducible via URL query params (refresh-safe).
- **Reusable but scoped UI**: reuse existing merchant UI primitives if safe; otherwise create module-local primitives to avoid cross-page regressions.

---

## Target route + URL contract (V1)

- **Module entry**: `/business/reel-campaigns?tab=campaigns`
- Tabs:
  - `tab=campaigns|creators|submissions|sales|payouts`
- Deep-link params:
  - `campaignId=<id>`
  - `creatorId=<id>`
  - `submissionId=<id>`
  - `mode=create` (starts Create Campaign wizard)
  - `productId=<id>` (optional preselect)

---

## Phase 0 — Safe scaffolding (no behavior changes)

**Goal**: Add the module entry point without impacting anything else.

**Work**
- Add a new sidebar item in `components/business/AdminLayout.tsx`:
  - Label: `Reel Campaigns`
  - Route: `/business/reel-campaigns`
- Add route parity in `Ecommerce/src/App.tsx`:
  - Render a placeholder page (e.g. `Coming soon`) under merchant layout.

**Exit criteria**
- Merchant portal runs exactly as before.
- Clicking `Reel Campaigns` opens the placeholder page (no 404, no console errors).

---

## Phase 1 — Module shell + URL-driven tabs (still placeholders)

**Goal**: Create a stable module container and tab navigation without building features yet.

**Work**
- Create: `src/pages/business/reel-campaigns/ReelCampaigns.tsx`
- Implement:
  - Top header + tab bar
  - Query-param router:
    - reads `tab` and defaults to `campaigns`
    - writes tab changes to URL
  - Placeholder content for each tab (simple panels)

**Exit criteria**
- Tab switches only change URL.
- Refreshing the page preserves the selected tab.
- No dependencies on any other business page.

---

## Phase 2 — Mock data + local module state (foundation)

**Goal**: Add mock datasets and state transitions without APIs.

**Work**
- Create `src/pages/business/reel-campaigns/mock/`:
  - `campaigns.ts`, `creators.ts`, `submissions.ts`, `sales.ts`, `ledger.ts`
- Create a local module store (simple React state + helpers) inside the module:
  - create campaign
  - change campaign status
  - approve / request revision for submissions
  - derived metrics for sales + payouts views

**Exit criteria**
- All tabs can render lists from mock data.
- State transitions update UI immediately and consistently across tabs.

---

## Phase 3 — Campaigns tab (list + detail drawer + create wizard)

**Goal**: Build the primary lifecycle manager for campaigns.

**Work**
- Campaigns list:
  - filters UI (status/product/creator/date/search)
  - table/grid with status chips
  - row click opens drawer
- Campaign detail drawer:
  - product + creator + terms + brief + timeline
  - deep-link buttons: “View submissions”, “View sales”, “View payouts”
- Create campaign wizard (stepper):
  - Product → Creator → Terms → Brief → Review & Send
  - Send offer transitions campaign to `Sent`
- Safe confirm modals:
  - Cancel offer
  - Delete draft (optional)

**Exit criteria**
- `/business/reel-campaigns?tab=campaigns&campaignId=...` opens the correct drawer.
- Create flow creates a new mock campaign and opens it in the drawer.
- Deep links route to other tabs with filters preserved in URL.

---

## Phase 4 — Creators tab (discovery + creator drawer + create redirect)

**Goal**: Let merchants discover creators and initiate campaigns from creator context.

**Work**
- Creators list/grid:
  - filters UI (category/availability; performance optional)
  - optional “for product” context selector
- Creator profile drawer:
  - portfolio + categories + availability + basic stats
- CTA:
  - “Create campaign with this creator” → redirects to Campaigns tab and starts wizard with `creatorId` preselected.

**Exit criteria**
- `/business/reel-campaigns?tab=creators&creatorId=...` opens the correct drawer.
- Wizard opens with correct creator preselected.

---

## Phase 5 — Submissions tab (inbox + review drawer + approval/revision)

**Goal**: Build merchant approval gate UI for creator submissions.

**Work**
- Submissions inbox:
  - filters UI (status/campaign/creator/product/date/search)
  - list rows/cards with thumbnails
- Submission review drawer:
  - video preview
  - campaign brief read-only
  - feedback textarea (required for revision)
  - actions: Approve / Request revision (with confirm modal)
- Deep links:
  - “View campaign” opens Campaign drawer

**Exit criteria**
- Approve/revision transitions are reflected across Campaigns and Submissions.
- `/business/reel-campaigns?tab=submissions&submissionId=...` opens review drawer.

---

## Phase 6 — Attribution & Sales tab (KPIs + performance table + drilldowns)

**Goal**: Provide merchant reporting for campaign-attributed sales (mock-derived).

**Work**
- Date range selector + KPIs:
  - attributed orders/units/revenue
  - commission total
  - AOIN fee total (5%)
  - merchant net (informational)
- Performance table (campaign/product/creator breakdown)
- Drilldowns:
  - open Campaign drawer
  - redirect to Payouts filtered by campaign/creator

**Exit criteria**
- `/business/reel-campaigns?tab=sales&campaignId=...` applies filter.
- All metrics are internally consistent with mock data.

---

## Phase 7 — Commissions & Payouts tab (summary + ledger drawer)

**Goal**: Finance view for commission and settlement readiness (mock).

**Work**
- Summary tiles (eligible/pending/adjustments + fee totals)
- Creator payouts table
- Ledger drawer:
  - line items (order-item-like rows) with statuses (pending/eligible/reversed/paid)
  - filters inside drawer (status/campaign)

**Exit criteria**
- `/business/reel-campaigns?tab=payouts&creatorId=...` filters correctly.
- Ledger drawer opens and is usable for QA.

---

## Phase 8 — Hardening + regression safety (still mock)

**Goal**: Make UI production-grade while ensuring no side effects to existing merchant portal.

**Work**
- Add consistent:
  - loading skeletons
  - empty states
  - error banners + retry buttons
  - disabled states on in-flight actions
- Browser navigation correctness:
  - back/forward should close drawers or switch tabs appropriately (URL is the source of truth)
- Responsive QA:
  - tabs overflow handling on mobile
  - drawer usability on smaller screens
- Verify “no existing flow disturbed”:
  - routes untouched except new entry
  - no global CSS overrides
  - no changes in AuthContext behavior

**Exit criteria**
- Merchant portal’s existing dashboard/catalog/orders/reports behave the same.
- `Reel Campaigns` module is fully navigable and demo-ready with mock data.

---

## Suggested build order (fastest path to demo)

1. Phase 0 + 1 (module visible, tabs stable)
2. Phase 3 (Campaigns + create wizard) — core demo
3. Phase 5 (Submissions approval) — completes the “merchant gate” loop
4. Phase 4 (Creators discovery) — makes hiring flow real
5. Phase 6 + 7 (Sales + Payouts) — reporting/finance
6. Phase 8 (polish/regression safety)

