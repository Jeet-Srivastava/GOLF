/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'

interface Charity {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  upcoming_events: string | null
  image_url: string | null
  website_url: string | null
  is_featured: boolean
  total_received_cents: number
}

function parseUpcomingEvents(value: string | null) {
  return value?.split('\n').map((event) => event.trim()).filter(Boolean) || []
}

export default function AdminCharitiesPage() {
  const { toast } = useToast()
  const [charities, setCharities] = useState<Charity[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Charity | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formShortDesc, setFormShortDesc] = useState('')
  const [formUpcomingEvents, setFormUpcomingEvents] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('')
  const [formFeatured, setFormFeatured] = useState(false)

  useEffect(() => { loadCharities() }, [])

  async function loadCharities() {
    const supabase = createClient()
    const { data } = await supabase
      .from('charities')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name')

    setCharities(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setFormName('')
    setFormSlug('')
    setFormDesc('')
    setFormShortDesc('')
    setFormUpcomingEvents('')
    setFormImageUrl('')
    setFormWebsiteUrl('')
    setFormFeatured(false)
    setModalOpen(true)
  }

  function openEdit(charity: Charity) {
    setEditing(charity)
    setFormName(charity.name)
    setFormSlug(charity.slug)
    setFormDesc(charity.description)
    setFormShortDesc(charity.short_description)
    setFormUpcomingEvents(charity.upcoming_events || '')
    setFormImageUrl(charity.image_url || '')
    setFormWebsiteUrl(charity.website_url || '')
    setFormFeatured(charity.is_featured)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()

    const payload = {
      name: formName,
      slug: formSlug || formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: formDesc,
      short_description: formShortDesc,
      upcoming_events: formUpcomingEvents || null,
      image_url: formImageUrl || null,
      website_url: formWebsiteUrl || null,
      is_featured: formFeatured,
    }

    if (editing) {
      const { error } = await supabase.from('charities').update(payload).eq('id', editing.id)
      if (error) { toast({ type: 'error', title: 'Error', description: error.message }); setSaving(false); return }
      toast({ type: 'success', title: 'Charity updated!' })
    } else {
      const { error } = await supabase.from('charities').insert(payload)
      if (error) { toast({ type: 'error', title: 'Error', description: error.message }); setSaving(false); return }
      toast({ type: 'success', title: 'Charity added!' })
    }

    setSaving(false)
    setModalOpen(false)
    loadCharities()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this charity? This cannot be undone.')) return
    const supabase = createClient()
    await supabase.from('charities').delete().eq('id', id)
    toast({ type: 'info', title: 'Charity deleted' })
    loadCharities()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Charity Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? 'Loading charities…' : `${charities.length} charities listed`}
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Charity
        </Button>
      </div>

      {/* Charities Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {charities.map((charity, i) => {
          const upcomingEvents = parseUpcomingEvents(charity.upcoming_events)

          return (
          <motion.div
            key={charity.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden"
          >
            {charity.image_url && (
              <div className="h-32 overflow-hidden bg-white/[0.04]">
                <img src={charity.image_url} alt={charity.name} className="h-full w-full object-cover opacity-60" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">{charity.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{charity.short_description}</p>
                </div>
                {charity.is_featured && <Badge variant="primary">Featured</Badge>}
              </div>
              {upcomingEvents.length > 0 && (
                <p className="text-xs text-cyan-400">
                  {upcomingEvents.length} upcoming event{upcomingEvents.length > 1 ? 's' : ''}
                </p>
              )}
              <p className="text-xs text-emerald-400 mt-2">
                £{(charity.total_received_cents / 100).toLocaleString()} raised
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => openEdit(charity)}>
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(charity.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </motion.div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Charity' : 'Add Charity'}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <Input label="Name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          <Input
            label="Slug"
            value={formSlug}
            onChange={(e) => setFormSlug(e.target.value)}
            placeholder="auto-generated from name"
          />
          <Input
            label="Short Description"
            value={formShortDesc}
            onChange={(e) => setFormShortDesc(e.target.value)}
            required
          />
          <Textarea
            label="Full Description"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            rows={4}
          />
          <Textarea
            label="Upcoming Events"
            value={formUpcomingEvents}
            onChange={(e) => setFormUpcomingEvents(e.target.value)}
            rows={4}
            placeholder={'One event per line\nCharity Golf Day - 25 May 2026\nSummer Fundraiser - 10 June 2026'}
          />
          <Input
            label="Image URL"
            value={formImageUrl}
            onChange={(e) => setFormImageUrl(e.target.value)}
            placeholder="https://..."
          />
          <Input
            label="Website URL"
            value={formWebsiteUrl}
            onChange={(e) => setFormWebsiteUrl(e.target.value)}
            placeholder="https://..."
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formFeatured}
              onChange={(e) => setFormFeatured(e.target.checked)}
              className="accent-emerald-500"
            />
            <span className="text-sm text-gray-300">Featured charity</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} fullWidth>Cancel</Button>
            <Button type="submit" loading={saving} fullWidth>{editing ? 'Update' : 'Add'} Charity</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
