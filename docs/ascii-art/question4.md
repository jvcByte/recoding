## Drill 5 — Handle the Empty String and `\n` Only Input

Write logic (in `main` or a helper) that handles these exact cases from the spec:

```bash
go run . "" | cat -e
# → no output at all

go run . "\n" | cat -e
# → one blank line, then nothing
$
```

**What you need to figure out:**
- `""` → print nothing (not even a newline)
- `"\n"` → splits into `["", ""]` → renders as a single blank line
- `"\n\n"` → splits into `["", "", ""]` → renders as two blank lines

Write a function:

```go
func shouldPrintBlankLine(text string) bool
```

That returns true when a segment is empty and should output a single newline instead of 8 rendered rows.

**Test all three cases before moving on.**

---
