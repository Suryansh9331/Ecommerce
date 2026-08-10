# Creator Studio — Step-by-step Implementation Flow (no dependency breaks)

This document is the recommended **build order** for the Creator Studio frontend so you can implement modules one-by-one without breaking navigation, state, or UX flows.

Scope reference: `Ecommerce/CREATOR_STUDIO_MODULES.md`

---

## Principles (to avoid rework)

- **Do navigation + routes first**: every sidebar item must have a route + placeholder page to prevent 404s while you build.
- **Build shared UI primitives before pages**: drawers/modals/status chips used everywhere.
- **Keep data mocked initially**: wire APIs after UX is stable, module-by-module.
- **Don’t couple modules**: each page should render even if other pages aren’t done yet.

---

## Phase 0 — Baseline stabilization (do first)

### 0.1 Freeze the IA and sidebar list
- Update the sidebar in `Ecommerce/src/pages/creator/CreatorLayout.tsx` to include (even if pages are placeholders):
  - Home, Deals, Upload Reel
  - **My Reels**
  - **Notifications**
  - **Payouts/KYC** (if payouts are real)
  - Earnings
  - Settings
  - (Optional later) Campaigns, Analytics, Support

### 0.2 Route parity (must be complete)
- Add routes for every sidebar item in `Ecommerce/src/App.tsx` under the `/creator` layout.
- Create placeholder pages for new routes (simple “Coming soon” pages) so navigation never breaks.

**Exit criteria**
- Sidebar navigation works for every item (no 404).
- Layout renders on desktop + mobile drawer works.

---

## Phase 1 — Shared UI primitives (foundation)

Build these once and reuse everywhere.

### 1.1 Drawer system (primary pattern)
- Create a reusable **right-side drawer** component:
  - header (title + close)
  - scrollable body
  - sticky footer actions
  - overlay click closes

### 1.2 Modal system (confirmation + blocking)
- Confirm modal: decline offer, delete reel, logout (optional)
- Blocking modal: “Complete payout setup / KYC required”

### 1.3 Status system
- Status chip component + status-to-style mapping:
  - offer/campaign/reel/payout statuses
- Optional: simple timeline component (steps with timestamps)

### 1.4 Form primitives + validation helpers
- Input, select, textarea, toggle, file uploader shell
- Validation utilities (required, max length, file size/type, duration)

**Exit criteria**
- You can open a drawer + confirm modal from any page.
- Status chips look consistent across pages.

---

## Phase 2 — Sidebar-first modules (your preferred order)

You said you’ll go **side panel → home → deals**. This sequence avoids dependencies breaking.

### 2.1 Sidebar (finalize UX + badges)
- Replace hardcoded badges later, but prepare structure now:
  - Deals badge (pending offers count)
  - Notifications badge (unread count)
- Don’t block on API; use mock counts initially.

**Exit criteria**
- Sidebar sections are stable (Main / Manage / Finance / System).

---

## Phase 3 — Home / Dashboard (works alone)

### 3.1 Dashboard layout + widgets
- KPI cards: pending offers, active campaigns, reels pending/rejected, earnings
- Alert strip (deadline / rejection / payout update)
- “Next actions” list (deep links)
- Recent activity list

### 3.2 Navigation deep links (no new dependency)
- Link to Deals tab via query params: `/creator/deals?tab=offers`
- Link to Upload with campaign preselected: `/creator/upload-reel?campaignId=...`

**Exit criteria**
- Dashboard is useful with mocked data.
- Clicking CTAs navigates correctly (even if target page is placeholder).

---

## Phase 4 — Deals (Offers + lifecycle) with drawer details

### 4.1 Offers list
- Card grid/list, sorting, basic filters (start minimal)
- Clicking card opens **Deal Detail Drawer**

### 4.2 Deal Detail Drawer
- Commission breakdown, deadline, deliverable spec, brief section
- Actions:
  - Accept → move to Active tab (mock state)
  - Decline → confirmation modal + remove offer

### 4.3 Tabs
- Offers / Active / Completed / History
- Start with mock arrays; preserve shape for API later.

### 4.4 Readiness gates (soft first, hard later)
- If Payout/KYC not complete:
  - Accept shows blocking modal → link to `/creator/payouts`
- Keep the gate logic in one place (helper/hook) so it’s reusable.

**Exit criteria**
- Full offer flow works with mock state:
  - accept/decline
  - active campaign appears
  - rejected/under-review statuses display

---

## Phase 5 — Upload Reel (stepper + validations)

### 5.1 Stepper shell
- Steps: campaign → upload → details → review → submitted

### 5.2 File validations (client-side)
- Allowed: mp4/mov/avi/mkv
- Size ≤ 100MB
- Duration ≤ 60s (read via `<video>` metadata)
- Inline errors + disable submit until valid

### 5.3 Submit flow (mock first)
- On submit:
  - show “Submitted” state
  - status transitions mock: under_review → approved/rejected
- Rejected path shows reason + “Re-upload”

**Exit criteria**
- Upload page is production-quality UX even before API wiring.

---

## Phase 6 — My Reels (manager)

### 6.1 Reels list + filters
- Status filter, campaign filter, search (optional)
- Clicking opens Reel Detail Drawer

### 6.2 Reel Detail Drawer
- Video preview + status + feedback
- Actions:
  - Re-upload (for rejected) → routes to Upload with context
  - View live (for approved/live)

**Exit criteria**
- Creators can understand “what’s live / what needs action” from one place.

---

## Phase 7 — Notifications

### 7.1 Notifications page
- list + unread filter
- actions: mark read, mark all read, delete (optional)

### 7.2 Badge integration
- unread count drives sidebar/top-bar badge (mock initially)

**Exit criteria**
- Notifications are actionable and deep-link to deals/reels.

---

## Phase 8 — Earnings + Payouts/KYC

### 8.1 Earnings page
- breakdown cards + per-campaign rows

### 8.2 Payouts/KYC page
- bank form + KYC upload form (even if backend not ready)
- validations:
  - account number + confirm match
  - IFSC format
  - file type/size limits for docs

### 8.3 Gates enforcement (final)
- Accept deal / request payout hard-checks readiness gates

**Exit criteria**
- Finance flows feel complete and safe.

---

## Phase 9 — Campaigns / Analytics / Support (optional, last)

- Campaigns is valuable once Deals + Upload are stable.
- Analytics only after real metrics exist.
- Support anytime, but doesn’t block core loop.

---

## Suggested “single-module” workflow (how you should work day-to-day)

For each module you pick (Dashboard, then Deals, etc.):
1. Ensure route exists + placeholder page merged.
2. Implement layout + empty states first.
3. Add list view + detail drawer interactions.
4. Add validations and UX polish.
5. Wire API calls last (swap mock data → real).

