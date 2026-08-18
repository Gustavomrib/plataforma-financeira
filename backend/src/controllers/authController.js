const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

async function registerUser(req, res) {
  const { name, email, password } = req.body;
  const trimmedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const trimmedPassword = String(password || "");

  if (!trimmedName) {
    return res.status(400).json({ message: "Nome é obrigatório." });
  }

  if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
    return res.status(400).json({ message: "Email inválido." });
  }

  if (!trimmedPassword || trimmedPassword.length < 6) {
    return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return res.status(409).json({ message: "Este email já está cadastrado." });
  }

  const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

  const user = await prisma.user.create({
    data: {
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
    },
  });

  const { password: _, ...userWithoutPassword } = user;

  return res.status(201).json({
    message: "Usuário cadastrado com sucesso.",
    user: userWithoutPassword,
  });
}

async function loginUser(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const trimmedPassword = String(password || "");

  if (!normalizedEmail || !trimmedPassword) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  const passwordMatches = await bcrypt.compare(String(password), user.password);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Credenciais inválidas." });
  }

  const token = generateToken(user);

  const { password: _, ...userWithoutPassword } = user;

  return res.status(200).json({
    message: "Login realizado com sucesso.",
    token,
    user: userWithoutPassword,
  });
}

module.exports = {
  registerUser,
  loginUser,
  generateToken,
};
