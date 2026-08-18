const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  getSummary,
} = require("../controllers/transactionController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createTransaction);
router.get("/", listTransactions);
router.get("/summary", getSummary);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;
