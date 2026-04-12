## Drill 3 — Split Input on Literal `\n`

Write a function `splitInput(input string) []string` that splits a string on the two-character sequence `\n` (backslash + n), not a real newline byte.

**Requirements:**
- Split on the literal two-character string `\n` (not a newline character)
- Return all segments including empty ones

**Starter:**
```go
package main

import "fmt"

func splitInput(input string) []string {
	// TODO: implement
	return nil
}

func main() {
	cases := []struct {
		input    string
		expected int
	}{
		{`Hello`, 1},
		{`Hello\nThere`, 2},
		{`Hello\n\nThere`, 3},
		{`\n`, 2},
		{``, 1},
	}

	allPass := true
	for _, c := range cases {
		got := splitInput(c.input)
		if len(got) != c.expected {
			fmt.Printf("FAIL: splitInput(%q) = %d segments, want %d\n", c.input, len(got), c.expected)
			allPass = false
		}
	}
	if allPass {
		fmt.Println("OK")
	}
}
```

**Expected output:**
```
OK
```
