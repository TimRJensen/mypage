FROM denoland/deno:alpine-2.2.8

WORKDIR /app
COPY ./deno.json .
COPY ./app .

EXPOSE 4242
CMD ["run", "--allow-net", "--allow-read", "--allow-write=./src", "--allow-env", "--allow-run", "./src/server.ts"]
