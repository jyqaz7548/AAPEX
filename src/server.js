import { createServer } from "./app.js";
import { config } from "./config.js";

const server = createServer(config);

server.listen(config.port);
