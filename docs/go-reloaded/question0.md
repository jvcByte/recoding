## Drill 1 — Read Input Text from Stdin

Write a function that reads the entire input from stdin and returns it as a string:

```go
func readInput() string
```

**Requirements:**
- Read all lines from stdin
- Join them back with newlines
- Return the full text as a single string

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
	// TODO: implement
	return ""
}

func main() {
	text := readInput()
	fmt.Print(text)
}
```

**Stdin (paste into the stdin box):**
```
hello world
this is a test
```

**Expected output:**
```
hello world
this is a test
```
