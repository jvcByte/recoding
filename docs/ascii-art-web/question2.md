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
