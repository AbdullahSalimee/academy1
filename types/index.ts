export interface Class {
  id: string;
  name: string;
  section: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  father_name: string | null;
  phone: string | null;
  address: string | null;
  class_id: string;
  admission_date: string;
  default_monthly_fee: number;
  is_active: boolean;
  created_at: string;
}

export interface Fee {
  id: string;
  student_id: string;
  month: number;
  year: number;
  amount: number;
  paid: boolean;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface FeePayment {
  id: string;
  fee_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: "cash" | "bank" | "other";
  notes: string | null;
  created_at: string;
}

export interface Test {
  id: string;
  name: string;
  test_date: string;
  class_id: string;
  subject_id: string;
  total_marks: number;
  created_at: string;
}

export interface Mark {
  id: string;
  test_id: string;
  student_id: string;
  obtained_marks: number | null;
  is_absent: boolean;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: "present" | "absent" | "late";
  notes: string | null;
  created_at: string;
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
