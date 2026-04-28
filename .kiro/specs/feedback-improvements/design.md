# Design Document: Participant Feedback Improvements

## Overview

Based on participant feedback from April 21, 2026, this document outlines improvements to address critical platform issues affecting user experience and reliability.

**Average Rating:** 3.0/5 (4 responses)  
**Key Themes:** Reliability, Navigation, Flexibility, Testing

---

## 1. Network Resilience & Autosave

### Problem
Network interruptions cause loss of unsaved work despite autosave feature.

### Requirements

**1.1** Implement local storage backup before server sync  
**1.2** Add offline queue for failed autosave requests  
**1.3** Show clear save status: "Saving..." / "Saved" / "Offline"  
**1.4** Retry failed saves when connection restored  
**1.5** Reduce autosave interval from 10s to 3s  
**1.6** Prevent navigation until current changes are saved  
**1.7** Add "unsaved changes" warning before advancing  

### Design

```typescript
// Local storage key pattern
const AUTOSAVE_KEY = `autosave:${sessionId}:${questionIndex}`;

// Save status indicator
type SaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

// Autosave flow
1. User types → debounce 3s → save to localStorage
2. Attempt server sync
3. On success: clear localStorage, show "Saved"
4. On failure: keep in localStorage, show "Offline", add to retry queue
5. On reconnect: process retry queue
```

---

## 2. Non-Linear Question Navigation

### Problem
Cannot skip questions and return later; questions lock after moving on.

### Requirements

**2.1** Add "Skip" button that advances without marking as final  
**2.2** Allow navigation to any previously reached question  
**2.3** Show question status: not started / draft / skipped / final  
**2.4** Only lock questions explicitly marked as final  
**2.5** Add "Edit" button to reopen draft/skipped questions  
**2.6** Update progress dots to show all statuses  

### Design

```typescript
// Question status enum
type QuestionStatus = 'not_started' | 'draft' | 'skipped' | 'final';

// Database schema addition
ALTER TABLE submissions ADD COLUMN status TEXT DEFAULT 'not_started';

// Navigation rules
- Can navigate to any question with index <= current_question_index
- "Skip" button: marks as 'skipped', advances current_question_index
- "Next" button: marks as 'draft' if has content, advances
- "Submit Final" button: marks as 'final', locks question
- Can edit any question with status != 'final'

// Progress indicator
○ = not_started (gray)
◐ = draft (orange)
⊘ = skipped (yellow with slash)
● = final (green)
```

---

## 3. Question Overview Panel

### Problem
Cannot see all questions upfront to plan approach.

### Requirements

**3.1** Add "Question Overview" toggle button  
**3.2** Show list of all questions with title, type, status  
**3.3** Allow clicking to jump to any reached question  
**3.4** Show point value or difficulty if configured  
**3.5** Maintain current one-at-a-time view as default  

### Design

```typescript
// Overview panel component
interface QuestionOverview {
  index: number;
  title: string;
  type: 'written' | 'code';
  status: QuestionStatus;
  points?: number;
  reachable: boolean;
}

// UI layout
[Toggle Overview] button in header
→ Slides in side panel with question list
→ Click question → navigate if reachable
→ Shows lock icon for unreached questions
```

---

## 4. Improved Paste Detection

### Problem
Accidental clipboard use triggers false positive cheating flags.

### Requirements

**4.1** Only flag pastes exceeding character threshold (already implemented)  
**4.2** Track if user left page/tab before paste  
**4.3** Distinguish internal (same page) vs external pastes  
**4.4** Add paste event review UI for instructors  
**4.5** Allow instructors to dismiss false positive paste flags  

### Design

```typescript
// Enhanced paste event tracking
interface PasteEvent {
  submission_id: string;
  char_count: number;
  pasted_text: string;
  occurred_at: timestamp;
  tab_was_blurred: boolean;  // NEW
  source_type: 'internal' | 'external' | 'unknown';  // NEW
}

// Detection logic
1. Track last blur/focus events
2. On paste, check if blur occurred within 5s before paste
3. Compare pasted text with existing submission text to detect internal copy
4. Flag only if: char_count > threshold AND (tab_was_blurred OR source_type = 'external')
```

---

## 5. Code Execution Improvements

### Problem
Cannot test code; compilation errors prevent verification.

### Requirements

