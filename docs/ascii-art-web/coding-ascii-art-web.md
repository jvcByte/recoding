# ascii-art-web — Hands-On Coding Drills
> Derived strictly from the ascii-art-web project brief
> Builds on top of ascii-art base project
> Format: Small focused coding tasks, build up to full implementation
> Rules: Write every function yourself. Test each drill before moving to the next.
> Standard Go packages only — no external libraries.

---

## Drill 1 — Minimal HTTP Server

Write a Go program that starts an HTTP server on port 8080 and responds to `GET /` with a plain text `"OK"`.

```go
func main() {
    http.HandleFunc("/", handleIndex)
    fmt.Println("Server running at http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

**Requirements:**
- Server must start without errors
- `GET /` returns status `200 OK`
- Any other path returns status `404 Not Found` — not Go's default 404, your own
- Server must not crash on any request

**Test with:**
```bash
curl -i http://localhost:8080/
curl -i http://localhost:8080/nonexistent
```

**Confirm:**
- `200` on `/`
- `404` on anything else
- Server keeps running after both requests

---

## Drill 2 — Serve an HTML Template

Create a `templates/` directory in your project root. Inside it, create `index.html`:

```html
<!DOCTYPE html>
<html>
<head><title>ASCII Art</title></head>
<body>
    <h1>ASCII Art Generator</h1>
</body>
</html>
```

Now write a handler that serves it using Go's `html/template` package:

```go
func handleIndex(w http.ResponseWriter, r *http.Request) {
    // only handle GET /
    // return 404 if path != "/"
    // return 405 if method != GET
    // parse and execute the template
    // return 500 if template fails
}
```

**Requirements:**
- Use `template.ParseFiles("templates/index.html")`
- Return `404` if the template file is missing
- Return `500` if template execution fails
- Return `405 Method Not Allowed` if a non-GET request hits this route

**Test with:**
```bash
curl -i http://localhost:8080/
curl -i -X POST http://localhost:8080/
curl -i http://localhost:8080/about
```

---

## Drill 3 — Build the HTML Form

Extend `index.html` to include the three required UI elements:

1. A `<textarea>` or `<input>` for text entry
2. A way to select a banner — radio buttons, `<select>`, or similar
3. A submit button that sends a `POST` to `/ascii-art`

```html
<form action="/ascii-art" method="POST">
    <textarea name="text" placeholder="Enter text here..."></textarea>

    <label>
        <input type="radio" name="banner" value="standard" checked> Standard
    </label>
    <label>
        <input type="radio" name="banner" value="shadow"> Shadow
    </label>
    <label>
        <input type="radio" name="banner" value="thinkertoy"> Thinkertoy
    </label>

    <button type="submit">Generate</button>
</form>
```

**Requirements:**
- The `name` attribute on inputs must match exactly what your Go handler will read
- Form must use `method="POST"` and `action="/ascii-art"`
- All three banners must be selectable
- Default selection must be one of the three valid banners

**Test by opening `http://localhost:8080` in a browser and confirming the form renders.**

---

## Drill 4 — Handle POST `/ascii-art`

Write the POST handler:

```go
func handleAsciiArt(w http.ResponseWriter, r *http.Request) {
    // return 405 if method != POST
    // parse form data
    // extract "text" and "banner" fields
    // validate both fields
    // return 400 if either is missing or invalid
    // load the banner file
    // return 404 if banner file not found
    // render the ASCII art
    // return 500 if rendering fails
    // display result
}
```

**Status code rules — apply exactly:**
| Situation | Code |
|---|---|
| Method is not POST | 405 |
| `text` field missing or empty | 400 |
| `banner` field not one of three valid values | 400 |
| Banner `.txt` file not found on disk | 404 |
| Template missing or execution fails | 500 |
| Everything succeeds | 200 |

**Test with:**
```bash
curl -i -X POST http://localhost:8080/ascii-art \
  -d "text=hello&banner=standard"

curl -i -X POST http://localhost:8080/ascii-art \
  -d "text=&banner=standard"          # → 400

curl -i -X POST http://localhost:8080/ascii-art \
  -d "text=hello&banner=banana"       # → 400

curl -i -X GET http://localhost:8080/ascii-art  # → 405
```

---

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

## Drill 6 — Validate and Sanitize Input

Write a Go function:

```go
func validateInput(text string, banner string) error
```

- Returns nil if both fields are valid
- Returns a descriptive error if:
  - `text` is empty after trimming whitespace
  - `banner` is not `"standard"`, `"shadow"`, or `"thinkertoy"`
  - `text` contains characters outside printable ASCII (32–126) and literal `\n`

**Test cases:**
```go
validateInput("hello", "standard")     → nil
validateInput("", "standard")          → error: text is empty
validateInput("hello", "banana")       → error: invalid banner
validateInput("café", "standard")      → error: non-ASCII character
validateInput("hello\nworld", "shadow") → nil  ← literal \n is allowed
```

**Why sanitize:** your server is public — never pass raw user input directly to file operations or template rendering without checking it first.

---

## Drill 7 — Serve Static Files (Optional CSS)

Create a `static/` directory and add a basic `style.css`:

