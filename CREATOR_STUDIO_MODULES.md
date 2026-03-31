# Creator Studio (Frontend) — Modules & Sidebar Spec

This document defines what the **Creator Studio** should include in the frontend, and what should appear in the **Creator dashboard sidebar**.

It is based on the current implementation in:
- `Ecommerce/src/pages/creator/CreatorLayout.tsx` (sidebar + layout)
- Creator routes in `Ecommerce/src/App.tsx`

---

## Current Sidebar (as implemented)

**Home**
- Route: `/creator/dashboard`

**Content**
- Deals: `/creator/deals`
- Upload Reel: `/creator/upload-reel`
- Categories: `/creator/categories`
- Portfolio: `/creator/portfolio`

**Finance**
- Earnings: `/creator/earnings`

**Bottom**
- Settings: `/creator/settings`

Utilities:
- Visit Store (external)
- Logout

---

## Required (MVP) Modules

These are the minimum modules required to support the core creator workflow end-to-end.

### 1) Home / Dashboard
- **Route**: `/creator/dashboard`
- **Purpose**: quick overview + next actions (deadlines, pending offers, active campaigns, earnings).
- **Must include**:
  - pending offers count
  - active campaigns count + nearest deadline
  - monthly earnings + pending payout
  - recent activity feed

### 2) Deals (Offers + Campaign lifecycle)
- **Route**: `/creator/deals`
- **Purpose**: accept/decline offers; track active/submitted/completed campaigns.
- **Must include**:
  - tabs for offers / active / completed / history
  - deal detail view (sheet/modal) with commission, deadline, deliverables
  - campaign status (upload pending → under review → approved/live → revision)

### 3) Upload Reel (Deliverables)
- **Route**: `/creator/upload-reel`
- **Purpose**: upload deliverable reel against an accepted campaign.
- **Must include**:
  - select campaign (active deals)
  - video uploader
  - submission + status feedback
  - resubmission path for rejected reels (revision workflow)

### 4) Earnings (Finance summary)
- **Route**: `/creator/earnings`
- **Purpose**: earnings breakdown and payout readiness.
- **Must include**:
  - balance vs pending vs paid
  - per-campaign earnings history
  - payout release timeline (if applicable)

### 5) Settings (Account)
- **Route**: `/creator/settings`
- **Purpose**: profile settings + operational preferences.
- **Must include**:
  - creator profile basics (name, email, phone)
  - availability toggle (“Open for brand deals”)

---

## Strongly Recommended Modules (Next build)

These are not strictly required to demo the flow, but are typically needed for a real creator studio.

### A) My Reels (Reel Manager)
- **Route**: `/creator/reels`
- **Why**: creators need a single place to manage all reels (not only through Deals).
- **Should include**:
  - list of reels with status (pending/approved/rejected/live)
  - feedback/rejection reason + re-upload action
  - link to the product/reel page preview
  - basic analytics per reel (views/likes/shares if available)

### B) Campaigns (Dedicated)
- **Route**: `/creator/campaigns`
- **Why**: “Deals” mixes marketplace offers + ongoing campaigns; a dedicated module simplifies deliverables.
- **Should include**:
  - active campaigns timeline
  - briefs/guidelines (what to say/show, CTA, hashtags, do/don’t)
  - deliverable checklist + due dates

### C) Notifications / Inbox
- **Route**: `/creator/notifications`
- **Why**: creators need a single inbox for offer updates, approval/rejection, payout status, deadline alerts.
- **Should include**:
  - unread count badge in sidebar/top bar
  - mark-as-read + deep links to related deal/reel

### D) Payout Setup (Bank + KYC)
- **Route**: `/creator/payouts` (or `/creator/billing`)
- **Why**: real payouts require bank details, KYC, tax info.
- **Should include**:
  - bank account details
  - KYC / verification status
  - payout method + failure handling

### E) Analytics / Insights
- **Route**: `/creator/analytics`
- **Why**: creators optimize content based on performance.
- **Should include**:
  - performance trends (views/likes/shares, earnings)
  - campaign performance + attributed sales

---

## Optional Modules (Add only if needed)

### Support / Help Center
- **Route**: `/creator/support`
- FAQs, ticket creation, contact.

### Messages / Brand Chat
- **Route**: `/creator/messages`
- Only if negotiations/briefs happen via chat inside the product.

### Referrals / Invite
- **Route**: `/creator/referrals`
- Growth / network effects.

---

## Sidebar Recommendation (Clean & scalable)

If you want a lean but complete sidebar:

