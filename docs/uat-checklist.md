# User Acceptance Testing Checklist

## Feedback Improvements — UAT Checklist

Use this checklist when beta testing with a small group before the next deployment.

---

## Phase 1: Network Resilience & Autosave

- [ ] Type code/text and disconnect network — verify localStorage backup exists
- [ ] Reconnect — verify offline queue syncs and "Saved" indicator appears
- [ ] Verify autosave fires every ~3 seconds
- [ ] Navigate away with unsaved changes — verify warning modal appears
- [ ] Confirm "Stay" keeps you on the page, "Continue anyway" navigates

## Phase 2: Non-Linear Navigation

- [ ] Advance to Q2 — verify Q1 dot turns green (final)
- [ ] Click Q1 dot — verify you can navigate back
- [ ] Verify "Back to Current" button appears when viewing non-current question
- [ ] Click "Skip →" — verify question marked as skipped (orange dot)
- [ ] Return to skipped question — verify you can edit it
- [ ] Submit final answer — verify question locked (green dot)
- [ ] Open Overview panel — verify all questions listed with correct status

## Phase 3: Question Count Accuracy

- [ ] Submit 2 of 3 questions — verify count shows 2/3 final
- [ ] Skip 1 question — verify it shows as skipped, not counted as final
- [ ] Refresh page — verify counts are still accurate

## Phase 4: Code Execution

- [ ] Run code with syntax error — verify "Compile error" message shown
- [ ] Run code that crashes — verify "Runtime error" message shown
- [ ] Run code that times out — verify "Time limit exceeded" message shown
- [ ] Run test cases — verify pass/fail shown per test case
- [ ] Verify syntax warning appears in toolbar after compile error

## Phase 5: Documentation

- [ ] Click "Docs" button — verify panel opens
- [ ] Navigate to pkg.go.dev — verify iframe loads
- [ ] Try to navigate to google.com — verify blocked (not in whitelist)
- [ ] Switch to "Offline" tab — verify Go stdlib docs searchable
- [ ] Search "fmt.Println" — verify result appears with signature and example

## Phase 6: Paste Detection

- [ ] Copy text from another tab and paste — verify "external" source type recorded
- [ ] Copy text from within the editor and paste — verify "internal" source type recorded
- [ ] Instructor view: verify paste events show tab_was_blurred and source_type columns

---

## Sign-off

| Tester | Date | Result | Notes |
|--------|------|--------|-------|
|        |      |        |       |
|        |      |        |       |
