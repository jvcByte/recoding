## Drill 10 — Full Render Pipeline

Wire together the banner reader, character map builder, and renderer to process the string `"Hi"` — exactly as your POST handler would — and print the rendered output.

**Requirements:**
- Read the banner from stdin with `readBannerFromStdin`
- Build the character map with `buildCharMap`
- Render `"Hi"` with `renderLine`
- Print all 8 rows

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

func buildCharMap(lines []string) map[rune][8]string {
	// TODO: implement
	return nil
}

func renderLine(text string, charMap map[rune][8]string) [8]string {
	// TODO: implement
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
