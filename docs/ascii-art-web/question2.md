## Drill 3 — Validate Input

Write a function `validateInput(text, banner string) (string, int)` that returns an error message and HTTP status code for invalid input, or an empty string and 200 for valid input.

**Requirements:**
- Blank/whitespace-only `text` → `("text is empty", 400)`
- Invalid banner name → `("invalid banner: <name>", 400)`
- Valid banners: `"standard"`, `"shadow"`, `"thinkertoy"`
- Non-ASCII character in text (outside 32–126) → `("non-ASCII character in input", 400)`
- The literal two-character sequence `\n` in text is allowed
- Valid input → `("", 200)`

**Starter:**
```go
package main

import "fmt"

func validateInput(text, banner string) (string, int) {
	// TODO: implement
	return "", 200
}

func main() {
	cases := []struct {
		text, banner string
		wantCode     int
	}{
		{"hello", "standard", 200},
		{"", "standard", 400},
		{"   ", "standard", 400},
		{"hello", "banana", 400},
		{"café", "standard", 400},
		{`hello\nworld`, "shadow", 200},
	}

	allPass := true
	for _, c := range cases {
		msg, code := validateInput(c.text, c.banner)
		status := "OK"
		if code != c.wantCode {
			status = "FAIL"
			allPass = false
		}
		fmt.Printf("%s: validateInput(%q, %q) = %d %q\n", status, c.text, c.banner, code, msg)
	}
	if allPass {
		fmt.Println("all pass")
	}
}
```

**Expected output:**
```
OK: validateInput("hello", "standard") = 200 ""
OK: validateInput("", "standard") = 400 "text is empty"
OK: validateInput("   ", "standard") = 400 "text is empty"
OK: validateInput("hello", "banana") = 400 "invalid banner: banana"
OK: validateInput("café", "standard") = 400 "non-ASCII character in input"
OK: validateInput("hello\nworld", "shadow") = 200 ""
all pass
```
