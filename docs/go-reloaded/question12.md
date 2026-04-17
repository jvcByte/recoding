## Drill 13 — Test the Article Rule

Use your full pipeline. Verify `a` → `an` works for vowels and `h`.

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
There it was. A amazing rock!
```

**Expected output:**
```
There it was. An amazing rock!
```
