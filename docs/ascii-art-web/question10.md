## Drill 11 — Handler Logic (Pure Function)

Write a function `handlePost(text, banner string, charMap map[rune][8]string) (int, string)` that simulates the complete POST handler logic as a pure function.

**Requirements:**
- Validate `text` and `banner` using the rules from Drill 3
- On invalid input: return the appropriate 4xx status code and error message
- On valid input: render the art and return `200` with the HTML-wrapped result
- Do not start a server — this is pure logic only

**Starter:**
```go
package main

import (
	"bufio"
	"fmt"
	"os"
)

func readBannerFromStdin() []string {
	// TODO: implement (copy from Drill 10)
	return nil
}

func buildCharMap(lines []string) map[rune][8]string {
	// TODO: implement (copy from Drill 10)
	return nil
}

func renderLine(text string, charMap map[rune][8]string) [8]string {
	// TODO: implement (copy from Drill 10)
	return [8]string{}
}

func validateInput(text, banner string) (string, int) {
	// TODO: implement (copy from Drill 3)
	return "", 200
}

func handlePost(text, banner string, charMap map[rune][8]string) (int, string) {
	// TODO: implement
	return 0, ""
}

func main() {
	lines := readBannerFromStdin()
	charMap := buildCharMap(lines)

	cases := []struct {
		text, banner string
		wantCode     int
	}{
		{"Hi", "standard", 200},
		{"", "standard", 400},
		{"hello", "unknown", 400},
	}

	allPass := true
	for _, c := range cases {
		code, body := handlePost(c.text, c.banner, charMap)
		status := "OK"
		if code != c.wantCode {
			status = "FAIL"
			allPass = false
		}
		preview := body
		if len(preview) > 20 {
			preview = preview[:20] + "..."
		}
		fmt.Printf("%s: handlePost(%q, %q) = %d %q\n", status, c.text, c.banner, code, preview)
	}
	if allPass {
		fmt.Println("all pass")
	}
}
```

**Expected output:**
```
OK: handlePost("Hi", "standard") = 200 "<pre> _   _   _  ..."
OK: handlePost("", "standard") = 400 "text is empty"
OK: handlePost("hello", "unknown") = 400 "invalid banner: unknown"
all pass
```
