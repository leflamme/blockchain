import React, { useState, useEffect, useCallback } from 'react';
// import './index.css'; // <-- THIS IS THE FIX (REMOVED, this was incorrect)

// --- Configuration ---
// Make sure your Laravel API is running and accessible at this URL
// This is set by the Docker environment variable VITE_API_URL
const API_URL = 'http://localhost:8000/api';

// --- Helper Functions ---
const api = {
  getPendingTransactions: () => fetch(`${API_URL}/transactions/pending`).then(res => res.json()),
  getBlocks: () => fetch(`${API_URL}/blocks`).then(res => res.json()),
  createTransaction: (data) => fetch(`${API_URL}/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(data),
  }),
  mineBlock: () => fetch(`${API_URL}/block/mine`, { method: 'POST' }),
  validateChain: () => fetch(`${API_URL}/blockchain/validate`).then(res => res.json()),
};

// --- Main App Component ---
export default function App() {
  const [page, setPage] = useState('dashboard'); // 'dashboard', 'transactions', 'blocks'
  const [message, setMessage] = useState(null); // For status updates

  const showMessage = useCallback((text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  }, []); // <-- FIX: Wrap showMessage in useCallback with an empty dependency array

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Navbar setPage={setPage} />
      
      {message && (
        <div className={`fixed top-20 right-5 p-4 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {page === 'dashboard' && <DashboardPage showMessage={showMessage} />}
        {page === 'transactions' && <TransactionsPage showMessage={showMessage} />}
        {page === 'blocks' && <BlocksPage />}
      </main>
    </div>
  );
}

