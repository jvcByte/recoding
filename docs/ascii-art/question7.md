## Drill 8 — Validate Input Characters

Write a function `validateInput(input string) error` that returns an error if any character is outside printable ASCII range 32–126.

**Requirements:**
- Allow the literal two-character sequence `\n` (backslash + n) — treat it as valid
- All other characters must be in the range 32–126 (inclusive)
- Return `nil` for valid input, a non-nil error otherwise

**Starter:**
```go
package main

import "fmt"

func validateInput(input string) error {
	// TODO: implement
	return nil
}

func main() {
	cases := []struct {
		input string
		valid bool
	}{
		{"Hello", true},
		{`Hello\nThere`, true},
		{"café", false},
		{"Hello\tThere", false},
		{"", true},
	}

	allPass := true
	for _, c := range cases {
		err := validateInput(c.input)
		ok := err == nil
		status := "OK"
		if ok != c.valid {
			status = "FAIL"
			allPass = false
		}
		fmt.Printf("%s: validateInput(%q) valid=%v\n", status, c.input, ok)
	}
	if allPass {
		fmt.Println("all pass")
	}
}
```

**Expected output:**
```
OK: validateInput("Hello") valid=true
OK: validateInput("Hello\\nThere") valid=true
OK: validateInput("café") valid=false
OK: validateInput("Hello\tThere") valid=false
OK: validateInput("") valid=true
all pass
```
