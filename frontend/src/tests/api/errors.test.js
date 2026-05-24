import { describe, it, expect } from 'vitest';
import { extractApiError } from '@/api/errors';

describe('extractApiError', () => {
  it('handles a string detail', () => {
    const err = { response: { status: 400, data: { detail: 'Bad request' } } };
    expect(extractApiError(err)).toEqual({ status: 400, message: 'Bad request' });
  });

  it('flattens an array of FastAPI field errors', () => {
    const err = {
      response: {
        status: 422,
        data: {
          detail: [
            { loc: ['body', 'email'], msg: 'invalid email', type: 'value_error' },
            { loc: ['body', 'salary'], msg: 'must be > 0', type: 'value_error' },
          ],
        },
      },
    };
    const result = extractApiError(err);
    expect(result.status).toBe(422);
    expect(result.fieldErrors).toEqual({ email: 'invalid email', salary: 'must be > 0' });
    expect(result.message).toContain('invalid email');
  });

  it('returns a network error message when there is no response', () => {
    const err = { request: {} };
    expect(extractApiError(err).message).toMatch(/network error/i);
  });

  it('falls back to the error message', () => {
    expect(extractApiError({ message: 'boom' }).message).toBe('boom');
  });
});
