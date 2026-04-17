# go-reloaded — Hands-On Coding Drills
> Derived strictly from the go-reloaded project brief
> Format: Small focused coding tasks, build up to full implementation
> Rules: Write every function yourself. Test each drill before moving to the next.
> Standard Go packages only — no external libraries.

---

## Drill 1 — Read Input and Write Output Files

Write a Go program that:

```go
func readFile(path string) (string, error)
func writeFile(path string, content string) error
```

- `readFile` reads the entire file at `path` and returns its content as a string
- `writeFile` writes `content` to the file at `path`, creating it if it doesn't exist
- Both return a meaningful error if the operation fails

**Usage:**
```bash
go run . input.txt output.txt
```

**Test it:**
```bash
echo "hello world" > input.txt
go run . input.txt output.txt
cat output.txt
# → hello world
```

**Edge cases:**
- Input file does not exist → print error and exit with non-zero code
- Output path is not writable → print error and exit

---

## Drill 2 — Convert `(hex)` and `(bin)` Tags

Write a Go function:

```go
func convertBases(text string) string
```

- Finds every `(hex)` tag and replaces the word immediately before it with its decimal value
- Finds every `(bin)` tag and replaces the word immediately before it with its decimal value
- Removes the tag itself from the output

**Test cases:**
```
"1E (hex) files were added"   → "30 files were added"
"It has been 10 (bin) years"  → "It has been 2 years"
"Simply add 42 (hex) and 10 (bin) and you will see the result is 68." → "Simply add 66 and 2 and you will see the result is 68."
```

**What you need:**
- `strconv.ParseInt(s, 16, 64)` for hex
- `strconv.ParseInt(s, 2, 64)` for binary
- `strconv.FormatInt(n, 10)` to convert back to decimal string

---

## Drill 3 — Single-Word Case Modifiers: `(up)`, `(low)`, `(cap)`

Write a Go function:

```go
func applySingleCaseModifiers(text string) string
```

- `(up)` → converts the word immediately before it to UPPERCASE
- `(low)` → converts the word immediately before it to lowercase
- `(cap)` → capitalizes the first letter of the word immediately before it

**Test cases:**
```
"Ready, set, go (up) !"              → "Ready, set, GO !"
"I should stop SHOUTING (low)"       → "I should stop shouting"
"Welcome to the Brooklyn bridge (cap)" → "Welcome to the Brooklyn Bridge"
```

**What you need:**
- `strings.ToUpper`, `strings.ToLower`
- Manual capitalize: `strings.ToUpper(s[:1]) + strings.ToLower(s[1:])`

---

## Drill 4 — Multi-Word Case Modifiers: `(up, N)`, `(low, N)`, `(cap, N)`

Extend your solution from Drill 3 to handle the numbered variant:

```go
func applyCaseModifiers(text string) string
```

- `(up, 3)` → converts the 3 words before the tag to uppercase
- `(low, 2)` → converts the 2 words before the tag to lowercase
- `(cap, 6)` → capitalizes the first letter of the 6 words before the tag
- Single `(up)` / `(low)` / `(cap)` still works (defaults to 1 word)

**Test cases:**
```
"This is so exciting (up, 2)"   → "This is SO EXCITING"
"it was the age of foolishness (cap, 6)" → "It Was The Age Of Foolishness"
"IT WAS THE (low, 3) winter"    → "it was the winter"
```

**Important:** count only actual words — punctuation attached to a word counts as part of that word, not a separate word.

---

## Drill 5 — Punctuation Spacing

Write a Go function:

```go
func fixPunctuation(text string) string
```

- Single punctuation marks (`.`, `,`, `!`, `?`, `:`, `;`) must be placed directly after the previous word with no space, and have a space before the next word
- Grouped punctuation (`...`, `!?`, `!!`, etc.) must be treated as a single unit — same rule applies

**Test cases:**
```
"I was sitting over there ,and then BAMM !!"  → "I was sitting over there, and then BAMM!!"
"Punctuation tests are ... kinda boring ,what do you think ?" → "Punctuation tests are... kinda boring, what do you think?"
"Ready, set, GO !"  → "Ready, set, GO!"
```

