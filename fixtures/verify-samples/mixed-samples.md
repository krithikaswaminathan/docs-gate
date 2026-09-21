<!-- SYNTHETIC FIXTURE: written for docs-gate testing only. Not real product documentation.
     Seeded cases (for checking verify-samples' output against):
     1. Valid JS, no placeholders, no network -- should pass static syntax check.
     2. JS with a syntax error -- should fail static syntax check.
     3. JS with a placeholder -- should be not-checked (placeholder), not failed.
     4. Bare code block, no language tag -- should be not-checked (no language tag).
     5. Python block -- should be not-checked (no parser available).
     6. JS with a fetch() call -- should be flagged looksNetworkDependent.
     7. Cross-step inconsistency: step 8 uses a client variable step 7 never defines. -->

# Querying the Widget API from Node

## Step 1: Compute a total

```js
function total(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
console.log(total([{ price: 1 }, { price: 2 }]));
```

## Step 2: A broken sample

```js
function greet(name {
  return "Hello, " + name;
}
```

## Step 3: Set your API key

```js
const apiKey = "YOUR_API_KEY_HERE";
```

## Step 4: Example output

```
$ node total.js
3
```

## Step 5: A snippet with no language tag

```
const x = 1;
```

## Step 6: Equivalent request in Python

```python
import requests
response = requests.get("https://api.widget.example/v1/ping")
print(response.status_code)
```

## Step 7: Create a client

```js
const client = createClient({ apiKey });
```

## Step 8: Fetch account info

```js
const response = await fetch("https://api.widget.example/v1/account", {
  headers: { Authorization: `Bearer ${widgetClient.apiKey}` },
});
console.log(await response.json());
```
