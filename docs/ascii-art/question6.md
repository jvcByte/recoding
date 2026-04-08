## Drill 7 — Support Multiple Banners

Extend your program to accept an optional second argument — the banner name:

```bash
go run . "Hello" standard
go run . "Hello" shadow
go run . "Hello" thinkertoy
```

Write a function:

```go
func resolveBannerFile(name string) (string, error)
```

- Accepts `"standard"`, `"shadow"`, or `"thinkertoy"`
- Returns the corresponding filename (e.g., `"standard.txt"`)
- Returns an error for any unrecognized name
- Defaults to `"standard"` if no banner argument is provided

**Test cases:**
```
"standard"   → "standard.txt", nil
"shadow"     → "shadow.txt", nil
"thinkertoy" → "thinkertoy.txt", nil
"banana"     → "", error
""           → "standard.txt", nil  ← default
```

---
