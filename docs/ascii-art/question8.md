## Drill 9 — Numbers and Special Characters

Your banner already handles these — but write a focused test to verify it.

Write a test file `render_test.go` that tests rendering of:

```go
func TestNumbers(t *testing.T)        // "0123456789"
func TestSpecialChars(t *testing.T)   // "{Hello There}" from the spec
func TestSpace(t *testing.T)          // "Hello There" — space between words
func TestMixedInput(t *testing.T)     // "1Hello 2There" from the spec
```

For each test:
- Load the standard banner
- Render the string
- Compare output line by line against the expected output from the spec

**Do not hardcode expected output as one giant string.** Build it by rendering known characters and comparing row by row.

---
