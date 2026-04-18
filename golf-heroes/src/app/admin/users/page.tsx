'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Mail, Shield, Edit2, Trophy, CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: string
  charity_contribution_percent: number
  created_at: string
  subscriptions: Array<{ plan: string; status: string }> | null
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('subscriber')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('*, subscriptions(plan, status)')
      .order('created_at', { ascending: false })

    setUsers(data || [])
    setLoading(false)
  }

  const filtered = users.filter(
    u => u.email.toLowerCase().includes(search.toLowerCase()) ||
         u.full_name.toLowerCase().includes(search.toLowerCase())
  )

  function openEdit(user: UserProfile) {
    setEditingUser(user)
    setEditName(user.full_name)
    setEditRole(user.role)
  }

  async function handleSaveUser() {
    if (!editingUser) return
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName, role: editRole as 'subscriber' | 'admin' })
      .eq('id', editingUser.id)

    if (error) {
      toast({ type: 'error', title: 'Error', description: error.message })
    } else {
      toast({ type: 'success', title: 'User updated!' })
      setEditingUser(null)
      loadUsers()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">{users.length} total users</p>
        </div>
      </div>

      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<Search className="h-4 w-4" />}
      />

      {/* Users Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((user) => {
                const sub = user.subscriptions?.[0]
                return (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{user.full_name || '—'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'admin' ? 'warning' : 'default'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {sub ? (
                        <div className="flex items-center gap-2">
                          <Badge variant={sub.status === 'active' ? 'success' : 'danger'} dot>
                            {sub.status}
                          </Badge>
                          <span className="text-xs text-gray-500 capitalize">{sub.plan}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(user)}
                        className="rounded-lg p-2 text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        title="Edit User"
        description={editingUser?.email}
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-300">Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white"
            >
              <option value="subscriber">Subscriber</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditingUser(null)} fullWidth>Cancel</Button>
            <Button onClick={handleSaveUser} fullWidth>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
