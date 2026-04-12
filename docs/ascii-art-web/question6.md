## Drill 7 — HTTP Status Text

Write a function `statusText(code int) string` that returns the standard HTTP reason phrase for a given status code.

**Requirements:**
- Return the correct reason phrase for: 200, 400, 404, 405, 500
- Use the standard Go `net/http` package — do not hardcode strings

**Starter:**
```go
package main

import "fmt"

func statusText(code int) string {
	// TODO: implement
	return ""
}

func main() {
	codes := []int{200, 400, 404, 405, 500}
	for _, code := range codes {
		fmt.Printf("%d %s\n", code, statusText(code))
	}
}
```

**Expected output:**
```
200 OK
400 Bad Request
404 Not Found
405 Method Not Allowed
500 Internal Server Error
```
