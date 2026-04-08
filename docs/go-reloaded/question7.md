### Question 7

You implement the single-quote rule: `' awesome '` → `'awesome'`. It works on the sample input. Then your auditor tests it with:

```
"As Elton John said: ' I am the most well-known homosexual in the world '"
```

Your output incorrectly puts the closing `'` after `world'` with a space before it.

**Trace the bug. What assumption did your implementation make about single quotes that broke on multi-word input? How do you fix it — and how do you test that the fix works for both the one-word and multi-word cases?**
