# Merchant Module Spec — Reel Campaigns (V1)

This document defines the **Merchant-side** module: **Reel Campaigns**.

It is aligned with:
- `Ecommerce/docs/Aoin CreatorInfluencer PPT Explain.pdf`
- `Ecommerce/docs/Creator Module — Product Requirements Document (PRD).pdf`
- Existing Creator Studio UX patterns (Deals → Upload → My Reels; status chips; drawers).

---

## Goals (what merchants need)

- **Outsource product marketing** to creators through structured campaigns/deals.
- **Approve creator-submitted reels** before they go live.
- **Track reel-attributed performance** (sales, conversion, ROI).
- **Understand commission + platform fee** impact and settlement readiness.

---

## Where it lives (Merchant portal)

- **Sidebar label**: `Reel Campaigns`
- **Route** (recommended): `/business/reel-campaigns`
- **Page layout**: Merchant portal layout (`components/business/AdminLayout.tsx`) + a top tab bar inside the module.

---

## Core objects (V1 mental model)

- **Campaign/Deal**: merchant hires a creator for a specific product with commission terms and a time window.
- **Submission**: creator uploads a reel against an active campaign; merchant reviews it.
- **Attribution**: sales attributed to a campaign via last-touch reel→product click within X days.
- **Settlement/Ledger view**: breakdown of creator commission, AOIN fee (5%), merchant net for attributed sales (informational/finance).

---

## Status model (V1)

### Campaign / Deal status (from PRD)
- `Draft` → `Sent` → `Accepted` → `Active` → `Submitted` → `Approved` → `Live` → `Completed`
- Side states: `Rejected` (creator rejects), `Cancelled`, `Expired`

### Reel submission status (merchant view)
- `Pending review` (creator submitted)
- `Approved`
- `Revision requested` (rejected with feedback; creator re-uploads)

---

## Module structure (sub-modules / tabs)

This is a **single module** with **tabs**, not separate sidebar entries.

---

## Detailed UI/UX + Functionality (per tab)

This section is implementation-oriented. For each tab, it defines:
- **Primary screens** and the layout blocks
- **Actions** (CTAs), **validations**, **modals**
- **Drawers** (detail views) and required fields
- **Redirections / deep links** between tabs
- **Empty, loading, error states**

### Shared conventions (applies to all tabs)

- **Top-level route**: `/business/reel-campaigns`
- **Tabs** use a query param for state:
  - `?tab=campaigns|creators|submissions|sales|payouts`
- **Optional context params** used by deep links:
  - `campaignId`, `submissionId`, `creatorId`, `productId`
- **Detail views** open as a **right-side drawer** (preferred) to avoid losing list context.
- **Status chips** are consistent and use a single mapping (campaign statuses + submission statuses).
- **Optimistic UX**:
  - for “Send offer / Approve / Request revision”, show immediate UI feedback and then refresh.
  - if request fails, revert and show error toast + inline banner in drawer.

**Global states**
- **Loading**: skeleton rows/cards + disabled CTAs.
- **Error**: page-level banner with `Retry` button; preserve filters in URL.
- **Empty**: clear illustration + single next action CTA (e.g., “Create your first campaign”).

---

### Tab 1 — Campaigns
**Purpose**: Create and manage campaigns/deals across the full lifecycle.

#### A) Campaigns list screen (default view)

**Layout blocks**
- **Header**
  - Title: `Reel Campaigns`
  - Primary CTA: `Create campaign`
  - Secondary: `Export` (optional, later)
- **Filter bar**
  - Status: multi-select or single-select (V1: single-select)
  - Product selector (typeahead)
  - Creator selector (typeahead)
  - Date range (created/updated or window end)
  - Search: campaign code / product name / creator name
- **Campaign list**
  - V1 recommended as a **table** (scales better) with row click opening drawer
  - Columns:
    - Campaign code
    - Product (thumb + name)
    - Creator (avatar + name)
    - Terms (commission % + cap/unlimited)
    - Window end / deadline
    - Status chip
    - Updated at

