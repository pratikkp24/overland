import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HeroDirect from '../HeroDirect';
import BookCards from '../BookCards';
import * as AuthContextModule from '@/auth/AuthContext';
import fs from 'fs';
import path from 'path';

describe('1.6 Market Rates Label Guard', () => {
  const mockAuth = {
    user: null,
    loading: false,
    mode: 'supabase' as const,
    authError: null,
    openAuth: vi.fn(),
    closeAuth: vi.fn(),
    authOpen: false,
    pendingRole: 'shipper' as const,
    signUpWithPassword: vi.fn(),
    signInWithPassword: vi.fn(),
    sendLink: vi.fn(),
    updateProfile: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  };

  /* The hero's rate figures moved from a static panel into HeroDeck's card
     stack. The claim being guarded is unchanged and is the point of the test:
     a rate derived from market.ts must carry a word that says so, and must
     never be badged live. */
  it('the hero labels every modelled rate, and never calls one live', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(mockAuth);

    render(
      <MemoryRouter>
        <HeroDirect />
      </MemoryRouter>
    );

    // The front card of the deck carries the honesty label.
    expect(screen.getAllByText(/Modelled/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/^live$/i)).toBeNull();
    expect(screen.queryByText(/live rate/i)).toBeNull();
  });

  it('the diesel card names its source, because it is the one measured number', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(mockAuth);
    const src = fs.readFileSync(path.resolve(import.meta.dirname, '../HeroDeck.tsx'), 'utf8');
    // Measured data must be attributed; modelled data must not borrow that word.
    expect(src).toMatch(/EIA/);
    expect(src).toMatch(/Measured/);
    expect(src).toMatch(/Modelled/);
  });

  it('BookCards does not badge modelled rates as live', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(mockAuth);

    render(
      <MemoryRouter>
        <BookCards />
      </MemoryRouter>
    );

    expect(screen.queryByText(/^live$/i)).toBeNull();
    expect(screen.queryByText(/live rates/i)).toBeNull();
  });

  it('grep guard: HeroDirect.tsx and BookCards.tsx source files do not label modelled rates as live', () => {
    const heroSource = fs.readFileSync(path.resolve(import.meta.dirname, '../HeroDirect.tsx'), 'utf8')
      + fs.readFileSync(path.resolve(import.meta.dirname, '../HeroDeck.tsx'), 'utf8');
    const bookSource = fs.readFileSync(path.resolve(import.meta.dirname, '../BookCards.tsx'), 'utf8');

    // Ensure neither file badges rate figures with "live" text
    expect(heroSource).not.toMatch(/Live rate/i);
    expect(heroSource).not.toMatch(/>\s*Live\s*</i);
    expect(bookSource).not.toMatch(/Live rate/i);
    expect(bookSource).not.toMatch(/>\s*Live\s*</i);
  });
});
