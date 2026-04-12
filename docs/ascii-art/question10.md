## Drill 11 — Edge Case Gauntlet

Write a function `render(input string, charMap map[rune][8]string) string` that handles the full rendering pipeline including all edge cases.

**Requirements:**
- Empty string `""` → return `""` (no output)
- Split on literal `\n`
- Non-empty segments → render 8 art rows joined by `\n`
- Empty segments between non-empty ones → insert a single blank line
- Trailing empty segment (after a final `\n`) → no extra output
- Join all segment outputs with `\n`

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

func render(input string, charMap map[rune][8]string) string {
	// TODO: implement
	return ""
}

func main() {
	lines := readBannerFromStdin()
	charMap := buildCharMap(lines)

	cases := []struct {
		input         string
		expectedLines int
	}{
		{"", 0},
		{`\n`, 1},
		{`\n\n`, 2},
	}

	allPass := true
	for _, c := range cases {
		out := render(c.input, charMap)
		var got int
		if out == "" {
			got = 0
		} else {
			got = len(splitByNewline(out))
		}
		status := "OK"
		if got != c.expectedLines {
			status = "FAIL"
			allPass = false
		}
		fmt.Printf("%s: render(%q) lines=%d (want %d)\n", status, c.input, got, c.expectedLines)
	}
	if allPass {
		fmt.Println("all pass")
	}
}

func splitByNewline(s string) []string {
	var result []string
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '\n' {
			result = append(result, s[start:i])
			start = i + 1
		}
	}
	result = append(result, s[start:])
	return result
}
```

**Expected output:**
```
OK: render("") lines=0 (want 0)
OK: render("\n") lines=1 (want 1)
OK: render("\n\n") lines=2 (want 2)
all pass
```
