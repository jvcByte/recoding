# ascii-art-color — Hands-On Coding Drills
> Derived strictly from the ascii-art color project brief
> Builds on top of ascii-art base project
> Format: Small focused coding tasks, build up to full implementation
> Rules: Write every function yourself. Test each drill before moving to the next.
> Standard Go packages only — no external libraries.

---

## Drill 1 — Parse the `--color` Flag

Write a Go function:

```go
func parseArgs(args []string) (color string, substring string, text string, banner string, err error)
```

- Accepts `os.Args[1:]`
- Detects the `--color=<color>` flag if present
- Extracts the color name, the substring to color, and the main text
- Also handles optional banner argument (`standard`, `shadow`, `thinkertoy`)
- Returns a usage error for any unrecognized flag format

**Valid argument combinations to handle:**
```bash
go run . "Hello"                                      # no flag
go run . --color=red "Hello"                          # color, no substring → color whole string
go run . --color=red kit "a king kitten have kit"     # color, substring, text
go run . --color=red kit "something" shadow           # color, substring, text, banner
go run . --color=red "Hello" shadow                   # color, no substring, text, banner
```

**Must return usage error for:**
```bash
go run . --colour=red "Hello"      # wrong flag name
go run . --color "Hello"           # missing = sign
go run . --color= "Hello"          # empty color
go run . -color=red "Hello"        # single dash
```

**Usage message must be exactly:**
```
Usage: go run . [OPTION] [STRING]
EX: go run . --color=<color> <substring to be colored> "something"
```

---

## Drill 2 — ANSI Color Code Resolver

Write a Go function:

```go
func resolveColor(name string) (string, error)
```

- Takes a color name string (e.g., `"red"`, `"blue"`, `"green"`)
- Returns the ANSI escape code string for that color
- Returns an error if the color is not supported

**You must support at minimum:**
```
"red"     → "\033[31m"
"green"   → "\033[32m"
"yellow"  → "\033[33m"
"blue"    → "\033[34m"
"magenta" → "\033[35m"
"cyan"    → "\033[36m"
"white"   → "\033[37m"
"reset"   → "\033[0m"
```

**Also define the reset constant:**
```go
const resetCode = "\033[0m"
```

**Test cases:**
```go
resolveColor("red")     → "\033[31m", nil
resolveColor("cyan")    → "\033[36m", nil
resolveColor("purple")  → "", error    ← not in your map
resolveColor("")        → "", error
```

**Design note:** use a `map[string]string` — do not use a switch statement. It will be easier to extend later.

---

## Drill 3 — Find All Occurrences of a Substring

Write a Go function:

```go
func findOccurrences(text string, substring string) []int
```

- Returns the starting index of every occurrence of `substring` in `text`
- Case-sensitive
- Overlapping matches count separately

**Test cases:**
```
findOccurrences("a king kitten have kit", "kit") → [2, 8, 19]
findOccurrences("hello", "l")                    → [2, 3]
findOccurrences("hello", "hello")                → [0]
findOccurrences("hello", "world")                → []
findOccurrences("aaaa", "aa")                    → [0, 1, 2]   ← overlapping
findOccurrences("hello", "")                     → []           ← empty substring
```

**Why this matters:** you need to know exactly which character positions in the input string should be rendered in color — not just whether the substring exists.

---

## Drill 4 — Build a Color Mask

Write a Go function:

```go
func buildColorMask(text string, substring string) []bool
```

- Returns a boolean slice the same length as `text`
- `true` at index `i` means character `i` should be rendered in color
- `false` means render in default terminal color

**Test cases:**
```
buildColorMask("a king kitten have kit", "kit")
→ [false, false, true, true, true, false, false, false, true, true, true, ...]
  (positions 2,3,4 = "kit" in "king"; positions 8,9,10 = "kit" in "kitten"; positions 19,20,21 = "kit")

buildColorMask("hello", "")   → [false, false, false, false, false]
buildColorMask("hello", "xyz") → [false, false, false, false, false]
```

**When substring is empty or not found:** return all `false` — the caller will decide to color everything instead.

---

## Drill 5 — Render a Single Row with Color

Write a Go function:

```go
func renderRowWithColor(
    text string,
    rowIndex int,
    charMap map[rune][8]string,
    colorMask []bool,
    colorCode string,
) string
```

- Renders one row (0–7) of the ASCII art for the full text
- For each character at position `i` in `text`:
  - If `colorMask[i]` is `true`: wrap that character's row segment with `colorCode` and `resetCode`
  - If `colorMask[i]` is `false`: render without color codes
- Returns the full rendered row as a single string

**What "wrapping" looks like:**
```
colorCode + charMap[ch][rowIndex] + resetCode
```

