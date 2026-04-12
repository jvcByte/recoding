## Drill 9 — Render Template to String

Write a function `renderTemplate(data PageData) (string, error)` that executes an HTML template into a string buffer and returns the result.

**Requirements:**
- Use `html/template` to parse and execute the template
- Render into a `strings.Builder`, not directly to a writer
- Return the rendered string and any error
- The template string is provided — do not change it

**Starter:**
```go
package main

import "fmt"

const tmpl = `<pre>{{.Result}}</pre>{{if .Error}}<p>{{.Error}}</p>{{end}}`

type PageData struct {
	Result string
	Error  string
}

func renderTemplate(data PageData) (string, error) {
	// TODO: implement
	return "", nil
}

func main() {
	out, err := renderTemplate(PageData{Result: "hello art"})
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(out)

	out2, err := renderTemplate(PageData{Error: "text is empty"})
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	fmt.Println(out2)
}
```

**Expected output:**
```
<pre>hello art</pre>
<pre></pre><p>text is empty</p>
```
