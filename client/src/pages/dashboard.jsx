import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AddTransactionModal from "../components/AddModal";

function BudgetMateDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const navigate = useNavigate();

  const API_BASE = "http://localhost:5000";

  // Load stored budget
  useEffect(() => {
    const saved = localStorage.getItem("monthlyBudget");
    if (saved) setMonthlyBudget(parseFloat(saved));
  }, []);



  const getTransactions = async () => {
    const id = localStorage.getItem('id');
    if (!id) return console.error("No id found.");

    try {
      const response = await axios.get(`${API_BASE}/transactions/${id}`, {
        withCredentials: true
      });

      if (response.data && response.data.transactions) {
        setTransactions(
          response.data.transactions.map((t) => ({
            ...t,
            amount: parseFloat(t.amount)
          }))
        );
      } else {
        console.error("Transactions not found in response:", response.data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    getTransactions();
  }, []);

  // Delete
  const deleteTransaction = async (transactionId) => {
    try {
      await axios.delete(`${API_BASE}/delete-transaction/${transactionId}`);
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const handleTransactionUpdate = async (id, newAmount, newCategory) => {
  try {
    // Send PUT request to update transaction
    const response = await axios.put(`${API_BASE}/update-transaction/${id}`, {
      category: newCategory,
      amount: newAmount,
    });

    if (response.data.success) {
      // Update state if the transaction was updated successfully
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                amount: parseFloat(newAmount),
                description: newCategory,  
              }
            : t
        )
      );
      setEditingTransactionId(null);
      getTransactions();
    }
  } catch (error) {
    console.error("Error updating transaction:", error);
  }
  
};


const startEdit = (transaction) => {
  setEditingTransactionId(transaction.id);
  setEditAmount(transaction.amount);
  setEditDescription(transaction.category); 
};

  const cancelEdit = () => setEditingTransactionId(null);

  // Monthly budget editing
  const startEditBudget = () => {
    setBudgetInput(monthlyBudget !== null ? monthlyBudget.toString() : "");
    setIsEditingBudget(true);
  };
  const saveBudget = () => {
    const val = parseFloat(budgetInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyBudget(val);
      localStorage.setItem("monthlyBudget", val);
      setIsEditingBudget(false);
    } else {
      alert("Please enter a valid positive number for budget.");
    }
  };
  const cancelEditBudget = () => setIsEditingBudget(false);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/");
  };

  // Calculations
  const totalExpenses = transactions.reduce(
    (acc, t) => (t.type === "expense" ? acc + t.amount : acc),
    0
  );
  const totalIncome = transactions.reduce(
    (acc, t) => (t.type === "income" ? acc + t.amount : acc),
    0
  );
  const balance = monthlyBudget - totalExpenses;

  // Category totals
  const categoryTotals = transactions.reduce((acc, t) => {
    if (t.type === "expense") {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
    }
    return acc;
  }, {});
  const categories = Object.entries(categoryTotals);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-400 to-pink-400 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-black-800">
            💸 BudgetMate Dashboard
          </h1>
          <button
            className="bg-teal-300 hover:bg-teal-600 text-white px-4 py-2 rounded-lg"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Monthly Budget */}
          <div className="bg-white shadow-lg rounded-lg p-6 border-2 border-teal-700">
            <h2 className="text-xs font-semibold text-teal-700 mb-2">
              🎯 Monthly Budget
            </h2>
            {!isEditingBudget ? (
              <>
                <p className="text-md text-gray-700">Original Budget:</p>
                <p className="text-xl font-bold text-indigo-600 mb-2">
                  ₱{monthlyBudget !== null ? monthlyBudget.toFixed(2) : "--"}
                </p>
                <p className="text-md text-gray-700">Budget + Total Income:</p>
                <p className="text-2xl font-bold text-green-700 mb-2">
                  ₱
                  {monthlyBudget !== null
                    ? (monthlyBudget + totalIncome).toFixed(2)
                    : "--"}
                </p>
                <button
                  className="text-sm text-indigo-500 hover:underline"
                  onClick={startEditBudget}
                >
                  Edit Budget
                </button>
                {monthlyBudget !== null &&
                  totalExpenses > monthlyBudget + totalIncome && (
                    <p className="mt-4 text-red-600 font-semibold">
                      ⚠️ You have exceeded your combined budget!
                    </p>
                  )}
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <div className="flex gap-2">
                  <button
                    className="bg-teal-500 text-white px-3 py-1 rounded-lg"
                    onClick={saveBudget}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded-lg"
                    onClick={cancelEditBudget}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Balance */}
          <div className="bg-white shadow-lg rounded-lg p-6 border-2 border-teal-700">
            <h2 className="text-xl font-semibold text-teal-700 mb-2">
              💰 Balance
            </h2>
            <p className="text-2xl font-bold text-teal-600">
              ₱{balance.toFixed(2)}
            </p>
          </div>

          {/* Total Expenses */}
          <div className="bg-white shadow-lg rounded-lg p-6 border-2 border-teal-700">
            <h2 className="text-md font-semibold text-teal-700 mb-2">
              💸 Total Expenses
            </h2>
            <p className="text-3xl font-bold text-red-600">
              ₱{totalExpenses.toFixed(2)}
            </p>
          </div>

          {/* Total Income */}
          <div className="bg-white shadow-lg rounded-lg p-6 border-2 border-teal-700">
            <h2 className="text-md font-semibold text-teal-700 mb-2">
              💵 Total Income
            </h2>
            <p className="text-3xl font-bold text-green-600">
              ₱{totalIncome.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white shadow-lg rounded-lg p-6 border-2 border-teal-700 mb-6">
          <h2 className="text-xl font-semibold text-teal-700 mb-4">
            📂 Monthly Expenses
          </h2>
          {categories.length > 0 ? (
            <ul className="space-y-2">
              {categories.map(([category, total]) => {
                const isTooHigh = total > 10000;
                const notNeeds = [
                  "entertainment",
                  "games",
                  "shoes",
                  "clothing",
                  "luxury",
                  "gadget",
                  "vacation",
                ];
                const isNotNeed = notNeeds.some((kw) =>
                  category.toLowerCase().includes(kw)
                );
                return (
                  <li
                    key={category}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 border-b pb-2"
                  >
                    <div>
                      <span className="font-medium">{category}</span>
                      {isTooHigh && (
                        <span className="ml-2 text-red-500 text-sm font-semibold">
                          Too High 💥
                        </span>
                      )}
                      {isNotNeed && (
                        <span className="ml-2 text-yellow-500 text-sm font-semibold">
                          Not a Need ⚠️
                        </span>
                      )}
                    </div>
                    <span className="text-teal-600 font-bold">
                      ₱{total.toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-600">No expense categories yet.</p>
          )}
        </div>

        {/* Transactions List */}
        <div className="bg-white shadow-lg rounded-lg p-6 border-2 border-teal-700">
          <h2 className="text-xl font-semibold text-teal-700 mb-4">
            📊 Transactions
          </h2>
          <div className="max-h-72 overflow-y-auto">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center mb-3"
                >
                  {editingTransactionId === transaction.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row gap-2 items-center">
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="px-2 py-1 border rounded w-full sm:w-1/2"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="px-2 py-1 border rounded w-full sm:w-1/3"
                      />
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        <button
                          className="bg-green-500 text-white px-2 py-1 rounded"
                          onClick={() =>
                            handleTransactionUpdate(
                              transaction.id,
                              editAmount,
                              editDescription
                            )
                          }
                        >
                          Save
                        </button>
                        <button
                          className="bg-gray-400 text-white px-2 py-1 rounded"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`flex-1 text-center py-2 rounded-lg cursor-pointer ${transaction.type === "income"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
                          }`}
                      >
                        {transaction.category} - ₱{transaction.amount.toFixed(2)}
                      </div>
                      <div className="flex gap-2 ml-3">
                        <button
                          className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg"
                          onClick={() => startEdit(transaction)}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-teal-300 hover:bg-teal-600 text-white px-3 py-1 rounded-lg"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">
                No transactions recorded.
              </p>
            )}
          </div>
          <button
            className="w-full mt-4 bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600"
            onClick={() => setShowAddModal(true)}
          >
            ➕ Add Transaction
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddTransactionModal
          hide={() => setShowAddModal(false)}
          refreshTransactions={getTransactions}
        />
      )}

    </div>
  );
}

export default BudgetMateDashboard;
