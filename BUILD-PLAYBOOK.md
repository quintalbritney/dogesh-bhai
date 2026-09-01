# Build Playbook: PRD → Live, Designed App (with Claude Code)

A step-by-step record of how Dogesh Bhai actually got built in this session —
from a written PRD to a deployed, branded, bug-checked app. Written so it can
be reused for the next app: swap the domain, keep the process.

This is the "how we actually did it" companion to a product-spec playbook
(like the one this project started from) — that kind fixes *what* to build;
this one fixes *how* to get it built with an AI coding assistant without the
build stalling on environment issues, fake data, or silent design regressions.

---

## Phase 0 — Turn a PRD into a build plan, not just code

Don't hand a full PRD (ours ran 40 sections) straight to code. First have the
assistant translate it into a scoped, sequenced plan and get your sign-off:

- Roles & permission model (who can do what — kept to the minimum real roles)
- Data model as plain tables + one append-only timeline/audit table
- **Row Level Security as the real enforcement**, not hidden UI buttons
- Explicit build order: core loop first, everything else after
- A list of disclosed simplifications (what's mocked/deferred and why)

**Prompt used:** *"Translate this PRD into an actual buildable MVP plan —
data model, RLS, build order — and put it in a plan file before writing any
code."*

This is also where you resolve ambiguous asks before they become rework —
e.g. "live tracking" turned out to mean crowd-sourced location pings + QR
scans, not GPS hardware, once we talked through what was actually feasible
for free.

## Phase 1 — Environment setup (expect Windows-specific friction)

On a fresh machine, check for Node, git, and the GitHub/Vercel CLIs *before*
assuming they exist:

```powershell
node -v; npm -v; git --version
```

Gotchas we actually hit:
- Node wasn't installed → `winget install OpenJS.NodeJS.LTS`
- Git was installed but not on `PATH` for this shell session → had to
  prepend `C:\Program Files\Git\cmd` to `$env:Path` explicitly per command
- `create-next-app` refuses a directory name with a space (`"my app"`) as
  the npm package name → scaffold into a temp dir, then move files in, then
  fix `package.json`'s `"name"` field
- Next.js 16's dev server deprecated `middleware.ts` in favor of `proxy.ts`
  → ran `npx @next/codemod@canary middleware-to-proxy .` rather than
  hand-porting it

## Phase 2 — Data model & RLS, as a single migration, before any app code

Write the whole schema — tables, a status-walking core entity, an
append-only timeline table, and every RLS policy — as one `.sql` file the
user runs themselves in the Supabase SQL Editor. Do this *before* scaffolding
the app, so the app code is written against a real, known schema.

**Prompt used:** *"Write the data model as a single SQL migration: tables,
a status field walking the core flow, a timeline table, and RLS policies
enforcing who can update what based on role."*

Key discipline: RLS policies enforce permissions in Postgres itself (e.g.
"only `vet`/`admin` role can set `verification_status`"), not just by hiding
a button in the UI — verified later by literally trying the forbidden action
as a lower-privilege account and confirming Postgres rejects it.

## Phase 3 — Scaffold, wire the backend, build early

1. `create-next-app` (TypeScript, Tailwind, App Router)
2. Add `@supabase/ssr` browser + server clients, plus session-refresh
   middleware/proxy
3. `.env.local.example` committed (safe placeholders), `.env.local`
   gitignored
4. **Run a production build immediately**, before writing feature code —
   catches type errors and framework version quirks while the tree is small
   enough that errors are obvious

One real gotcha here: hand-written Supabase types must be `type` aliases,
not `interface` — interfaces don't get the implicit index signature
supabase-js needs, which silently collapses every query result to `never`.

## Phase 4 — Build the core business loop first, verify in a real browser

Before any other screen, build the one path that proves the product works:
register the entity → assign responsibility → schedule/complete an action →
see it reflected in a timeline. Click through it manually in a browser
against the real database before building anything else.

**Prompt used:** *"Build the core loop end to end — register, assign,
complete, timeline — and let's click through it in the browser before
building anything else."*

This is also where you catch schema mistakes cheaply: we found the
`Database` generic needed `Relationships: []` and `Views`/`Functions`/`Enums`
keys to satisfy supabase-js's type constraints — caught during this first
build, not three features deep.

## Phase 5 — Build remaining features in dependency order

Roughly, in the order we actually did it:
1. Auth screens (signup/login/logout) + browse/list views
2. The next-most-critical record type + its own verification/trust states
3. Any multi-step status pipeline (report → claim → resolve) as an explicit
   state machine, not a free-text status field
4. Identity/lookup mechanism (we used generated QR codes linking to each
   record's page — client-side generation, no external service)
5. Location/map (free tiles — Leaflet + OpenStreetMap — no billing account
   needed, unlike Google Maps)
6. Duplicate-detection flow — **build this as an explicit admin decision
   with both merge directions offered**, not an assumed direction. (We
   shipped the assumed-direction version first, it merged the wrong record,
   and we fixed it by making admins pick "keep A, archive B" vs "keep B,
   archive A" explicitly instead of guessing from submission order.)
7. Admin console with real dashboard counts (never fabricated ones)
8. In-app notifications, verified with a *second* test account so you
   confirm the notification reaches the right person, not just that the
   insert succeeded

At every step: build → `npm run build` clean → click through in browser as
each relevant role → only then move on.

## Phase 6 — Deploy for real (GitHub + Vercel, CLI device flows)

```powershell
winget install --id GitHub.cli
gh auth login --hostname github.com --git-protocol https --web
```
This prints a one-time code + URL — the human opens it and approves in
their own browser. Same pattern for Vercel:
```powershell
npm install -g vercel
vercel login --github
```
Then:
```powershell
git init && git add -A && git commit -m "Initial commit"
gh repo create <you>/<repo> --public --source=. --remote=origin --push
vercel link --yes --project <name>
vercel env add NEXT_PUBLIC_SUPABASE_URL production --no-sensitive --value "..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --no-sensitive --value "..."
vercel deploy --prod
```

**Environment-specific gotcha worth documenting for your own setup:** in
this particular sandboxed shell, `gh`'s auto-configured git credential
helper (`!'gh.exe' auth git-credential`) failed silently on every `git
push` — the shell couldn't spawn the sub-shell the helper needs. Workaround:
push with the token embedded directly in a one-off URL instead of relying on
the stored credential helper:
```powershell
$token = gh auth token
git push "https://$token@github.com/<you>/<repo>.git" main:main
```
This is a workaround for *this* sandboxed environment — on a normal
terminal, `gh auth setup-git` should just work.

**After every deploy, verify the live URL against real data** — log in on
the production URL and confirm it shows the same records as local, not just
a green build log. A build can succeed while still being misconfigured
against the database.

## Phase 7 — The UI/UX pass is its own phase, not an afterthought

Once the app works, treat design as a deliberate second pass with its own
process:

1. **Name the emotional register explicitly** ("punchy," "bright," "Apple
   restraint + Petco cheerfulness") rather than asking for "a nice UI."
2. **Pick real reference products** and study them specifically — what CTA
   copy they use, what layout order, what makes them feel bright vs. dull.
3. **Write the palette as actual hex-range design tokens** in one place
   (CSS custom properties), not scattered Tailwind utility classes — so
   "make it brighter" is a five-line diff, not a file-by-file hunt.
4. **Source real photography, don't fabricate it.** We pulled genuinely
   free-to-use, correctly-licensed photos (Wikimedia Commons, CC-BY-SA) via
   web search + fetch, verified each URL actually resolved before using it,
   and credited the source in the footer — rather than hot-linking random
   images or generating fake ones.
5. **Watch for accidental full-opacity bugs**: a decorative CSS class
   (`opacity: 0.12`, meant for a background texture) got applied directly to
   a content section instead of a separate overlay `<div>`, washing out an
   entire hero section to near-invisibility. Caught by comparing what a
   screenshot showed against what the DOM/computed-styles actually said —
   worth knowing this class of bug exists before you lose time to it.
6. **If the live preview's screenshot tool seems to lie after scrolling**,
   don't trust it blindly — cross-check with a JS `getComputedStyle` /
   `elementFromPoint` query on the actual page. In our case the screenshot
   tool had a scroll-capture quirk; the real page was rendering correctly
   the whole time.

## Phase 8 — Seed realistic demo data through the app itself

Don't hand-write INSERT statements for demo content if the app already has
the right server actions — call them the same way a real user would, so the
data respects the same RLS policies and triggers real ones (timeline
entries, ID generation, etc.) that fake seed data would otherwise skip.

We built a one-time admin "Seed demo dogs" button that calls the *existing*
`createDog`-equivalent path for each named profile, with real (freely
licensed) photos and scattered map coordinates — not synthetic placeholder
data, and not a special-cased seed script that bypasses the app's own rules.

## Phase 9 — Turn user bug reports into root-cause fixes + reusable tooling

When the user reported one dog appearing dozens of times, the instinct is to
just delete the duplicates. Better sequence:
1. **Find the root cause** — the register button had no loading/disabled
   state, so repeated clicks (or a slow response the user thought failed)
   fired repeated inserts.
2. **Fix the cause**, not just the symptom — added a shared `SubmitButton`
   component using React's `useFormStatus()` that disables itself and shows
   "Saving…" during any request, applied to every form that creates a new
   record.
3. **Clean up existing damage as a reusable admin action**, not a one-off
   manual fix — built an "archive duplicate names, keep the oldest" console
   button instead of clicking "Archive" 19 times by hand. It's still there
   for next time.

## Phase 10 — Treat every change as: build → commit → push → deploy → verify live

Once deployed, this becomes the loop for every subsequent change, not a
one-time sequence:
```powershell
npm run build                          # must be clean before shipping
git add -A && git commit -m "..."
git push <remote> main:main
vercel deploy --prod
```
Then actually open the production URL and confirm the change is visible
with real data — the same discipline as Phase 6, repeated every time.

---

## Principles worth keeping, independent of the domain

- **Migrations and RLS before app code** — the schema is a contract; write
  and lock it first.
- **RLS is the real permission system.** A hidden button is a UX nicety, not
  security — verify by attempting the forbidden action as the wrong role.
- **Build the core loop before anything else**, and prove it by clicking
  through it, not by reading the code.
- **Never fabricate stats, contacts, or data.** Real counts even when small;
  empty states instead of invented phone numbers or made-up impressive
  numbers.
- **Disclose every simplification explicitly** (what's mocked, what's
  deferred, and why) rather than letting it pass silently as if it were the
  real thing.
- **A build succeeding is not the same as a feature working.** Verify in a
  real browser, against real data, after every deploy — local and
  production both.
- **When a bug surfaces, fix the cause and leave a tool behind**, not just a
  one-time patch.
