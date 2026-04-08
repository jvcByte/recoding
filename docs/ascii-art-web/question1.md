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
