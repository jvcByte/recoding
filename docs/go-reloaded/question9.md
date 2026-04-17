## Drill 10 — Test Hex and Bin Together

Use your full pipeline from Drill 9. Test that hex and bin conversions work together in the same input.

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
Simply add 42 (hex) and 10 (bin) and you will see the result is 68.
```

**Expected output:**
```
Simply add 66 and 2 and you will see the result is 68.
```
