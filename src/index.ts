import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import client from "prom-client";

dotenv.config({ path: __dirname + "/../../.env" });

const app: Express = express();
app.use(express.json());

client.collectDefaultMetrics();

const requestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total des requêtes HTTP",
  labelNames: ["method", "route", "status"],
});

app.use((req, res, next) => {
  res.on("finish", () => {
    requestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
  });
  next();
});

// Endpoint pour exposer les métriques
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).send();
});

const port = process.env.METRICS_SERVICE_PORT || 2000;
app.listen(port, () => {
  console.log(`[server]: Metrics is running at http://localhost:${port}`);
});
