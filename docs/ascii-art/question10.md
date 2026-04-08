## Drill 11 — Full Pipeline Integration Check

Run every example from the spec and confirm your output matches exactly:

```bash
go run . "" | cat -e
go run . "\n" | cat -e
go run . "Hello\n" | cat -e
go run . "hello" | cat -e
go run . "HeLlO" | cat -e
go run . "Hello There" | cat -e
go run . "1Hello 2There" | cat -e
go run . "{Hello There}" | cat -e
go run . "Hello\nThere" | cat -e
go run . "Hello\n\nThere" | cat -e
```

For each one:
1. Run your program
2. Run the expected output from the spec through `cat -e`
3. Diff them — zero differences means you pass

Write a shell script `check.sh` that automates all 10 comparisons and reports PASS or FAIL per case.

---

*Write every function yourself. Do not copy. Test locally before moving to the next drill.*
