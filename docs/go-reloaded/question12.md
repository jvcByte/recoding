### Question 11

You have 8 transformation rules to implement. Two approaches are on the table:

- **Approach A:** One large function that scans the text and handles every rule in a single pass.
- **Approach B:** A pipeline — separate functions for each rule, applied in sequence.

**Which did you choose — and what are the real trade-offs? Think specifically about: what happens when two rules interact (e.g., `(up)` fires on a word that also needs punctuation cleanup), how easy it is to add a 9th rule later, and how you'd write unit tests for each approach.**
