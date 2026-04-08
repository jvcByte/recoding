## Question 3

You're building a data extraction tool for an HR system. Your template prompt:

> *"Extract the following fields: Name, Age, Location, Occupation. Return as JSON."*

It works perfectly on clean inputs like: *"John Doe, age 29, lives in Paris and works as a software engineer."*

Then someone feeds it: *"Maria has been with us since 2019. She's based remotely and handles our EU compliance."*

The model either guesses or returns nulls for missing fields.

**What does this reveal about the assumption baked into your template? Rewrite the extraction prompt to handle missing or ambiguous fields gracefully — without hallucinating values. What instruction specifically prevents the model from inventing data?**

---
