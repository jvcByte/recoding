## Drill 10 — Full Pipeline: Render "Hello"

Wire all the pieces together to render the string `"Hello"` and print all 8 rows.

**Requirements:**
- Read the banner from stdin with `readBannerFromStdin`
- Build the character map with `buildCharMap`
- Split the input on literal `\n` with `splitInput`
- Render each non-empty segment with `renderLine`
- Print the 8 rows of the result

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
	art := renderLine("Hello", charMap)
	for _, row := range art {
		fmt.Println(row)
	}
}
```

**Expected output (8 lines):**
```
 _   _          _   _          
| | | |   ___  | | | |   ___   
| |_| |  / _ \ | | | |  / _ \  
|  _  | |  __/ | | | | | (_) | 
|_| |_|  \___| |_| |_|  \___/  
                                
                                
                                
```
