const prisma = require("../lib/prisma");

function normalizeType(type) {
  const value = String(type || "").trim().toUpperCase();
  return value === "INCOME" || value === "EXPENSE" ? value : null;
}

async function createTransaction(req, res) {
  const { description, amount, type, date } = req.body;
  const trimmedDescription = String(description || "").trim();

  if (!trimmedDescription || amount === undefined || !type || !date) {
    return res.status(400).json({ message: "Descrição, valor, tipo e data são obrigatórios." });
  }

  const normalizedType = normalizeType(type);
  const numericAmount = Number(amount);

  if (!normalizedType) {
    return res.status(400).json({ message: "Tipo inválido. Use INCOME ou EXPENSE." });
  }

  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: "O valor deve ser maior que zero." });
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: "Data inválida." });
  }

  const transaction = await prisma.transaction.create({
    data: {
      description: trimmedDescription,
      amount: numericAmount,
      type: normalizedType,
      date: parsedDate,
      userId: req.user.id,
    },
  });

  return res.status(201).json({ message: "Transação criada com sucesso.", transaction });
}

async function listTransactions(req, res) {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    orderBy: { date: "desc" },
  });

  return res.status(200).json({ transactions });
}

async function updateTransaction(req, res) {
  const { id } = req.params;
  const parsedId = Number(id);
  const { description, amount, type, date } = req.body;

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({ message: "ID da transação inválido." });
  }

  const existingTransaction = await prisma.transaction.findUnique({
    where: { id: parsedId },
  });

  if (!existingTransaction) {
    return res.status(404).json({ message: "Transação não encontrada." });
  }

  if (existingTransaction.userId !== req.user.id) {
    return res.status(403).json({ message: "Você não pode alterar essa transação." });
  }

  const normalizedType = type ? normalizeType(type) : existingTransaction.type;
  const parsedAmount = amount !== undefined ? Number(amount) : Number(existingTransaction.amount);
  const parsedDate = date ? new Date(date) : existingTransaction.date;
  const trimmedDescription = description !== undefined ? String(description).trim() : existingTransaction.description;

  if (!trimmedDescription) {
    return res.status(400).json({ message: "Descrição da transação é obrigatória." });
  }

  if (!normalizedType) {
    return res.status(400).json({ message: "Tipo inválido. Use INCOME ou EXPENSE." });
  }

  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "O valor deve ser maior que zero." });
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: "Data inválida." });
  }

  const updatedTransaction = await prisma.transaction.update({
    where: { id: parsedId },
    data: {
      description: trimmedDescription,
      amount: parsedAmount,
      type: normalizedType,
      date: parsedDate,
    },
  });

  return res.status(200).json({ message: "Transação atualizada com sucesso.", transaction: updatedTransaction });
}

async function deleteTransaction(req, res) {
  const { id } = req.params;
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return res.status(400).json({ message: "ID da transação inválido." });
  }

  const existingTransaction = await prisma.transaction.findUnique({
    where: { id: parsedId },
  });

  if (!existingTransaction) {
    return res.status(404).json({ message: "Transação não encontrada." });
  }

  if (existingTransaction.userId !== req.user.id) {
    return res.status(403).json({ message: "Você não pode excluir essa transação." });
  }

  await prisma.transaction.delete({
    where: { id: parsedId },
  });

  return res.status(200).json({ message: "Transação removida com sucesso." });
}

async function getSummary(req, res) {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
  });

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  return res.status(200).json({
    totalIncome,
    totalExpense,
    balance,
    transactions,
  });
}

module.exports = {
  createTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  getSummary,
};
