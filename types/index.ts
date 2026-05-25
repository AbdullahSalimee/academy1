export interface Class {
  id: string
  name: string
  section: string | null
  created_at: string
}

export interface Subject {
  id: string
  name: string
  created_at: string
}

export interface Student {
  id: string
  name: string
  father_name: string | null
  phone: string | null
  address: string | null
  class_id: string
  admission_date: string
  default_monthly_fee: number
  is_active: boolean
  created_at: string
}

export interface StudentDetails extends Student {
  class_name: string
  class_section: string | null
}

export interface Fee {
  id: string
  student_id: string
  month: number
  year: number
  amount: number
  paid: boolean
  paid_date: string | null
  notes: string | null
  created_at: string
}

export interface Test {
  id: string
  name: string
  test_date: string
  class_id: string
  subject_id: string
  total_marks: number
  created_at: string
  // joined
  subject_name?: string
  class_name?: string
}

export interface Mark {
  id: string
  test_id: string
  student_id: string
  obtained_marks: number | null
  is_absent: boolean
  created_at: string
}

export interface TestResult {
  id: string
  obtained_marks: number | null
  is_absent: boolean
  test_name: string
  test_date: string
  total_marks: number
  subject_name: string
  student_name: string
  student_id: string
  class_name: string
  class_id: string
  test_id: string
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
