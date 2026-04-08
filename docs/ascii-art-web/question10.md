## Drill 11 — Edge Case Gauntlet

Write a test file `web_edge_test.go`:

```go
func TestEmptyTextReturns400(t *testing.T)        // POST with text="" → 400
func TestWhitespaceOnlyTextReturns400(t *testing.T) // POST with text="   " → 400
func TestNewlineInputRendersCorrectly(t *testing.T) // POST with text="hello\nworld" → 200, two blocks
func TestAllThreeBannersWork(t *testing.T)         // POST standard, shadow, thinkertoy → all 200
func TestNonASCIICharacterReturns400(t *testing.T) // POST with text="café" → 400
func TestLargeInputReturns200(t *testing.T)        // POST with long valid string → 200
func TestUnknownRouteReturns404(t *testing.T)      // GET /banana → 404
func TestFormPreservesInput(t *testing.T)          // after POST, user input is still in form
```

Run with:
```bash
go test ./...
```

---
