# Tool-Prompts — Scenario-Based Re-Coding Questions
> Derived strictly from the tool-prompts quest exercises  
> Format: Scenario-based | Intensity: 10+ questions  
> Rules: Answer each question in your own words. No AI-generated responses.

---

## Question 1

Your team uses this prompt:

> *"List three cities with their populations."*

Sometimes the output is a paragraph, sometimes a list, sometimes partially structured.

**What is the structural flaw in this prompt from a tool-integration perspective? Rewrite it as a JSON-enforced template that guarantees machine-readable output. Identify each constraint you added and explain how it ensures consistency.**

---

## Question 2

You enforce JSON output using:

> *"Return the result in JSON."*

It works for some inputs, but occasionally the model adds extra text like:

> *"Here is the JSON:"*

**What does this reveal about weak output constraints? Rewrite the prompt to strictly enforce valid JSON with no extra tokens. What specific instruction prevents formatting violations?**

---

## Question 3

You test your JSON prompt across multiple inputs. It works for simple data but fails when values are missing or ambiguous.

**What assumption about structured output is breaking here? Modify the prompt to handle missing fields without hallucinating values. What rule ensures the model does not invent data?**

---

## Question 4

A developer claims:

> *"JSON formatting is just cosmetic—it doesn’t affect functionality."*

**Using a real-world pipeline scenario, explain why this is incorrect. How does structured output impact parsing, automation, and downstream tool usage? Provide a concrete example where unstructured output breaks a system.**

---

## Question 5

You design a prompt to simulate a weather API:

> *"Simulate a weather response for Lagos."*

The outputs vary in structure and fields.

**What is missing from this prompt? Rewrite it with a strict schema definition. Why is schema specification critical when mimicking API behavior?**

---

## Question 6

Your weather API prompt works for most cities but produces inconsistent units (Celsius vs Fahrenheit).

**What does this reveal about implicit assumptions in tool prompts? Modify the prompt to enforce consistent units and formatting. What instruction ensures standardization across all outputs?**

---

## Question 7

You are chaining prompts:
1. User query
2. API simulation
3. Final response

Sometimes the final response ignores the API output and generates a fresh answer.

**What breakdown in prompt chaining is occurring? How would you enforce dependency between steps so that each stage must use the previous output?**

---

## Question 8

A junior engineer writes a chained workflow but hardcodes intermediate values instead of passing outputs between steps.

**What scalability issue does this create? Redesign the chain to dynamically pass structured outputs between prompts. Why is this critical for agent-like behavior?**

---

## Question 9

Your agent flow works for simple queries like:

> *"What's the temperature in Paris?"*

But fails for:

> *"Compare the weather in Paris and Berlin."*

**What limitation in your chaining design is exposed? How would you modify the workflow to handle multi-entity queries?**

---

## Question 10

You are building a reusable tool prompt template for API simulation across domains (weather, finance, user data).

**What parts of the prompt must remain constant, and what must be configurable? Design a generalized template and explain how it adapts to different schemas.**

---

## Question 11

You notice that even with JSON instructions, outputs sometimes include trailing commas or invalid syntax.

**What does this reveal about model compliance vs strict execution? What additional constraint or validation step would you include at the prompt level to improve reliability?**

---

## Question 12

Your chatbot must respond quickly, but structured prompts and chaining increase latency.

**What trade-off does this introduce? How would you optimize prompts to reduce token usage while maintaining structured integrity and tool compatibility?**

---

## Question 13

A student argues:

> *"We don’t need prompt chaining—we can just ask one big prompt to do everything."*

**Using examples from Exercise 3, explain why this approach fails in complex workflows. What advantages does chaining provide in terms of control, debugging, and modularity?**

---

## Question 14

You simulate an API response, but the model occasionally adds extra fields not defined in the schema.

**What risk does this create in production systems? Modify the prompt to strictly limit outputs to only defined fields. What instruction enforces schema adherence?**

---

## Question 15

Your system integrates multiple tools (calculator + weather API). Outputs sometimes mix reasoning with tool responses, breaking parsing.

**What structural separation is missing? Design a prompt that clearly distinguishes between reasoning, tool invocation, and final output. Why is this separation critical for reliable tool use?**

---

## Reflection Prompt (Bonus)

Tool prompting introduces structure, chaining, and external integration—but also new failure modes.

**What does an “ideal tool prompt” look like as a reusable pattern? Define its structure, constraints, and limitations. Identify one scenario where tool prompting could fail despite correct design.**

---

*All answers must be written in your own words. Responses identified as AI-generated will be rejected.*
