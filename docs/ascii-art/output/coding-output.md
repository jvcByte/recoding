# ascii-art-output — Hands-On Coding Drills
> Derived strictly from the ascii-art-output project brief
> Builds on top of ascii-art base project
> Format: Small focused coding tasks, build up to full implementation
> Rules: Write every function yourself. Test each drill before moving to the next.
> Standard Go packages only — no external libraries.

---

## Drill 1 — Parse the `--output` Flag

Write a Go function:

```go
func parseArgs(args []string) (outputFile string, text string, banner string, err error)
```

- Detects `--output=<fileName.txt>` flag if present
- Valid argument combinations:

```bash
go run . "hello"                                    # no flag → stdout, standard banner
go run . --output=banner.txt "hello"                # output file + text
go run . --output=banner.txt "hello" standard       # output file + text + banner
go run . --output=banner.txt "Hello There!" shadow  # output file + text + shadow banner
```

- Any other format returns this exact usage message:

```
Usage: go run . [OPTION] [STRING] [BANNER]
```

**Must return usage error for:**
```bash
go run . --output "hello"            # missing =
go run . --output= "hello"           # empty filename
go run . -output=banner.txt "hello"  # single dash
go run . --OUTPUT=banner.txt "hello" # wrong case
go run . --output=banner "hello"     # missing .txt extension — decide: enforce or allow?
```

**Test cases:**
```
["--output=banner.txt", "hello"]                → "banner.txt", "hello", "standard", nil
["--output=banner.txt", "hello", "shadow"]      → "banner.txt", "hello", "shadow", nil
["hello"]                                       → "", "hello", "standard", nil
["--output=", "hello"]                          → "", "", "", error + usage message
["--output", "hello"]                           → "", "", "", error + usage message
[]                                              → "", "", "", error + usage message
```

---

## Drill 2 — Validate Output Filename

Write a Go function:

```go
func validateOutputFilename(name string) error
```

