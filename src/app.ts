import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes";
import errorMiddleware from "./middlewares/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api", routes);

app.use(errorMiddleware);

export default app;
