# prompt-basics

## Overview

- What is a prompt?
- Anatomy of a prompt (system, user, assistant messages)
- Zero-shot vs few-shot prompting
- Introduction to completions in ChatGPT / Playground

## Learning Objectives

- Understand the structure and components of a prompt
- Distinguish between zero-shot and few-shot prompting
- Practice generating consistent outputs with simple prompts
- Explore how parameters like temperature and top-p affect model behavior

## Exercises of the day

- Exercise 0: Environment and Libraries
- Exercise 1: Simple prompt writing
- Exercise 2: Instruction refinement
- Exercise 3: Parameter experimentation

## Virtual Environment

- OpenAI Playground or ChatGPT interface
- Python 3.9+ installed locally (optional, for simulating API workflows)

## Exercise 0: Environment and libraries

**Objective:** Set up the environment for Python development.

- Install Python (latest stable version, preferably 3.9+).
- Verify installation by running:

```bash
  python --version
```

- Write and execute a Hello, World! program.

## Exercise 1: Simple Prompt Writing

**Objective:** Write your first prompts and observe outputs.

- Write a direct instruction prompt (e.g., “List three programming languages”).
- Write a question style prompt (e.g., “What are the benefits of Python for AI?”).
- Compare how the model answers each type.

## Exercise 2: Instruction Refinement

**Objective:** Convert vague requests into precise prompts.

- Start with a vague request like: “Tell me about AI.”
- Refine it step by step into a clear instruction, e.g.:

  * “Explain AI in simple terms for beginners.”
  * “Summarize the main AI techniques in 5 bullet points.”
- Compare outputs and note differences.

## Exercise 3: Parameter Experimentation

**Objective:** Understand how parameters affect output diversity.

- Use the same prompt with temperature = 0.2 and then with temperature = 0.9.
- Repeat with different top-p values (e.g., 0.5 vs 1).
- Record how the style, randomness, and focus of responses change.

## Submission

Provide all exercises. For each exercise include the prompts, model outputs, and a brief sentence analysis highlighting differences in output, clarity, or behavior.

## Resources

* [OpenAI Python](https://github.com/openai/openai-python)
* [Anthropic – How to write prompts](https://github.com/anthropics/prompt-eng-interactive-tutorial)
* [Prompting best practices](https://learnprompting.org/)