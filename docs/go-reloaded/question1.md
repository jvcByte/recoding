## Drill 2 — Convert `(hex)` Tags

Write a function that finds every `(hex)` tag and replaces the word immediately before it with its decimal value:

```go
func convertHex(text string) string
```

**Requirements:**
- The word before `(hex)` is always a valid hexadecimal number
- Replace that word with its decimal equivalent
- Remove the `(hex)` tag from the output

**Starter:**
```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
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

func convertHex(text string) string {
	// TODO: implement
	return text
}

func main() {
	text := readInput()
	fmt.Println(convertHex(text))
}
```

**Stdin:**
```
1E (hex) files were added
```

**Expected output:**
```
30 files were added
```

**Hint:** Use `strconv.ParseInt(s, 16, 64)` to parse hex, and `strconv.FormatInt(n, 10)` to convert back to decimal.