**Edge case:** consecutive colored characters should not re-emit the color code every character — wrap the entire colored run once. This avoids polluting output with redundant escape sequences.

Example: if `kit` is all colored, the row output for those 3 characters should be:
```
colorCode + row_of_k + row_of_i + row_of_t + resetCode
```
Not:
```
colorCode + row_of_k + resetCode + colorCode + row_of_i + resetCode + ...
```

---

## Drill 6 — Color the Whole String (No Substring Specified)

Write logic that handles the case where no substring is provided — the entire input should be colored.

```go
func colorAll(text string) []bool
```

- Returns a boolean slice of length `len(text)` where every value is `true`

**Then integrate it:** in your main rendering logic, if the parsed substring is `""` (empty), use `colorAll` instead of `buildColorMask`.

**Test:**
```bash
go run . --color=red "Hello"
# Every character of "Hello" should be rendered in red
```

---

## Drill 7 — Integrate Color into Full Render Pipeline

Extend your `renderLine` function from ascii-art Drill 4 to accept color parameters:

```go
func renderLineWithColor(
    text string,
    charMap map[rune][8]string,
    colorMask []bool,
    colorCode string,
) string
```

- Produces all 8 rows
- Each row is built using `renderRowWithColor` from Drill 5
- Returns the complete 8-row block as a single string with newlines between rows

**Test with:**
```bash
go run . --color=red kit "a king kitten have kit"
```

Only the `kit` segments in the output should appear in red. The rest should be in the default terminal color.

---

## Drill 8 — Handle `\n` in Colored Input

The input can still contain `\n` — your color logic must work across multiple lines.

Write a function:

```go
func renderAllLines(
    segments []string,
    charMap map[rune][8]string,
    substring string,
    colorCode string,
) string
```

- `segments` is the result of splitting input on literal `\n`
- For each segment:
  - If empty → output one blank line
  - If not empty → build the color mask for that segment and render with color
- Returns the full output as one string

**Test cases:**
```bash
go run . --color=blue kit "kit\nkitten"
# Line 1: "kit" fully colored
# Line 2: "kit" inside "kitten" colored, rest not
```

---

## Drill 9 — Backward Compatibility (No Flag)

Your program must still work with no `--color` flag at all — exactly as the base ascii-art project.

Write a test:

```go
func TestNoFlag(t *testing.T)
```

That confirms:
```bash
go run . "Hello"          # works, no color, same as base ascii-art
go run . "Hello" shadow   # works with banner, no color
```

Also confirm that adding `--color` does not break banner selection:
```bash
go run . --color=red "Hello" shadow        # colored + shadow banner
go run . --color=red kit "Hello" shadow    # colored substring + shadow banner
```

---

## Drill 10 — Usage Error Handling

Write a test file `args_test.go` covering every invalid flag format:

```go
func TestMissingEquals(t *testing.T)       // --color red "Hello"
func TestEmptyColor(t *testing.T)          // --color= "Hello"
func TestWrongFlagName(t *testing.T)       // --colour=red "Hello"
func TestSingleDash(t *testing.T)          // -color=red "Hello"
func TestUnknownColor(t *testing.T)        // --color=ultraviolet "Hello"
func TestNoTextArgument(t *testing.T)      // --color=red (no text at all)
```

Each must:
- Not crash (no panic)
- Print the exact usage message to stdout
- Exit with a non-zero code

---

## Drill 11 — Edge Case Gauntlet

Write a test file `color_edge_test.go`:

```go
func TestColorWholeString(t *testing.T)         // no substring → all colored
func TestSubstringNotFound(t *testing.T)        // substring not in text → no color applied
func TestSubstringSameAsText(t *testing.T)      // substring equals full text → all colored
func TestOverlappingMatches(t *testing.T)       // "aaaa" with substring "aa"
func TestColorWithNewline(t *testing.T)         // "kit\nkitten" with substring "kit"
func TestColorEmptySegment(t *testing.T)        // "\n" with color flag → blank line, no crash
func TestConsecutiveColoredChars(t *testing.T)  // no redundant escape codes in output
```

Run with:
```bash
go test ./...
```

All tests must pass before the project is considered complete.

---

## Drill 12 — Full Spec Compliance Check

Manually verify this exact example from the spec:

```bash
go run . --color=red kit "a king kitten have kit"
```

Confirm:
- The `kit` in `king` is red (positions 2–4)
- The `kit` in `kitten` is red (positions 8–10 of "kitten")
- The standalone `kit` at the end is red
- All other characters are default terminal color
- No extra blank lines, no missing rows
- Output format matches standard ascii-art output, just with color injected

Write a `check_color.sh` script that runs this example and at least 3 others, printing PASS or FAIL for each.

---

*Write every function yourself. Do not copy. Test locally before moving to the next drill.*
