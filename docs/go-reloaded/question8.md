### Question 8

You process `(hex)` conversion and it works for most inputs. Then your auditor runs:

```
1E (hex) files were added
```

Your program crashes with a parsing error.

**What went wrong? Walk through what `strconv.ParseInt("1E", 16, 64)` actually requires — and what your code likely missed about case sensitivity in hex input. How do you fix it, and what other hex edge cases should you now test for?**
