## Drill 6 — Static File Safety Check

Write a function `isStaticPath(urlPath string) bool` that returns `true` only if the cleaned path is a file inside `/static/` (not the directory itself).

**Requirements:**
- Clean the path first with `path.Clean`
- Must start with `/static/`
- Must not equal `/static/` exactly (no directory listing)
- Path traversal attempts that escape `/static/` must return `false`

**Starter:**
```go
package main

import "fmt"

func isStaticPath(urlPath string) bool {
	// TODO: implement
	return false
}

func main() {
	cases := []struct {
		urlPath string
		want    bool
	}{
		{"/static/style.css", true},
		{"/static/app.js", true},
		{"/static/../main.go", false},
		{"/static/../../etc/passwd", false},
		{"/other/file.css", false},
		{"/static/", false},
	}

	allPass := true
	for _, c := range cases {
		got := isStaticPath(c.urlPath)
		status := "OK"
		if got != c.want {
			status = "FAIL"
			allPass = false
		}
		fmt.Printf("%s: isStaticPath(%q) = %v\n", status, c.urlPath, got)
	}
	if allPass {
		fmt.Println("all pass")
	}
}
```

**Expected output:**
```
OK: isStaticPath("/static/style.css") = true
OK: isStaticPath("/static/app.js") = true
OK: isStaticPath("/static/../main.go") = false
OK: isStaticPath("/static/../../etc/passwd") = false
OK: isStaticPath("/other/file.css") = false
OK: isStaticPath("/static/") = false
all pass
```
