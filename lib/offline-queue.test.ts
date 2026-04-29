/**
 * Tests for offline queue functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  enqueueFailedAutosave,
  dequeueRequest,
  getQueue,
  clearQueue,
  hasPendingRequests,
  getPendingCount,
  processQueue,
} from './offline-queue';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

describe('offline-queue', () => {
  beforeEach(() => {
    clearQueue();
    vi.clearAllMocks();
  });

  describe('enqueueFailedAutosave', () => {
    it('should add a request to the queue', () => {
      enqueueFailedAutosave('session-1', 0, 'test code');
      
      const queue = getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].sessionId).toBe('session-1');
      expect(queue[0].questionIndex).toBe(0);
      expect(queue[0].responseText).toBe('test code');
      expect(queue[0].retryCount).toBe(0);
    });

    it('should add multiple requests to the queue', () => {
      enqueueFailedAutosave('session-1', 0, 'code 1');
      enqueueFailedAutosave('session-1', 1, 'code 2');
      enqueueFailedAutosave('session-2', 0, 'code 3');
      
      const queue = getQueue();
      expect(queue).toHaveLength(3);
    });
  });

  describe('dequeueRequest', () => {
    it('should remove a request from the queue', () => {
      enqueueFailedAutosave('session-1', 0, 'test code');
      const queue = getQueue();
      const id = queue[0].id;
      
      dequeueRequest(id);
      
      const updatedQueue = getQueue();
      expect(updatedQueue).toHaveLength(0);
    });

    it('should only remove the specified request', () => {
      enqueueFailedAutosave('session-1', 0, 'code 1');
      enqueueFailedAutosave('session-1', 1, 'code 2');
      const queue = getQueue();
      const firstId = queue[0].id;
      
      dequeueRequest(firstId);
      
      const updatedQueue = getQueue();
      expect(updatedQueue).toHaveLength(1);
      expect(updatedQueue[0].responseText).toBe('code 2');
    });
  });

  describe('getQueue', () => {
    it('should return an empty array when queue is empty', () => {
      const queue = getQueue();
      expect(queue).toEqual([]);
    });

    it('should return all queued requests', () => {
      enqueueFailedAutosave('session-1', 0, 'code 1');
      enqueueFailedAutosave('session-1', 1, 'code 2');
      
      const queue = getQueue();
      expect(queue).toHaveLength(2);
    });
  });

  describe('clearQueue', () => {
    it('should remove all requests from the queue', () => {
      enqueueFailedAutosave('session-1', 0, 'code 1');
      enqueueFailedAutosave('session-1', 1, 'code 2');
      
      clearQueue();
      
      const queue = getQueue();
      expect(queue).toHaveLength(0);
    });
  });

  describe('hasPendingRequests', () => {
    it('should return false when queue is empty', () => {
      expect(hasPendingRequests()).toBe(false);
    });

    it('should return true when queue has requests', () => {
      enqueueFailedAutosave('session-1', 0, 'test code');
      expect(hasPendingRequests()).toBe(true);
    });
  });

  describe('getPendingCount', () => {
    it('should return 0 when queue is empty', () => {
      expect(getPendingCount()).toBe(0);
    });

    it('should return the correct count', () => {
      enqueueFailedAutosave('session-1', 0, 'code 1');
      enqueueFailedAutosave('session-1', 1, 'code 2');
      enqueueFailedAutosave('session-2', 0, 'code 3');
      
      expect(getPendingCount()).toBe(3);
    });
  });

  describe('processQueue', () => {
    it('should return 0 when queue is empty', async () => {
      const count = await processQueue();
      expect(count).toBe(0);
    });

    it('should retry all requests and remove successful ones', async () => {
      enqueueFailedAutosave('session-1', 0, 'code 1');
      enqueueFailedAutosave('session-1', 1, 'code 2');
      
      // Mock successful responses
      (global.fetch as any).mockResolvedValue({ ok: true });
      
      const count = await processQueue();
      
      expect(count).toBe(2);
      expect(getQueue()).toHaveLength(0);
    });

    it('should keep failed requests in queue with incremented retry count', async () => {
      enqueueFailedAutosave('session-1', 0, 'code 1');
      
      // Mock failed response
      (global.fetch as any).mockResolvedValue({ ok: false });
      
      const count = await processQueue();
      
      expect(count).toBe(0);
      const queue = getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].retryCount).toBe(1);
    });

    it('should skip requests that exceeded max retries', async () => {
      enqueueFailedAutosave('session-1', 0, 'code 1');
      
      // Manually set retry count to max
      const queue = getQueue();
      queue[0].retryCount = 3;
      localStorage.setItem('autosave:offline-queue', JSON.stringify(queue));
      
      // Mock failed response
      (global.fetch as any).mockResolvedValue({ ok: false });
      
      const count = await processQueue();
      
      expect(count).toBe(0);
      // Request should remain in queue but not be retried (stays at retryCount 3)
      const updatedQueue = getQueue();
      expect(updatedQueue).toHaveLength(1);
      expect(updatedQueue[0].retryCount).toBe(3);
    });

    it('should handle mixed success and failure', async () => {
      enqueueFailedAutosave('session-1', 0, 'code 1');
      enqueueFailedAutosave('session-1', 1, 'code 2');
      enqueueFailedAutosave('session-1', 2, 'code 3');
      
      // Mock responses: success, fail, success
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true });
      
      const count = await processQueue();
      
      expect(count).toBe(2);
      const queue = getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].responseText).toBe('code 2');
      expect(queue[0].retryCount).toBe(1);
    });
  });
});
