### Question 14

The spec guarantees that when `(hex)` or `(bin)` is used, the word before it will always be a valid number in that base. But in a real production tool, you can't make that guarantee.

**Without changing the spec's required behavior for valid inputs, how would you design your error handling for invalid inputs? What should the program output, exit with, or log — and how does Go's idiomatic error handling pattern (`if err != nil`) shape the way you structure this decision across your codebase?**
