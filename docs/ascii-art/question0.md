## Drill 1 — Read Banner Lines

Write a function `readBannerFromStdin() []string` that reads all lines from stdin and returns them as a slice.

**Requirements:**
- Read line by line using a scanner
- Return each line as a string element
- Do not include the newline character in each line

**Starter:**
```go
package main

import (
	"bufio"
	"fmt"
	"os"
)

func readBannerFromStdin() []string {
	// TODO: implement
	return nil
}

func main() {
	lines := readBannerFromStdin()
	fmt.Println(len(lines))
}
```

**Expected output:**
```
855
```
