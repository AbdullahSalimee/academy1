'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Class } from '@/types'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewStudentPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    father_name: '',
    phone: '',
    address: '',
    class_id: '',
    admission_date: new Date().toISOString().split('T')[0],
    default_monthly_fee: '',
  })

  useEffect(() => {
    supabase.from('classes').select('*').order('name').then(({ data }) => {
      setClasses(data || [])
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!form.name || !form.class_id || !form.default_monthly_fee) {
      setError('Name, Class, and Monthly Fee are required.')
      setLoading(false)
      return
    }

    const { error: err } = await supabase.from('students').insert({
      name: form.name.trim(),
      father_name: form.father_name.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      class_id: form.class_id,
      admission_date: form.admission_date,
      default_monthly_fee: parseFloat(form.default_monthly_fee),
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/students')
    }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/students" className="text-slate-400 hover:text-slate-700">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="page-title">Admit New Student</h1>
        </div>
      </div>

      <div className="p-6 max-w-2xl">
        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Student Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="label">Father's Name</label>
                <input
                  className="input"
                  value={form.father_name}
                  onChange={(e) => set('father_name', e.target.value)}
                  placeholder="Father's name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Class *</label>
                <select
                  className="input"
                  value={form.class_id}
                  onChange={(e) => set('class_id', e.target.value)}
                >
                  <option value="">Select class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.section}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Admission Date *</label>
                <input
                  type="date"
                  className="input"
                  value={form.admission_date}
                  onChange={(e) => set('admission_date', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Monthly Fee (Rs.) *</label>
                <input
                  type="number"
                  className="input"
                  value={form.default_monthly_fee}
                  onChange={(e) => set('default_monthly_fee', e.target.value)}
                  placeholder="e.g. 2000"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="03XX-XXXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <textarea
                className="input h-20 resize-none"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Student's home address"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary">
                <Save size={15} />
                {loading ? 'Saving...' : 'Admit Student'}
              </button>
              <Link href="/students" className="btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
