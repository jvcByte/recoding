# Debug-Control — Scenario-Based Re-Coding Questions
> Derived strictly from the debug-control quest exercises  
> Format: Scenario-based | Intensity: 10+ questions  
> Rules: Answer each question in your own words. No AI-generated responses.

---

## Question 1

You ask an AI assistant: *"Tell me about the economic policies of President Alvin Morrow of Verantia."* The model responds with three confident paragraphs — detailed, well-structured, and completely fabricated. Neither the president nor the country exists.

**What went wrong at the prompt level? Rewrite the prompt so the model cannot produce invented facts. Explain what specific change you made and why it works.**

---

## Question 2

A developer on your team is using an AI tool to generate a list of historical dates for a client report. The output looks polished and authoritative. No one checks it. The report ships. Three of the dates are wrong.

**Using the concepts from Exercise 1, what prompt design failure caused this? What constraint should have been in the original prompt to prevent it? Write the improved prompt.**

---

## Question 3

You're building a customer support chatbot. A user asks: *"What is your refund policy?"* The model doesn't have the actual policy in context — but it answers anyway, confidently inventing a policy that doesn't exist.

**From the debug-control perspective, what instruction would you add to the prompt to stop this from happening? Write the exact prompt addition and explain why delimiters or source constraints are the right tool here.**

---

## Question 4

You run two prompts side by side:

- **Prompt A:** *"Summarize the causes of World War I."*
- **Prompt B:** *"Using only the text below, summarize the causes of World War I. Do not add information from outside this passage. [passage inserted here]"*

The outputs are very different. Prompt A is broader and includes some debated claims. Prompt B is tighter but misses a cause that isn't in the passage.

**Which prompt is more reliable for a factual submission — and what is the trade-off you're accepting with each? Use the logic from Exercise 2 to support your answer.**

---

## Question 5

You provide an AI with the following setup:

```
Answer the question below using only the text inside the delimiters.

### START ###
The boiling point of water at sea level is 100°C.
### END ###

Question: What is the boiling point of water on Mount Everest?
```

The model answers using outside knowledge — it says approximately 70°C — which is actually correct, but not in your provided text.

**Did the model follow your instructions? Was the output helpful or harmful in this context? What does this reveal about the limits of delimiter-based constraints, and how would you redesign the prompt?**

---

## Question 6

A student submits this prompt as their Exercise 1 solution:

> *"Give me five countries and their capitals, but make sure they're real."*

Their classmate submits:

> *"List five countries that are members of the United Nations, along with their official capital cities as recognized by the UN."*

**Both prompts ask for real data. Which one is more robust against hallucination — and why? What specific prompt engineering principle from Exercise 1 does the stronger prompt apply?**

---

## Question 7

You're testing a model for a legal tech company. The task: summarize a contract clause. You paste the clause inside triple backticks and instruct the model to answer only from that text. But the model keeps referencing general contract law principles it learned during training.

**What is breaking the constraint, and what would you change in your prompt structure to fix it? Write a revised prompt that forces the model to stay within the provided clause.**

---

## Question 8

Your prompt for Exercise 2 is:

> *"Answer the following question and cite your source."*

The model responds: *"According to general knowledge..."* — and gives no real citation.

**Why did the instruction "cite your source" fail here? What was missing from the prompt that would have made source-grounding actually work? Rewrite the prompt using the data constraint approach from Exercise 2.**

---

## Question 9

A teammate argues: *"Delimiters don't actually help — the model reads the whole prompt anyway, so it'll use outside knowledge regardless."*

You disagree based on what you know from Exercise 3.

**Make the case that delimiters do change model behavior. What specifically do delimiters communicate to the model, and what does the comparison test in Exercise 3 reveal about their effect? What are their real limits?**

---

## Question 10

You're given this weak prompt:

> *"Tell me about climate change."*

And this passage to work with:

> *"Global average temperatures have risen by approximately 1.1°C since the pre-industrial era. This warming is primarily driven by the burning of fossil fuels, which releases carbon dioxide and other greenhouse gases. The effects include rising sea levels, more frequent extreme weather events, and disruption to ecosystems."*

**Rewrite the prompt using all three debug-control techniques: (1) a constraint against invented facts, (2) a source-binding instruction, and (3) delimiters around the passage. Then explain what each addition does.**

---

## Question 11

You've written a prompt that uses delimiters perfectly. You run it twice on the same model with the same input. The first output stays within the delimiters. The second output drifts outside them and adds unreferenced claims.

**What does this inconsistency reveal about relying on prompt constraints alone? What additional verification step — outside of prompt design — should you add to your workflow?**

---

## Question 12

You're doing a final comparison test for Exercise 3. Without delimiters, the model gives a broad, partially hallucinated answer. With delimiters, it's narrow and accurate — but it omits a key point that would have helped the user.

**Write a one-paragraph analysis of this trade-off. When is a constrained, narrower answer the right choice — and when does it actually do more harm than good?**

---

## Reflection Prompt (Bonus)

Look back at the submission requirements for this quest:

> *"For each exercise include the prompt, model outputs, and a brief sentence analysis comparing weak vs improved prompts."*

**After working through these scenarios: what makes a "brief analysis" genuinely useful versus just descriptive? What should a strong comparison actually show — and what's the difference between noticing that outputs differ and understanding why they differ?**

---

*All answers must be written in your own words. Responses identified as AI-generated will be rejected.*
