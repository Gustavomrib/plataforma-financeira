import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3000';

const initialTransaction = {
  description: '',
  amount: '',
  type: 'INCOME',
  date: new Date().toISOString().slice(0, 10),
};

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [transactionForm, setTransactionForm] = useState(initialTransaction);
  const [editingId, setEditingId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    if (!token) return;

    try {
      const [transactionsRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/transactions/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const transactionsData = await transactionsRes.json();
      const summaryData = await summaryRes.json();

      setTransactions(transactionsData.transactions || []);
      setSummary(summaryData || { totalIncome: 0, totalExpense: 0, balance: 0 });
    } catch {
      setError('Erro ao carregar dados.');
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  function handleAuthChange(event) {
    const { name, value } = event.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleTransactionChange(event) {
    const { name, value } = event.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin
      ? { email: authForm.email, password: authForm.password }
      : { name: authForm.name, email: authForm.email, password: authForm.password };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro na operação.');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setMessage('Login realizado com sucesso!');
      } else {
        setMessage('Cadastro realizado com sucesso!');
        setIsLogin(true);
      }

      setAuthForm({ name: '', email: '', password: '' });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleTransactionSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!transactionForm.description || !transactionForm.amount || !transactionForm.date) {
      setError('Preencha descrição, valor e data.');
      return;
    }

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/transactions/${editingId}` : `${API_URL}/transactions`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: transactionForm.description,
          amount: Number(transactionForm.amount),
          type: transactionForm.type,
          date: transactionForm.date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar transação.');
      }

      setMessage(editingId ? 'Transação atualizada.' : 'Transação criada.');
      setTransactionForm(initialTransaction);
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteTransaction(id) {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir.');
      }

      setMessage('Transação removida.');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleEditTransaction(transaction) {
    setEditingId(transaction.id);
    setTransactionForm({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      date: new Date(transaction.date).toISOString().slice(0, 10),
    });
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setToken('');
    setTransactions([]);
    setSummary({ totalIncome: 0, totalExpense: 0, balance: 0 });
    setMessage('Logout realizado.');
  }

  return (
    <main className="app-shell">
      <section className="panel auth-panel">
        {!token ? (
          <>
            <h2>{isLogin ? 'Login' : 'Cadastro'}</h2>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              {!isLogin && (
                <input
                  type="text"
                  name="name"
                  placeholder="Nome"
                  value={authForm.name}
                  onChange={handleAuthChange}
                />
              )}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={authForm.email}
                onChange={handleAuthChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Senha"
                value={authForm.password}
                onChange={handleAuthChange}
              />
              <button type="submit">{isLogin ? 'Entrar' : 'Cadastrar'}</button>
            </form>

            <button type="button" className="link-button" onClick={() => setIsLogin((prev) => !prev)}>
              {isLogin ? 'Quero me cadastrar' : 'Já tenho conta'}
            </button>
          </>
        ) : (
          <>
            <h2>Dashboard</h2>
            <button type="button" onClick={handleLogout} className="logout-button">Logout</button>
          </>
        )}

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      {token && (
        <section className="panel summary-panel">
          <h3>Resumo</h3>
          <div className="summary-grid">
            <div>
              <span>Receitas</span>
              <strong>R$ {Number(summary.totalIncome || 0).toFixed(2)}</strong>
            </div>
            <div>
              <span>Despesas</span>
              <strong>R$ {Number(summary.totalExpense || 0).toFixed(2)}</strong>
            </div>
            <div>
              <span>Saldo</span>
              <strong>R$ {Number(summary.balance || 0).toFixed(2)}</strong>
            </div>
          </div>

          <form onSubmit={handleTransactionSubmit} className="transaction-form">
            <h3>{editingId ? 'Editar transação' : 'Nova transação'}</h3>
            <input
              type="text"
              name="description"
              placeholder="Descrição"
              value={transactionForm.description}
              onChange={handleTransactionChange}
            />
            <div className="inline-fields">
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="amount"
                placeholder="Valor"
                value={transactionForm.amount}
                onChange={handleTransactionChange}
              />
              <select name="type" value={transactionForm.type} onChange={handleTransactionChange}>
                <option value="INCOME">Receita</option>
                <option value="EXPENSE">Despesa</option>
              </select>
              <input
                type="date"
                name="date"
                value={transactionForm.date}
                onChange={handleTransactionChange}
              />
            </div>
            <button type="submit">{editingId ? 'Salvar' : 'Adicionar'}</button>
            {editingId && (
              <button type="button" className="secondary-button" onClick={() => {
                setEditingId(null);
                setTransactionForm(initialTransaction);
              }}>
                Cancelar
              </button>
            )}
          </form>

          <h3>Transações</h3>
          <ul className="transaction-list">
            {transactions.length === 0 ? (
              <li>Nenhuma transação cadastrada.</li>
            ) : (
              transactions.map((transaction) => (
                <li key={transaction.id}>
                  <div>
                    <strong>{transaction.description}</strong>
                    <span>{transaction.type}</span>
                  </div>
                  <span>R$ {Number(transaction.amount).toFixed(2)}</span>
                  <div className="transaction-actions">
                    <button type="button" onClick={() => handleEditTransaction(transaction)}>Editar</button>
                    <button type="button" className="danger-button" onClick={() => handleDeleteTransaction(transaction.id)}>Excluir</button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      )}
    </main>
  );
}

export default App;
