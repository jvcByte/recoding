## Drill 5 — Multi-Word `(up, N)`, `(low, N)`, `(cap, N)`

Extend your case modifier to handle the numbered variant:

```go
func applyCaseModifiers(text string) string
```

**Requirements:**
- `(up, 3)` → converts the 3 words before the tag to uppercase
- `(low, 2)` → converts the 2 words before the tag to lowercase
- `(cap, 6)` → capitalizes the first letter of the 6 words before the tag
- Single `(up)` / `(low)` / `(cap)` still works (defaults to 1 word)
- If N is greater than the number of available words, apply to all available words

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

func applyCaseModifiers(text string) string {
	// TODO: implement
	return text
}

func main() {
	text := readInput()
	fmt.Println(applyCaseModifiers(text))
}
```

**Stdin:**
```
it was the age of foolishness (cap, 6)
```

**Expected output:**
```
It Was The Age Of Foolishness
```
