# Academy Management System

A Next.js + Supabase web app for managing student admissions, fees, and test results.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL)

---

## Setup Instructions

### Step 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once the project is ready, go to **SQL Editor**
3. Copy and paste the entire contents of `supabase_schema.sql` and click **Run**
4. This will create all tables, views, indexes, and seed data

### Step 2 — Configure environment variables

1. Duplicate `.env.example` and rename it to `.env.local`
2. Go to your Supabase project → **Project Settings** → **API**
3. Copy **Project URL** and paste it as `NEXT_PUBLIC_SUPABASE_URL`
4. Copy **anon/public key** and paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Step 3 — Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

| Module | What it does |
|--------|-------------|
| **Dashboard** | Overview stats — students, classes, monthly fees collected/due |
| **Classes** | Add/remove classes and subjects |
| **Students** | Admit students, view profiles, see their full fee + result history |
| **Fees** | Generate monthly fees for all students, mark fees as paid/unpaid |
| **Tests** | Create tests (name, class, subject, date), enter marks for whole class |
| **Results** | View class results with ranking, % score, and grade (A+ to F) |

---

## Workflow for Teachers

### Monthly fee collection
1. Go to **Fees** page at the start of each month
2. Click **Generate Monthly Fees** — this creates one fee record per active student
3. As students pay, click **Mark Paid** next to their name
4. Filter by "Unpaid" to see who still owes

### After a test
1. Go to **Tests** → **Create Test**
2. Fill in test name, class, subject, date, total marks → click Create
3. You land directly on the **mark entry** screen
4. Type each student's marks — press **Enter** to move to next student
5. Check **Absent** for absent students
6. Click **Save All Marks** when done

### Showing results to parents
1. Go to **Results**
2. Select the class and test
3. Show the screen to the parent — it shows marks, percentage, grade, and class rank

---

## Generate Monthly Fees (SQL Function)

You can also call this from Supabase SQL editor:
```sql
SELECT generate_monthly_fees(2025, 9);  -- September 2025
```
This creates fee records for all active students, using their default monthly fee.
If a record already exists (e.g., you ran it twice), it is safely skipped.

---

## Folder Structure

```
academy/
├── app/
│   ├── dashboard/page.tsx     # Stats overview
│   ├── students/
│   │   ├── page.tsx           # Student list with filters
│   │   ├── new/page.tsx       # Admit new student
│   │   └── [id]/page.tsx      # Student profile + fees + results
│   ├── fees/page.tsx          # Fee management
│   ├── tests/
│   │   ├── page.tsx           # Test list
│   │   ├── new/page.tsx       # Create test
│   │   └── [id]/marks/page.tsx  # Mark entry grid
│   ├── results/page.tsx       # Results viewer
│   └── classes/page.tsx       # Manage classes & subjects
├── components/layout/Sidebar.tsx
├── lib/supabase.ts            # Supabase client
├── types/index.ts             # TypeScript types
└── supabase_schema.sql        # Full database schema
```
