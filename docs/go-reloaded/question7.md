## Drill 8 — Fix `a` → `an` Article Rule

Write a function that converts `a` to `an` when the next word starts with a vowel or `h`:

```go
func fixArticles(text string) string
```

**Requirements:**
- Every standalone `a` or `A` followed by a word starting with `a`, `e`, `i`, `o`, `u`, or `h` (case-insensitive) becomes `an` / `An`
- Only match exact standalone `a` — not `a` inside another word like `cat` or `amazing`

**Starter:**
```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func readInput() string {
	var lines []string
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	return strings.Join(lines, "\n")
}

func fixArticles(text string) string {
	// TODO: implement
	return text
}

func main() {
	text := readInput()
	fmt.Println(fixArticles(text))
}
```

**Stdin:**
```
There is no greater agony than bearing a untold story inside you.
```

**Expected output:**
```
There is no greater agony than bearing an untold story inside you.
```
