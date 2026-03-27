import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../../DashboardLayout'
import api from '../../../api'
import { readPageCache, writePageCache } from '../../pageCache'

export function DeanFaculty() {
  type FacultyRow = {
    id: number
    name: string
    email: string
    employee_number?: string | null
    faculty?: { id: number; first_name: string; last_name: string; department?: string | null; specialization?: string | null } | null
  }

  const cached = readPageCache<FacultyRow[]>('dean.faculty.list')
  const [items, setItems] = useState<FacultyRow[]>(cached ?? [])
  const [loading, setLoading] = useState(!cached)
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    employee_number: '',
    department: 'CCS',
    specialization: '',
  })

  useEffect(() => {
    ;(async () => {
      if (!cached) setLoading(true)
      try {
        const res = await api.get('/api/faculty')
        const payload = Array.isArray(res.data?.faculty) ? (res.data.faculty as FacultyRow[]) : []
        setItems(payload)
        writePageCache('dean.faculty.list', payload)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return items
    return items.filter((f) => {
      const n = (f.name || `${f.faculty?.last_name ?? ''}, ${f.faculty?.first_name ?? ''}`).toLowerCase()
      return n.includes(t) || String(f.email || '').toLowerCase().includes(t) || String(f.faculty?.department || '').toLowerCase().includes(t)
    })
  }, [items, q])

  async function refresh() {
    const res = await api.get('/api/faculty')
    const payload = Array.isArray(res.data?.faculty) ? (res.data.faculty as FacultyRow[]) : []
    setItems(payload)
    writePageCache('dean.faculty.list', payload)
  }

  function openCreate() {
    setError(null)
    setEditingId(null)
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      employee_number: '',
      department: 'CCS',
      specialization: '',
    })
    setModalOpen(true)
  }

  function openEdit(f: FacultyRow) {
    setError(null)
    setEditingId(f.id)
    setForm({
      first_name: f.faculty?.first_name ?? (f.name?.split(' ')[0] ?? ''),
      last_name: f.faculty?.last_name ?? (f.name?.split(' ').slice(-1)[0] ?? ''),
      email: f.email ?? '',
      password: '',
      employee_number: f.employee_number ?? '',
      department: f.faculty?.department ?? 'CCS',
      specialization: f.faculty?.specialization ?? '',
    })
    setModalOpen(true)
  }

  async function submit() {
    setSaving(true)
    setError(null)
    try {
      if (!editingId) {
        await api.post('/api/provision/faculty', {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          password: form.password,
          employee_number: form.employee_number,
          department: form.department || 'CCS',
          specialization: form.specialization || null,
        })
      } else {
        await api.put(`/api/faculty/${editingId}`, {
          name: `${form.first_name} ${form.last_name}`.trim(),
          email: form.email,
          department: form.department || null,
          specialization: form.specialization || null,
        })
      }
      setModalOpen(false)
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this faculty account?')) return
    setSaving(true)
    setError(null)
    try {
      await api.delete(`/api/faculty/${id}`)
      await refresh()
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Delete failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout activeKey="faculty" title="Faculty">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-block">
            <div className="panel-title">Faculty Directory</div>
            <div className="panel-subtitle">Create, update, and deactivate faculty accounts</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <input className="form-input" style={{ width: 220 }} placeholder="Search name/email/department…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="button" className="btn-sm btn-primary" onClick={openCreate} disabled={loading || saving}>
              Add faculty
            </button>
          </div>
        </div>

        {error ? <div className="login-error">{error}</div> : null}

        <div className="table-card">
          <div className="table-card-title">Faculty</div>
          <div className="table-card-sub">{loading ? 'Loading…' : `Showing ${filtered.length} of ${items.length} faculty member(s)`}</div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      {q.trim() ? 'No faculty match your search.' : 'No faculty found.'}
                    </td>
                  </tr>
                ) : (
                  filtered.slice(0, 200).map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 700 }}>
                        {f.faculty?.last_name ? `${f.faculty.last_name}, ${f.faculty.first_name}` : f.name || '—'}
                      </td>
                      <td>{f.faculty?.department || '—'}</td>
                      <td>{f.email || '—'}</td>
                      <td>
                        <button type="button" className="btn-xs btn-outline" onClick={() => openEdit(f)} disabled={saving}>
                          Edit
                        </button>
                        <button type="button" className="btn-xs btn-outline" onClick={() => remove(f.id)} disabled={saving}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, width: 'min(720px, 100%)', maxHeight: '85vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{editingId ? 'Edit faculty' : 'Add faculty'}</div>
              <button type="button" className="btn-xs btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Close
              </button>
            </div>

            {error ? <div className="login-error">{error}</div> : null}

            <div style={{ height: 10 }} />

            <div className="card">
              <div className="card-title">Faculty account</div>
              <div className="card-subtitle">{editingId ? 'Update details for an existing faculty user.' : 'Creates both user + faculty domain record.'}</div>

              <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                <div className="two-col">
                  <div>
                    <div className="section-heading">First name</div>
                    <input className="form-input" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} />
                  </div>
                  <div>
                    <div className="section-heading">Last name</div>
                    <input className="form-input" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} />
                  </div>
                </div>

                <div className="two-col">
                  <div>
                    <div className="section-heading">Email</div>
                    <input className="form-input" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <div className="section-heading">Department</div>
                    <input className="form-input" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <div className="section-heading">Employee number</div>
                  <input
                    className="form-input"
                    value={form.employee_number}
                    onChange={(e) => setForm((p) => ({ ...p, employee_number: e.target.value }))}
                    placeholder="7-digit ID"
                    inputMode="numeric"
                    maxLength={7}
                    disabled={!!editingId}
                  />
                </div>

                <div className="two-col">
                  <div>
                    <div className="section-heading">Specialization (optional)</div>
                    <input className="form-input" value={form.specialization} onChange={(e) => setForm((p) => ({ ...p, specialization: e.target.value }))} />
                  </div>
                  <div>
                    <div className="section-heading">Password {editingId ? '(leave blank to keep)' : ''}</div>
                    <input
                      className="form-input"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder={editingId ? '••••••' : 'min 6 chars'}
                      disabled={!!editingId}
                      title={editingId ? 'Password changes are not supported in this UI yet.' : ''}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button type="button" className="btn-sm btn-outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn-sm btn-primary" onClick={submit} disabled={saving || (!editingId && (!form.password || !form.employee_number))}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  )
}

