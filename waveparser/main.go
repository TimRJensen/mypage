package main

import (
	"bufio"
	"encoding/binary"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

var (
	CWD, _ = os.Getwd()
	fields = map[string]int{"v": 0, "vt": 1, "vn": 2}
)

func parser(file string) []float32 {
	f, _ := os.Open(file)
	defer f.Close()

	data := make([][]float32, 3)
	result := make([]float32, 0)
	reader := bufio.NewScanner(f)
	reader.Split(bufio.ScanLines)
	for reader.Scan() {
		line := reader.Text()
		switch chunks := strings.Split(line, " "); chunks[0] {
		case "v", "vt", "vn":
			chunks := strings.Split(line, " ")
			for _, chunck := range chunks[1:] {
				v, _ := strconv.ParseFloat(chunck, 32)
				data[fields[chunks[0]]] = append(data[fields[chunks[0]]], float32(v))
			}
		case "f":
			chunks := strings.Split(line, " ")
			for _, chunck := range chunks[1:] {
				indices := strings.Split(chunck, "/")
				for i, index := range indices {
					k, _ := strconv.ParseInt(index, 10, 32)
					switch i {
					case 0, 2:
						result = append(result, data[i][(k-1)*3])
						result = append(result, data[i][(k-1)*3+1])
						result = append(result, data[i][(k-1)*3+2])
					case 1:
						result = append(result, data[i][(k-1)*2])
						result = append(result, data[i][(k-1)*2+1])
					}
				}
			}
		}
	}

	return result
}

func main() {
	args := os.Args[1:]
	if len(args) == 0 {
		panic("Invalid argument")
	}

	flags := map[string]string{"--o": "output.bin"}
	regx := regexp.MustCompile(`^-(o|f)$|^--(f|o)(?:ile|utput)$`)
	for i, arg := range args {
		if !regx.MatchString(arg) {
			continue
		}
		if i+1 < len(args) {
			flags["-"+strings.Trim(arg, "-")[:1]] = args[i+1]
		}
	}

	if _, ok := flags["-f"]; !ok {
		panic("No file specified")
	}
	file, _ := filepath.Abs(filepath.Join(CWD, flags["-f"]))

	if _, err := os.Stat(file); os.IsNotExist(err) {
		panic("File does not exist")
	}

	data := parser(file)
	path, _ := filepath.Abs(path.Join(CWD, flags["-o"]))
	out, _ := os.Create(path)
	binary.Write(out, binary.LittleEndian, data)
	fmt.Println(fmt.Sprintf("[LOG] Succesfully parsed \"%s\"\n[LOG] Wrote to \"%s\"", file, path))
}