**5.1** Add "Run Code" button with sample test cases  
**5.2** Show clear error messages distinguishing platform vs code errors  
**5.3** Ensure code runner stability throughout session  
**5.4** Add syntax checking before submission  
**5.5** Provide example inputs/outputs for testing  

### Design

```typescript
// Test execution flow
1. User clicks "Run Code"
2. Send code + test cases to /api/run-code
3. Execute in sandboxed environment
4. Return: stdout, stderr, exit_code, execution_time
5. Display results in collapsible panel

// Error categorization
- Syntax errors: "Your code has a syntax error on line X"
- Runtime errors: "Your code crashed: [error message]"
- Platform errors: "Platform error: [technical details]. Please report this."
- Timeout: "Execution exceeded 5 second limit"

// Sample test cases in question
{
  "test_cases": [
    { "input": "hello", "expected_output": "HELLO" },
    { "input": "world", "expected_output": "WORLD" }
  ]
}
```

---

## 6. Question Count Accuracy

### Problem
UI shows incorrect number of answered questions.

### Requirements

**6.1** Audit question counting logic  
**6.2** Count only includes submissions with status = 'final'  
**6.3** Add unit tests for question status tracking  
**6.4** Fix any caching issues in UI  
**6.5** Real-time sync of question counts  

### Design

```typescript
// Correct counting query
SELECT COUNT(*) FROM submissions 
WHERE session_id = ? AND status = 'final'

// UI state management
- Fetch question statuses on mount
- Update local state on any submission change
- Refetch on navigation to ensure sync
- Add React Query for automatic cache invalidation
```

---

## 7. Package/Library Flexibility

### Problem
Forced to use specific packages instead of familiar alternatives.

### Requirements

**7.1** Allow multiple valid approaches unless testing specific package  
**7.2** Update starter code to be more flexible  
**7.3** Provide package documentation links in question  
**7.4** Add note about allowed packages in question text  

### Design

```typescript
// Question metadata
{
  "allowed_packages": ["os", "bufio", "io/ioutil"],  // NEW
  "required_package": null,  // Only set if testing specific package
  "documentation_links": [  // NEW
    { "package": "os", "url": "https://pkg.go.dev/os" }
  ]
}

// Starter code template
// You may use any of: os, bufio, io/ioutil
// Documentation: [links]
package main

func main() {
  // Your solution here
}
```

---

## 8. Documentation Access

### Problem
Need internet access for documentation lookup.

### Requirements

**8.1** Add built-in documentation viewer for allowed languages  
**8.2** Whitelist official documentation sites  
**8.3** Monitor for suspicious browsing patterns  
**8.4** Provide offline documentation for common packages  

### Design

```typescript
// Documentation panel
[Docs] button in editor toolbar
→ Opens side panel with iframe
→ Allowed domains: pkg.go.dev, golang.org, etc.
→ Track time spent on docs (not flagged)
→ Flag if navigating to non-whitelisted domains

// Offline docs
- Bundle common package docs in platform
- Searchable documentation index
- Code examples for each function
```

---

## 9. Timeline & Scope Adjustment

### Problem
3-month timeline too aggressive given platform state and learning curve.

### Requirements

**9.1** Conduct platform stability audit  
**9.2** Comprehensive testing before next deployment  
**9.3** Consider extending timeline or reducing scope  
**9.4** Communicate realistic expectations to participants  

---

## Implementation Priority

### Phase 1: Critical Fixes (Before Next Use)
- Network resilience & autosave improvements (1.1-1.7)
- Non-linear navigation & question unlocking (2.1-2.6)
- Question count accuracy (6.1-6.5)
- Code execution stability (5.2, 5.3)

### Phase 2: UX Improvements
- Question overview panel (3.1-3.5)
- Improved paste detection (4.1-4.5)
- Code testing with sample cases (5.1, 5.4, 5.5)

### Phase 3: Flexibility & Documentation
- Package flexibility (7.1-7.4)
- Documentation access (8.1-8.4)

### Phase 4: Polish
- Timeline adjustment (9.1-9.4)
- Additional testing and refinement

---

## Success Metrics

- Average rating improves from 3.0 to 4.0+
- Zero data loss incidents
- <5% false positive paste flags
- 100% code execution success rate
- Participant satisfaction with navigation flexibility
