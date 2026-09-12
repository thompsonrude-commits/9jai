import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { LogOut, Settings2, Bookmark, Download, Bell, Globe, BookOpen } from 'lucide-react';
import { signOut } from '../lib/firebase';
import AppHeader from './AppHeader';

export default function Profile({ user }: { user?: FirebaseUser | null }) {
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <AppHeader />
        <div className="text-center max-w-md p-6 rounded-3xl border border-gray-200 bg-white shadow-sm">
          <h1 className="text-2xl font-serif text-[#008751] mb-3">Profile</h1>
          <p className="text-sm text-gray-600 mb-6">Sign in to access your saved chats, bookmarks, downloads and personal preferences.</p>
          <a href="/admin/login" className="inline-flex items-center justify-center rounded-full bg-[#008751] px-5 py-3 text-sm font-bold text-white hover:bg-[#00A862] transition-colors">Sign in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <AppHeader />
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#008751] font-bold mb-2">Profile</p>
          <h1 className="text-3xl font-serif text-[#1A1A1A]">Welcome back, {user.displayName || 'Learner'}</h1>
          <p className="mt-2 text-sm text-gray-600 max-w-xl">Manage account settings, language preferences, saved history and AI personalization in one place.</p>
        </div>
        <button
          onClick={() => signOut()}
          className="inline-flex items-center gap-2 rounded-full bg-[#008751] px-4 py-2 text-sm font-bold text-white hover:bg-[#00A862] transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-[#008751]"><Globe size={18} /><h2 className="text-lg font-semibold">Language Preferences</h2></div>
          <p className="text-sm text-gray-600 mb-4">Set your preferred default language, voice style and learning goals.</p>
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#F5F5F0] p-4"><p className="text-sm font-semibold">Default Language</p><p className="text-xs text-gray-500">Nigerian Pidgin</p></div>
            <div className="rounded-2xl bg-[#F5F5F0] p-4"><p className="text-sm font-semibold">Voice Mode</p><p className="text-xs text-gray-500">Multilingual assistant</p></div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-[#008751]"><Bell size={18} /><h2 className="text-lg font-semibold">Notifications</h2></div>
          <p className="text-sm text-gray-600 mb-4">Control alerts for new lessons, updates and community activity.</p>
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#F5F5F0] p-4"><p className="text-sm font-semibold">Daily learning reminders</p><p className="text-xs text-gray-500">Enabled</p></div>
            <div className="rounded-2xl bg-[#F5F5F0] p-4"><p className="text-sm font-semibold">New content alerts</p><p className="text-xs text-gray-500">Enabled</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mt-6">
        <Card title="Saved history" subtitle="Review your past conversations." icon={BookOpen} />
        <Card title="Bookmarks" subtitle="Keep your favorite lessons handy." icon={Bookmark} />
        <Card title="Downloads" subtitle="Access images, audio and notes." icon={Download} />
      </div>
    </div>
  );
}

function Card({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: React.ComponentType<{ size: number }> }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#008751]/10 text-[#008751] mb-4"><Icon size={18} /></div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}
