## Drill 6 — Fix Punctuation Spacing

Write a function that corrects spacing around punctuation marks:

```go
func fixPunctuation(text string) string
```

**Requirements:**
- Single punctuation marks (`.`, `,`, `!`, `?`, `:`, `;`) must sit directly after the previous word with no space before them
- Grouped punctuation (`...`, `!?`, `!!`, etc.) must be treated as a single unit — same rule applies
- Process grouped punctuation before single punctuation to avoid breaking groups apart

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

func fixPunctuation(text string) string {
	// TODO: implement
	return text
}

func main() {
	text := readInput()
	fmt.Println(fixPunctuation(text))
}
```

**Stdin:**
```
Punctuation tests are ... kinda boring ,what do you think ?
```

**Expected output:**
```
Punctuation tests are... kinda boring, what do you think?
```
