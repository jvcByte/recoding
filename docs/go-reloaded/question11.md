## Drill 12 — Test Single-Quote Formatting

Use your full pipeline. Verify single-quote pairs are formatted correctly for both single-word and multi-word cases.

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

// TODO: paste your full transform pipeline here

func main() {
	text := readInput()
	fmt.Print(transform(text))
}
```

**Stdin:**
```
I am exactly how they describe me: ' awesome '
```

**Expected output:**
```
I am exactly how they describe me: 'awesome'
```
