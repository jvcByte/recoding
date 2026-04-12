## Drill 4 — Render a Single Character

Write a function `renderLine(text string, charMap map[rune][8]string) [8]string` that builds the 8 art rows for a string by concatenating each character's rows side by side.

**Requirements:**
- For each character in `text`, look it up in `charMap`
- Concatenate the art row for each character onto the corresponding output row
- Return an `[8]string` with the 8 combined rows

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
	// TODO: implement
	return [8]string{}
}

func main() {
	lines := readBannerFromStdin()
	charMap := buildCharMap(lines)
	art := renderLine("A", charMap)
	for _, row := range art {
		fmt.Println(row)
	}
}
```

**Expected output (8 lines):**
```
    _    
   / \   
  / _ \  
 / ___ \ 
/_/   \_\
         
         
         
```
