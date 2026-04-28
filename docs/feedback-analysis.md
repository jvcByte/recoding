# Participant Feedback Analysis

**Date:** April 21, 2026  
**Total Responses:** 4  
**Average Rating:** 3.0/5

## Rating Distribution
- 5★: 0
- 4★: 2
- 3★: 0
- 2★: 2
- 1★: 0

---

## Critical Issues

### 1. Network Interruptions Clear Unsaved Work
**Reporter:** jairiagb  
**Severity:** High  
**Description:** Network interruptions cause loss of unsaved work despite autosave feature.

**Proposed Solution:**
- Implement local storage backup before sending to server
- Add offline queue for autosave requests
- Show clear "saving..." / "saved" / "offline" indicators
- Retry failed saves when connection restored

---

### 2. Cannot Skip Questions and Return Later
**Reporters:** oayinmir, eokwong  
**Severity:** High  
**Description:** Participants want non-linear navigation to skip difficult questions and return later.

**Current Behavior:** Linear progression only, must answer or leave blank before advancing.

**Proposed Solution:**
- Add "Skip" button that advances without marking as final
- Show question status: not started / draft / skipped / final
- Allow navigation to any reached question via progress dots
- Only mark as final when explicitly submitted or session ends

---

### 3. Copy/Paste Detection Too Strict
**Reporter:** oayinmir  
**Severity:** Medium  
**Description:** Accidental clipboard use (copying own code, redundant text) triggers cheating flags.

**Current Behavior:** Any paste event is flagged regardless of context.

**Proposed Solution:**
- Only flag pastes that exceed character threshold (already implemented)
- Track if user left the page/tab before paste
- Distinguish between internal (same page) and external pastes
- Add paste event review UI for instructors to dismiss false positives

---

### 4. Cannot Test/Run Code & Compilation Errors
**Reporters:** oayinmir, eokwong  
**Severity:** High  
**Description:** Code won't compile/run, preventing verification of solutions.

**Issues:**
- Compilation errors not from student's code
- Cannot test code before submission
- Platform stops compiling at some point

**Proposed Solution:**
- Improve error messages to distinguish platform vs. code errors
- Add "Run Tests" button with sample inputs
- Ensure code runner is stable throughout session
- Add syntax checking before submission

---

### 5. Inaccurate Question Count Display
**Reporter:** eokwong  
**Severity:** Medium  
**Description:** UI shows incorrect number of answered questions (showed 7 when only 4 answered).

**Proposed Solution:**
- Audit question counting logic
- Ensure count only includes actually submitted answers
- Add unit tests for question status tracking
- Fix any caching issues in UI

---

### 6. Cannot Edit After Skipping
**Reporter:** eokwong  
**Severity:** High  
**Description:** Questions become locked/uneditable after moving to next question.

**Proposed Solution:**
- Allow editing any non-final submission
- Only lock questions explicitly marked as final
- Add "Edit" button to reopen locked questions
- Clear indication of which questions are editable vs. final

---

### 7. Cannot See All Questions Upfront
**Reporter:** jairiagb  
**Severity:** Medium  
**Description:** Want to see all questions in a module to choose which ones to answer.

**Current Behavior:** Questions revealed one at a time.

**Proposed Solution:**
- Add "Question Overview" panel showing all question titles/types
- Allow clicking to jump to any question
- Show difficulty/point value for each question
- Maintain current one-at-a-time view as default with overview toggle

---

### 8. Package/Library Restrictions Too Strict
**Reporter:** oayinmir  
**Severity:** Medium  
**Description:** Forced to use specific packages (e.g., bufio) instead of familiar ones (e.g., os.*).

**Proposed Solution:**
- Allow multiple valid approaches unless specifically testing a package
- Update starter code to be more flexible
- Provide package documentation links in question
- Consider allowing internet access for docs

---

### 9. Need Internet Access
**Reporter:** oayinmir  
**Severity:** Medium  
**Description:** Participants want internet access for documentation lookup.

**Considerations:**
- Conflicts with anti-cheating measures
- Could allow restricted access to official docs only
- Or provide offline documentation viewer

**Proposed Solution:**
- Add built-in documentation viewer for allowed languages/packages
- Whitelist official documentation sites
- Monitor for suspicious browsing patterns

---

### 10. Autosave Delay Causes Data Loss
**Reporter:** oayinmir  
**Severity:** High  
**Description:** Input takes time to save; users assume it's saved and move on, losing work.

**Proposed Solution:**
- Reduce autosave interval (currently 10s, reduce to 3-5s)
- Add visual "saving..." indicator
- Prevent navigation until current changes are saved
- Add "unsaved changes" warning before advancing

---

## Positive Feedback

- Autosave feature appreciated (jairiagb)
- Coding mentors' efforts recognized (eokwong)
- Platform concept is good, needs refinement

---

## Action Items Priority

### Immediate (Before Next Use)
1. Fix question locking issue - allow editing non-final submissions
2. Improve autosave reliability and reduce interval
3. Add offline/network failure handling
4. Fix question count display bug
5. Thorough platform testing

### High Priority
1. Implement question skipping and non-linear navigation
2. Improve code compilation stability
3. Better error messages distinguishing platform vs. code errors
4. Add clear save status indicators

### Medium Priority
1. Refine paste detection to reduce false positives
2. Add question overview panel
3. Relax package restrictions where appropriate
4. Consider documentation access solution

### Low Priority
1. Add intellisense/autocomplete
2. Improve UI/UX polish
3. Add more comprehensive testing before deployment

---

## Timeline Concern

**Quote from jairiagb:** "Is three month not too short for us to start recoding 😏 Given our quite unique situation?"

**Note:** Participants feel the 3-month timeline is too aggressive given the platform's current state and their learning curve. Consider extending timeline or reducing scope.
