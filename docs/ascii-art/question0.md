## Drill 1 — Read and Parse a Banner File

Write a Go function:

```go
func loadBanner(filename string) ([]string, error)
```

- Reads a banner file (e.g., `standard.txt`) from disk
- Splits it into individual lines
- Returns the lines as a slice of strings
- Returns a meaningful error if the file cannot be opened or read

**What you need to know:**
- Each character in a banner file is represented by 8 lines
- Characters are separated by a blank line (`\n`)
- The banner file covers ASCII characters from space (32) to tilde (126)

**Test it with:**
```bash
# Print how many lines your loader returns
# standard.txt should give you: (95 characters × 9 lines each) - 1 = 854 lines
```

**Edge cases to handle:**
- File does not exist → return descriptive error
- File is empty → return descriptive error

---
