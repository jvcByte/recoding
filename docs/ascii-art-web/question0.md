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