// --- Navigation ---
function Navbar({ setPage }) {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">The Chain</h1>
          </div>
          <div className="flex items-center space-x-4">
            {['dashboard', 'transactions', 'blocks'].map((pageName) => (
              <button
                key={pageName}
                onClick={() => setPage(pageName)}
                className="capitalize text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {pageName}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

// --- Page Components (Section 7.1) ---

/**
 * 1. Dashboard Page
 */
function DashboardPage({ showMessage }) {
  const [status, setStatus] = useState({ valid: null, message: '' });
  const [isMining, setIsMining] = useState(false);

  const handleValidate = useCallback(async () => {
    try {
      const data = await api.validateChain();
      setStatus({ valid: data.is_valid, message: data.message });
      const messageType = data.is_valid ? 'success' : 'error';
      showMessage(data.message, messageType);
    } catch (err) {
      showMessage('Error validating chain.', 'error');
    }
  }, [showMessage]);

  const handleMine = async () => {
    setIsMining(true);
    showMessage('Mining new block... This may take a moment.', 'success');
    try {
      const res = await api.mineBlock();
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Mining failed');
      }
      const newBlock = await res.json();
      showMessage(`Successfully mined Block #${newBlock.index_no}!`, 'success');
      handleValidate(); // Re-validate after mining
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setIsMining(false);
    }
  };

  // Validate on load
  useEffect(() => {
    handleValidate();
  }, [handleValidate]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
      
      {/* Status Card */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Blockchain Status</h3>
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-full ${
            status.valid === null ? 'bg-gray-200' : 
            status.valid ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {status.valid === null ? (
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4c0-1.165.549-2.165 1.403-2.816l-.898-.898A6.002 6.002 0 006 13c0 3.314 2.686 6 6 6s6-2.686 6-6-2.686-6-6-6c-1.905 0-3.58.88-4.664 2.216l.89.89z" /></svg>
            ) : status.valid ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            ) : (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          <div>
            <p className={`text-2xl font-bold ${
              status.valid === null ? 'text-gray-700' : 
              status.valid ? 'text-green-700' : 'text-red-700'
            }`}>
              {status.message || 'Validating...'}
            </p>
            <p className="text-gray-500">Current chain integrity status</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionButton
          title="Validate Chain"
          description="Check the integrity of all blocks and hashes."
          onClick={handleValidate}
          buttonText="Validate Now"
        />
        <ActionButton
          title="Mine New Block"
          description="Group all pending transactions into a new block."
          onClick={handleMine}
          buttonText={isMining ? 'Mining...' : 'Mine Block'}
          disabled={isMining}
        />
      </div>
    </div>
  );
}

function ActionButton({ title, description, onClick, buttonText, disabled }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-600 mt-2 mb-4">{description}</p>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-md font-semibold text-white transition-colors ${
          disabled 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {buttonText}
      </button>
    </div>
  );
}

/**
 * 2. Transactions Page
 */
function TransactionsPage({ showMessage }) {
  const [pending, setPending] = useState([]);
  const [form, setForm] = useState({ sender: '', receiver: '', amount: '' });
  const [errors, setErrors] = useState({});

  const fetchPending = useCallback(() => {
    api.getPendingTransactions()
      .then(setPending)
      .catch(err => showMessage('Failed to fetch pending transactions.', 'error'));
  }, [showMessage]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const res = await api.createTransaction(form);

    if (!res.ok) {
      const data = await res.json();
      if (data.errors) {
        setErrors(data.errors);
      } else {
        showMessage(data.message || 'Transaction failed.', 'error');
      }
    } else {
      const newTx = await res.json();
      showMessage('Transaction created successfully!', 'success');
      setPending([newTx, ...pending]);
      setForm({ sender: '', receiver: '', amount: '' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Create Transaction Form */}
      <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow h-fit">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Create Transaction</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Sender"
            name="sender"
            value={form.sender}
            onChange={handleChange}
            error={errors.sender}
            placeholder="e.g., Alice"
          />
          <FormInput
            label="Receiver"
            name="receiver"
            value={form.receiver}
            onChange={handleChange}
            error={errors.receiver}
            placeholder="e.g., Bob"
          />
          <FormInput
            label="Amount"
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleChange}
            error={errors.amount}
            placeholder="e.g., 10.5"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            Submit Transaction
          </button>
        </form>
      </div>

      {/* Pending Transactions List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Pending Transactions</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pending.length === 0 ? (
            <p className="text-gray-500">No pending transactions.</p>
          ) : (
            pending.map(tx => <TransactionCard key={tx.id} tx={tx} />)
          )}
        </div>
      </div>
    </div>
  );
}

function FormInput({ label, name, error, ...props }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={name}
        name={name}
        className={`w-full px-3 py-2 border rounded-md ${
          error ? 'border-red-500' : 'border-gray-300'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error[0]}</p>}
    </div>
  );
}

function TransactionCard({ tx }) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex justify-between items-center">
        <div className="font-mono text-sm">
          <span className="font-bold text-red-600">{tx.sender}</span>
          <span className="text-gray-500"> → </span>
          <span className="font-bold text-green-600">{tx.receiver}</span>
        </div>
        <div className="font-bold text-lg text-gray-800">{tx.amount}</div>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        ID: {tx.id} | Timestamp: {tx.timestamp}
      </div>
    </div>
  );
}

/**
 * 3. Blocks Page
 */
function BlocksPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBlocks()
      .then(setBlocks)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading blocks...</p>;
  }

  return (
    <div className="space-y-6">
      {blocks.length === 0 ? (
        <p className="text-gray-500">No blocks mined yet. (Try mining the Genesis Block!)</p>
      ) : (
        <div className="space-y-4">
          {blocks.map(block => (
            <BlockCard key={block.id} block={block} />
          ))}
        </div>
      )}
    </div>
  );
}

function BlockCard({ block }) {
  const [isOpen, setIsOpen] = useState(false);
  const isGenesis = block.index_no === 0;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div 
        className={`p-4 ${isGenesis ? 'bg-blue-50' : 'bg-white'} border-b border-gray-200 cursor-pointer`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <h3 className="text-2xl font-bold text-blue-700">
            Block #{block.index_no} {isGenesis && "(Genesis Block)"}
          </h3>
          <div className="text-sm text-gray-500 font-mono mt-2 md:mt-0">
            {new Date(block.timestamp * 1000).toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* Block Hashes */}
      <div className="p-4 space-y-3 font-mono text-sm">
        <HashEntry label="Hash" hash={block.current_hash} color="text-green-600" />
        <HashEntry label="Prev. Hash" hash={block.previous_hash} color="text-red-600" />
        <div className="pt-2">
          <span className="text-gray-600">Nonce: </span>
          <span className="font-bold text-gray-800">{block.nonce}</span>
        </div>
      </div>

      {/* Transactions Toggle */}
      <div 
        className="p-4 bg-gray-50 border-t border-gray-200 cursor-pointer hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h4 className="font-semibold text-gray-700">
          {isOpen ? 'Hide' : 'Show'} {block.transactions.length} Transactions
        </h4>
      </div>

      {/* Transactions List (Collapsible) */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200 bg-white">
          {block.transactions.length === 0 ? (
            <p className="text-gray-500 text-sm">No transactions in this block.</p>
          ) : (
            <div className="space-y-2">
              {block.transactions.map(tx => (
                <TransactionCard key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HashEntry({ label, hash, color }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`break-all ${color} font-bold`}>{hash}</span>
    </div>
  );
}