**Row actions (V1 minimal)**
- Clicking the row opens **Campaign detail drawer**
- Optional quick actions menu (3-dots):
  - `Copy campaign code`
  - `View submissions`

**Empty states**
- No campaigns at all: “Create your first Reel Campaign” + CTA
- Filters produce empty: “No campaigns match filters” + `Clear filters`

#### B) Create campaign (wizard modal or dedicated panel)

**Entry points**
- `Create campaign` button (from Campaigns tab)
- From Creators tab: `Create campaign with this creator`
- From Products (optional): `Create reel campaign` from product page later

**Recommended UX**
- Use a **stepper** (similar to creator upload) to reduce mistakes:
  1. Product
  2. Creator
  3. Terms
  4. Brief
  5. Review & Send

**Step 1: Product**
- Product picker (search + category indicator)
- Validate: product must belong to merchant + be eligible (approved/in stock as per platform rules)
- On select:
  - prefill category context (used to recommend creators in step 2)

**Step 2: Creator**
- Creator picker with recommendations (category match + availability)
- Filters: category, availability
- Validate: creator must be `Available` (or allow sending offer but warn if busy; choose one)

**Step 3: Terms**
- Commission type:
  - `Percent unlimited`
  - `Percent capped` (requires cap quantity)
- Fields:
  - commissionPercent (required, 1–100)
  - capQuantity (required if capped; integer > 0)
  - campaignWindowEnd (required; must be future date/time)
  - deliverableCount (V1 fixed to 1, show as read-only)
- Validation:
  - show inline errors
  - disable `Continue` until valid

**Step 4: Brief**
- Textarea: “What to show / say / CTA”
- Optional checklist toggles (V1 optional):
  - include product link CTA
  - hook in first 3 seconds
  - mention key benefits
- Validation: required brief min length (light validation; e.g. 20 chars)

**Step 5: Review & Send**
- Summary card: product, creator, terms, deadline
- Confirm checkbox: “I confirm terms and brief are correct”
- Actions:
  - `Send offer` (creates campaign + sets status `Sent`)
  - `Save as draft` (optional V1; if not, skip and always send)

**After send**
- Redirect: back to Campaigns list with drawer opened for the created campaign:
  - `/business/reel-campaigns?tab=campaigns&campaignId=NEW_ID`

#### C) Campaign detail drawer

**Drawer sections**
- **Header**: campaign code + status chip
- **Product block**: image + name + price + category; link to product in merchant catalog (optional)
- **Creator block**: name + availability + portfolio link (opens creator drawer in Creators tab)
- **Terms block**: commission %, cap/unlimited, window end, deliverable
- **Brief block**: read-only brief text + “Edit” (optional; only in Draft/Sent)
- **Timeline**: status history with timestamps (if available)
- **Performance teaser** (optional V1): attributed sales + revenue

**Drawer actions by status**
- `Draft`: `Send offer`, `Edit`, `Delete draft`
- `Sent`: `Cancel offer`, (optional) `Resend offer`
- `Accepted/Active`: `View submissions` (deep link), `Add internal notes` (optional)
- `Submitted`: `Review submission` (deep link to Submissions drawer)
- `Approved/Live/Completed`: `View sales` and `View commission summary` (deep links)

**Deep links from drawer**
- View submissions:
  - `/business/reel-campaigns?tab=submissions&campaignId=123`
- View sales:
  - `/business/reel-campaigns?tab=sales&campaignId=123`
- View payouts:
  - `/business/reel-campaigns?tab=payouts&campaignId=123`

**Key screens**
- **Campaigns list**
  - Filters: status, product, creator, date range
  - Columns/cards: campaign code, product, creator, commission terms, window end, status, last updated
  - Primary actions: `Create campaign`, `Open details`
