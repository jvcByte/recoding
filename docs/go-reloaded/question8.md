## Drill 9 — Wire the Full Pipeline

Combine all your functions into a complete transformation pipeline. Write `transform(text string) string` that applies all rules in order:

Apply transformations in this exact order:
1. `convertHex` + `convertBin`
2. `applyCaseModifiers`
3. `fixPunctuation`
4. `fixSingleQuotes`
5. `fixArticles`

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
	var lines []string
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	return strings.Join(lines, "\n")
}

func convertHex(text string) string   { return text } // TODO: copy from Drill 2
func convertBin(text string) string   { return text } // TODO: copy from Drill 3
func applyCaseModifiers(text string) string { return text } // TODO: copy from Drill 5
func fixPunctuation(text string) string     { return text } // TODO: copy from Drill 6
func fixSingleQuotes(text string) string    { return text } // TODO: copy from Drill 7
func fixArticles(text string) string        { return text } // TODO: copy from Drill 8

func transform(text string) string {
	text = convertHex(text)
	text = convertBin(text)
	text = applyCaseModifiers(text)
	text = fixPunctuation(text)
	text = fixSingleQuotes(text)
	text = fixArticles(text)
	return text
}

func main() {
	text := readInput()
	fmt.Print(transform(text))
}
```

**Stdin:**
```
it (cap) was the best of times, it was the worst of times (up) , it was the age of wisdom, it was the age of foolishness (cap, 6) , it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of darkness, it was the spring of hope, IT WAS THE (low, 3) winter of despair.
```

**Expected output:**
```
It was the best of times, it was the worst of TIMES, it was the age of wisdom, It Was The Age Of Foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of darkness, it was the spring of hope, it was the winter of despair.
```
