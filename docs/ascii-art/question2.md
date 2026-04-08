## Drill 3 — Handle `\n` in Input

Write a Go function:

```go
func splitInput(input string) []string
```

- Takes the raw argument string (e.g., `"Hello\nThere"`)
- Splits on literal `\n` (two characters: backslash + n) — **not** a real newline
- Returns a slice of strings, one per line to render

**Test cases:**
```
"Hello"          → ["Hello"]
"Hello\nThere"   → ["Hello", "There"]
"Hello\n\nThere" → ["Hello", "", "There"]
"\n"             → ["", ""]
""               → [""]
```

**Critical distinction:** the input `"Hello\nThere"` arrives as a command-line argument — the `\n` is two characters (`\` and `n`), not a real newline byte. Your function must split on the two-character sequence `\n`, not `"\n"` the escape.

---
