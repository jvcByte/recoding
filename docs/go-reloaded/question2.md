## Drill 3 — Convert `(bin)` Tags

Write a function that finds every `(bin)` tag and replaces the word immediately before it with its decimal value:

```go
func convertBin(text string) string
```

**Requirements:**
- The word before `(bin)` is always a valid binary number
- Replace that word with its decimal equivalent
- Remove the `(bin)` tag from the output

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

func convertBin(text string) string {
	// TODO: implement
	return text
}

func main() {
	text := readInput()
	fmt.Println(convertBin(text))
}
```

**Stdin:**
```
It has been 10 (bin) years
```

**Expected output:**
```
It has been 2 years
```

**Hint:** Use `strconv.ParseInt(s, 2, 64)` to parse binary.
