# Prompt-Basics — Scenario-Based Re-Coding Questions
> Derived strictly from the prompt-basics quest exercises
> Format: Scenario-based | Intensity: 10+ questions
> Rules: Answer each question in your own words. No AI-generated responses.

---

## Question 1

You're asked to build a customer support tool. Your first prompt is:

> *"Help the customer."*

The model responds with a generic paragraph about how it's happy to assist. The client is unhappy — the output is useless for their actual support workflow.

**Using the anatomy of a prompt (system, user, assistant messages), redesign this prompt from scratch. What goes in the system message, what goes in the user message, and why does the separation matter for getting a consistent, useful output?**

---

## Question 2

A junior developer on your team writes this prompt:

> *"Tell me about machine learning."*

They get a 500-word essay. They wanted a 3-line definition for a README file.

**This is the exact vague-to-precise problem Exercise 2 targets. Walk through the refinement step by step — at least three iterations — until the prompt reliably produces what was actually needed. Explain what you changed at each step and why.**

---

## Question 3

You run the same prompt twice on a model with temperature set to 0.9:

- **Run 1:** The model gives a creative, slightly off-topic answer.
- **Run 2:** The model gives a different creative answer that contradicts Run 1.

Your manager says: *"Just lower the temperature."* You set it to 0.2. Now both runs give nearly identical answers — but the output feels rigid and misses edge cases your prompt was designed to explore.

**What is the actual trade-off temperature controls — not just "more random vs. less random," but what it means for reliability, use case fit, and output trust? When is 0.9 the right choice and when is 0.2?**

---

## Question 4

You're designing a prompt for a medical information tool. The system message says:

> *"You are a helpful assistant."*

The user message asks about drug interactions. The model answers confidently — but includes a fabricated interaction that doesn't exist.

**What role should the system message be playing here that it isn't? Rewrite the system message to anchor the model's behavior for this specific use case. What does a well-designed system message actually control that a user message alone cannot?**

---

## Question 5

Exercise 1 asks you to compare a **direct instruction prompt** versus a **question-style prompt** for the same topic.

You test:
- *"List three benefits of Python for AI development."*
- *"What are the benefits of Python for AI development?"*

The outputs look almost the same to you. You conclude: *"There's no real difference."*

**Is that conclusion correct? What should you actually be comparing — not just surface content, but structure, tone, implied format, and what each prompt style signals to the model about what kind of response is expected?**

---

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

## Question 7

You set top-p to 0.5 for a creative writing task. The outputs feel repetitive and safe — the model keeps using the same sentence structures. You switch to top-p = 1.0 and the outputs become more varied but occasionally incoherent.

**Explain in plain terms what top-p is actually doing differently from temperature — they both affect output variation, but they work on different things. What is each parameter controlling, and when would you adjust one but not the other?**

---

## Question 8

A teammate argues: *"Zero-shot prompting is always better because it forces the model to reason on its own without being led by examples."*

You've just finished Exercise 1 and Exercise 2, which both involve observing how structure affects output.

**Is your teammate right? Build a specific counter-example where zero-shot fails and few-shot fixes it — and explain what the examples in a few-shot prompt are actually doing for the model that an instruction alone cannot.**

---

## Question 9

You're submitting Exercise 3. The requirement says: *"Record how the style, randomness, and focus of responses change."*

You run both temperature values, copy the outputs, and write: *"Temperature 0.2 was more focused. Temperature 0.9 was more creative."*

**That observation is accurate but shallow. What would a genuinely useful analysis of the same outputs look like? What specific things should you be recording — beyond just "focused vs. creative" — to actually understand how the parameter is shaping the model's behavior?**

---

## Question 10

You're refining a prompt for Exercise 2. After four iterations, your prompt is long, detailed, and highly specific. The output is now exactly what you wanted.

Then you test it on a slightly different input — and the overly specific instructions cause the model to break, producing a confused or off-topic response.

**What does this reveal about the relationship between prompt precision and prompt robustness? How do you write a prompt that is specific enough to be useful but general enough to not collapse on variation? What's the design principle at play?**

---

## Question 11

You're comparing two prompts for Exercise 1:

- **Prompt A:** *"List three programming languages."*
- **Prompt B:** *"List three programming languages used in machine learning, with one sentence on why each is popular."*

Prompt A gives a clean list. Prompt B gives a structured, more useful answer.

**The exercise asks you to compare how the model answers each type — but the real question is: what did you as the prompt writer actually control by adding specificity? Map out exactly which parts of Prompt B changed the model's output and why each addition mattered.**

---

## Question 12

It's your first week at a company. You're asked to document the prompt structure used for the internal AI tool so new team members can maintain it. The system message, user message format, temperature setting, and few-shot examples are all tangled together in a single undocumented script.

**Using everything from prompt-basics — anatomy, prompt types, parameters — write a brief documentation structure for this tool. What does each section need to explain, and why does clean prompt documentation matter in a production environment the same way code documentation does?**

---

## Reflection Prompt (Bonus)

The submission requirement says: *"a brief sentence analysis highlighting differences in output, clarity, or behavior."*

After doing all three exercises, you realize your first analysis was mostly description — you noted *what* changed but not *why*.

**What's the difference between describing a prompt output and analyzing it? Write a one-paragraph example of a weak analysis and a strong analysis of the same pair of outputs — then explain what makes the second one genuinely useful.**

---

*All answers must be written in your own words. Responses identified as AI-generated will be rejected.*
