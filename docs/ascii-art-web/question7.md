## Drill 8 — HTTP Status Code Compliance Test

Write a test file `server_test.go` using Go's `net/http/httptest` package:

```go
func TestGetIndex(t *testing.T)               // GET / → 200
func TestGetIndexWrongPath(t *testing.T)      // GET /about → 404
func TestPostIndexNotAllowed(t *testing.T)    // POST / → 405
func TestPostAsciiArtValid(t *testing.T)      // POST /ascii-art valid data → 200
func TestPostAsciiArtEmptyText(t *testing.T)  // POST /ascii-art empty text → 400
func TestPostAsciiArtBadBanner(t *testing.T)  // POST /ascii-art invalid banner → 400
func TestGetAsciiArtNotAllowed(t *testing.T)  // GET /ascii-art → 405
```

**Use `httptest.NewRecorder()` to test handlers without starting a real server:**

```go
func TestGetIndex(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/", nil)
    w := httptest.NewRecorder()
    handleIndex(w, req)
    if w.Code != http.StatusOK {
        t.Errorf("expected 200, got %d", w.Code)
    }
}
```

---
