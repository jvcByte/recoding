## Drill 4 — Render a Single Line of Text

Write a Go function:

```go
func renderLine(text string, charMap map[rune][8]string) string
```

- Takes a single line of text (no `\n` in it)
- Looks up each character in `charMap`
- Combines the 8 rows of each character side by side
- Returns the full 8-row rendered string

**Example:**
```
renderLine("Hi", charMap)
```
Should produce 8 lines where each line is the corresponding row of `H` concatenated with the corresponding row of `i`.

**Requirements:**
- If the text is empty (`""`), return 8 empty lines (spaces only — see the `\n` usage example in the spec)
- If a character is not in the map (outside ASCII 32–126), skip it or handle gracefully — document your choice

**Test with:**
```bash
go run . "Hi" | cat -e
# Each line should end with $ (cat -e shows line endings)
```

---
