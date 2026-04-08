## Question 10

You're testing your data extraction template on this input:

> *"Dr. Amara Nwosu, 41, relocated from Lagos to Amsterdam last spring and now leads the AI safety division."*

Your template asks for: Name, Age, Location, Occupation.

The model correctly extracts Name and Age, returns "Amsterdam" for Location (ignoring Lagos), and writes "AI safety division lead" for Occupation.

**Three of four fields returned — but are all three correct? What prompt instruction would have forced the model to flag ambiguity (e.g., two locations, inferred vs. stated occupation) instead of silently choosing? Why does silent inference make a data extraction template unreliable in production?**

---
