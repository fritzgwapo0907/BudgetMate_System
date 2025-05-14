import { useState } from "react";
import axios from "axios";

function AddTransactionModal({ hide, refreshTransactions, userId }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense"); 
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); 

  const apiUrl = "http://localhost:5000"; 

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    
    if (!description || !amount || isNaN(amount) || amount <= 0 || amount.trim() === '') {
      setError("Please fill in all fields correctly.");
      setIsLoading(false);
      return;
    }

    try {
      const formattedAmount = parseFloat(amount).toFixed(2);

      
      const userId = localStorage.getItem("id"); 

      const response = await axios.post(`${apiUrl}/add-transaction`, {
        userId, 
        description,
        amount: formattedAmount,
        type,
      });

      if (response.data.success) {
       
        setDescription("");
        setAmount("");
        setType("expense");
        hide();
        refreshTransactions();
      } else {
        setError(response.data.message || "Failed to add transaction.");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      setError("An error occurred while adding the transaction.");
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold text-teal-700 mb-4">Add Transaction</h2>

        
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
        
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

         
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Type</label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={type === "income"}
                  onChange={() => setType("income")}
                  className="form-radio text-teal-500"
                  aria-label="Income"
                />
                <span className="ml-2 text-gray-700">Income</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={type === "expense"}
                  onChange={() => setType("expense")}
                  className="form-radio text-red-500"
                  aria-label="Expense"
                />
                <span className="ml-2 text-gray-700">Expense</span>
              </label>
            </div>
          </div>

        
          <div className="flex justify-between gap-4">
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg w-full sm:w-auto"
              onClick={hide}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-teal-500 text-white px-4 py-2 rounded-lg w-full sm:w-auto hover:bg-teal-600"
              disabled={isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTransactionModal;
