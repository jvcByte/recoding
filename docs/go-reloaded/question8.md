### Question 9

Your program passes all your own tests. During the audit, your auditor feeds it a file where a `(low, 5)` modifier appears near the beginning of a sentence — and there are fewer than 5 words before it.

**What does your program do in this case — crash, silently process fewer words, or something else? Walk through what the correct behavior should be according to the spec, and how your implementation handles (or should handle) the boundary condition of `n > available words`.**
