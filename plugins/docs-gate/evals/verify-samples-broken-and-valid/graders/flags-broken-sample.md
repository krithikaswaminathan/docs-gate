---
type: llm
---

resources/mixed-samples.md has a code sample under "Step 2: A broken sample" with a genuine
JavaScript syntax error (a missing closing parenthesis: `function greet(name {`). Step 1 has a
valid, syntactically-correct JavaScript sample.

PASS if the response reports the Step 2 sample as broken/invalid (a syntax error, or similar), and
does not claim the Step 1 sample is broken.
FAIL if the response says Step 2 is fine, or reports Step 1 as broken.
