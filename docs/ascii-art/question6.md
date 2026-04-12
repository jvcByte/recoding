## Drill 7 — Resolve Banner Filename

Write a function `resolveBannerFile(name string) (string, error)` that maps a banner name to its filename.

**Requirements:**
- An empty string defaults to `"standard"`
- Valid names: `"standard"`, `"shadow"`, `"thinkertoy"`
- Return `name + ".txt"` for valid names
- Return an error for any unrecognized name

**Starter:**
```go
package main

import "fmt"

func resolveBannerFile(name string) (string, error) {
	// TODO: implement
	return "", nil
}

func main() {
	cases := []string{"standard", "shadow", "thinkertoy", "banana", ""}
	for _, name := range cases {
		file, err := resolveBannerFile(name)
		if err != nil {
			fmt.Printf("%q → error\n", name)
		} else {
			fmt.Printf("%q → %s\n", name, file)
		}
	}
}
```

**Expected output:**
```
"standard" → standard.txt
"shadow" → shadow.txt
"thinkertoy" → thinkertoy.txt
"banana" → error
"" → standard.txt
```
