## Drill 1 — Route Dispatch

Write a function `dispatch(method, path string) int` that returns the correct HTTP status code based on the request method and path — without starting a real server.

**Requirements:**
- `GET /` → 200
- `POST /ascii-art` → 200
- Any other method on a known path → 405
- Any unknown path → 404

**Starter:**
```go
package main

import "fmt"

func dispatch(method, path string) int {
	// TODO: implement
	return 0
}

func main() {
	cases := []struct {
		method, path string
		want         int
	}{
		{"GET", "/", 200},
		{"POST", "/", 405},
		{"GET", "/about", 404},
		{"POST", "/ascii-art", 200},
		{"GET", "/ascii-art", 405},
		{"DELETE", "/ascii-art", 405},
	}

	allPass := true
	for _, c := range cases {
		got := dispatch(c.method, c.path)
		status := "OK"
		if got != c.want {
			status = "FAIL"
			allPass = false
		}
		fmt.Printf("%s: dispatch(%q, %q) = %d\n", status, c.method, c.path, got)
	}
	if allPass {
		fmt.Println("all pass")
	}
}
```

**Expected output:**
```
OK: dispatch("GET", "/") = 200
OK: dispatch("POST", "/") = 405
OK: dispatch("GET", "/about") = 404
OK: dispatch("POST", "/ascii-art") = 200
OK: dispatch("GET", "/ascii-art") = 405
OK: dispatch("DELETE", "/ascii-art") = 405
all pass
```