```css
body { font-family: monospace; padding: 2rem; }
pre  { background: #f4f4f4; padding: 1rem; overflow-x: auto; }
```

Register a static file server in Go:

```go
fs := http.FileServer(http.Dir("static"))
http.Handle("/static/", http.StripPrefix("/static/", fs))
```

Link it in your HTML:
```html
<link rel="stylesheet" href="/static/style.css">
```

**Requirements:**
- `GET /static/style.css` returns `200` with correct `Content-Type: text/css`
- `GET /static/nonexistent.css` returns `404`
- Static server must not expose files outside the `static/` directory

**Test with:**
```bash
curl -i http://localhost:8080/static/style.css
curl -i http://localhost:8080/static/../main.go   # must NOT serve your source
```

---

## Drill 8 — HTTP Status Code Compliance Test

Write a test file `server_test.go` using Go's `net/http/httptest` package:

```go
func TestGetIndex(t *testing.T)               // GET / → 200
func TestGetIndexWrongPath(t *testing.T)      // GET /about → 404
func TestPostIndexNotAllowed(t *testing.T)    // POST / → 405
func TestPostAsciiArtValid(t *testing.T)      // POST /ascii-art valid data → 200
func TestPostAsciiArtEmptyText(t *testing.T)  // POST /ascii-art empty text → 400
func TestPostAsciiArtBadBanner(t *testing.T)  // POST /ascii-art invalid banner → 400
func TestGetAsciiArtNotAllowed(t *testing.T)  // GET /ascii-art → 405
```

**Use `httptest.NewRecorder()` to test handlers without starting a real server:**

```go
func TestGetIndex(t *testing.T) {
    req := httptest.NewRequest(http.MethodGet, "/", nil)
    w := httptest.NewRecorder()
    handleIndex(w, req)
    if w.Code != http.StatusOK {
        t.Errorf("expected 200, got %d", w.Code)
    }
}
```

---

## Drill 9 — Missing Template Returns 500

Delete or rename `templates/index.html` temporarily. Confirm your server returns `500 Internal Server Error` instead of crashing.

Write a test:

```go
func TestMissingTemplateReturns500(t *testing.T) {
    // temporarily point template path to a nonexistent file
    // make a GET / request
    // confirm status code is 500
    // confirm server did not panic
}
```

**Why this matters:** a missing template is a server-side failure, not a client error. It must be `500`, not `404`, and it must never crash the server.

---

## Drill 10 — README.md

Create `README.md` in the project root with exactly these four sections, filled in with real content:

```markdown
# ASCII Art Web

## Description
A web-based ASCII art generator built in Go. Users can enter text and select
a banner style to generate ASCII art rendered in the browser.

## Authors
- [Your name]

## Usage
### How to run
```bash
git clone <repo>
cd ascii-art-web
go run .
# Open http://localhost:8080 in your browser
```

## Implementation Details: Algorithm
1. User submits text and banner selection via HTML form (POST /ascii-art)
2. Server validates input — rejects empty text, invalid banners, non-ASCII characters
3. Server loads the selected banner file from disk
4. Input is split on literal `\n` into segments
5. Each segment is rendered by looking up each character's 8-line art from the banner map
6. Rendered rows are joined and returned to the browser inside a `<pre>` tag
```

**Requirements from the spec — all four sections must be present:**
- Description
- Authors
- Usage: how to run
- Implementation details: algorithm

---

## Drill 11 — Edge Case Gauntlet

Write a test file `web_edge_test.go`:

```go
func TestEmptyTextReturns400(t *testing.T)        // POST with text="" → 400
func TestWhitespaceOnlyTextReturns400(t *testing.T) // POST with text="   " → 400
func TestNewlineInputRendersCorrectly(t *testing.T) // POST with text="hello\nworld" → 200, two blocks
func TestAllThreeBannersWork(t *testing.T)         // POST standard, shadow, thinkertoy → all 200
func TestNonASCIICharacterReturns400(t *testing.T) // POST with text="café" → 400
func TestLargeInputReturns200(t *testing.T)        // POST with long valid string → 200
func TestUnknownRouteReturns404(t *testing.T)      // GET /banana → 404
func TestFormPreservesInput(t *testing.T)          // after POST, user input is still in form
```

Run with:
```bash
go test ./...
```

---

## Drill 12 — Full Browser Acceptance Check

Manually test all of the following in a real browser — automated tests can't fully replace this:

| Test | Expected |
|---|---|
| Open `http://localhost:8080` | Page loads, form visible |
| Submit `"hello"` with standard | ASCII art of "hello" appears in `<pre>` |
| Submit `"Hello There!"` with shadow | Shadow-style art appears |
| Submit `"Hello There!"` with thinkertoy | Thinkertoy-style art appears |
| Submit empty text | Error message shown, no crash |
| Submit text with emoji or accented char | Error message shown, no crash |
| Submit `"hello\nworld"` | Two separate ASCII art blocks appear |
| Resize browser window | Page remains usable |
| Open `http://localhost:8080/nonexistent` | 404 page shown |

Document each result with a tick or note in your README under a **Testing** subsection.

---

*Write every function yourself. Do not copy. Test locally before moving to the next drill.*
