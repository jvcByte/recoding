# ascii-art-justify — Hands-On Coding Drills
> Derived strictly from the ascii-art-justify project brief
> Builds on top of ascii-art base project
> Format: Small focused coding tasks, build up to full implementation
> Rules: Write every function yourself. Test each drill before moving to the next.
> Standard Go packages only — no external libraries.

---

## Drill 1 — Parse the `--align` Flag

Write a Go function:

```go
func parseArgs(args []string) (align string, text string, banner string, err error)
```

- Detects `--align=<type>` flag if present
- Valid align types: `"left"`, `"right"`, `"center"`, `"justify"`
- Valid argument combinations:

```bash
go run . "hello"                             # no flag, default left, default standard banner
go run . --align=center "hello"              # align + text
go run . --align=right "hello" standard      # align + text + banner
go run . --align=justify "how are you" shadow # align + text + banner
```

- Any other format returns this exact usage message:

```
Usage: go run . [OPTION] [STRING] [BANNER]
```

**Must return usage error for:**
```bash
go run . --align "hello"          # missing =
go run . --align= "hello"         # empty type
go run . --align=diagonal "hello" # invalid type
go run . -align=center "hello"    # single dash
go run . --ALIGN=center "hello"   # wrong case
```

**Test cases:**
```
["--align=center", "hello"]           → "center", "hello", "standard", nil
["--align=right", "hello", "shadow"]  → "right", "hello", "shadow", nil
["hello"]                             → "left", "hello", "standard", nil
["--align=diagonal", "hello"]         → "", "", "", error + usage message
[]                                    → "", "", "", error + usage message
```

---

## Drill 2 — Get Terminal Width

Write a Go function:

```go
func getTerminalWidth() int
```

- Returns the current width of the terminal in columns
- Uses `golang.org/x/term` — wait, that's external. Use `syscall` instead:

```go
import (
    "syscall"
    "unsafe"
)

type winsize struct {
    Row    uint16
    Col    uint16
    Xpixel uint16
    Ypixel uint16
}

func getTerminalWidth() int {
    ws := &winsize{}
    syscall.Syscall(syscall.SYS_IOCTL,
        uintptr(syscall.Stdout),
        uintptr(syscall.TIOCGWINSZ),
        uintptr(unsafe.Pointer(ws)),
    )
    if ws.Col == 0 {
        return 80 // safe default
    }
    return int(ws.Col)
}
```

**Test it by printing the result:**
```bash
go run . --align=center "hello"
# Resize your terminal window and run again — width should change
```

**Edge case:** if the syscall fails (e.g., output is piped, not a real terminal), fall back to 80 columns. Never crash.

---

## Drill 3 — Calculate Left Padding

Write a Go function:

```go
func calcPadding(align string, textWidth int, termWidth int) (leftPad int, rightPad int)
```

- `textWidth` = total pixel width of the rendered ASCII art line (number of characters wide)
- `termWidth` = current terminal width in columns
- Returns left and right padding (in spaces) based on alignment type

**Rules:**
```
left:    leftPad = 0,                          rightPad = termWidth - textWidth
center:  leftPad = (termWidth - textWidth) / 2, rightPad = termWidth - textWidth - leftPad
right:   leftPad = termWidth - textWidth,       rightPad = 0
justify: handled separately (see Drill 5)
```

**Test cases (termWidth = 80, textWidth = 20):**
```
left    → leftPad=0,  rightPad=60
center  → leftPad=30, rightPad=30
right   → leftPad=60, rightPad=0
```

**Edge case:** if `textWidth >= termWidth`, return `leftPad = 0`. Never produce negative padding.

---

## Drill 4 — Measure ASCII Art Line Width

Write a Go function:

```go
func measureLineWidth(text string, charMap map[rune][8]string) int
```

