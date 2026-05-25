'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Class, Subject } from '@/types'
import { Plus, Trash2 } from 'lucide-react'

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [newClass, setNewClass] = useState({ name: '', section: '' })
  const [newSubject, setNewSubject] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    const [cls, sub] = await Promise.all([
      supabase.from('classes').select('*').order('name'),
      supabase.from('subjects').select('*').order('name'),
    ])
    setClasses(cls.data || [])
    setSubjects(sub.data || [])
  }

  useEffect(() => { load() }, [])

  const addClass = async () => {
    if (!newClass.name) return
    setLoading(true)
    await supabase.from('classes').insert({
      name: newClass.name.trim(),
      section: newClass.section.trim() || null,
    })
    setNewClass({ name: '', section: '' })
    setLoading(false)
    load()
  }

  const deleteClass = async (id: string) => {
    if (!confirm('Delete this class? Students in it cannot be deleted.')) return
    await supabase.from('classes').delete().eq('id', id)
    load()
  }

  const addSubject = async () => {
    if (!newSubject.trim()) return
    await supabase.from('subjects').insert({ name: newSubject.trim() })
    setNewSubject('')
    load()
  }

  const deleteSubject = async (id: string) => {
    if (!confirm('Delete this subject?')) return
    await supabase.from('subjects').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Classes & Subjects</h1>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-slate-800 mb-4">Classes</h2>

          {/* Add class form */}
          <div className="flex gap-2 mb-5">
            <input
              className="input flex-1"
              placeholder="Class name (e.g. Grade 5)"
              value={newClass.name}
              onChange={(e) => setNewClass((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="input w-24"
              placeholder="Section"
              value={newClass.section}
              onChange={(e) => setNewClass((f) => ({ ...f, section: e.target.value }))}
            />
            <button onClick={addClass} disabled={loading} className="btn-primary shrink-0">
              <Plus size={15} /> Add
            </button>
          </div>

          <div className="space-y-2">
            {classes.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                <span className="text-sm font-medium text-slate-800">
                  {c.name} {c.section && <span className="text-slate-500">({c.section})</span>}
                </span>
                <button
                  onClick={() => deleteClass(c.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {classes.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No classes yet.</p>
            )}
          </div>
        </div>

        {/* Subjects */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-slate-800 mb-4">Subjects</h2>

          <div className="flex gap-2 mb-5">
            <input
              className="input flex-1"
              placeholder="Subject name (e.g. Mathematics)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
            />
            <button onClick={addSubject} className="btn-primary shrink-0">
              <Plus size={15} /> Add
            </button>
          </div>

          <div className="space-y-2">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                <span className="text-sm font-medium text-slate-800">{s.name}</span>
                <button
                  onClick={() => deleteSubject(s.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No subjects yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
