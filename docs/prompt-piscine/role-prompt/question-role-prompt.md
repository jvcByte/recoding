# Role-Prompts — Scenario-Based Re-Coding Questions
> Derived strictly from the role-prompts quest exercises  
> Format: Scenario-based | Intensity: 10+ questions  
> Rules: Answer each question in your own words. No AI-generated responses.

---

## Question 1

Your team uses this prompt in a learning app:

> *"Explain climate change."*

Different users report wildly different tones—some responses are too technical, others too casual.

**What is the structural issue with this prompt from a role-design perspective? Rewrite it as a role-based template that ensures consistent tone and perspective. Identify each role-related component you added and explain how it controls output style.**

---

## Question 2

You design three role prompts:
- Scientist
- Journalist
- Critic

They work well for a simple topic but break down when applied to a complex technical subject.

**Does this mean role prompting failed—or that roles need better definition? What is the difference between a loosely defined persona and a well-scoped role? Refine one of the roles to handle both simple and complex topics consistently.**

---

## Question 3

You are testing role-based prompts in production. The same question is asked under three roles, but outputs overlap in tone and structure.

**What does this reveal about weak role separation? Design an experiment to evaluate how distinct each role output truly is. What criteria would you use to measure role differentiation?**

---

## Question 4

A student writes:

> *"Act like a scientist and explain climate change."*

The output is still too general and lacks technical depth.

**What assumption about role prompting is flawed here? Rewrite the prompt to enforce not just role identity but also depth, vocabulary, and perspective. What specific instructions ensure the role is actually followed?**

---

## Question 5

You are building a mentoring system where the model reviews student code. The current prompt:

> *"Fix this code."*

Students get blunt corrections with no explanation.

**How would you redesign this using a mentor role? What structural elements ensure the feedback is constructive, explanatory, and aligned with teaching rather than just fixing?**

---

## Question 6

A mentor-style prompt produces helpful explanations—but sometimes adds unnecessary praise or overly long feedback.

**What trade-off between tone and efficiency is being exposed? Modify the prompt to keep feedback supportive but concise. What instruction controls tone without inflating response length?**

---

## Question 7

You compare two prompts for code review:
- Prompt A: *"Fix this function."*
- Prompt B: *"Act as a senior developer reviewing this code. Provide corrections and explain improvements."*

Both fix the issue, but Prompt B provides richer feedback.

**Why is the role instruction critical here? Define the structural difference between task-only prompts and role-based prompts, and how that impacts reasoning and explanation quality.**

---

## Question 8

A junior developer writes:

> *"Act as a mentor."*

The outputs are inconsistent—sometimes strict, sometimes friendly.

**What key role elements are missing? Rewrite this into a reusable mentoring template that ensures consistent tone, depth, and structure. Explain how each addition reduces ambiguity.**

---

## Question 9

In Exercise 3, you generate two outputs for the same email task:
- Friendly tone
- Professional tone

The content differs significantly, not just the tone.

**What mistake in prompt design caused this? How do you separate *content constraints* from *tone instructions* so that only style changes while meaning stays consistent?**

---

## Question 10

You are asked to design a reusable tone-control prompt that works across multiple tasks (emails, explanations, feedback).

**What core structure must remain constant, and what elements should be adjustable? Build a generalized tone template and explain how it adapts without losing consistency.**

---

## Question 11

Users report that role-based outputs vary too much between sessions, even with the same prompt.

**What does this suggest about role specificity? What techniques can you use to make role behavior more consistent without making it rigid or unnatural?**

---

## Question 12

A real-time chatbot must use role prompts (e.g., tutor, assistant), but long role descriptions increase latency.

**What trade-off does this introduce? Redesign the role prompt to be shorter while preserving persona clarity. What details can be compressed without losing role fidelity?**

---

## Question 13

You test a role prompt:

> *"Act as a critic."*

The output becomes overly negative and unhelpful.

**What does this reveal about poorly constrained roles? Modify the prompt to balance critical thinking with constructive feedback. What instruction prevents destructive or biased tone?**

---

## Question 14

A student claims:

> *"Roles only change tone, not the actual content."*

**Using examples from Exercises 1–3, challenge this claim. In what ways do role instructions influence not just tone, but reasoning depth, focus, and structure? Provide a concrete scenario.**

---

## Question 15

You are designing a system that combines roles (e.g., a “friendly tutor” who is also a “strict grader”).

The outputs become inconsistent and conflicting.

**What structural problem arises when combining multiple roles? Design a prompt that resolves role conflicts and clearly prioritizes behavior. Why is role hierarchy important in complex prompts?**

---

## Reflection Prompt (Bonus)

Role prompting allows control over tone, perspective, and behavior—but introduces risks like inconsistency and ambiguity.

**What does an “ideal role prompt” look like as a reusable pattern? Define its structure, constraints, and limitations. Identify one scenario where role prompting could reduce clarity or reliability instead of improving it.**

---

*All answers must be written in your own words. Responses identified as AI-generated will be rejected.*
