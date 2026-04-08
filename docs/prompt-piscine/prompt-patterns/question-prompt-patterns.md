# Prompt-Patterns — Scenario-Based Re-Coding Questions
> Derived strictly from the prompt-patterns quest exercises
> Format: Scenario-based | Intensity: 10+ questions
> Rules: Answer each question in your own words. No AI-generated responses.

---

## Question 1

Your team uses this prompt across dozens of weekly reports:

> *"Summarize this text."*

Some outputs are three sentences. Some are ten. Some focus on conclusions, others on methodology. The reports are inconsistent and your manager can't use them reliably.

**What is the structural problem with this prompt from a reusable pattern perspective? Rewrite it as a proper summarization template — one that would produce consistent output regardless of who runs it or what text they feed in. Identify every element you added and why each one is necessary for reliability.**

---

## Question 2

You apply your refined summarization pattern from Exercise 1 to two very different inputs: a news article and a technical blog post. The news article summarizes cleanly. The technical blog produces bullet points that are vague and miss the core argument.

**Does this mean your pattern failed — or that the pattern needs to be adapted per input type? What's the difference between a prompt pattern that is reusable and one that is universal? How do you design for reusability without assuming all inputs are the same?**

---

## Question 3

You're building a data extraction tool for an HR system. Your template prompt:

> *"Extract the following fields: Name, Age, Location, Occupation. Return as JSON."*

It works perfectly on clean inputs like: *"John Doe, age 29, lives in Paris and works as a software engineer."*

Then someone feeds it: *"Maria has been with us since 2019. She's based remotely and handles our EU compliance."*

The model either guesses or returns nulls for missing fields.

**What does this reveal about the assumption baked into your template? Rewrite the extraction prompt to handle missing or ambiguous fields gracefully — without hallucinating values. What instruction specifically prevents the model from inventing data?**

---

## Question 4

A classmate argues: *"JSON output format is just a stylistic choice — asking for JSON versus plain text doesn't change what the model actually extracts."*

You've just completed Exercise 2 and know this isn't quite right.

**What does specifying output format in a data extraction prompt actually change — beyond appearance? Think about consistency across multiple inputs, downstream processing, and what happens when a developer tries to parse the output programmatically. Build a concrete example that proves your classmate wrong.**

---

## Question 5

You're given this prompt to transform for Exercise 3:

> *"Write about climate change."*

You apply the **instructional pattern** and produce:

> *"Write a 200-word explanation of climate change for high school learners."*

Then you apply the **comparative pattern** and produce:

> *"Compare the effects of climate change on coastal vs inland regions in 5 bullet points."*

**Both are improvements — but they produce fundamentally different outputs. What does each pattern optimize for, and in what real-world use case would you choose the instructional pattern over the comparative, or vice versa? The answer can't just be "it depends" — make a specific, reasoned choice.**

---

## Question 6

You validate your data extraction template across five different input texts. Four return perfect JSON. The fifth returns the correct data but wrapped in a sentence: *"Here is the extracted information: {'Name': 'Ana Silva'...}"*

**The data is right but the format is broken. At the prompt level — not post-processing — what instruction would you add to enforce format compliance consistently? And what does this edge case reveal about the difference between a model understanding your request and reliably executing it?**

---

## Question 7

Your manager gives you a vague brief: *"We need a prompt that summarizes customer complaints."*

Before you write a single word of the prompt, the exercise's pattern-design approach requires you to ask certain questions.

**What are the 4–5 questions you must answer before writing this summarization pattern — and what breaks in the output if you skip each one? Map each question directly to a structural element of the final prompt.**

---

## Question 8

You're documenting your Exercise 3 comparison. The weak prompt *"Write about climate change"* produced a 400-word general essay. Your instructional pattern produced a focused 200-word explanation. Your comparative pattern produced 5 structured bullet points.

The submission asks for *"a brief sentence analysis explaining improvements, consistency, and clarity."*

**Write that analysis — but make it actually useful. Don't just say the improved prompts were "clearer." Explain specifically what structural element of each pattern caused the improvement, and what would have been lost if that element had been omitted.**

---

## Question 9

A developer on your team builds a summarization pattern that works well — then hardcodes it into a production pipeline. Six months later, the product pivots: summaries now need to be one sentence instead of three bullet points, and aimed at executives instead of general users.

**What's the maintenance problem that bad pattern design created here? How should a reusable prompt template be structured from the start so that changing audience, length, or focus doesn't require rewriting the entire pipeline?**

---

## Question 10

You're testing your data extraction template on this input:

> *"Dr. Amara Nwosu, 41, relocated from Lagos to Amsterdam last spring and now leads the AI safety division."*

Your template asks for: Name, Age, Location, Occupation.

The model correctly extracts Name and Age, returns "Amsterdam" for Location (ignoring Lagos), and writes "AI safety division lead" for Occupation.

**Three of four fields returned — but are all three correct? What prompt instruction would have forced the model to flag ambiguity (e.g., two locations, inferred vs. stated occupation) instead of silently choosing? Why does silent inference make a data extraction template unreliable in production?**

---

## Question 11

You apply the comparative pattern to a new topic: *"Compare remote work vs office work for software developers in 5 bullet points."*

The output is balanced and well-structured. Then a colleague applies the same pattern to a politically sensitive topic and gets a biased comparison that favors one side.

**What does this reveal about the limits of the comparative pattern as a reusable structure? What additional element should be added to a comparative pattern prompt when the topic involves contested or sensitive claims — and what happens to output reliability without it?**

---

## Question 12

You've completed all three exercises and are preparing your submission. The requirement says: *"For Exercises 1 and 2, show multiple inputs to demonstrate reliability."*

You ran each prompt twice. Both times the output was good. You submit.

**Was two inputs enough to demonstrate reliability — and what does "reliability" actually mean in the context of a reusable prompt pattern? How many inputs, and of what variety, would constitute a genuine reliability test? What kinds of inputs specifically would stress-test a pattern rather than just confirm it works on easy cases?**

---

## Reflection Prompt (Bonus)

The quest defines four prompt pattern types: instructional, comparative, QA, and data extraction. You used three of them across the exercises.

**QA pattern was listed in the overview but not explicitly exercised. Based on what you know about the other three patterns — what do you think the QA pattern is designed to do, what structure would it have, and where would it break down? Write a draft QA pattern for a real use case and identify its likely failure mode.**

---

*All answers must be written in your own words. Responses identified as AI-generated will be rejected.*
