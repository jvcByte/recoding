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
