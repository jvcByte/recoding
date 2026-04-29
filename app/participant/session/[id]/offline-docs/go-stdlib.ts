/**
 * Offline documentation index for common Go standard library packages.
 * Used as fallback when internet access is unavailable.
 */

export interface DocEntry {
  package: string;
  symbol: string;
  signature: string;
  description: string;
  example?: string;
}

export const GO_STDLIB_DOCS: DocEntry[] = [
  // fmt package
  { package: 'fmt', symbol: 'Println', signature: 'func Println(a ...any) (n int, err error)', description: 'Println formats using the default formats for its operands and writes to standard output. Spaces are always added between operands and a newline is appended.', example: 'fmt.Println("Hello, World!")' },
  { package: 'fmt', symbol: 'Printf', signature: 'func Printf(format string, a ...any) (n int, err error)', description: 'Printf formats according to a format specifier and writes to standard output.', example: 'fmt.Printf("Hello, %s!\\n", name)' },
  { package: 'fmt', symbol: 'Sprintf', signature: 'func Sprintf(format string, a ...any) string', description: 'Sprintf formats according to a format specifier and returns the resulting string.', example: 'result := fmt.Sprintf("Value: %d", 42)' },
  { package: 'fmt', symbol: 'Scan', signature: 'func Scan(a ...any) (n int, err error)', description: 'Scan scans text read from standard input, storing successive space-separated values into successive arguments.' },
  { package: 'fmt', symbol: 'Scanln', signature: 'func Scanln(a ...any) (n int, err error)', description: 'Scanln is similar to Scan, but stops scanning at a newline.' },
  { package: 'fmt', symbol: 'Sscanf', signature: 'func Sscanf(str string, format string, a ...any) (n int, err error)', description: 'Sscanf scans the argument string, storing successive space-separated values into successive arguments as determined by the format.' },
  { package: 'fmt', symbol: 'Errorf', signature: 'func Errorf(format string, a ...any) error', description: 'Errorf formats according to a format specifier and returns the string as a value that satisfies error.' },

  // strings package
  { package: 'strings', symbol: 'Contains', signature: 'func Contains(s, substr string) bool', description: 'Contains reports whether substr is within s.', example: 'strings.Contains("seafood", "foo") // true' },
  { package: 'strings', symbol: 'Split', signature: 'func Split(s, sep string) []string', description: 'Split slices s into all substrings separated by sep and returns a slice of the substrings between those separators.', example: 'strings.Split("a,b,c", ",") // ["a", "b", "c"]' },
  { package: 'strings', symbol: 'Join', signature: 'func Join(elems []string, sep string) string', description: 'Join concatenates the elements of its first argument to create a single string. The separator string sep is placed between elements in the resulting string.', example: 'strings.Join([]string{"a","b","c"}, ",") // "a,b,c"' },
  { package: 'strings', symbol: 'TrimSpace', signature: 'func TrimSpace(s string) string', description: 'TrimSpace returns a slice of the string s, with all leading and trailing white space removed.', example: 'strings.TrimSpace("  hello  ") // "hello"' },
  { package: 'strings', symbol: 'ToUpper', signature: 'func ToUpper(s string) string', description: 'ToUpper returns s with all Unicode letters mapped to their upper case.', example: 'strings.ToUpper("hello") // "HELLO"' },
  { package: 'strings', symbol: 'ToLower', signature: 'func ToLower(s string) string', description: 'ToLower returns s with all Unicode letters mapped to their lower case.', example: 'strings.ToLower("HELLO") // "hello"' },
  { package: 'strings', symbol: 'HasPrefix', signature: 'func HasPrefix(s, prefix string) bool', description: 'HasPrefix reports whether the string s begins with prefix.', example: 'strings.HasPrefix("hello", "he") // true' },
  { package: 'strings', symbol: 'HasSuffix', signature: 'func HasSuffix(s, suffix string) bool', description: 'HasSuffix reports whether the string s ends with suffix.', example: 'strings.HasSuffix("hello", "lo") // true' },
  { package: 'strings', symbol: 'Replace', signature: 'func Replace(s, old, new string, n int) string', description: 'Replace returns a copy of the string s with the first n non-overlapping instances of old replaced by new. If n < 0, there is no limit on the number of replacements.', example: 'strings.Replace("oink oink oink", "oink", "moo", 2) // "moo moo oink"' },
  { package: 'strings', symbol: 'Count', signature: 'func Count(s, substr string) int', description: 'Count counts the number of non-overlapping instances of substr in s.', example: 'strings.Count("cheese", "e") // 3' },
  { package: 'strings', symbol: 'Index', signature: 'func Index(s, substr string) int', description: 'Index returns the index of the first instance of substr in s, or -1 if substr is not present in s.', example: 'strings.Index("chicken", "ken") // 4' },
  { package: 'strings', symbol: 'Trim', signature: 'func Trim(s, cutset string) string', description: 'Trim returns a slice of the string s with all leading and trailing Unicode code points contained in cutset removed.', example: 'strings.Trim("¡¡¡Hello!!!", "!¡") // "Hello"' },
  { package: 'strings', symbol: 'Fields', signature: 'func Fields(s string) []string', description: 'Fields splits the string s around each instance of one or more consecutive white space characters.', example: 'strings.Fields("  foo bar  baz   ") // ["foo", "bar", "baz"]' },
  { package: 'strings', symbol: 'Repeat', signature: 'func Repeat(s string, count int) string', description: 'Repeat returns a new string consisting of count copies of the string s.', example: 'strings.Repeat("na", 4) // "nananana"' },

  // strconv package
  { package: 'strconv', symbol: 'Atoi', signature: 'func Atoi(s string) (int, error)', description: 'Atoi is equivalent to ParseInt(s, 10, 0), converted to type int.', example: 'n, err := strconv.Atoi("42")' },
  { package: 'strconv', symbol: 'Itoa', signature: 'func Itoa(i int) string', description: 'Itoa is equivalent to FormatInt(int64(i), 10).', example: 'strconv.Itoa(42) // "42"' },
  { package: 'strconv', symbol: 'ParseFloat', signature: 'func ParseFloat(s string, bitSize int) (float64, error)', description: 'ParseFloat converts the string s to a floating-point number with the precision specified by bitSize.', example: 'f, err := strconv.ParseFloat("3.14", 64)' },
  { package: 'strconv', symbol: 'FormatFloat', signature: 'func FormatFloat(f float64, fmt byte, prec, bitSize int) string', description: 'FormatFloat converts the floating-point number f to a string.', example: 'strconv.FormatFloat(3.14159, \'f\', 2, 64) // "3.14"' },

  // os package
  { package: 'os', symbol: 'Args', signature: 'var Args []string', description: 'Args hold the command-line arguments, starting with the program name.' },
  { package: 'os', symbol: 'Stdin', signature: 'var Stdin = NewFile(uintptr(syscall.Stdin), "/dev/stdin")', description: 'Stdin, Stdout, and Stderr are open Files pointing to the standard input, standard output, and standard error file descriptors.' },
  { package: 'os', symbol: 'Exit', signature: 'func Exit(code int)', description: 'Exit causes the current program to exit with the given status code.', example: 'os.Exit(1)' },
  { package: 'os', symbol: 'Open', signature: 'func Open(name string) (*File, error)', description: 'Open opens the named file for reading.', example: 'f, err := os.Open("file.txt")' },
  { package: 'os', symbol: 'ReadFile', signature: 'func ReadFile(name string) ([]byte, error)', description: 'ReadFile reads the named file and returns the contents.', example: 'data, err := os.ReadFile("file.txt")' },

  // bufio package
  { package: 'bufio', symbol: 'NewScanner', signature: 'func NewScanner(r io.Reader) *Scanner', description: 'NewScanner returns a new Scanner to read from r.', example: 'scanner := bufio.NewScanner(os.Stdin)' },
  { package: 'bufio', symbol: 'Scanner.Scan', signature: 'func (s *Scanner) Scan() bool', description: 'Scan advances the Scanner to the next token, which will then be available through the Bytes or Text method.', example: 'for scanner.Scan() { fmt.Println(scanner.Text()) }' },
  { package: 'bufio', symbol: 'Scanner.Text', signature: 'func (s *Scanner) Text() string', description: 'Text returns the most recent token generated by a call to Scan as a newly allocated string holding its bytes.' },
  { package: 'bufio', symbol: 'NewReader', signature: 'func NewReader(rd io.Reader) *Reader', description: 'NewReader returns a new Reader whose buffer has the default size.', example: 'reader := bufio.NewReader(os.Stdin)' },
  { package: 'bufio', symbol: 'Reader.ReadString', signature: 'func (b *Reader) ReadString(delim byte) (string, error)', description: 'ReadString reads until the first occurrence of delim in the input, returning a string containing the data up to and including the delimiter.', example: 'line, err := reader.ReadString(\'\\n\')' },

  // sort package
  { package: 'sort', symbol: 'Ints', signature: 'func Ints(x []int)', description: 'Ints sorts a slice of ints in increasing order.', example: 'sort.Ints([]int{3,1,2}) // [1,2,3]' },
  { package: 'sort', symbol: 'Strings', signature: 'func Strings(x []string)', description: 'Strings sorts a slice of strings in increasing order.', example: 'sort.Strings([]string{"c","a","b"}) // ["a","b","c"]' },
  { package: 'sort', symbol: 'Slice', signature: 'func Slice(x any, less func(i, j int) bool)', description: 'Slice sorts the slice x given the provided less function.', example: 'sort.Slice(s, func(i, j int) bool { return s[i] < s[j] })' },

  // math package
  { package: 'math', symbol: 'Abs', signature: 'func Abs(x float64) float64', description: 'Abs returns the absolute value of x.', example: 'math.Abs(-3.14) // 3.14' },
  { package: 'math', symbol: 'Max', signature: 'func Max(x, y float64) float64', description: 'Max returns the larger of x or y.', example: 'math.Max(3.0, 5.0) // 5.0' },
  { package: 'math', symbol: 'Min', signature: 'func Min(x, y float64) float64', description: 'Min returns the smaller of x or y.', example: 'math.Min(3.0, 5.0) // 3.0' },
  { package: 'math', symbol: 'Sqrt', signature: 'func Sqrt(x float64) float64', description: 'Sqrt returns the square root of x.', example: 'math.Sqrt(16.0) // 4.0' },
  { package: 'math', symbol: 'Pow', signature: 'func Pow(x, y float64) float64', description: 'Pow returns x**y, the base-x exponential of y.', example: 'math.Pow(2, 10) // 1024' },
];

export function searchDocs(query: string): DocEntry[] {
  const q = query.toLowerCase();
  return GO_STDLIB_DOCS.filter(
    (d) =>
      d.package.toLowerCase().includes(q) ||
      d.symbol.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
  );
}
