## Question 6

You're building a few-shot prompt to classify customer feedback as positive, negative, or neutral. You include two examples:

```
Feedback: "I love this product!" → Positive  
Feedback: "It broke after one use." → Negative  
Feedback: [new input]
```

The model classifies *"It works, I guess"* as Positive.

**What went wrong with your few-shot setup? What example was missing, and why does the absence of one category in your examples affect the model's output on ambiguous inputs? Rewrite the few-shot prompt to fix it.**

---
