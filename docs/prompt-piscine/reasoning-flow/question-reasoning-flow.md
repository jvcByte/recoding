# Reasoning-Flow — Scenario-Based Re-Coding Questions (Refined Pattern Version)
> Derived strictly from the reasoning-flow quest exercises  
> Format: Scenario-based | Intensity: 10+ questions  
> Rules: Answer each question in your own words. No AI-generated responses.

---

## Question 1

Your AI tutoring platform returns correct answers but no explanations. Different engineers try adding:

> *"Explain your reasoning."*

Some outputs become too long. Others remain shallow.

**What is the structural flaw in this instruction as a reusable reasoning pattern? Rewrite it into a structured prompt template that enforces step-by-step reasoning with controlled verbosity. Identify each component you added and explain how it prevents either missing or excessive reasoning.**

---

## Question 2

You design a reasoning template for logic puzzles. It works well for simple comparisons (e.g., age relationships), but fails on puzzles involving multiple constraints and conditions.

**Does this mean your reasoning pattern failed—or that it lacks abstraction? What is the difference between a reasoning pattern that is reusable versus one that is scalable across complexity? Modify your template to handle both simple and complex logic puzzles without breaking structure.**

---

## Question 3

You are comparing two prompts in production:
- Prompt A: No reasoning
- Prompt B: Includes step-by-step reasoning

Initial tests show Prompt B performs better.

**Design a proper experiment to validate this claim. What metrics would you use beyond accuracy, and what types of test cases would expose weaknesses in each prompt? Why is a single example insufficient to prove reasoning effectiveness?**

---

## Question 4

A financial AI assistant calculates percentages but occasionally produces wrong outputs due to skipped steps.

You add:

> *"Solve step by step."*

Errors reduce but don’t disappear.

**What assumption about reasoning correctness is flawed here? Rewrite the prompt to include a mandatory verification stage. What exact instruction ensures the model checks its own work instead of blindly proceeding?**

---

## Question 5

A student receives inconsistent explanations for the same math problem. Sometimes the model explains clearly, sometimes it jumps steps.

**What does this reveal about output structure vs instruction intent? Design a fixed response format that forces the model to: restate, decompose, solve, and verify. Explain how each section contributes to consistency across outputs.**

---

## Question 6

Your system produces correct answers with flawed reasoning steps. Students begin to trust incorrect logic.

**What hidden risk does this create in reasoning-based systems? Design a prompt that introduces a self-correction loop. What specific instruction forces the model to detect and fix its own reasoning errors before presenting the final answer?**

---

## Question 7

You are building an automated grader for reasoning quality. Two outputs:
- Output A: Correct answer, weak reasoning
- Output B: Incorrect answer, strong reasoning structure

**Which is better—and why? Define a scoring rubric with at least 3 criteria that evaluates reasoning independently from correctness. What does each criterion measure?**

---

## Question 8

A junior engineer uses:

> *"Solve this problem."*

Outputs vary wildly in reasoning depth and clarity.

**What structural elements are missing from this prompt? Rewrite it as a reusable reasoning template. For each added component, explain exactly what inconsistency it eliminates.**

---

## Question 9

In a coding prep tool, the model often jumps straight to code even when reasoning is required first.

**What prompt design flaw allows this behavior? Create a prompt that strictly separates: (1) algorithm reasoning and (2) implementation. What instruction prevents the model from skipping directly to code?**

---

## Question 10

You are tasked with building a general-purpose reasoning framework that works for:
- Math problems
- Logic puzzles
- Coding tasks

**What core structure must remain constant across all domains? What parts must remain flexible? Design a generalized reasoning template and explain how it adapts without losing consistency.**

---

## Question 11

Users report that the same prompt produces different reasoning paths for identical inputs.

**Does this indicate a failure in the prompt—or a property of the model? What techniques can you apply at the prompt level to improve consistency without eliminating useful variation?**

---

## Question 12

Your chatbot must respond quickly, but reasoning prompts increase latency and token usage.

**What trade-off does this introduce in production systems? Redesign your reasoning prompt to minimize token usage while preserving essential logic. What parts of the reasoning process can be compressed without losing meaning?**

---

## Question 13

A factorial prompt works for small inputs but skips steps for larger numbers.

**What scalability limitation of step-by-step prompting is exposed here? Modify the prompt to enforce consistent iteration regardless of input size. What instruction ensures no steps are skipped?**

---

## Question 14

Adding:

> *"Let’s think step by step"*

improves accuracy but creates overly verbose outputs.

**Why does this happen? Propose a refined instruction that preserves accuracy while limiting unnecessary explanation. What distinguishes essential reasoning from redundant detail in your design?**

---

## Question 15

An educational tool wants to show both correct and incorrect reasoning paths.

A naive prompt produces confusing outputs where users can’t tell which is which.

**What structural separation is missing? Design a prompt that clearly distinguishes: (1) correct reasoning, (2) incorrect reasoning, and (3) explanation of the difference. Why is this separation critical for learning?**

---

## Reflection Prompt (Bonus)

Across all exercises, reasoning prompts improved accuracy but introduced issues like verbosity, inconsistency, and hidden errors.

**What does an “ideal reasoning prompt” look like as a reusable pattern? Define its structure, constraints, and failure points. In what scenario would enforcing reasoning actually reduce performance or usability?**

---

*All answers must be written in your own words. Responses identified as AI-generated will be rejected.*
