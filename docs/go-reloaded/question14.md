## Drill 15 — Edge Cases

Use your full pipeline. This input combines all rules and tests boundary conditions — make sure nothing breaks.

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

**Also test with:**
```
Ready, set, go (up) !
```
**Expected:**
```
Ready, set, GO!
```

Try both inputs — your pipeline should handle them without any changes to the code.
