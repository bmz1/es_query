import { Client } from "@elastic/elasticsearch";

export const client = new Client({
  node: "http://localhost:9200",
  requestTimeout: 1000,
  maxRetries: 1, 
});