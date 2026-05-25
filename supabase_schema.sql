-- ============================================================
-- ACADEMY MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: classes
-- ============================================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,           -- e.g. "Grade 5 A"
  section TEXT,                 -- e.g. "Morning"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: subjects
-- ============================================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,    -- e.g. "Mathematics"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: class_subjects  (which subjects belong to which class)
-- ============================================================
CREATE TABLE class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(class_id, subject_id)
);

-- ============================================================
-- TABLE: students
-- ============================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  father_name TEXT,
  phone TEXT,
  address TEXT,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  default_monthly_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: fees  (one record per student per month)
-- ============================================================
CREATE TABLE fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,      -- can override default_monthly_fee
  paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, month, year)     -- one record per student per month
);

-- ============================================================
-- TABLE: tests
-- ============================================================
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,           -- e.g. "Monthly Test - April"
  test_date DATE NOT NULL,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  total_marks INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: marks  (one record per student per test)
-- ============================================================
CREATE TABLE marks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  obtained_marks NUMERIC(6,2),       -- NULL means absent
  is_absent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(test_id, student_id)
);

-- ============================================================
-- INDEXES  (for performance with 2500+ students)
-- ============================================================
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_is_active ON students(is_active);
CREATE INDEX idx_fees_student_id ON fees(student_id);
CREATE INDEX idx_fees_month_year ON fees(month, year);
CREATE INDEX idx_fees_paid ON fees(paid);
CREATE INDEX idx_tests_class_id ON tests(class_id);
CREATE INDEX idx_tests_subject_id ON tests(subject_id);
CREATE INDEX idx_tests_test_date ON tests(test_date);
CREATE INDEX idx_marks_test_id ON marks(test_id);
CREATE INDEX idx_marks_student_id ON marks(student_id);

-- ============================================================
-- SEED DATA - Sample classes
-- ============================================================
INSERT INTO classes (name, section) VALUES
  ('Grade 1', 'A'),
  ('Grade 1', 'B'),
  ('Grade 2', 'A'),
  ('Grade 2', 'B'),
  ('Grade 3', 'A'),
  ('Grade 4', 'A'),
  ('Grade 5', 'A'),
  ('Grade 6', 'A'),
  ('Grade 7', 'A'),
  ('Grade 8', 'A');

-- ============================================================
-- SEED DATA - Common subjects
-- ============================================================
INSERT INTO subjects (name) VALUES
  ('Mathematics'),
  ('English'),
  ('Urdu'),
  ('Science'),
  ('Social Studies'),
  ('Islamiat'),
  ('Computer'),
  ('Physics'),
  ('Chemistry'),
  ('Biology');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- View: student with class name (avoids joins in app)
CREATE VIEW student_details AS
SELECT
  s.id,
  s.name,
  s.father_name,
  s.phone,
  s.address,
  s.admission_date,
  s.default_monthly_fee,
  s.is_active,
  s.class_id,
  c.name AS class_name,
  c.section AS class_section
FROM students s
JOIN classes c ON s.class_id = c.id;

-- View: fee summary per student
CREATE VIEW fee_summary AS
SELECT
  f.student_id,
  s.name AS student_name,
  c.name AS class_name,
  COUNT(*) AS total_months,
  SUM(CASE WHEN f.paid THEN f.amount ELSE 0 END) AS total_paid,
  SUM(CASE WHEN NOT f.paid THEN f.amount ELSE 0 END) AS total_due
FROM fees f
JOIN students s ON f.student_id = s.id
JOIN classes c ON s.class_id = c.id
GROUP BY f.student_id, s.name, c.name;

-- View: test results with student and subject info
CREATE VIEW test_results AS
SELECT
  m.id,
  m.obtained_marks,
  m.is_absent,
  t.name AS test_name,
  t.test_date,
  t.total_marks,
  sub.name AS subject_name,
  s.name AS student_name,
  s.id AS student_id,
  c.name AS class_name,
  t.class_id,
  t.id AS test_id
FROM marks m
JOIN tests t ON m.test_id = t.id
JOIN students s ON m.student_id = s.id
JOIN classes c ON t.class_id = c.id
JOIN subjects sub ON t.subject_id = sub.id;

-- ============================================================
-- FUNCTION: auto-generate monthly fee records for a class
-- Call this at start of each month
-- Usage: SELECT generate_monthly_fees(2024, 9);
-- ============================================================
CREATE OR REPLACE FUNCTION generate_monthly_fees(p_year INTEGER, p_month INTEGER)
RETURNS INTEGER AS $$
DECLARE
  inserted INTEGER := 0;
BEGIN
  INSERT INTO fees (student_id, month, year, amount, paid)
  SELECT 
    s.id,
    p_month,
    p_year,
    s.default_monthly_fee,
    FALSE
  FROM students s
  WHERE s.is_active = TRUE
  ON CONFLICT (student_id, month, year) DO NOTHING;

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (enable after setting up auth)
-- For now left open for development - enable when ready
-- ============================================================
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
