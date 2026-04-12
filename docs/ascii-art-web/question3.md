## Drill 4 — Build HTML Response

Write a function `buildResponse(art string) string` that wraps rendered ASCII art in an HTML `<pre>` tag.

**Requirements:**
- Wrap the art string in `<pre>` and `</pre>` tags
- Do not add extra whitespace or newlines around the tags
- An empty art string should still produce `<pre></pre>`

**Starter:**
```go
package main

import "fmt"

func buildResponse(art string) string {
	// TODO: implement
	return ""
}

func main() {
	cases := []struct {
		art  string
		want string
	}{
		{"hello art", "<pre>hello art</pre>"},
		{"", "<pre></pre>"},
		{"line1\nline2", "<pre>line1\nline2</pre>"},
	}

	allPass := true
	for _, c := range cases {
		got := buildResponse(c.art)
		status := "OK"
		if got != c.want {
			status = "FAIL"
			allPass = false
		}
		fmt.Printf("%s: buildResponse(%q) = %q\n", status, c.art, got)
	}
	if allPass {
		fmt.Println("all pass")
	}
}
```

**Expected output:**
```
OK: buildResponse("hello art") = "<pre>hello art</pre>"
OK: buildResponse("") = "<pre></pre>"
OK: buildResponse("line1\nline2") = "<pre>line1\nline2</pre>"
all pass
```
