## Drill 12 — Full Web Handler Simulation

Combine everything into a `simulateRequest(method, path, body string, charMap map[rune][8]string) (int, string)` function that simulates the complete request/response cycle.

**Requirements:**
- Use `dispatch` from Drill 1 to check routing — return 404 or 405 for bad routes/methods
- For `POST /ascii-art`: parse the form body, validate, render, and return 200 with `<pre>` wrapped art
- For `GET /`: return 200 with `"<html>index</html>"`
- All logic must be pure — no server, no file I/O (charMap is passed in)

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

func dispatch(method, path string) int {
	// TODO: implement (copy from Drill 1)
	return 0
}

func parseFormBody(body string) map[string]string {
	// TODO: implement (copy from Drill 2)
	return map[string]string{}
}

func validateInput(text, banner string) (string, int) {
	// TODO: implement (copy from Drill 3)
	return "", 200
}

func simulateRequest(method, path, body string, charMap map[rune][8]string) (int, string) {
	// TODO: implement
	return 0, ""
}

func main() {
	lines := readBannerFromStdin()
	charMap := buildCharMap(lines)

	cases := []struct {
		method, path, body string
		wantCode           int
	}{
		{"GET", "/", "", 200},
		{"POST", "/ascii-art", "text=Hi&banner=standard", 200},
		{"GET", "/missing", "", 404},
		{"DELETE", "/ascii-art", "", 405},
		{"POST", "/ascii-art", "text=&banner=standard", 400},
	}

	allPass := true
	for _, c := range cases {
		code, _ := simulateRequest(c.method, c.path, c.body, charMap)
		status := "OK"
		if code != c.wantCode {
			status = "FAIL"
			allPass = false
		}
		fmt.Printf("%s: %s %s = %d\n", status, c.method, c.path, code)
	}
	if allPass {
		fmt.Println("all pass")
	}
}
```

**Expected output:**
```
OK: GET / = 200
OK: POST /ascii-art = 200
OK: GET /missing = 404
OK: DELETE /ascii-art = 405
OK: POST /ascii-art = 400
all pass
```
