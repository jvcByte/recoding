## Drill 8 — PageData Struct

Define a `PageData` struct that holds the data your HTML template needs, then populate and print two instances to verify the fields work correctly.

**Requirements:**
- Fields: `Result string`, `Error string`, `Text string`, `Banner string`
- The zero value must be safe to use (no panics)
- A successful render populates `Result`; an error populates `Error`

**Starter:**
```go
package main

import "fmt"

type PageData struct {
	// TODO: define fields
}

func main() {
	success := PageData{
		// TODO: populate for a successful render of text="hello" with banner="standard"
	}
	fmt.Printf("Result=%q Error=%q Text=%q Banner=%q\n",
		success.Result, success.Error, success.Text, success.Banner)

	failure := PageData{
		// TODO: populate for a validation error "text is empty"
	}
	fmt.Printf("Result=%q Error=%q Text=%q Banner=%q\n",
		failure.Result, failure.Error, failure.Text, failure.Banner)

	var zero PageData
	fmt.Printf("zero Result=%q Error=%q\n", zero.Result, zero.Error)
}
```

**Expected output:**
```
Result="art goes here" Error="" Text="hello" Banner="standard"
Result="" Error="text is empty" Text="" Banner="standard"
zero Result="" Error=""
```