**Order matters:** process grouped punctuation before single punctuation, otherwise `...` gets broken apart.

---

## Drill 6 — Single-Quote Formatting

Write a Go function:

```go
func fixSingleQuotes(text string) string
```

- Pairs of `'` marks should have no space between them and the words they wrap
- Works for both single-word and multi-word content between the quotes

**Test cases:**
```
"I am exactly how they describe me: ' awesome '"
→ "I am exactly how they describe me: 'awesome'"

"As Elton John said: ' I am the most well-known homosexual in the world '"
→ "As Elton John said: 'I am the most well-known homosexual in the world'"
```

**Hint:** find the first `'`, strip the space after it; find the matching closing `'`, strip the space before it.

---

## Drill 7 — `a` → `an` Rule

Write a Go function:

```go
func fixArticles(text string) string
```

- Every standalone `a` or `A` followed by a word starting with a vowel (`a`, `e`, `i`, `o`, `u`) or `h` should become `an` / `An`

**Test cases:**
```
"There it was. A amazing rock!"          → "There it was. An amazing rock!"
"There is no greater agony than bearing a untold story inside you." → "There is no greater agony than bearing an untold story inside you."
"I need a hero"                          → "I need a hero"   ← h rule
"She ate a apple"                        → "She ate an apple"
```

**Important:** only match exact standalone `a` — not `a` inside another word like `cat` or `amazing`.

---

## Drill 8 — Wire Everything Together

Build the full pipeline in `main`:

1. Read args: `go run . input.txt output.txt`
2. Read input file
3. Apply transformations in this order:
   - `convertBases` (hex/bin)
   - `applyCaseModifiers` (up/low/cap with optional N)
   - `fixPunctuation`
   - `fixSingleQuotes`
   - `fixArticles`
4. Write result to output file

**Test with all spec examples:**

```bash
# Test 1
echo "it (cap) was the best of times, it was the worst of times (up) , it was the age of wisdom, it was the age of foolishness (cap, 6) , it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of darkness, it was the spring of hope, IT WAS THE (low, 3) winter of despair." > sample.txt
go run . sample.txt result.txt
cat result.txt
# Expected: It was the best of times, it was the worst of TIMES, it was the age of wisdom, It Was The Age Of Foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of darkness, it was the spring of hope, it was the winter of despair.

# Test 2
echo "Simply add 42 (hex) and 10 (bin) and you will see the result is 68." > sample.txt
go run . sample.txt result.txt
cat result.txt
# Expected: Simply add 66 and 2 and you will see the result is 68.

# Test 3
echo "There is no greater agony than bearing a untold story inside you." > sample.txt
go run . sample.txt result.txt
cat result.txt
# Expected: There is no greater agony than bearing an untold story inside you.

# Test 4
echo "Punctuation tests are ... kinda boring ,what do you think ?" > sample.txt
go run . sample.txt result.txt
cat result.txt
# Expected: Punctuation tests are... kinda boring, what do you think?
```

---

## Drill 9 — Edge Case Gauntlet

Write a test file `transform_test.go` covering:

```go
func TestHexConversion(t *testing.T)       // "1E (hex)" → "30"
func TestBinConversion(t *testing.T)       // "10 (bin)" → "2"
func TestUpSingle(t *testing.T)            // "go (up)" → "GO"
func TestCapMultiple(t *testing.T)         // "(cap, 6)" on 6 words
func TestLowFewerWordsThanN(t *testing.T)  // (low, 5) with only 2 words before → apply to available words
func TestGroupedPunctuation(t *testing.T)  // "..." stays together
func TestSingleQuoteMultiWord(t *testing.T)// ' I am great ' → 'I am great'
func TestArticleH(t *testing.T)            // "a hero" → "a hero" (h rule)
func TestArticleVowel(t *testing.T)        // "a apple" → "an apple"
func TestCombinedRules(t *testing.T)       // (up) + punctuation in same sentence
```

Run with:
```bash
go test ./...
```

All tests must pass before you consider the project complete.

---

*Write every function yourself. Do not copy. Test locally before moving to the next drill.*
