## Drill 5 — Sanitize File Path

Write a function `sanitizePath(p string) string` that cleans a URL path to prevent directory traversal attacks.

**Requirements:**
- Use `path.Clean` to normalize the path
- The result must always start with `/`
- Remove any `..` components
- Remove duplicate slashes

**Starter:**
```go
package main

import "fmt"

func sanitizePath(p string) string {
	// TODO: implement
	return ""
}

func main() {
	cases := []struct {
		input string
		want  string
	}{
		{"/static/style.css", "/static/style.css"},
		{"/static/../main.go", "/main.go"},
		{"/static/../../etc/passwd", "/etc/passwd"},
		{"//double//slash", "/double/slash"},
		{"/normal/path", "/normal/path"},
	}

	allPass := true
	for _, c := range cases {
		got := sanitizePath(c.input)
		status := "OK"
		if got != c.want {
			status = "FAIL"
			allPass = false
		}
		fmt.Printf("%s: sanitizePath(%q) = %q\n", status, c.input, got)
	}
	if allPass {
		fmt.Println("all pass")
	}
}
```

**Expected output:**
```
OK: sanitizePath("/static/style.css") = "/static/style.css"
OK: sanitizePath("/static/../main.go") = "/main.go"
OK: sanitizePath("/static/../../etc/passwd") = "/etc/passwd"
OK: sanitizePath("//double//slash") = "/double/slash"
OK: sanitizePath("/normal/path") = "/normal/path"
all pass
```