- **Campaign detail (drawer / panel)**
  - Summary: product + creator, terms, deadline/window, deliverable requirements
  - Timeline: Draft → Sent → Accepted → Submitted → Approved → Live → Completed
  - Actions (contextual):
    - Draft: `Send offer`
    - Sent: `Cancel offer`, `Edit terms` (optional), `Resend` (optional)
    - Accepted/Active: `View submissions`, `Message/Notes` (optional)
    - Completed: `View sales`, `View commission summary`

**Create campaign flow (V1)**
1. Select **Product**
2. Choose **Creator** (can deep-link from Creators tab)
3. Set **Terms**
   - Commission type:
     - Percent + cap (e.g., 20% up to 200 qty) OR percent unlimited
   - Campaign window end date (expiry/deadline)
   - Deliverable: “1 reel” (V1)
4. Add **Brief / requirements** (what to show/say; do/don’t; CTA)
5. Confirm → `Send offer` (campaign becomes `Sent`)

---

### Tab 2 — Creators
**Purpose**: Discover creators and shortlist/hire for a product category.

#### A) Creators discovery screen

**Layout blocks**
- **Header**
  - Title: `Creators`
  - Secondary CTA: `View shortlists` (optional later)
- **Context selector (recommended)**
  - “For product” dropdown (optional but very useful):
    - choose a product to scope creators by product category
  - If not selected: show category multi-select filter
- **Filters**
  - Category (single or multi; V1 single is fine)
  - Availability (Available/Busy)
  - Performance (optional if data exists): followers range, avg views range
  - Search: creator name/handle
- **Creator grid/list**
  - Cards with: avatar, name, categories/tags, availability chip, small stats, “View” button

**Empty states**
- No creators available for selected filters: suggest clearing filters or picking another category
- If product selected but category has no creators: show guidance + “Browse all creators”

#### B) Creator profile drawer

**Drawer sections**
- Header: creator name + availability chip
- Categories/niche tags (show chosen 5 categories)
- Portfolio:
  - links / media thumbnails
  - “View public portfolio” link (if exists)
- Performance (optional):
  - platform-based stats: reels made, deals completed, views/likes/shares
- Actions
  - Primary: `Create campaign with this creator`
  - Secondary: `Copy profile link` (optional)

**Create campaign redirection**
- Opens Create Campaign wizard with creator preselected:
  - `/business/reel-campaigns?tab=campaigns&creatorId=CREATOR_ID&mode=create`
  - If product was selected in Creators context, also pass `productId`.

**Key screens**
- **Creator discovery list**
  - Default scope: creators matching the selected product’s category
  - Filters (V1):
    - category match
    - availability (Available / Busy)
    - (optional if data exists) followers, average views
  - Sorting: recommended / newest / top performing (optional)
- **Creator profile preview (drawer)**
  - Portfolio, niche tags/categories, availability
  - Basic stats (if available): reels, deals, views, followers
  - Actions:
    - `Create campaign with this creator` (deep-link into Campaign creation)

---

### Tab 3 — Submissions
**Purpose**: Review reels submitted by creators and approve/reject with feedback.

#### A) Submissions inbox screen

**Layout blocks**
- **Header**
  - Title: `Submissions`
  - Badge count: pending submissions
- **Filters**
  - Status: Pending review / Approved / Revision requested
  - Campaign selector
  - Creator selector
  - Product selector
  - Date range: submittedAt
  - Search: campaign code, creator name
- **List**
  - Row/card shows:
    - video thumbnail + duration
    - campaign code + product name
    - creator name
    - submitted at
    - status chip
  - Clicking opens **Submission review drawer**

**Empty states**
- No pending submissions: show “You’re all caught up”
- Filtered empty: “No submissions match filters”

#### B) Submission review drawer

**Drawer sections**
- Header: submission id (optional) + campaign code + status chip
- Video player (must be prominent)
- Campaign brief (read-only) so reviewer can check compliance
- Creator notes/caption (from creator upload)
- Checklist (optional, but recommended)
  - “Correct product shown”
  - “Brand guidelines followed”
  - “CTA included”
