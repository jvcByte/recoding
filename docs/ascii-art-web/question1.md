## Drill 2 — Parse URL-Encoded Form Body

Write a function `parseFormBody(body string) map[string]string` that parses a URL-encoded form string (the body of a POST request) into a key-value map.

**Requirements:**
- Parse `key=value&key2=value2` format
- URL-decode both keys and values (e.g. `+` → space, `%XX` → character)
- Return a `map[string]string`
- Return an empty map (not nil) on empty input

**Starter:**
```go
package main

import "fmt"

func parseFormBody(body string) map[string]string {
	// TODO: implement
	return map[string]string{}
}

func main() {
	cases := []struct {
		body       string
		wantText   string
		wantBanner string
	}{
		{"text=hello&banner=standard", "hello", "standard"},
		{"text=Hello+There&banner=shadow", "Hello There", "shadow"},
		{"text=&banner=standard", "", "standard"},
		{"banner=thinkertoy", "", "thinkertoy"},
	}

	allPass := true
	for _, c := range cases {
		m := parseFormBody(c.body)
		if m["text"] == c.wantText && m["banner"] == c.wantBanner {
			fmt.Printf("OK: text=%q banner=%q\n", m["text"], m["banner"])
		} else {
			fmt.Printf("FAIL: got text=%q banner=%q, want text=%q banner=%q\n",
				m["text"], m["banner"], c.wantText, c.wantBanner)
			allPass = false
		}
	}
	if allPass {
		fmt.Println("all pass")
	}
}
```

**Expected output:**
```
OK: text="hello" banner="standard"
OK: text="Hello There" banner="shadow"
OK: text="" banner="standard"
OK: text="" banner="thinkertoy"
all pass
```
