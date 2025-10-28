import express from "express";
import dotenv from "dotenv";
import createTransaction from "./api/createTransaction.js";
//import saveTransaction from "./api/saveTransaction.js";

dotenv.config();
const app = express();

app.use(express.json());

// pasang route
app.use("/api/createTransaction", createTransaction);
//app.use("/api/saveTransaction", saveTransaction);

// cek server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
