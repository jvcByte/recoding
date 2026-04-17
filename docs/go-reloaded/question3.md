## Drill 4 — Single-Word `(up)`, `(low)`, `(cap)`

Write a function `applySingleCaseModifiers(text string) string` that handles single-word case modifiers:

**Requirements:**
- `(up)` → converts the word immediately before it to UPPERCASE
- `(low)` → converts the word immediately before it to lowercase
- `(cap)` → capitalizes the first letter of the word immediately before it (rest lowercase)
- Remove the tag from the output

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

func applySingleCaseModifiers(text string) string {
	// TODO: implement
	return text
}

func main() {
	text := readInput()
	fmt.Println(applySingleCaseModifiers(text))
}
```

**Stdin:**
```
Ready, set, go (up) !
```

**Expected output:**
```
Ready, set, GO !
```

**Hint:** To capitalize: `strings.ToUpper(s[:1]) + strings.ToLower(s[1:])`
