## Drill 5 — Render a Multi-Character String

Using the `renderLine` function from Drill 4, render the string `"Hi"` and print all 8 rows.

**Requirements:**
- Reuse `renderLine` — no changes needed to its logic
- Each character's rows are concatenated horizontally
- Print all 8 rows, one per line

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
	art := renderLine("Hi", charMap)
	for _, row := range art {
		fmt.Println(row)
	}
}
```

**Expected output (8 lines):**
```
 _   _   _  
| | | | (_) 
| |_| |  _  
|  _  | | | 
| | | | | | 
|_| |_| |_| 
            
            
```
