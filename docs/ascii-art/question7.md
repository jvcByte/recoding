## Drill 8 — Validate Input Characters

Write a Go function:

```go
func validateInput(input string) error
```

- Returns nil if every character in the input is a printable ASCII character (32–126) or the two-character sequence `\n`
- Returns a descriptive error if any character falls outside that range

**Test cases:**
```
"Hello"         → nil
"Hello\nThere"  → nil
"café"          → error (é is outside ASCII 32–126)
"Hello\tThere"  → error (\t is ASCII 9, not printable)
""              → nil
```

**Why this matters:** the spec says the program handles numbers, letters, spaces, special characters, and `\n` — it does not say it handles unicode or control characters. Failing loudly is better than producing garbled output.

---
