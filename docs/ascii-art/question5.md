## Drill 6 — Handle Empty Segments

Write a function `countOutputLines(input string) int` that returns how many lines would be printed for a given input string.

**Requirements:**
- Empty string `""` → 0 lines (no output)
- Each non-empty segment produces 8 art rows
- An empty segment between two other segments produces 1 blank line
- A trailing empty segment (after the last `\n`) produces no extra line
- Use `splitInput` from Drill 3 to split on literal `\n`

**Starter:**
```go
package main

import "fmt"

func splitInput(input string) []string {
	// TODO: implement (copy from Drill 3)
	return nil
}

func countOutputLines(input string) int {
	// TODO: implement
	return 0
}

func main() {
	cases := []struct {
		input    string
		expected int
	}{
		{"", 0},
		{`\n`, 1},
		{`\n\n`, 2},
		{"A", 8},
		{`A\nB`, 17},
	}

	allPass := true
	for _, c := range cases {
		got := countOutputLines(c.input)
		status := "OK"
		if got != c.expected {
			status = "FAIL"
			allPass = false
		}
		fmt.Printf("%s: countOutputLines(%q) = %d (want %d)\n", status, c.input, got, c.expected)
	}
	if allPass {
		fmt.Println("all pass")
	}
}
```

**Expected output:**
```
OK: countOutputLines("") = 0 (want 0)
OK: countOutputLines("\n") = 1 (want 1)
OK: countOutputLines("\n\n") = 2 (want 2)
OK: countOutputLines("A") = 8 (want 8)
OK: countOutputLines("A\nB") = 17 (want 17)
all pass
```
