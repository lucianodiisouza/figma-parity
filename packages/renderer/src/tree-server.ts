import { createServer, type Server } from "node:http";
import type { CapturedNode } from "@parity/capture";
import type { MatrixCell } from "@parity/matrix";
import type { TreeProvider } from "./capture-run.js";

/** What the harness app POSTs per cell. */
export interface TreeReport {
  tree: CapturedNode;
  /** Device pixels per logical point (PixelRatio.get()), for crop extraction. */
  scale?: number;
}

/**
 * Host-side collector for the harness app's tree reports. The app POSTs
 * { cellId, tree, scale } to /tree after each render (the simulator shares the host
 * network); `providerFor()` turns the collected reports into the capture run's
 * TreeProvider, awaiting the report for each cell with a timeout.
 */
export class TreeCollector {
  private server: Server | undefined;
  private reports = new Map<string, TreeReport>();
  private waiters = new Map<string, (report: TreeReport) => void>();

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
          const { cellId, tree, scale } = JSON.parse(body) as {
            cellId: string;
            tree: CapturedNode;
            scale?: number;
          };
          const report: TreeReport = { tree, scale };
          this.reports.set(cellId, report);
          this.waiters.get(cellId)?.(report);
          this.waiters.delete(cellId);
          res.writeHead(204).end();
        } catch {
          res.writeHead(400).end();
        }
      });
    });
    await new Promise<void>((resolve) => this.server!.listen(this.port, "127.0.0.1", resolve));
  }

  /** Await the report for a cell (posted before or after the call). */
  waitFor(cellId: string, timeoutMs = 15_000): Promise<TreeReport> {
    const existing = this.reports.get(cellId);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiters.delete(cellId);
        reject(new Error(`no tree report for cell ${cellId} within ${timeoutMs}ms`));
      }, timeoutMs);
      this.waiters.set(cellId, (report) => {
        clearTimeout(timer);
        resolve(report);
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
    this.reports.clear();
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve) => this.server?.close(() => resolve()));
  }
}
