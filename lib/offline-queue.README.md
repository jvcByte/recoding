# Offline Queue for Failed Autosaves

This module provides a robust offline queue system for handling failed autosave requests. When network connectivity is lost or server requests fail, the queue stores requests in localStorage and automatically retries them when the connection is restored.

## Features

- **Persistent Storage**: Failed requests are stored in localStorage and survive page refreshes
- **Automatic Retry**: Automatically retries failed requests when connection is restored
- **Retry Limits**: Prevents infinite retry loops with configurable max retry count
- **Batch Processing**: Processes multiple queued requests with delays to avoid overwhelming the server
- **Event Listeners**: Automatically detects when connection is restored using browser online/offline events

## Core Functions

### `enqueueFailedAutosave(sessionId, questionIndex, responseText)`

Adds a failed autosave request to the offline queue.

```typescript
enqueueFailedAutosave('session-123', 0, 'console.log("Hello")');
```

### `processQueue()`

Processes all queued requests and returns the number of successfully synced requests.

```typescript
const successCount = await processQueue();
console.log(`Synced ${successCount} requests`);
```

### `setupOfflineQueueListeners(onQueueProcessed?)`

Sets up automatic queue processing when connection is restored. Returns a cleanup function.

```typescript
const cleanup = setupOfflineQueueListeners((successCount) => {
  toast.success(`Synced ${successCount} saved changes`);
});

// Later, when component unmounts:
cleanup();
```

### `hasPendingRequests()`

Checks if there are any pending requests in the queue.

```typescript
if (hasPendingRequests()) {
  console.log('You have unsaved changes');
}
```

### `getPendingCount()`

Returns the number of pending requests.

```typescript
const count = getPendingCount();
console.log(`${count} requests pending`);
```

### `clearQueue()`

Clears all requests from the queue (use with caution).

```typescript
clearQueue();
```

## Integration Example

### In CodeEditor or ResponseEditor:

```typescript
import { useEffect, useCallback } from 'react';
import {
  enqueueFailedAutosave,
  setupOfflineQueueListeners,
  processQueue,
  hasPendingRequests,
} from '@/lib/offline-queue';
import { toast } from 'sonner';

export default function CodeEditor({ sessionId, questionIndex, ... }) {
  // Set up offline queue listeners
  useEffect(() => {
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
  
  // Modified autosave function
  const doAutosave = useCallback(async () => {
    const current = codeRef.current;
    if (current === lastSavedRef.current || isClosed) return;
    
    setSaveStatus('saving');
    saveToLocalStorage(sessionId, questionIndex, current);
    
    try {
      const res = await fetch(`/api/submissions/${sessionId}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_index: questionIndex,
          response_text: current,
        }),
      });
      
      if (res.ok) {
        clearLocalStorage(sessionId, questionIndex);
        lastSavedRef.current = current;
        setSaveStatus('saved');
      } else {
        // Add to offline queue on failure
        enqueueFailedAutosave(sessionId, questionIndex, current);
        setSaveStatus('offline');
        toast.error('Save failed - will retry when online');
      }
    } catch (err) {
      // Add to offline queue on network error
      enqueueFailedAutosave(sessionId, questionIndex, current);
      setSaveStatus('offline');
      toast.error('Save failed - will retry when online');
    }
  }, [sessionId, questionIndex, isClosed]);
  
  // ... rest of component
}
```

## Configuration

The following constants can be adjusted in `lib/offline-queue.ts`:

- `MAX_RETRIES`: Maximum number of retry attempts (default: 3)
- `RETRY_DELAY_MS`: Delay between retry attempts in milliseconds (default: 2000)
- `QUEUE_KEY`: localStorage key for the queue (default: 'autosave:offline-queue')

## Storage Format

Requests are stored in localStorage as JSON:

```json
[
  {
    "id": "session-123:0:1234567890",
    "sessionId": "session-123",
    "questionIndex": 0,
    "responseText": "console.log('Hello')",
    "timestamp": 1234567890,
    "retryCount": 0
  }
]
```

## Requirements Satisfied

This implementation satisfies the following requirements from the design document:

- **1.2**: Add offline queue for failed autosave requests
- **1.4**: Retry failed saves when connection restored

## Testing

Run the test suite:

```bash
npm test -- lib/offline-queue.test.ts --run
```

The test suite covers:
- Enqueueing and dequeueing requests
- Queue persistence in localStorage
- Retry logic with success and failure scenarios
- Max retry limit enforcement
- Mixed success/failure batch processing
