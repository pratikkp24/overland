import { describe, it, expect } from 'vitest';
import { sanitizeAmount, toAmount, amountError, MAX_AMOUNT } from '@/lib/money';

describe('sanitizeAmount', () => {
  /* The bug this file exists for. The old filter deleted the point, not the
     decimals, so a bid of "2400.50" was submitted as $240,050. */
  it('keeps the decimal point instead of multiplying by a hundred', () => {
    expect(sanitizeAmount('2400.50')).toBe('2400.50');
    expect(toAmount('2400.50')).toBe(2401);
    expect(toAmount('2400.50')).not.toBe(240050);
  });

  it('strips currency symbols, commas and spaces', () => {
    expect(sanitizeAmount('$2,400')).toBe('2400');
    expect(sanitizeAmount(' 2 400 ')).toBe('2400');
    expect(sanitizeAmount('2400 USD')).toBe('2400');
  });

  it('tolerates half-typed input rather than fighting the keystroke', () => {
    expect(sanitizeAmount('')).toBe('');
    expect(sanitizeAmount('2')).toBe('2');
    expect(sanitizeAmount('2.')).toBe('2.');
    expect(sanitizeAmount('.5')).toBe('0.5');
  });

  it('allows only one decimal point and two decimals', () => {
    expect(sanitizeAmount('1.2.3')).toBe('1.23');
    expect(sanitizeAmount('2400.567')).toBe('2400.56');
  });

  it('drops leading zeros without eating a lone zero', () => {
    expect(sanitizeAmount('007')).toBe('7');
    expect(sanitizeAmount('0')).toBe('0');
  });

  it('clamps at the ceiling the database enforces', () => {
    expect(sanitizeAmount('9999999')).toBe(String(MAX_AMOUNT));
    expect(toAmount('9999999')).toBe(MAX_AMOUNT);
  });

  /* Input with no digits collapses to an empty string and so reads as 0. That is
     the useful answer — every caller already rejects a non-positive amount, and
     amountError turns it into a sentence. */
  it('reduces input with no digits to zero, which callers reject', () => {
    expect(toAmount('abc')).toBe(0);
    expect(amountError('abc')).toMatch(/greater than zero/i);
  });
});

describe('amountError', () => {
  it('says nothing about an empty field — that is the caller\'s business', () => {
    expect(amountError('')).toBeNull();
    expect(amountError('   ')).toBeNull();
  });

  it('rejects zero and unusable input', () => {
    expect(amountError('0')).toMatch(/greater than zero/i);
    expect(amountError('abc')).toMatch(/greater than zero/i);
  });

  it('accepts an ordinary rate', () => {
    expect(amountError('2400')).toBeNull();
    expect(amountError('2400.50')).toBeNull();
  });

  it('names the field it is complaining about', () => {
    expect(amountError('0', 'bid')).toMatch(/bid/);
  });
});
