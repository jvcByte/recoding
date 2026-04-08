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
