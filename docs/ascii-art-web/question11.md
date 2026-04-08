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
