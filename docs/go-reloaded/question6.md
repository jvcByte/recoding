## Drill 7 — Fix Single-Quote Formatting

Write a function `fixSingleQuotes(text string) string` that removes spaces between single-quote marks and the words they wrap:

**Requirements:**
- Find pairs of `'` marks
- Remove any space immediately after the opening `'`
- Remove any space immediately before the closing `'`
- Works for both single-word and multi-word content between the quotes

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

func fixSingleQuotes(text string) string {
	// TODO: implement
	return text
}

func main() {
	text := readInput()
	fmt.Println(fixSingleQuotes(text))
}
```

**Stdin:**
```
As Elton John said: ' I am the most well-known homosexual in the world '
```

**Expected output:**
```
As Elton John said: 'I am the most well-known homosexual in the world'
```
