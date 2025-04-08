# mypage

My personal website. Feel free to have a look at [www.timrjensen.dev](https://www.timrjensen.dev)

## Requirements

- Deno v.2.2.8
- Docker v.4.40.0
- Optionally Go v1.22.0

## Usage (frontend)

```
docker compose up -d
```

Then navigate to [localhost:4242](http://localhost:4242)

## Usage (wavefront parser)

```
go run waveparser/main.go -f file-to-parse.obj -o output-file.bin
```