- Feedback textarea (required when requesting revision)
  - Character count + examples (placeholder)

**Actions**
- `Approve`
  - confirm modal: “Approve and make live?”
  - on success:
    - mark submission Approved
    - campaign moves to Approved/Live (depending on backend)
    - redirect stays in Submissions; optionally show “View live reel” link
- `Request revision`
  - requires feedback text
  - confirm modal: “Send revision request to creator?”
  - on success:
    - status becomes Revision requested
    - creator side will show rejection reason + re-upload path
- `View campaign`
  - deep link:
    - `/business/reel-campaigns?tab=campaigns&campaignId=123`

**Guardrails**
- Prevent double-submit (disable buttons while API call in-flight)
- If submission is already approved by another admin/session, show non-blocking warning and refresh

**Key screens**
- **Submissions inbox**
  - Filters: status (pending/approved/revision), campaign, product, creator, date
  - Item row/card: thumbnail/video preview, campaign code, creator, product, submitted at
- **Submission review (drawer)**
  - Video player preview
  - Brief checklist (optional)
  - Feedback box (required for revision request)
  - Actions:
    - `Approve` → reel becomes live (`Approved`/`Live`)
    - `Request revision` → provide feedback; creator sees reason and can re-upload

**Notes**
- Merchant approval is a **hard gate**: creator-submitted reels do not go public until approved.

---

### Tab 4 — Attribution & Sales
**Purpose**: Campaign performance and reel-attributed commerce metrics.

#### A) Overview screen

**Layout blocks**
- **Header**
  - Title: `Attribution & Sales`
  - Date range selector (default: last 30 days)
- **KPI cards**
  - Attributed orders
  - Attributed units
  - Attributed revenue (net base per PRD)
  - Creator commission (sum)
  - AOIN fee (5% sum)
  - Merchant net (informational)
- **Charts (V1 minimal)**
  - line chart: attributed revenue over time
  - bar chart: top campaigns or top creators

#### B) Performance table

**Table columns**
- campaign code
- product
- creator
- attributed orders/units
- attributed revenue
- commission amount
- AOIN fee
- merchant net

**Row click behavior**
- opens a **Performance detail drawer** OR routes to filtered views:
  - “View campaign” (Campaign drawer)
  - “View payouts for this campaign” (Payouts tab filtered)

**Filters**
- campaign / product / creator selectors
- min revenue (optional)

**Empty/error states**
- If attribution events aren’t configured yet: show a callout “Attribution not available yet” with explanation and a link to docs/settings (if exists)

**What it should show (V1)**
- Attributed sales by:
  - campaign
  - product
  - creator
  - date range
- KPIs:
  - attributed orders / units
  - attributed revenue (net base definition per PRD)
  - conversion rate (if click events exist)
  - top campaigns / top creators

**Key screens**
- **Performance overview**
  - Summary cards + simple chart
- **Campaign performance table**
  - campaign code, creator, product, attributed sales, revenue, commission amount, AOIN fee, merchant net

---

### Tab 5 — Commissions & Payouts
**Purpose**: Finance summary per creator/campaign (informational + operational readiness).

#### A) Summary screen (creator-level)

**Layout blocks**
- **Header**
  - Title: `Commissions & Payouts`
  - Date range selector (for earning periods)
- **Summary tiles**
  - Eligible commission (ready)
  - Pending commission (awaiting delivery/return window)
  - Reversals/adjustments (if any)
  - AOIN fee (5%) total
- **Creator table**
  - creator name
  - campaigns count
  - eligible amount
  - pending amount
  - last payout date/status (optional)
  - action: `View ledger`

#### B) Ledger drawer (creator or campaign scoped)