- Returns the total character width of the rendered ASCII art for a given text string
- This is the length of any one of the 8 rows when rendered (they're all the same width)

**How to calculate:**
- For each rune in `text`, look up its 8-line art in `charMap`
- Take row 0 (or any row) and measure `len(row)`
- Sum across all characters

**Test cases:**
```go
measureLineWidth("hello", charMap)  // sum of widths of h, e, l, l, o in standard banner
measureLineWidth(" ", charMap)      // width of a single space character
measureLineWidth("", charMap)       // → 0
```

---

## Drill 5 — Justify Alignment

The `justify` alignment spaces words evenly so the text spans the full terminal width.

Write a Go function:

```go
func justifySpacing(words []string, charMap map[rune][8]string, termWidth int) []int
```

- `words` = the individual words in the input text (split on space)
- Returns a slice of spacer widths (in columns) to insert **between** each word
- The total width of all words + all spacers must equal `termWidth`

**How to calculate:**
```
totalWordWidth = sum of measureLineWidth(word) for each word
availableSpace = termWidth - totalWordWidth
gaps = len(words) - 1
baseGap = availableSpace / gaps
extraGap = availableSpace % gaps  ← distribute 1 extra space to the first extraGap gaps
```

**Test case (termWidth=80):**
```
words = ["how", "are", "you"]
totalWordWidth = measureLineWidth("how") + measureLineWidth("are") + measureLineWidth("you")
gaps = 2
→ [baseGap + (0 or 1), baseGap + (0 or 1)]
```

**Edge case:** if there is only one word, treat it as left-aligned — no gaps to calculate.

---

## Drill 6 — Render a Padded Row

Write a Go function:

```go
func renderPaddedRow(text string, rowIndex int, charMap map[rune][8]string, leftPad int) string
```

- Renders one row of the ASCII art for `text`
- Prepends `leftPad` spaces before the rendered content
- Returns the padded row as a string

**Test with center alignment:**
```
text = "hello", rowIndex = 0, leftPad = 30
→ "                              " + row_0_of_hello
```

**Why only leftPad here:** right padding is usually not needed for terminal output — lines naturally end where the content ends. Only prepend the left side.

---

## Drill 7 — Render Justified Row

Write a Go function:

```go
func renderJustifiedRow(words []string, rowIndex int, charMap map[rune][8]string, spacers []int) string
```

- Renders one row with words spaced by the spacer widths from Drill 5
- Between each word, insert exactly `spacers[i]` space characters
- Returns the full justified row as a string

**Example:**
```
words = ["how", "are", "you"], spacers = [20, 20], rowIndex = 3
→ row_3_of_how + " "(×20) + row_3_of_are + " "(×20) + row_3_of_you
```

**Edge case:** if `words` has only one word, render it left-aligned with no spacing.

---

## Drill 8 — Full Aligned Render Pipeline

Wire Drills 1–7 together. Write a function:

```go
func renderAligned(text string, align string, charMap map[rune][8]string, termWidth int) string
```

- Splits input on literal `\n`
- For each segment:
  - Empty → output one blank line
  - Non-empty + `justify` → split segment on spaces, calculate spacers, render justified rows
  - Non-empty + other alignment → calculate padding, render padded rows
- Returns all 8 rows per segment, newline-separated

**Test with:**
```bash
go run . --align=center "hello" standard
go run . --align=right "hello" shadow
go run . --align=justify "how are you" shadow
go run . --align=left "Hello There" standard
```

Output must match the spec terminal display examples exactly (accounting for your actual terminal width).

---

## Drill 9 — Terminal Resize Adaptation

The spec says: *"If you reduce the terminal window, the graphical representation should adapt accordingly."*

This means terminal width must be read **at render time**, not cached at startup.

Write a test that demonstrates this:

```go
func TestTerminalWidthRead(t *testing.T)
```

- Call `getTerminalWidth()` twice
- Confirm it returns a consistent value when the terminal hasn't changed
- Document in a comment: if the terminal were resized between calls, the second call would return a different value — this is the intended behavior

**Also confirm:** your `renderAligned` function calls `getTerminalWidth()` fresh each time it is invoked, not once at startup.

---

## Drill 10 — Argument Parser Compatibility

The spec says the program must accept other correctly formatted `[OPTION]` and/or `[BANNER]` if other ascii-art projects are implemented.

Write an extended parser:

```go
func parseArgsExtended(args []string) (align string, color string, substring string, text string, banner string, err error)
```

That handles all valid combinations:

```bash
go run . "hello"
go run . "hello" standard
go run . --align=center "hello"
go run . --align=center "hello" shadow
go run . --color=red "hello"
go run . --color=red "hello" shadow
go run . --align=center --color=red "hello"
go run . --align=center --color=red "hello" shadow
go run . --align=right --color=red kit "hello" shadow
```

**Any unrecognized flag or ordering still returns the usage message.**

---

## Drill 11 — Edge Case Gauntlet

Write a test file `justify_edge_test.go`:

```go
func TestLeftDefault(t *testing.T)           // no flag → same as --align=left
func TestCenterSingleChar(t *testing.T)      // --align=center "A" → centered single char
func TestRightLongString(t *testing.T)       // text wider than terminal → leftPad=0, no crash
func TestJustifySingleWord(t *testing.T)     // --align=justify "hello" → treated as left
func TestJustifyTwoWords(t *testing.T)       // --align=justify "hi there" → one gap fills space
func TestAlignWithNewline(t *testing.T)      // --align=center "hello\nworld" → each line centered
func TestEmptyString(t *testing.T)           // --align=center "" → no output
func TestInvalidAlignType(t *testing.T)      // --align=diagonal → usage message, non-zero exit
func TestMissingEquals(t *testing.T)         // --align center → usage message, non-zero exit
```

Run with:
```bash
go test ./...
```

---

## Drill 12 — Full Spec Compliance Check

Write a shell script `check_justify.sh` that runs each example from the spec and compares output:

```bash
#!/bin/bash

pass=0
fail=0

check() {
    local desc="$1"
    local actual="$2"
    local expected="$3"
    if [ "$actual" = "$expected" ]; then
        echo "PASS: $desc"
        ((pass++))
    else
        echo "FAIL: $desc"
        diff <(echo "$actual") <(echo "$expected")
        ((fail++))
    fi
}

check "center hello standard"      "$(go run . --align=center 'hello' standard)"     "$(cat expected/center_hello.txt)"
check "left Hello There standard"  "$(go run . --align=left 'Hello There' standard)" "$(cat expected/left_hello_there.txt)"
check "right hello shadow"         "$(go run . --align=right 'hello' shadow)"         "$(cat expected/right_hello.txt)"
check "justify how are you shadow" "$(go run . --align=justify 'how are you' shadow)" "$(cat expected/justify_how_are_you.txt)"
check "no flag single arg"         "$(go run . 'hello')"                              "$(cat expected/left_hello.txt)"

echo ""
echo "Results: $pass passed, $fail failed"
```

**Before running:** generate your expected files once your output looks correct, then lock them as reference. Re-run the script after every change to catch regressions.

---

*Write every function yourself. Do not copy. Test locally before moving to the next drill.*
