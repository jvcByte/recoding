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
