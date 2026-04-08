# ascii-art-fs — Hands-On Coding Drills
> Derived strictly from the ascii-art-fs project brief
> Builds on top of ascii-art base project
> Format: Small focused coding tasks, build up to full implementation
> Rules: Write every function yourself. Test each drill before moving to the next.
> Standard Go packages only — no external libraries.

---

## Drill 1 — Argument Validation

Write a Go function:

```go
func parseArgs(args []string) (text string, banner string, err error)
```

- Accepts `os.Args[1:]`
- Valid formats:
  - One argument → text only, default to `"standard"` banner
  - Two arguments → text + banner name
  - Any other count → return usage error
- Returns the exact usage message on error:

```
Usage: go run . [STRING] [BANNER]
```

**Test cases:**
```
["hello"]                  → "hello", "standard", nil
["hello", "shadow"]        → "hello", "shadow", nil
["hello", "thinkertoy"]    → "hello", "thinkertoy", nil
[]                         → "", "", error + usage message
["a", "b", "c"]            → "", "", error + usage message
["hello", "banana"]        → "", "", error  ← invalid banner name
```

**Note:** argument validation here is stricter than base ascii-art — the format is exactly `[STRING] [BANNER]`, no flags, no extras.

---

## Drill 2 — Banner Name Validation

Write a Go function:

```go
func validateBanner(name string) error
```

- Returns nil for `"standard"`, `"shadow"`, `"thinkertoy"`
- Returns a descriptive error for anything else
- Case-sensitive — `"Standard"` is not valid

**Test cases:**
```
"standard"    → nil
"shadow"      → nil
"thinkertoy"  → nil
"Standard"    → error
"banana"      → error
""            → error
```

**Why separate from Drill 1:** you want to be able to test banner validation independently from argument counting. Each function does one thing.

---

## Drill 3 — Resolve Banner File Path

Write a Go function:

```go
func bannerFilePath(name string) string
```

- Takes a validated banner name
- Returns the relative file path to load it from

**Test cases:**
```
"standard"    → "standard.txt"
"shadow"      → "shadow.txt"
"thinkertoy"  → "thinkertoy.txt"
```

**Design note:** keep this as a pure mapping function — no file I/O here. This makes it trivial to unit test without touching the file system.

---

## Drill 4 — Load Banner Using `fs` API

Write a Go function using the `fs` package (not just `os`):

```go
func loadBannerFS(fsys fs.FS, name string) ([]string, error)
```

- Takes an `fs.FS` interface and a banner name
- Resolves the file path using `bannerFilePath`
- Opens and reads the file using `fs.ReadFile` or `fsys.Open`
- Returns the file lines as a slice of strings
- Returns a meaningful error if the file cannot be found or read

**Why `fs.FS` instead of a hardcoded path:**
- Makes your function testable with `fstest.MapFS` (in-memory fake filesystem)
- Allows the program to embed banner files later without changing this function

**Test it with a real filesystem:**
```go
loadBannerFS(os.DirFS("."), "standard")   // reads standard.txt from current dir
loadBannerFS(os.DirFS("."), "shadow")     // reads shadow.txt
```

**And with a fake filesystem in tests:**
```go
fakeFS := fstest.MapFS{
    "standard.txt": &fstest.MapFile{Data: []byte("...banner content...")},
}
loadBannerFS(fakeFS, "standard")
```

---

## Drill 5 — Parse Banner Into Character Map

This is the same logic as ascii-art base Drill 2, but now it must work with data loaded via `fs.FS`.

Write a Go function:

```go
func parseBanner(lines []string) (map[rune][8]string, error)
```

- Takes raw lines from `loadBannerFS`
- Returns a map of rune → 8-line character art
- Returns an error if the line count is not what's expected for a valid banner file

**Validation rule:** a valid banner file for 95 printable ASCII characters (space to tilde) requires exactly `95 * 9 - 1 = 854` lines. If the count is wrong, return an error — do not silently produce a broken map.

**Test cases:**
```go
// Valid banner → 95 entries, each with 8 lines
// Truncated banner → error
// Empty file → error
```

---

## Drill 6 — Render With Named Banner (Integration)

Wire Drills 1–5 together. Write a `main` function that:

1. Parses and validates arguments
2. Validates banner name
3. Loads the banner file via `fs.FS`
4. Parses it into a character map
5. Splits input on literal `\n`
6. Renders each segment (empty → blank line, non-empty → 8-row art)
7. Prints to stdout

**Test with all three banners:**
```bash
go run . "hello" standard | cat -e
go run . "Hello There!" shadow | cat -e
go run . "Hello There!" thinkertoy | cat -e
```

