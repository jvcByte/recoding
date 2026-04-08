## Drill 5 — Display Result in the Page

Decide how you display the POST result — either:

**Option A:** Redirect to a result page at `/ascii-art` after POST  
**Option B:** Re-render the home page with the result appended

Whichever you choose, write a Go struct to pass data to your template:

```go
type PageData struct {
    Result string
    Error  string
    Text   string   // preserve user input
    Banner string   // preserve banner selection
}
```

Update your template to display the result:

```html
{{if .Result}}
<pre>{{.Result}}</pre>
{{end}}

{{if .Error}}
<p class="error">{{.Error}}</p>
{{end}}
```

**Requirements:**
- The ASCII art must render in a `<pre>` tag to preserve spacing
- If there is an error, show it clearly on the page
- The user's input and banner selection must be preserved after submission (don't reset the form)

**Test by submitting the form in a browser and confirming the output appears.**

---
