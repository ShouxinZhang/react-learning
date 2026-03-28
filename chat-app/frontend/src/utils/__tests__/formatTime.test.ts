import { describe, it, expect } from 'vitest';
import { formatMessageTime, formatDateSeparator, shouldShowTimeSeparator } from '../formatTime';

describe('formatMessageTime', () => {
  it('returns HH:mm format', () => {
    const result = formatMessageTime('2026-03-28T14:05:00Z');
    // Should contain hours and minutes separated by :
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatDateSeparator', () => {
  it('returns 今天 for today', () => {
    const now = new Date();
    expect(formatDateSeparator(now.toISOString())).toBe('今天');
  });

  it('returns 昨天 for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatDateSeparator(yesterday.toISOString())).toBe('昨天');
  });

  it('returns 周x for 2-6 days ago', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const result = formatDateSeparator(threeDaysAgo.toISOString());
    expect(result).toMatch(/^周[日一二三四五六]$/);
  });

  it('returns x月x日 for same year but > 7 days', () => {
    const now = new Date();
    const old = new Date(now.getFullYear(), 0, 5, 12, 0, 0);
    // Only test if it's far enough in the past (> 7 days from today)
    const diffDays = Math.floor((now.getTime() - old.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 7) {
      expect(formatDateSeparator(old.toISOString())).toBe('1月5日');
    }
  });

  it('returns YYYY年x月x日 for different year', () => {
    expect(formatDateSeparator('2023-06-15T12:00:00Z')).toBe('2023年6月15日');
  });
});

describe('shouldShowTimeSeparator', () => {
  it('returns true when prev is null', () => {
    expect(shouldShowTimeSeparator(null, '2026-03-28T10:00:00Z')).toBe(true);
  });

  it('returns true when gap > 5 minutes', () => {
    expect(shouldShowTimeSeparator(
      '2026-03-28T10:00:00Z',
      '2026-03-28T10:06:00Z',
    )).toBe(true);
  });

  it('returns false when gap <= 5 minutes', () => {
    expect(shouldShowTimeSeparator(
      '2026-03-28T10:00:00Z',
      '2026-03-28T10:04:00Z',
    )).toBe(false);
  });
});
