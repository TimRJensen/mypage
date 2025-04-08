import * as esbuild from "npm:esbuild";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader";

async function handler(req: Request): Promise<Response> {
    await esbuild.build({
        plugins: [...denoPlugins()],
        entryPoints: ["./src/main.ts"],
        outfile: "./src/main.js",
        bundle: true,
        format: "esm",
    });

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

Deno.serve({ port: 4242, hostname: "0.0.0.0" }, handler);
esbuild.stop();
