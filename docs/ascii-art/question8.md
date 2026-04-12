## Drill 9 — Render Digits and Special Characters

Using `renderLine` from Drill 4, render the characters `'1'` and `'!'` individually and print the first row of each.

**Requirements:**
- Both `'1'` and `'!'` must be present in the character map
- Their first rows must be non-empty and different from each other
- Print each first row with a label

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
	// TODO: implement (copy from Drill 2)
	return nil
}

func renderLine(text string, charMap map[rune][8]string) [8]string {
	// TODO: implement (copy from Drill 4)
	return [8]string{}
}

func main() {
	lines := readBannerFromStdin()
	charMap := buildCharMap(lines)

	one := renderLine("1", charMap)
	bang := renderLine("!", charMap)

	fmt.Printf("'1' row0: %q\n", one[0])
	fmt.Printf("'!' row0: %q\n", bang[0])

	if one[0] != bang[0] {
		fmt.Println("distinct: true")
	} else {
		fmt.Println("distinct: false")
	}
}
```

**Expected output:**
```
'1' row0: " _  "
'!' row0: " _ "
distinct: true
```
