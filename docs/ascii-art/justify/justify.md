## justify

**Available**  
Go • 6.13 kB • go -> 29% • Optional

---

## Objectives

You must follow the same [instructions](../ascii-art.md) as in the first subject but the alignment can be changed.

We  
&emsp;&emsp;will  
&emsp;&emsp;&emsp;&emsp;explain!

To change the alignment of the output it must be possible to use a flag:

```
--align=<type>
```

Where `<type>` can be:

- center  
- left  
- right  
- justify  

---

### Requirements

- You must adapt your representation to the terminal size.  
- If you reduce the terminal window, the graphical representation should adapt accordingly.  
- Only text that fits the terminal size will be tested.  

---

### Flag Format

The flag must have **exactly** the format shown above.  
Any other format must return the following usage message:

```
Usage: go run . [OPTION] [STRING] [BANNER]
```

---

### Example

```
go run . --align=right something standard
```

---

### Additional Behavior

- If there are other ascii-art optional projects implemented, the program should accept other correctly formatted `[OPTION]` and/or `[BANNER]`.  
- The program must still be able to run with a single `[STRING]` argument.  

---

## Instructions

- Your project must be written in Go.  
- The code must respect [good practices](../../../good-practices.md).  
- It is recommended to have test files for [unit testing](https://go.dev/doc/tutorial/add-a-test).  

---

## Usage

Assume the bars in the display below are the terminal borders:

```
|$ go run . --align=center "hello" standard                                                                                 |
|                                             _                _    _                                                       |
|                                            | |              | |  | |                                                      |
|                                            | |__      ___   | |  | |    ___                                               |
|                                            |  _ \    / _ \  | |  | |   / _ \                                              |
|                                            | | | |  |  __/  | |  | |  | (_) |                                             |
|                                            |_| |_|   \___|  |_|  |_|   \___/                                              |
|                                                                                                                           |
|                                                                                                                           |
|$ go run . --align=left "Hello There" standard                                                                             |
| _    _           _    _                 _______   _                                                                       |
|| |  | |         | |  | |               |__   __| | |                                                                      |
|| |__| |   ___   | |  | |    ___           | |    | |__      ___    _ __     ___                                           |
||  __  |  / _ \  | |  | |   / _ \          | |    |  _ \    / _ \  | '__|   / _ \                                          |
|| |  | | |  __/  | |  | |  | (_) |         | |    | | | |  |  __/  | |     |  __/                                          |
||_|  |_|  \___|  |_|  |_|   \___/          |_|    |_| |_|   \___|  |_|      \___|                                          |
|                                                                                                                           |
|                                                                                                                           |
|$ go run . --align=right "hello" shadow                                                                                    |
|                                                                                                                           |
|                                                                                          _|                _| _|          |
|                                                                                          _|_|_|     _|_|   _| _|   _|_|   |
|                                                                                          _|    _| _|_|_|_| _| _| _|    _| |
|                                                                                          _|    _| _|       _| _| _|    _| |
|                                                                                          _|    _|   _|_|_| _| _|   _|_|   |
|                                                                                                                           |
|                                                                                                                           |
|$ go run . --align=justify "how are you" shadow                                                                            |
|                                                                                                                           |
|_|                                                                                                                         |
|_|_|_|     _|_|   _|      _|      _|                  _|_|_| _|  _|_|   _|_|                    _|    _|   _|_|   _|    _| |
|_|    _| _|    _| _|      _|      _|                _|    _| _|_|     _|_|_|_|                  _|    _| _|    _| _|    _| |
|_|    _| _|    _|   _|  _|  _|  _|                  _|    _| _|       _|                        _|    _| _|    _| _|    _| |
|_|    _|   _|_|       _|      _|                      _|_|_| _|         _|_|_|                    _|_|_|   _|_|     _|_|_| |
|                                                                                                      _|                   |
|                                                                                                  _|_|                     |
|$                                                                                                                          |
```

---

## Allowed Packages

- Only the [standard Go](golang.org/pkg/) packages are allowed.

---

## Learning Objectives

This project will help you learn about:

- The Go file system (fs) API  
- Data manipulation  
- Terminal display  