Your output must match the spec examples exactly — including trailing spaces on each line.

---

## Drill 7 — Default Banner Fallback

Confirm that running with a single argument still works:

```bash
go run . "hello"        # should use standard banner by default
```

Write a test:

```go
func TestDefaultBanner(t *testing.T)
```

That renders `"hello"` with no banner argument and confirms the output matches the `standard` banner output exactly.

**Also test the error path:**
```bash
go run .                # no arguments → usage message, non-zero exit
go run . "a" "b" "c"   # too many arguments → usage message, non-zero exit
```

---

## Drill 8 — Compatibility With Other Options

The spec says: *"If there are other ascii-art optional projects implemented, the program should accept other correctly formatted [OPTION] and/or [BANNER]."*

This means your argument parser must not break when combined with the `--color` flag from the color project.

Write a function:

```go
func parseArgsExtended(args []string) (text string, banner string, color string, substring string, err error)
```

That handles all of these:
```bash
go run . "hello"                              # text only
go run . "hello" standard                     # text + banner
go run . --color=red "hello"                  # color, no substring, text
go run . --color=red "hello" shadow           # color, text, banner
go run . --color=red kit "hello" shadow       # color, substring, text, banner
```

**Invalid formats still return the usage message.**

---

## Drill 9 — Test With `fstest.MapFS`

Write a test file `fs_test.go` that uses an in-memory filesystem to test your banner loading — no real files needed.

```go
func TestLoadBannerFS(t *testing.T)
func TestLoadBannerFSMissingFile(t *testing.T)
func TestLoadBannerFSEmptyFile(t *testing.T)
func TestLoadBannerFSWrongLineCount(t *testing.T)
func TestParseBannerValidData(t *testing.T)
func TestParseBannerInvalidData(t *testing.T)
```

**Use `fstest.MapFS` like this:**
```go
import "testing/fstest"

fakeFS := fstest.MapFS{
    "standard.txt": &fstest.MapFile{
        Data: []byte(strings.Join(bannerLines, "\n")),
    },
}
lines, err := loadBannerFS(fakeFS, "standard")
```

This is what the `fs` API is actually for — your functions should be testable without touching real files on disk.

---

## Drill 10 — Output Format Strict Check

The spec shows trailing spaces on every rendered line, followed by `$` in `cat -e` output. This means every row must end with the correct amount of trailing spaces.

Write a test:

```go
func TestTrailingSpaces(t *testing.T)
```

That renders `"hello"` with the standard banner, splits the output into lines, and asserts that:
- There are exactly 8 rendered lines (plus any blank lines for `\n`)
- No line has been accidentally trimmed of trailing spaces
- Each line ends with the correct character (space, not nothing)

**Why this matters:** `strings.TrimRight` or `fmt.Println` on the wrong variable can silently strip trailing spaces, causing a format mismatch that only `cat -e` would catch.

---

## Drill 11 — Edge Case Gauntlet

Write a test file `edge_fs_test.go`:

```go
func TestEmptyString(t *testing.T)          // go run . "" standard → no output
func TestNewlineOnly(t *testing.T)          // go run . "\n" standard → one blank line
func TestAllThreeBanners(t *testing.T)      // same input, three different banners → three different outputs
func TestSpecialChars(t *testing.T)         // go run . "Hello There!" shadow → matches spec output
func TestThinkertoyOutput(t *testing.T)     // go run . "Hello There!" thinkertoy → matches spec output
func TestInvalidBannerName(t *testing.T)    // go run . "hello" banana → usage message, non-zero exit
func TestTooManyArgs(t *testing.T)          // go run . "a" "b" "c" → usage message, non-zero exit
func TestNoArgs(t *testing.T)              // go run . → usage message, non-zero exit
```

Run with:
```bash
go test ./...
```

---

## Drill 12 — Full Spec Compliance Check

Write a shell script `check_fs.sh` that runs every example from the spec and diffs against expected output:

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

check "hello standard"      "$(go run . hello standard)"      "$(cat expected/hello_standard.txt)"
check "Hello There! shadow" "$(go run . 'Hello There!' shadow)" "$(cat expected/hello_there_shadow.txt)"
check "Hello There! thinkertoy" "$(go run . 'Hello There!' thinkertoy)" "$(cat expected/hello_there_thinkertoy.txt)"
check "single arg default"  "$(go run . hello)"               "$(cat expected/hello_standard.txt)"

echo ""
echo "Results: $pass passed, $fail failed"
```

**Before running:** create the `expected/` directory and populate it by running the program once you're confident it's correct, then lock those outputs as your reference.

---

*Write every function yourself. Do not copy. Test locally before moving to the next drill.*
