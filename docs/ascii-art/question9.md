## Drill 10 — Edge Case Gauntlet

Write a test file `edge_test.go` covering:

```go
func TestEmptyString(t *testing.T)         // go run . ""  → no output
func TestNewlineOnly(t *testing.T)         // go run . "\n" → one blank line
func TestDoubleNewline(t *testing.T)       // go run . "\n\n" → two blank lines
func TestNewlineAtEnd(t *testing.T)        // go run . "Hello\n" → render Hello then blank line
func TestSingleChar(t *testing.T)          // go run . "A"
func TestAllPrintableASCII(t *testing.T)   // render every character from ' ' to '~'
func TestUnknownBanner(t *testing.T)       // go run . "Hi" banana → error, not crash
func TestInvalidCharacter(t *testing.T)    // input with é or \t → error
```

Run with:
```bash
go test ./...
```

All tests must pass before you consider the project complete.

---