**Main**
- Home (`/creator/dashboard`)
- Deals (`/creator/deals`)
- Upload Reel (`/creator/upload-reel`)

**Manage**
- My Reels (`/creator/reels`)
- Campaigns (`/creator/campaigns`)

**Finance**
- Earnings (`/creator/earnings`)
- Payouts/KYC (`/creator/payouts`)

**Insights**
- Analytics (`/creator/analytics`)

**System**
- Notifications (`/creator/notifications`)
- Settings (`/creator/settings`)

---

## Implementation Notes (Frontend)

### Badges
Current `Deals` badge in `CreatorLayout` is hardcoded. Badges should be driven by state/API:
- deals badge = pending offers count
- notifications badge = unread notifications count

### Route parity
If a module is present in the sidebar, it must exist as a route in `Ecommerce/src/App.tsx` under:
`<Route path="/creator" element={<CreatorLayout />}> ... </Route>`

### Access control
Creator routes are protected in `CreatorLayout.tsx` via:
- `isAuthenticated`
- `user?.role === 'creator'`

---

## Creator Studio UI/UX Architecture (solid baseline)

This section defines the **UI patterns**, **navigation rules**, **popups**, **forms**, and **validations** for the complete Creator Studio experience.

### Core IA (Information Architecture)

**Primary (daily use)**
- Dashboard: `/creator/dashboard`
- Deals: `/creator/deals`
- Upload Reel: `/creator/upload-reel`
- My Reels: `/creator/reels`

**Secondary**
- Campaigns: `/creator/campaigns`
- Earnings: `/creator/earnings`
- Payouts/KYC: `/creator/payouts`
- Notifications: `/creator/notifications`
- Settings: `/creator/settings`

**Tertiary**
- Analytics: `/creator/analytics`
- Support: `/creator/support`

### Global navigation rules
- **Sidebar**: module navigation only (no deep links per campaign).
- **Mobile top bar** (and optional desktop top bar): menu, notifications bell, and a single primary CTA (usually **Upload**).
- **Drill-down**: open details in a **right-side drawer** (Deal / Campaign / Reel / Payout detail) instead of sending users to a new page.

### Reusable UI primitives (must standardize)

**1) List → Detail Drawer pattern**
- Lists (offers, campaigns, reels, payouts, notifications) open a detail drawer.
- Drawer includes: summary, timeline, actions, validation errors, and audit meta (timestamps).

**2) Status chips + timeline**
- Every entity shows a consistent status chip and timeline:
  - Offer: `sent` → accepted/declined/expired
  - Campaign: active → submitted → under_review → approved/live OR rejected → resubmitted
  - Reel: upload_pending → pending_approval → approved/live OR rejected
  - Payout: pending → processing → paid OR failed

**3) Feedback system**
- Inline validation under fields.
- Page-level banner for non-field API failures.
- Optimistic updates only for safe actions (mark-as-read, toggles). Avoid optimistic updates for uploads/submits.

**4) Modal policy**
- Use **modals** only for confirmations and blocking requirements (KYC/bank missing).
- Use **drawers** for “details”.

---

## Creator Studio end-to-end flows (screens, popups, navigation)

### 1) Auth + onboarding (readiness gates)

**Login/Signup pages**
- Routes: `/creator/login`, `/creator/signup`
- Validations:
  - email format / phone format
  - password rules (min length + complexity if required)
  - required fields

**Readiness checklist (blocking gates)**
Show on Dashboard and enforce before sensitive actions:
- Profile complete (name, email/phone)
- Payout setup complete (bank + KYC if required)
- Availability toggle (non-blocking, but affects deal discovery)

Blocking popups:
- Trying to accept a deal or request payout without bank/KYC → **blocking modal** with CTA to `/creator/payouts`.

---

### 2) Dashboard (command center)

**Must contain**
- Alert strip (nearest deadline, rejected reel feedback, new offers, payout updates)
- KPI cards: pending offers, active campaigns, reels pending/rejected, earnings + pending payout
- “Next actions” card list (deep links):
  - “Upload for Campaign X” → `/creator/upload-reel?campaignId=...`
  - “Review offers” → `/creator/deals?tab=offers`
- Recent activity feed

Popups (only when high urgency)
- Deadline warning (e.g., < 6 hours left and no submission)
- Reel rejected (show reason + “Re-upload” CTA)

---

### 3) Deals (offers + campaign lifecycle)

**Route**: `/creator/deals`

**Tabs**
- Offers, Active, Completed, History