**Drawer sections**
- Header: creator + period + totals
- Breakdown table (depending on backend availability):
  - order item id
  - product
  - delivered date
  - eligible date
  - attributed net revenue
  - commission amount
  - AOIN fee
  - merchant net
  - status: pending/eligible/reversed/paid

**Filters inside drawer**
- status filter
- campaign filter

**Deep links**
- From Campaign detail → Payouts tab filtered by campaign:
  - `/business/reel-campaigns?tab=payouts&campaignId=123`
- From Sales table row → open ledger for that creator:
  - `/business/reel-campaigns?tab=payouts&creatorId=456`

**What it should show (V1)**
- **Commission summary per creator**
  - total attributed revenue
  - creator commission owed/earned (eligible vs pending)
  - AOIN fee (5% on attributed sales)
  - merchant net (after fee + commission; informational)
- **Eligibility/settlement readiness**
  - delivered + return/refund window passed
  - reversals/adjustments for returns/refunds (if supported)

**Key screens**
- **Creator payouts summary table**
  - creator, campaigns count, eligible amount, pending amount, paid amount
- **Ledger detail (drawer)**
  - line items by order item / settlement period (depending on backend implementation)

---

## UI/UX patterns (recommended)

- **List → detail drawer** pattern across tabs (matches Creator Studio).
- **Status chips** for campaign and submission statuses.
- **Deep links**:
  - From Creators → “Create campaign” opens Campaign form with creator preselected.
  - From Campaign detail → “View submissions” opens Submissions filtered to that campaign.
  - From Submissions → “View campaign” opens Campaign detail.

---

## Cross-tab redirections & URL map (V1)

Use query params so links are stable, shareable, and QA-friendly.

- **Open module**
  - `/business/reel-campaigns?tab=campaigns`
- **Open Campaign detail drawer**
  - `/business/reel-campaigns?tab=campaigns&campaignId=123`
- **Start Create Campaign wizard**
  - `/business/reel-campaigns?tab=campaigns&mode=create`
  - With preselects:
    - `&creatorId=456`
    - `&productId=789`
- **Open Creator drawer**
  - `/business/reel-campaigns?tab=creators&creatorId=456`
- **Open Submissions inbox filtered**
  - `/business/reel-campaigns?tab=submissions&campaignId=123`
- **Open Submission review drawer**
  - `/business/reel-campaigns?tab=submissions&submissionId=555`
- **Open Sales filtered**
  - `/business/reel-campaigns?tab=sales&campaignId=123`
  - `/business/reel-campaigns?tab=sales&creatorId=456`
- **Open Payouts filtered**
  - `/business/reel-campaigns?tab=payouts&campaignId=123`
  - `/business/reel-campaigns?tab=payouts&creatorId=456`

---

## Permissions & access control

- Visible only to users with role `merchant` (same gating as other `/business/*` pages).

---

## V1 scope checklist (definition of “done”)

**Campaigns**
- Create campaign (product + creator + terms + brief) and send offer
- List campaigns and view status timeline
- Basic actions: cancel/expire (where allowed)

**Creators**
- List creators by category + availability
- View creator profile/portfolio (drawer)
- Start campaign creation from creator

**Submissions**
- Inbox of pending submissions
- Approve / Request revision with feedback

**Attribution & Sales**
- Show attributed sales per campaign (basic table + date filter)

**Commissions & Payouts**
- Show commission + AOIN fee breakdown per campaign/creator (summary + detail drawer)

---

## Open items (need confirmation during implementation)

- **Campaign code usage**:
  - PRD: campaign_code is “human-friendly display and optional lookup”.
  - Creator UI today selects campaigns from a list; optional future enhancement is “enter campaign code”.
- **Creator metrics**:
  - Filters like followers/views require a source of truth (creator social stats vs platform stats).
- **Exact commission base**:
  - PRD suggests net base: item price − item discount − refunds; exclude shipping/tax.
- **Settlement timing**:
  - depends on delivery + return/refund window and payout cadence.

