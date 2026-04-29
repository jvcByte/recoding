/**
 * Example: Integrating Offline Queue with Autosave
 * 
 * This file demonstrates how to integrate the offline queue
 * with the CodeEditor and ResponseEditor components.
 */

import { useEffect, useCallback } from 'react';
import {
  enqueueFailedAutosave,
  setupOfflineQueueListeners,
  processQueue,
  hasPendingRequests,
} from './offline-queue';
import { toast } from 'sonner';

/**
 * Example: Modified autosave function with offline queue support
 */
export function useAutosaveWithOfflineQueue(
  sessionId: string,
  questionIndex: number,
  isClosed: boolean
) {
  const doAutosave = useCallback(async (code: string, lastSaved: string) => {
    if (code === lastSaved || isClosed) return { success: false, status: 'idle' as const };
    
    // Save to localStorage before attempting server sync
    const key = `autosave:${sessionId}:${questionIndex}`;
    try {
      localStorage.setItem(key, code);
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
    
    try {
      const res = await fetch(`/api/submissions/${sessionId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_index: questionIndex,
          response_text: code,
        }),
      });
      
      if (res.ok) {
        // Success: clear localStorage
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.error('Failed to clear localStorage:', err);
        }
        return { success: true, status: 'saved' as const };
      } else {
        // Failed: add to offline queue
        enqueueFailedAutosave(sessionId, questionIndex, code);
        return { success: false, status: 'offline' as const };
      }
    } catch (err) {
      // Network error: add to offline queue
      enqueueFailedAutosave(sessionId, questionIndex, code);
      return { success: false, status: 'offline' as const };
    }
  }, [sessionId, questionIndex, isClosed]);
  
  return doAutosave;
}

/**
 * Example: Hook to set up offline queue listeners
 */
export function useOfflineQueueSync() {
  useEffect(() => {
    // Set up listeners for online/offline events
    const cleanup = setupOfflineQueueListeners((successCount) => {
      toast.success(`Synced ${successCount} saved change(s)`);
    });
    
    // Process queue on mount if online
    if (navigator.onLine && hasPendingRequests()) {
      processQueue().then((count) => {
        if (count > 0) {
          toast.success(`Synced ${count} saved change(s)`);
        }
      });
    }
    
    return cleanup;
  }, []);
}

/**
 * Example: Component integration
 * 
 * In your CodeEditor or ResponseEditor component:
 * 
 * ```tsx
 * import { useOfflineQueueSync } from '@/lib/offline-queue.example';
 * 
 * export default function CodeEditor({ sessionId, questionIndex, ... }) {
 *   // Set up offline queue sync
 *   useOfflineQueueSync();
 *   
 *   // ... rest of your component
 * }
 * ```
 */