**Offer list**
- Filters: category, payout range, deadline window, brand, commission type
- Sort: recent / highest payout / deadline soon

**Offer detail drawer**
- Must show:
  - brand + product
  - commission breakdown (capped vs unlimited)
  - deliverable spec (1 reel, format, duration)
  - campaign timeline (accept by / upload by / review SLA)
  - brief & guidelines (do/don’t, required CTA)
- Actions:
  - Accept (primary)
  - Decline (secondary)

Popups
- Decline confirmation modal (optional reason dropdown; “Other” opens a text field)

Validations
- Accept requires readiness gates (bank/KYC if required)
- Prevent accept if offer expired / window ended

---

### 4) Upload Reel (deliverable workspace)

**Route**: `/creator/upload-reel`

**Recommended UX**: stepper
1. Select campaign
2. Upload video
3. Add details
4. Review & submit
5. Submitted (status)

**Step 1: Select campaign**
- Only show eligible active campaigns.
- Validation: campaign required.

**Step 2: Upload video**
Frontend validations must match backend constraints (reels documentation baseline):
- allowed extensions: `.mp4`, `.mov`, `.avi`, `.mkv`
- size: ≤ 100MB
- duration: ≤ 60 seconds

UX requirements
- drag/drop + browse
- preview player
- progress bar + cancel
- replace file flow

Popups/toasts
- unsupported file type
- file too large
- duration too long

**Step 3: Add details**
- Description/caption required
- Validation: required + max length (use backend-aligned limit; reels doc uses up to 5000 chars)
- Optional: disclosure toggle (“Paid partnership”) if required by policy

**Step 4: Review & submit**
- Checklist acknowledgement: “I followed the brief”
- Validation: must accept acknowledgement before submit

**Step 5: Submitted**
- Shows status (under review / approved / rejected)
- If rejected: show reason + CTA to re-upload with campaign preselected

---

### 5) My Reels (reel manager)

**Route**: `/creator/reels`

List view
- Filters: status, campaign, brand, date range
- Cards: thumbnail, campaign, status, updated time, basic metrics

Detail drawer
- video preview
- status timeline
- feedback/rejection reason
- actions: re-upload, view live, (optional) delete

Validations
- disable delete for under-review or live reels (policy decision; show explanation)

---

### 6) Notifications (inbox)

**Route**: `/creator/notifications`

Rules to follow (from backend notification documentation)
- aggregated reel-like notifications (update existing unread notification)
- follow notifications are per-event

UX requirements
- bell badge shows unread count
- list supports: unread filter, mark read, mark all read, delete, bulk delete (optional)
- open notification deep-links to relevant screen (deal/reel)

Performance
- poll unread count; fetch full list on open

---

### 7) Earnings + Payouts/KYC

**Earnings route**: `/creator/earnings`
- breakdown: available vs pending vs paid
- per-campaign earnings rows
- drill-down drawer for calculation & attribution

**Payouts/KYC route**: `/creator/payouts`
- bank form validations:
  - account number required + confirm match
  - IFSC format
  - beneficiary name required
- KYC validations:
  - document format checks
  - file upload type/size limits (set and enforce)
- payout request validations:
  - minimum threshold
  - available balance

Blocking popups
- KYC pending / bank missing when attempting payout or accept deal (if payout readiness is required)

---

### 8) Settings

**Route**: `/creator/settings`
- Profile: name/email/phone
- Availability toggle
- Shortcuts: payouts/KYC, notifications preferences (future)
- Security: password reset, logout

Validations
- email/phone formats
- required fields

---

## Validation matrix (must enforce)

**Accept deal**
- creator authenticated
- offer not expired
- readiness gates satisfied (if required): bank/KYC complete

**Upload reel**
- campaign selected and active
- file present
- file type allowed
- size ≤ 100MB
- duration ≤ 60s

**Submit reel**
- description required and within limit (≤ 5000)
- brief acknowledgement checked

**Notifications**
- mark-as-read can be optimistic (rollback on API failure)

**Payout request**
- bank + KYC complete
- available balance ≥ minimum

---

## Checklist (what we “have to include”)

- [ ] Dashboard overview (counts + next actions)
- [ ] Deals: offers + campaign lifecycle + detail sheet
- [ ] Upload Reel: select campaign + upload + resubmit
- [ ] Earnings: breakdown + history
- [ ] Settings: profile + availability toggle
- [ ] (Next) My Reels manager
- [ ] (Next) Notifications inbox + unread badge
- [ ] (Next) Payout setup (bank/KYC)
- [ ] (Next) Analytics insights

