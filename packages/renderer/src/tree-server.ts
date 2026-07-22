import { createServer, type Server } from "node:http";
import type { CapturedNode } from "@parity/capture";
import type { MatrixCell } from "@parity/matrix";
import type { TreeProvider } from "./capture-run.js";

/**
 * Host-side collector for the harness app's tree reports. The app POSTs
 * { cellId, tree } to /tree after each render (the simulator shares the host network);
 * `providerFor()` turns the collected reports into the capture run's TreeProvider,
 * awaiting the report for each cell with a timeout.
 */
export class TreeCollector {
  private server: Server | undefined;
  private trees = new Map<string, CapturedNode>();
  private waiters = new Map<string, (tree: CapturedNode) => void>();

  constructor(private readonly port = 4823) {}

  async start(): Promise<void> {
    this.server = createServer((req, res) => {
      if (req.method !== "POST" || req.url !== "/tree") {
        res.writeHead(404).end();
        return;
      }
      let body = "";
      req.on("data", (chunk: Buffer) => (body += chunk.toString()));
      req.on("end", () => {
        try {
          const { cellId, tree } = JSON.parse(body) as { cellId: string; tree: CapturedNode };
          this.trees.set(cellId, tree);
          this.waiters.get(cellId)?.(tree);
          this.waiters.delete(cellId);
          res.writeHead(204).end();
        } catch {
          res.writeHead(400).end();
        }
      });
    });
    await new Promise<void>((resolve) => this.server!.listen(this.port, "127.0.0.1", resolve));
  }

  /** Await the tree report for a cell (posted before or after the call). */
  waitFor(cellId: string, timeoutMs = 15_000): Promise<CapturedNode> {
    const existing = this.trees.get(cellId);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiters.delete(cellId);
        reject(new Error(`no tree report for cell ${cellId} within ${timeoutMs}ms`));
      }, timeoutMs);
      this.waiters.set(cellId, (tree) => {
        clearTimeout(timer);
        resolve(tree);
      });
    });
  }

  /**
   * TreeProvider backed by the collector. NOTE: the app posts its report right after the
   * deep link opens — often before the runner asks for it — so the provider must accept
   * an already-arrived report. Call `reset()` once before a run to drop stale state.
   */
  providerFor(opts: { timeoutMs?: number } = {}): TreeProvider {
    return (cell: MatrixCell) => this.waitFor(cell.id, opts.timeoutMs);
  }

  /** Drop all collected reports (call before a run so nothing stale is reused). */
  reset(): void {
    this.trees.clear();
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
  }
}
