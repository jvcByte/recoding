## Drill 2 — Build the Character Map

Write a function `buildCharMap(lines []string) map[rune][8]string` that parses the banner lines into a map from character to its 8 art rows.

**Requirements:**
- The banner covers ASCII 32 (`' '`) through 126 (`'~'`) — 95 characters total
- Each character occupies 9 lines: 8 art rows followed by 1 blank separator
- The map key is the `rune` value of the character
- The map value is an `[8]string` array of the 8 art rows

**Starter:**
```go
package main

import (
	"bufio"
	"fmt"
	"os"
)

func readBannerFromStdin() []string {
	// TODO: implement (copy from Drill 1)
	return nil
}

func buildCharMap(lines []string) map[rune][8]string {
	// TODO: implement
	return nil
}

func main() {
	lines := readBannerFromStdin()
	charMap := buildCharMap(lines)
	fmt.Println(len(charMap))
}
```

**Expected output:**
```
95
```
