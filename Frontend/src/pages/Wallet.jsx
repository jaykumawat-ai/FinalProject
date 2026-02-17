// frontend: src/pages/Wallet.jsx
import { useEffect, useState } from "react";
import api from "../api/api";
import { IndianRupee, PlusCircle } from "lucide-react";

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    // eslint-disable-next-line
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await api.get("/wallet/");
      setBalance(res.data.balance || 0);
    } catch (err) {
      console.error("Failed to fetch wallet", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get("/wallet/transactions");
      setTransactions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  };

  const addMoney = async () => {
    if (!amount || Number(amount) <= 0) return;

    try {
      await api.post("/wallet/add", { amount: Number(amount) });
      setAmount("");
      fetchWallet();
      fetchTransactions();
    } catch  {
      alert("Failed to add money");
    }
  };

  const handleRazorpayPayment = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Enter valid amount");
      return;
    }

    setPayLoading(true);
    try {
      // Create order on backend (POST body)
      const orderRes = await api.post("/wallet/create-order", {
        amount: Number(amount)
      });

      const { order_id, razorpay_key } = orderRes.data;

      if (!order_id) throw new Error("Order creation failed");

      const options = {
        key: razorpay_key,
        amount: Number(amount) * 100,
        currency: "INR",
        name: "TravelEase Wallet",
        description: "Wallet Top-up",
        order_id: order_id,
        handler: async function (response) {
          try {
            // verify on backend
            await api.post("/wallet/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(amount)
            });

            alert("Payment Successful!");
            // refresh wallet & transactions
            await fetchWallet();
            await fetchTransactions();
            setAmount("");
          } catch (err) {
            console.error("Verification failed", err);
            alert("Payment verification failed");
          }
        },
        theme: { color: "#6D28D9" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error", err);
      alert("Payment failed: " + (err?.response?.data?.detail || err.message));
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading wallet...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Wallet 💳</h1>

      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl shadow mb-8">
        <p className="text-sm">Available Balance</p>
        <p className="text-3xl font-bold mt-2">₹{balance.toLocaleString("en-IN")}</p>
      </div>

      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <PlusCircle size={18} />
          Add Money
        </h2>

        <div className="flex gap-4">
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border rounded-lg px-4 py-2 w-full"
          />

          <button
            onClick={handleRazorpayPayment}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg"
            disabled={payLoading}
          >
            {payLoading ? "Processing..." : "Pay with Razorpay"}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>

        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn, index) => (
              <div key={index} className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-medium capitalize">{txn.type}</p>
                  <p className="text-sm text-gray-500">{txn.reason}</p>
                </div>

                <p className={`font-semibold ${txn.type === "credit" ? "text-green-600" : "text-red-600"}`}>
                  {txn.type === "credit" ? "+" : "-"}₹{txn.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
