import {debounce} from "jsr:@std/async/debounce";
import * as esbuild from "npm:esbuild";
import {denoPlugins} from "jsr:@luca/esbuild-deno-loader";

async function build() {
    await esbuild.build({
        plugins: [...denoPlugins()],
        entryPoints: ["./src/main.ts"],
        outfile: "./src/main.js",
        bundle: true,
        format: "esm",
    });
}

async function handleHTTP(req: Request): Promise<Response> {
    await build();

    const url = new URL(req.url);
    const path = Deno.cwd() + (url.pathname === "/" ? "/index.html" : decodeURI(url.pathname));
    try {
        const file = await Deno.readFile(path);
        const ext = path.split(".").pop() || "txt";

        switch (ext) {
            case "js":
                return new Response(file, {
                    headers: {
                        "Content-Type": "application/javascript",
                        "Access-Control-Allow-Origin": "*",
                    },
                });
            case "css":
            case "html":
                return new Response(file, {
                    headers: {
                        "Content-Type": "text/" + ext,
                        "Access-Control-Allow-Origin": "*",
                    },
                });
            case "png":
                return new Response(file, {
                    headers: {
                        "Content-Type": "image/png",
                        "Access-Control-Allow-Origin": "*",
                    },
                });
            case "bin":
                return new Response(file, {
                    headers: {
                        "Content-Type": "application/octet-stream",
                        "Access-Control-Allow-Origin": "*",
                    },
                });
            default:
                return new Response(file, {
                    headers: {
                        "Content-Type": "text/plain",
                        "Access-Control-Allow-Origin": "*",
                    },
                });
        }
    } catch (_e) {
        return new Response("404 Not Found", { status: 404 });
    }
}

const clients = new Set<WebSocket>();
function handleWebSocker(req: Request): Promise<Response> {
    const {socket, response} = Deno.upgradeWebSocket(req);
    socket.onopen = () => {
        clients.add(socket);
    }
    socket.onclose = () => {
        clients.delete(socket);
    }

    return Promise.resolve(response);
}

function handleRequest(req: Request): Promise<Response> {
    if (req.headers.get("upgrade")?.toLowerCase() == "websocket") {
        return handleWebSocker(req);
    } else {
        return handleHTTP(req);
    }
}

debounce(build, 200);
async function watchFS() {
    const fsWorker = Deno.watchFs(Deno.cwd());
    for await (const e of fsWorker) {
        if (e.kind != "modify") {
            continue;
        }
        
        if (e.paths.some((path) => path.includes("main.js"))) {
            continue;
        }
        
        build();
        for (const client of clients) {
            client.send("reload");
        }
    }
}

watchFS();
Deno.serve({port: 4242, hostname: "0.0.0.0"}, handleRequest);
esbuild.stop();
