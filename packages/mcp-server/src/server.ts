import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { evaluateManifest, summarizeManifest } from "./tools.js";

/**
 * The agent interface (PRD §8): a THIN control-plane server over manifests. It registers
 * two tools that both operate on kilobyte manifests — no render/capture/diff happens here
 * (that's the data plane, out-of-band). MCP stays control-plane only.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: "figma-parity", version: "0.0.0" });

  server.registerTool(
    "summarize_manifest",
    {
      description:
        "Reduce a divergence manifest to its compact summary (coverage, cell counts, bug list). Input and output are kilobytes; never pixels.",
      inputSchema: { manifest: z.unknown() },
    },
    ({ manifest }) => ({
      content: [{ type: "text", text: JSON.stringify(summarizeManifest(manifest), null, 2) }],
    }),
  );

  server.registerTool(
    "evaluate_manifest",
    {
      description:
        "Compute the false-positive rate (and precision/recall) of a manifest against a labeled ground-truth set. The Phase 0 viability metric.",
      inputSchema: { manifest: z.unknown(), labels: z.unknown() },
    },
    ({ manifest, labels }) => ({
      content: [{ type: "text", text: JSON.stringify(evaluateManifest({ manifest, labels }), null, 2) }],
    }),
  );

  return server;
}

/** Start the server over stdio (the standard MCP transport for a local tool). */
export async function main(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}
