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
