### Question 10

You process punctuation spacing as a final pass after all other transformations. Your auditor runs:

```
Ready, set, go (up) !
```

Your output is `Ready, set, GO !` — the space before `!` wasn't removed.

**Why did the final punctuation pass miss this? What does this reveal about the order in which your transformations run — and what would you need to change in your pipeline so that punctuation cleanup always fires after case transformations, not before?**
