// app/admin/contacts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Search, Mail, MessageCircle, Globe,
  Star, Trash2, Reply, ExternalLink, Filter,
  RefreshCw, Loader2
} from 'lucide-react';

// Types
interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  source: string;
  read: boolean;
  starred: boolean;
  created_at: string;
}

// Configuration des sources (ajoutez-en autant que vous voulez)
const sourceConfig: Record<string, { icon: any; color: string; label: string }> = {
  email: { icon: Mail, color: 'bg-blue-50 text-blue-600', label: 'Email' },
  whatsapp: { icon: MessageCircle, color: 'bg-green-50 text-green-600', label: 'WhatsApp' },
  linkedin: { icon: Globe, color: 'bg-sky-50 text-sky-600', label: 'LinkedIn' },
  facebook: { icon: Globe, color: 'bg-indigo-50 text-indigo-600', label: 'Facebook' },
  instagram: { icon: Globe, color: 'bg-pink-50 text-pink-600', label: 'Instagram' },
  twitter: { icon: Globe, color: 'bg-gray-100 text-gray-700', label: 'Twitter/X' },
  telegram: { icon: Globe, color: 'bg-cyan-50 text-cyan-600', label: 'Telegram' },
  tiktok: { icon: Globe, color: 'bg-black/5 text-black', label: 'TikTok' },
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Charger les contacts
  const fetchContacts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setContacts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Marquer comme lu
  const markAsRead = async (id: number) => {
    await supabase.from('contacts').update({ read: true }).eq('id', id);
    fetchContacts();
  };

  // Basculer étoile
  const toggleStar = async (id: number, current: boolean) => {
    await supabase.from('contacts').update({ starred: !current }).eq('id', id);
    fetchContacts();
  };

  // Supprimer
  const deleteContact = async (id: number) => {
    if (!confirm('Supprimer ce message ?')) return;
    await supabase.from('contacts').delete().eq('id', id);
    fetchContacts();
  };

  // Vider tous les messages
  const clearAll = async () => {
    if (!confirm('Supprimer TOUS les messages ? Cette action est irréversible.')) return;
    await supabase.from('contacts').delete().neq('id', 0);
    fetchContacts();
  };

  // Répondre par email
  const replyByEmail = (email: string, subject: string) => {
    window.open(`mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`);
  };

  // Filtrer par recherche
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const stats = Object.entries(sourceConfig).map(([key, config]) => ({
    ...config,
    count: contacts.filter((c) => c.source === key).length,
  })).filter(s => s.count > 0);

  const totalStats = [
    ...stats,
    { icon: Star, label: 'Non lus', count: contacts.filter((c) => !c.read).length, color: 'bg-amber-50 text-amber-600' },
    { icon: Globe, label: 'Total', count: contacts.length, color: 'bg-violet-50 text-violet-600' },
  ];

  return (
    <div className="space-y-4 p-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Messages reçus</h2>
          <p className="text-xs text-gray-500">
            {contacts.filter(c => !c.read).length} non lus sur {contacts.length} messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={fetchContacts}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </Button>
          <div className="relative w-56">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              className="pl-8 h-8 text-xs bg-white border-gray-200 rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className={`grid gap-2.5 ${totalStats.length <= 4 ? 'grid-cols-' + totalStats.length : 'grid-cols-4'}`}>
        {totalStats.slice(0, 8).map((stat) => (
          <div key={stat.label} className="bg-white border rounded-xl p-3 flex items-center gap-2.5">
            <div className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon size={16} />
            </div>
            <div>
              <div className="text-xl font-medium text-gray-900">{stat.count}</div>
              <div className="text-[11px] text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Liste des contacts */}
      <Card className="border-gray-100 shadow-none">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-[13px] font-medium">Tous les messages</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] h-7 text-red-600 hover:bg-red-50"
              onClick={clearAll}
            >
              <Trash2 size={12} className="mr-1" /> Vider
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-gray-400" size={28} />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Globe size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun message</p>
              <p className="text-xs">Les messages apparaîtront ici</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[11px] text-gray-400 uppercase tracking-wider border-b bg-gray-50/50">
                    <th className="text-left p-2.5 font-medium w-8">
                      <Star size={12} />
                    </th>
                    <th className="text-left p-2.5 font-medium">Contact</th>
                    <th className="text-left p-2.5 font-medium">Sujet</th>
                    <th className="text-left p-2.5 font-medium">Source</th>
                    <th className="text-left p-2.5 font-medium">Date</th>
                    <th className="text-right p-2.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => {
                    const Source = sourceConfig[contact.source] || sourceConfig.email;
                    const date = new Date(contact.created_at);
                    const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                    const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <tr
                        key={contact.id}
                        onClick={() => markAsRead(contact.id)}
                        className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                          !contact.read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleStar(contact.id, contact.starred)}>
                            <Star
                              size={13}
                              className={contact.starred ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                            />
                          </button>
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-[26px] w-[26px]">
                              <AvatarFallback className="text-[10px] bg-gray-100 text-gray-600">
                                {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className={`font-medium ${!contact.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                {contact.name}
                              </div>
                              <div className="text-[10px] text-gray-400">{contact.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <div className={`font-medium max-w-[200px] truncate ${!contact.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {contact.subject}
                          </div>
                          <div className="text-[10px] text-gray-400 max-w-[200px] truncate">
                            {contact.message}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <Badge variant="secondary" className={`text-[10px] ${Source.color} border-0`}>
                            <Source.icon size={10} className="mr-1" />
                            {Source.label}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-gray-500 whitespace-nowrap">
                          <div>{dateStr}</div>
                          <div className="text-[10px] text-gray-400">{timeStr}</div>
                        </td>
                        <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-[26px] w-[26px] hover:bg-blue-50 hover:text-blue-600"
                              title="Répondre par email"
                              onClick={() => replyByEmail(contact.email, contact.subject)}
                            >
                              <Reply size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-[26px] w-[26px] hover:bg-gray-100"
                              title="Voir détails"
                            >
                              <ExternalLink size={13} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-[26px] w-[26px] hover:bg-red-50 hover:text-red-600"
                              title="Supprimer"
                              onClick={() => deleteContact(contact.id)}
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}