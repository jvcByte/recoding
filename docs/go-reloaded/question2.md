### Question 3

The spec says `(hex)` and `(bin)` should replace the word **before** them with its decimal conversion. The word before is always guaranteed to be a valid hex or binary number.

**How did you locate "the word before" in your implementation? Did you split the string, use an index, scan backwards? Walk through your exact approach and explain why it's correct — and where it would fail if the guarantee about valid input was removed.**
