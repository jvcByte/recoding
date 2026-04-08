## Drill 6 — Full Single-Banner Render

Wire Drills 1–5 together into a working program that:

1. Takes one argument (the input string)
2. Loads `standard.txt` banner
3. Splits input on `\n`
4. For each segment:
   - If empty → print one blank line
   - If not empty → render 8 rows and print them
5. Outputs to stdout

**Test with all spec examples:**
```bash
go run . "Hello" | cat -e
go run . "Hello\nThere" | cat -e
go run . "Hello\n\nThere" | cat -e
go run . "" | cat -e
go run . "\n" | cat -e
```

Your output must match the spec exactly — including trailing spaces on each row.

---
