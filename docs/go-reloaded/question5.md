### Question 6

You run your program on the sample input:

```
it (cap) was the best of times, it was the worst of times (up) , it was the age of foolishness (cap, 6)
```

Your output has `(cap, 6)` correctly uppercasing 6 words — but it's counting the comma as one of the 6 words.

**What went wrong in your word-counting logic? Walk through the bug: where in your code did punctuation get treated as a word, and what specific fix resolves it without breaking the single-word `(cap)` case?**
