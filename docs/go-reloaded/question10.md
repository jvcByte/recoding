## Drill 11 — Test Punctuation Cleanup

Use your full pipeline. Verify punctuation spacing works correctly including grouped punctuation.

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
I was sitting over there ,and then BAMM !!
```

**Expected output:**
```
I was sitting over there, and then BAMM!!
```
