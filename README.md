# Dogesh Bhai 🐾

A digital health and care passport for community (street) dogs. One dog, one permanent record, so feeding, health history, sightings, and emergency response never get lost just because one volunteer moves on.

**Live app:** https://dogesh-bhai.vercel.app
**Full product spec:** see the [Dogesh Bhai PRD](https://claude.ai/code/artifact/958f680f-b5fc-4a53-b3f1-b539ae36a491) and [BUILD-PLAYBOOK.md](./BUILD-PLAYBOOK.md) in this repo.

## What it does

- **Authentication** — email/password and Google sign-up/login, with a role picker (Volunteer or NGO) at signup. Vet and Admin access is granted by an existing admin.
- **Core entity CRUD** — register a dog (create), browse/search all dogs (read), edit a dog's details and photo (update), archive a dog or merge duplicates (delete/consolidate).
- **Core business flow** — the full lifecycle of a community dog: find it → register it → assign a caregiver → run a daily feeding schedule → get it connected to an NGO → get it vaccinated (vet-verified) → get it municipally registered → get a QR collar attached. Every step writes to that dog's permanent timeline.

Other features: real-time map of sightings, an emergency/medical case pipeline, a nearest-vets directory with distance sorting, an admin console with live (non-fabricated) stats, and in-app notifications.

## Roles

| Role | How you get it | Can do |
|---|---|---|
| Volunteer | Self-signup | Register dogs, join care teams, log feeding/sightings, submit health events, report emergencies |
| NGO | Self-signup + org name | Mark municipal registration & QR collar milestones on dogs assigned to them, add vet clinics |
| Vet | Promoted by an admin | Verify/dispute health records, moderate emergency cases |
| Admin | Promoted by an admin | Everything: role management, NGO assignment, data cleanup, live console |

## Tech stack

- **Framework:** Next.js (App Router, Server Actions, TypeScript)
- **Backend:** Supabase — Postgres, Auth, Row Level Security, Storage
- **Maps:** Leaflet + OpenStreetMap (no billing account required)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS

Permissions are enforced in the database itself via RLS policies, not just hidden in the UI — every mutation is gated by the requester's actual role, verified server-side.

## Getting started locally

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### 2. Install

```bash
npm install
```

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase project's URL and anon/publishable key:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Database setup

Run every file in `supabase/migrations/` **in order**, in your Supabase project's SQL Editor (Dashboard → SQL Editor → New query → paste → Run):

```
0001_init.sql
0002_public_read_for_landing.sql
0003_registration_pipeline.sql
0004_care_task_checked_status.sql
0005_vets.sql
0006_signup_role_and_ngo_org.sql
0007_dog_photos_storage.sql
0008_dog_photo_uploads.sql
0009_organisations_admin_delete.sql
```

This creates every table, enum, trigger, and RLS policy the app needs, plus a public `dog-photos` storage bucket.

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Make yourself an admin (first-time only)

Sign up normally as a Volunteer, then in the Supabase SQL Editor:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Log out and back in — you'll now see the Console link in the nav.

### 7. Seed demo data (optional)

Once logged in as admin, the Console (`/console`), Vets (`/vets`), and Learn (`/learn`) pages each have a "Seed demo…" button to populate example dogs, vets, and NGOs for testing without fabricating real-looking data silently — every seed action is an explicit, visible admin click.

## Project structure

```
src/app/            Route handlers & pages (App Router)
src/app/*/actions.ts Server Actions — all writes go through these
src/components/      Shared UI components
src/lib/             Supabase clients, types, shared helpers
supabase/migrations/ Every schema change, additive, numbered, never edited after merge
```

## Deployment

Deployed on Vercel, connected to the `main` branch. Every push should be followed by:

```bash
npm run build   # must be clean before shipping
git push
vercel deploy --prod
```

Then verify the live URL against real data, a clean build is not the same as a working feature.
