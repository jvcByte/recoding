## fs

**Available**  
Go • 6.13 kB • 26%  
Optional

---

## Objectives

You must follow the same [instructions](../ascii-art.md) as in the first subject, but the **second argument must be the name of the template**.

I know some templates may be hard to read, just do not obsess about it.

---

## Instructions

- Your project must be written in Go.  
- The code must respect [good practices](../../../good-practices.md).  
- It is recommended to have test files for [unit testing](https://go.dev/doc/tutorial/add-a-test).  
- You can see all about the banners in the project resources.  

---

## Usage Format

The usage must follow exactly:

```
go run . [STRING] [BANNER]
```

Any other format must return:

```
Usage: go run . [STRING] [BANNER]
```

---

### Example

```
go run . something standard
```

---

## Additional Behavior

- If there are other ascii-art optional projects implemented, the program should accept other correctly formatted `[OPTION]` and/or `[BANNER]`.  
- The program must still be able to run with a single `[STRING]` argument.  

---

## Usage Examples

```
student$ go run . "hello" standard | cat -e
 _              _   _          $
| |            | | | |         $
| |__     ___  | | | |   ___   $
|  _ \   / _ \ | | | |  / _ \  $
| | | | |  __/ | | | | | (_) | $
|_| |_|  \___| |_| |_|  \___/  $
                               $
                               $
```

```
student$ go run . "Hello There!" shadow | cat -e
                                                                                         $
_|    _|          _| _|                _|_|_|_|_| _|                                  _| $
_|    _|   _|_|   _| _|   _|_|             _|     _|_|_|     _|_|   _|  _|_|   _|_|   _| $
_|_|_|_| _|_|_|_| _| _| _|    _|           _|     _|    _| _|_|_|_| _|_|     _|_|_|_| _| $
_|    _| _|       _| _| _|    _|           _|     _|    _| _|       _|       _|          $
_|    _|   _|_|_| _| _|   _|_|             _|     _|    _|   _|_|_| _|         _|_|_| _| $
                                                                                         $
                                                                                         $
```

```
student$ go run . "Hello There!" thinkertoy | cat -e
                                                $
o  o     o o           o-O-o o                o $
|  |     | |             |   |                | $
O--O o-o | | o-o         |   O--o o-o o-o o-o o $
|  | |-' | | | |         |   |  | |-' |   |-'   $
o  o o-o o o o-o         o   o  o o-o o   o-o O $
                                                $
                                                $
```

---

## Allowed Packages

- Only the [standard Go](https://golang.org/pkg/) packages are allowed.

---

## Learning Objectives

This project will help you learn about:

- The Go file system (fs) API  
- Data manipulation  

---

## Support

Something is wrong?

- [Submit an issue](https://github.com/01-edu/public/issues/new?body=ascii-art-fs%0A---%0A&title=ascii-art-fs+subject)  
- [Or propose a change ](https://github.com/01-edu/api/content/root/01-edu_module/content/ascii-art-fs/README.md) 