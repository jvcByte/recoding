# ascii-art — Hands-On Coding Drills
> Derived strictly from the ascii-art project brief
> Format: Small focused coding tasks, build up to full implementation
> Rules: Write every function yourself. Test each drill before moving to the next.
> Standard Go packages only — no external libraries.

---

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

## Drill 6 — Full Single-Banner Render

Wire Drills 1–5 together into a working program that:

1. Takes one argument (the input string)
2. Loads `standard.txt` banner
3. Splits input on `\n`
4. For each segment:
   - If empty → print one blank line
   - If not empty → render 8 rows and print them
5. Outputs to stdout

**Test with all spec examples:**
```bash
go run . "Hello" | cat -e
go run . "Hello\nThere" | cat -e
go run . "Hello\n\nThere" | cat -e
go run . "" | cat -e
go run . "\n" | cat -e
```

Your output must match the spec exactly — including trailing spaces on each row.

---

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

## Drill 9 — Numbers and Special Characters

Your banner already handles these — but write a focused test to verify it.

Write a test file `render_test.go` that tests rendering of:

```go
func TestNumbers(t *testing.T)        // "0123456789"
func TestSpecialChars(t *testing.T)   // "{Hello There}" from the spec
func TestSpace(t *testing.T)          // "Hello There" — space between words
func TestMixedInput(t *testing.T)     // "1Hello 2There" from the spec
```

For each test:
- Load the standard banner
- Render the string
- Compare output line by line against the expected output from the spec

**Do not hardcode expected output as one giant string.** Build it by rendering known characters and comparing row by row.

---

## Drill 10 — Edge Case Gauntlet

Write a test file `edge_test.go` covering:

```go
func TestEmptyString(t *testing.T)         // go run . ""  → no output
func TestNewlineOnly(t *testing.T)         // go run . "\n" → one blank line
func TestDoubleNewline(t *testing.T)       // go run . "\n\n" → two blank lines
func TestNewlineAtEnd(t *testing.T)        // go run . "Hello\n" → render Hello then blank line
func TestSingleChar(t *testing.T)          // go run . "A"
func TestAllPrintableASCII(t *testing.T)   // render every character from ' ' to '~'
func TestUnknownBanner(t *testing.T)       // go run . "Hi" banana → error, not crash
func TestInvalidCharacter(t *testing.T)    // input with é or \t → error
```

Run with:
```bash
go test ./...
```

All tests must pass before you consider the project complete.

---

## Drill 11 — Full Pipeline Integration Check

Run every example from the spec and confirm your output matches exactly:

```bash
go run . "" | cat -e
go run . "\n" | cat -e
go run . "Hello\n" | cat -e
go run . "hello" | cat -e
go run . "HeLlO" | cat -e
go run . "Hello There" | cat -e
go run . "1Hello 2There" | cat -e
go run . "{Hello There}" | cat -e
go run . "Hello\nThere" | cat -e
go run . "Hello\n\nThere" | cat -e
```

For each one:
1. Run your program
2. Run the expected output from the spec through `cat -e`
3. Diff them — zero differences means you pass

Write a shell script `check.sh` that automates all 10 comparisons and reports PASS or FAIL per case.

---

*Write every function yourself. Do not copy. Test locally before moving to the next drill.*
