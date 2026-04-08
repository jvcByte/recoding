## Drill 6 — Validate and Sanitize Input

Write a Go function:

```go
func validateInput(text string, banner string) error
```

- Returns nil if both fields are valid
- Returns a descriptive error if:
  - `text` is empty after trimming whitespace
  - `banner` is not `"standard"`, `"shadow"`, or `"thinkertoy"`
  - `text` contains characters outside printable ASCII (32–126) and literal `\n`

**Test cases:**
```go
validateInput("hello", "standard")     → nil
validateInput("", "standard")          → error: text is empty
validateInput("hello", "banana")       → error: invalid banner
validateInput("café", "standard")      → error: non-ASCII character
validateInput("hello\nworld", "shadow") → nil  ← literal \n is allowed
```

**Why sanitize:** your server is public — never pass raw user input directly to file operations or template rendering without checking it first.

---
