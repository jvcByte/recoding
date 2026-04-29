/**
 * Offline Queue for Failed Autosaves
 * 
 * Stores failed autosave requests in localStorage and retries them when
 * the connection is restored.
 */

export interface QueuedRequest {
  id: string;
  sessionId: string;
  questionIndex: number;
  responseText: string;
  timestamp: number;
  retryCount: number;
}

const QUEUE_KEY = 'autosave:offline-queue';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Add a failed autosave request to the offline queue
 */
export function enqueueFailedAutosave(
  sessionId: string,
  questionIndex: number,
  responseText: string
): void {
  try {
    const queue = getQueue();
    const id = `${sessionId}:${questionIndex}:${Date.now()}`;
    
    const request: QueuedRequest = {
      id,
      sessionId,
      questionIndex,
      responseText,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    queue.push(request);
    saveQueue(queue);
  } catch (err) {
    console.error('Failed to enqueue autosave:', err);
  }
}

/**
 * Remove a request from the queue by ID
 */
export function dequeueRequest(id: string): void {
  try {
    const queue = getQueue();
    const filtered = queue.filter((req) => req.id !== id);
    saveQueue(filtered);
  } catch (err) {
    console.error('Failed to dequeue request:', err);
  }
}

/**
 * Get all queued requests
 */
export function getQueue(): QueuedRequest[] {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as QueuedRequest[];
  } catch (err) {
    console.error('Failed to read queue:', err);
    return [];
  }
}

/**
 * Save the queue to localStorage
 */
function saveQueue(queue: QueuedRequest[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save queue:', err);
  }
}

/**
 * Clear the entire queue
 */
export function clearQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (err) {
    console.error('Failed to clear queue:', err);
  }
}

/**
 * Process the offline queue by retrying all failed requests
 * Returns the number of successfully processed requests
 */
export async function processQueue(): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;
  
  let successCount = 0;
  const failedRequests: QueuedRequest[] = [];
  
  for (const request of queue) {
    // Skip if max retries exceeded
    if (request.retryCount >= MAX_RETRIES) {
      console.warn(`Max retries exceeded for request ${request.id}`);
      continue;
    }
    
    try {
      const success = await retryAutosave(request);
      
      if (success) {
        successCount++;
        // Remove from queue on success
        dequeueRequest(request.id);
      } else {
        // Increment retry count and keep in queue
        request.retryCount++;
        failedRequests.push(request);
      }
    } catch (err) {
      console.error(`Failed to retry request ${request.id}:`, err);
      request.retryCount++;
      failedRequests.push(request);
    }
    
    // Add delay between retries to avoid overwhelming the server
    if (queue.indexOf(request) < queue.length - 1) {
      await delay(RETRY_DELAY_MS);
    }
  }
  
  // Update queue with failed requests
  if (failedRequests.length > 0) {
    saveQueue(failedRequests);
  }
  
  return successCount;
}

/**
 * Retry a single autosave request
 */
async function retryAutosave(request: QueuedRequest): Promise<boolean> {
  try {
    const res = await fetch(`/api/submissions/${request.sessionId}/autosave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_index: request.questionIndex,
        response_text: request.responseText,
      }),
    });
    
    return res.ok;
  } catch (err) {
    console.error('Retry autosave failed:', err);
    return false;
  }
}

/**
 * Utility function to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if there are any pending requests in the queue
 */
export function hasPendingRequests(): boolean {
  const queue = getQueue();
  return queue.length > 0;
}

/**
 * Get the count of pending requests
 */
export function getPendingCount(): number {
  const queue = getQueue();
  return queue.length;
}

/**
 * Set up online/offline event listeners to automatically process queue
 * when connection is restored
 */
export function setupOfflineQueueListeners(
  onQueueProcessed?: (successCount: number) => void
): () => void {
  const handleOnline = async () => {
    console.log('Connection restored, processing offline queue...');
    const successCount = await processQueue();
    
    if (successCount > 0) {
      console.log(`Successfully processed ${successCount} queued request(s)`);
      onQueueProcessed?.(successCount);
    }
  };
  
  window.addEventListener('online', handleOnline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