- Returns nil if the filename is a valid, writable target
- Returns an error if:
  - Filename is empty
  - Filename contains path separators (`/` or `\`) that point outside the current directory
  - Filename has no `.txt` extension (decide your policy and document it)

**Test cases:**
```
"banner.txt"          → nil
"output.txt"          → nil
"result.txt"          → nil
""                    → error
"../banner.txt"       → error  ← path traversal
"/etc/banner.txt"     → error  ← absolute path
"banner"              → your call — document decision
"banner.md"           → your call — document decision
```

**Why this matters:** blindly writing to any path a user provides is a security risk. A well-designed tool constrains where it writes.

---

## Drill 3 — Write Output to File

Write a Go function:

```go
func writeToFile(filename string, content string) error
```

- Creates or overwrites the file at `filename`
- Writes `content` to it
- Returns a meaningful error if the write fails
- Uses `os.WriteFile` or `os.Create` + `file.WriteString`

**Test cases:**
```go
writeToFile("banner.txt", "hello\nworld\n")  // creates banner.txt with content
writeToFile("banner.txt", "updated\n")       // overwrites existing file
writeToFile("", "hello")                     // → error, empty filename
writeToFile("/nonexistent/path/out.txt", "x") // → error, directory doesn't exist
```

**After writing, verify with:**
```bash
cat -e banner.txt
# Every line should end with $ — confirming no trailing content issues
```

---

## Drill 4 — Route Output (File vs Stdout)

Write a Go function:

```go
func writeOutput(content string, outputFile string) error
```

- If `outputFile` is empty → write `content` to `os.Stdout`
- If `outputFile` is non-empty → write `content` to the file using `writeToFile`
- Returns any error from either path

**Test cases:**
```go
writeOutput("hello\n", "")            // prints to stdout
writeOutput("hello\n", "banner.txt")  // writes to file
writeOutput("hello\n", "/bad/path.txt") // returns error
```

**This function is the single decision point** — the rest of your program never needs to know whether output goes to a file or stdout. It just builds the content string and calls this.

---

## Drill 5 — Preserve Trailing Spaces in File Output

The spec shows `cat -e banner.txt` with `$` at the end of every line — including lines that are all spaces. This means trailing spaces must be preserved when writing to file.

Write a test:

```go
func TestTrailingSpacesInFile(t *testing.T)
```

That:
1. Renders `"hello"` with the standard banner
2. Writes it to a temp file using `writeToFile`
3. Reads the file back
4. Splits into lines
5. Asserts that lines which should have trailing spaces still have them

**Common trap:** `fmt.Fprintln`, `strings.TrimRight`, or certain write helpers silently strip trailing spaces. Use raw string writes — `file.WriteString(line + "\n")` — to guarantee nothing is trimmed.

---

## Drill 6 — Full Pipeline With Output Flag

Wire everything together. Write a `main` function that:

1. Parses and validates arguments
2. Validates output filename if provided
3. Loads the banner file
4. Parses it into a character map
5. Splits input on literal `\n`
6. Renders each segment
7. Routes output via `writeOutput`

**Test with both spec examples:**
```bash
go run . --output=banner.txt "hello" standard
cat -e banner.txt

go run . --output=banner.txt "Hello There!" shadow
cat -e banner.txt
```

Your file content must match the spec output exactly, including trailing spaces.

---

## Drill 7 — Overwrite Behavior

The spec example runs the program twice with the same output filename. The second run overwrites the first.

Write a test:

```go
func TestFileOverwrite(t *testing.T)
```

That:
1. Writes `"hello"` rendered output to `test_out.txt`
2. Writes `"world"` rendered output to the same `test_out.txt`
3. Reads the file and confirms it contains only `"world"` output — not both

**Also confirm:** the file is not appended to. It is fully replaced each run.

---

## Drill 8 — No Flag Fallback (Stdout)

Confirm that running with no `--output` flag writes to stdout — exactly like the base ascii-art project.

Write a test:

```go
func TestNoFlagStdout(t *testing.T)
```

That:
- Captures stdout output when no `--output` flag is provided
- Confirms the output matches the expected rendered ASCII art
- Confirms no file is created

**Hint for capturing stdout in tests:**
```go
old := os.Stdout
r, w, _ := os.Pipe()
os.Stdout = w

// run your render + writeOutput here

w.Close()
os.Stdout = old
var buf bytes.Buffer
io.Copy(&buf, r)
result := buf.String()
```

---

## Drill 9 — Extended Argument Compatibility

The spec says: *"If there are other ascii-art optional projects implemented, the program should accept other correctly formatted [OPTION] and/or [BANNER]."*

Write an extended parser:

```go
func parseArgsExtended(args []string) (outputFile string, align string, color string, substring string, text string, banner string, err error)
```

That handles all valid combinations:

```bash
go run . "hello"
go run . "hello" shadow
go run . --output=banner.txt "hello"
go run . --output=banner.txt "hello" shadow
go run . --align=center "hello"
go run . --output=banner.txt --align=center "hello" shadow
go run . --output=banner.txt --color=red "hello"
go run . --output=banner.txt --align=right --color=red kit "hello" shadow
```

**Any unrecognized flag or invalid combination still returns the usage message.**

---

## Drill 10 — Error Handling Gauntlet

Write a test file `output_errors_test.go`:

```go
func TestMissingEquals(t *testing.T)          // --output banner.txt → usage message
func TestEmptyFilename(t *testing.T)          // --output= → usage message
func TestSingleDash(t *testing.T)             // -output=banner.txt → usage message
func TestWrongCase(t *testing.T)              // --OUTPUT=banner.txt → usage message
func TestNoArgs(t *testing.T)                 // no arguments → usage message
func TestUnwritablePath(t *testing.T)         // --output=/root/banner.txt → error (permission denied)
func TestPathTraversal(t *testing.T)          // --output=../banner.txt → error
func TestOutputWithInvalidBanner(t *testing.T) // --output=out.txt "hello" banana → error
```

Each must:
- Not panic
- Print a meaningful message
- Exit with a non-zero code

---

## Drill 11 — Edge Case Gauntlet

Write a test file `output_edge_test.go`:

```go
func TestEmptyStringToFile(t *testing.T)      // go run . --output=out.txt "" → empty file or no output
func TestNewlineOnlyToFile(t *testing.T)      // go run . --output=out.txt "\n" → one blank line in file
func TestSpecialCharsToFile(t *testing.T)     // go run . --output=out.txt "{Hello}" standard
func TestLargeInputToFile(t *testing.T)       // long string → file written completely, not truncated
func TestShadowBannerToFile(t *testing.T)     // matches spec shadow example exactly
func TestStandardBannerToFile(t *testing.T)   // matches spec standard example exactly
func TestFileCreatedOnSuccess(t *testing.T)   // confirm file exists after successful run
func TestFileNotCreatedOnError(t *testing.T)  // confirm file is NOT created if input is invalid
```

Run with:
```bash
go test ./...
```

---

## Drill 12 — Full Spec Compliance Check

Write a shell script `check_output.sh`:

```bash
#!/bin/bash

pass=0
fail=0

check() {
    local desc="$1"
    local file="$2"
    local expected="$3"

    actual=$(cat "$file" 2>/dev/null)
    if [ "$actual" = "$expected" ]; then
        echo "PASS: $desc"
        ((pass++))
    else
        echo "FAIL: $desc"
        diff <(echo "$actual") <(echo "$expected")
        ((fail++))
    fi
}

# Run the program
go run . --output=banner.txt "hello" standard
check "hello standard → file" "banner.txt" "$(cat expected/hello_standard.txt)"

go run . --output=banner.txt "Hello There!" shadow
check "Hello There! shadow → file" "banner.txt" "$(cat expected/hello_there_shadow.txt)"

# Overwrite test
go run . --output=banner.txt "hello" standard
go run . --output=banner.txt "Hello There!" shadow
check "overwrite → shadow only" "banner.txt" "$(cat expected/hello_there_shadow.txt)"

# No flag → stdout
actual_stdout=$(go run . "hello" standard)
expected_stdout=$(cat expected/hello_standard.txt)
if [ "$actual_stdout" = "$expected_stdout" ]; then
    echo "PASS: no flag → stdout"
    ((pass++))
else
    echo "FAIL: no flag → stdout"
    ((fail++))
fi

echo ""
echo "Results: $pass passed, $fail failed"
```

**Before running:** generate your `expected/` files once output is confirmed correct, then lock them as reference.

---

*Write every function yourself. Do not copy. Test locally before moving to the next drill.*
