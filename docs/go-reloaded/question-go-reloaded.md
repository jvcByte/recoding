# go-reloaded — Scenario-Based Re-Coding Questions
> Derived strictly from the go-reloaded project brief
> Format: Scenario-based | Tests: Implementation decisions, Debugging & problem-solving, Design thinking
> Rules: Answer each question in your own words. No AI-generated responses.

---

## 🔧 Implementation Decisions

*Why you built it this way.*

---

### Question 1

Your program receives two arguments: an input filename and an output filename. You read the input file, process it, and write to the output.

A classmate reads the entire file into memory as one string and processes it all at once. You consider reading it line by line instead.

**Which approach did you choose — and why? What are the trade-offs between whole-file-in-memory vs line-by-line for a text transformation tool like this? What breaks in each approach when the input file is very large?**

---

### Question 2

You need to handle `(up)`, `(low)`, and `(cap)` — each with an optional number modifier like `(up, 3)`.

**Walk through your implementation decision: did you handle the simple case `(up)` and the numbered case `(up, 3)` in the same code path or separately? What made that the right call? What would break if you tried to force both into a single handler?**

---

### Question 3

The spec says `(hex)` and `(bin)` should replace the word **before** them with its decimal conversion. The word before is always guaranteed to be a valid hex or binary number.

**How did you locate "the word before" in your implementation? Did you split the string, use an index, scan backwards? Walk through your exact approach and explain why it's correct — and where it would fail if the guarantee about valid input was removed.**

---

### Question 4

Rule 8 says: convert `a` to `an` if the next word starts with a vowel or `h`.

But the rule says *every instance of `a`* — not just standalone `a`. So `"a amazing"` → `"an amazing"`, but what about `"a hard-boiled egg"` or `"a hour"`?

**How did you define "a" in your implementation — exact match only, or something broader? What edge cases did you have to consciously decide to include or exclude, and how does your code enforce that decision?**

---

### Question 5

Your program must handle punctuation spacing for `.`, `,`, `!`, `?`, `:`, `;` — close to the previous word, space before the next. But grouped punctuation like `...` or `!?` must stay together and be treated as a single unit.

**This is two different rules that look similar. How did you implement both without the grouped-punctuation rule accidentally triggering the single-punctuation rule — or vice versa? What was the order of operations in your processing pipeline, and why does order matter here?**

---

## 🐛 Debugging & Problem-Solving

*What broke and how you fixed it.*

---

### Question 6

You run your program on the sample input:

```
it (cap) was the best of times, it was the worst of times (up) , it was the age of foolishness (cap, 6)
```

Your output has `(cap, 6)` correctly uppercasing 6 words — but it's counting the comma as one of the 6 words.

**What went wrong in your word-counting logic? Walk through the bug: where in your code did punctuation get treated as a word, and what specific fix resolves it without breaking the single-word `(cap)` case?**

---

### Question 7

You implement the single-quote rule: `' awesome '` → `'awesome'`. It works on the sample input. Then your auditor tests it with:

```
"As Elton John said: ' I am the most well-known homosexual in the world '"
```

Your output incorrectly puts the closing `'` after `world'` with a space before it.

**Trace the bug. What assumption did your implementation make about single quotes that broke on multi-word input? How do you fix it — and how do you test that the fix works for both the one-word and multi-word cases?**

---

### Question 8

You process `(hex)` conversion and it works for most inputs. Then your auditor runs:

```
1E (hex) files were added
```

Your program crashes with a parsing error.

**What went wrong? Walk through what `strconv.ParseInt("1E", 16, 64)` actually requires — and what your code likely missed about case sensitivity in hex input. How do you fix it, and what other hex edge cases should you now test for?**

---

### Question 9

Your program passes all your own tests. During the audit, your auditor feeds it a file where a `(low, 5)` modifier appears near the beginning of a sentence — and there are fewer than 5 words before it.

**What does your program do in this case — crash, silently process fewer words, or something else? Walk through what the correct behavior should be according to the spec, and how your implementation handles (or should handle) the boundary condition of `n > available words`.**

---

### Question 10

You process punctuation spacing as a final pass after all other transformations. Your auditor runs:

```
Ready, set, go (up) !
```

Your output is `Ready, set, GO !` — the space before `!` wasn't removed.

**Why did the final punctuation pass miss this? What does this reveal about the order in which your transformations run — and what would you need to change in your pipeline so that punctuation cleanup always fires after case transformations, not before?**

---

## 🏗️ Design Thinking

*Architecture, trade-offs, pattern choices.*

---

### Question 11

You have 8 transformation rules to implement. Two approaches are on the table:

- **Approach A:** One large function that scans the text and handles every rule in a single pass.
- **Approach B:** A pipeline — separate functions for each rule, applied in sequence.

**Which did you choose — and what are the real trade-offs? Think specifically about: what happens when two rules interact (e.g., `(up)` fires on a word that also needs punctuation cleanup), how easy it is to add a 9th rule later, and how you'd write unit tests for each approach.**

---

### Question 12

The spec says to use only standard Go packages. You need to do string manipulation, file I/O, number base conversion, and pattern matching.

**Map out which standard Go packages you used for which rules — and for at least one rule, explain why you chose that package's approach over writing the logic manually. What does the standard library give you that a hand-rolled solution might get wrong?**

---

### Question 13

Your auditor is another student. The spec says: *"We advise you to create your own tests for yourself and for when you will correct your auditees."*

You need to write tests that are genuinely useful — not just the four sample inputs from the spec.

**Design a test suite for go-reloaded. What categories of input would you test beyond the given samples? List at least 6 specific test cases — including at least two that target interactions between rules (e.g., a word that needs both `(cap)` and punctuation cleanup) — and explain what each one is designed to catch.**

---

### Question 14

The spec guarantees that when `(hex)` or `(bin)` is used, the word before it will always be a valid number in that base. But in a real production tool, you can't make that guarantee.

**Without changing the spec's required behavior for valid inputs, how would you design your error handling for invalid inputs? What should the program output, exit with, or log — and how does Go's idiomatic error handling pattern (`if err != nil`) shape the way you structure this decision across your codebase?**

---

## Reflection Prompt (Bonus)

After completing go-reloaded, you look back at your code. You notice that the section handling `(low, n)`, `(up, n)`, and `(cap, n)` is almost identical three times — just with a different string transformation applied.

**What refactoring would eliminate the duplication? Write the signature of a Go function that could replace all three, and explain what you'd pass as an argument to make it work for all cases. What does this refactoring reveal about the design principle your original implementation missed?**

---

*All answers must be written in your own words. Responses identified as AI-generated will be rejected.*
