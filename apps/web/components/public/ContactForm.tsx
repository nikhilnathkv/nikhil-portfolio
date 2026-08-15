'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/public';
import { track } from '@/lib/analytics';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const inputClass =
  'w-full rounded-lg border border-pub-border bg-pub-surface px-3.5 py-2.5 text-pub-fg placeholder:text-pub-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pub-accent';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // spam trap — real users never fill this
  const [status, setStatus] = useState<Status>('idle');
  const started = useRef(false);

  const disabled = status === 'submitting';

  // Fire contact_started once, on first real interaction.
  function onFirstInput() {
    if (!started.current) {
      started.current = true;
      track('contact_started');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus('error');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, honeypot }),
      });
      if (!res.ok) throw new Error('request failed');
      track('contact_submitted');
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-xl border border-pub-border bg-pub-surface p-6 text-pub-fg"
      >
        Message sent. Thanks for reaching out — I&apos;ll get back to you.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} onFocus={onFirstInput} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cf-name" className="text-sm font-medium text-pub-fg">
          Name
        </label>
        <input
          id="cf-name"
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cf-email" className="text-sm font-medium text-pub-fg">
          Email
        </label>
        <input
          id="cf-email"
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cf-message" className="text-sm font-medium text-pub-fg">
          Message
        </label>
        <textarea
          id="cf-message"
          className={inputClass}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={5000}
        />
      </div>

      {/* Honeypot — hidden from users & assistive tech; bots fill it and get dropped. */}
      <div aria-hidden className="hidden">
        <label htmlFor="cf-website">Website</label>
        <input
          id="cf-website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {status === 'error' ? (
        <p role="alert" className="text-sm text-red-400">
          Something went wrong. Please try again, or email me directly.
        </p>
      ) : null}

      <div>
        <Button type="submit" disabled={disabled}>
          {disabled ? 'Sending…' : 'Send message'}
        </Button>
      </div>
    </form>
  );
}
