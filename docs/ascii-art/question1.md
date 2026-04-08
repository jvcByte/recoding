## Drill 2 — Map Characters to Banner Rows

Write a Go function:

```go
func buildCharMap(lines []string) map[rune][8]string
```

- Takes the raw lines from `loadBanner`
- Returns a map where each key is a rune (ASCII character from `' '` to `'~'`)
- Each value is an array of exactly 8 strings — the 8 lines that draw that character

**What you need to know:**
- The first character in the file is `' '` (space, ASCII 32)
- Characters are separated by a blank line
- So character at index `i` starts at line `i * 9 + 1` (skip the blank separator)

**Test cases:**
```go
charMap[' ']  // 8 lines of spaces
charMap['A']  // the 8-line ASCII art for 'A'
charMap['!']  // the 8-line ASCII art for '!'
charMap['~']  // last character in the file
```

**Edge case:** what happens if the file has fewer lines than expected? Return an error rather than silently producing a broken map.

---
