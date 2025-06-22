import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractABI/contract";

export default function UserPage() {
  const { state } = useLocation();
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [donationAmount, setDonationAmount] = useState({});
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);

      const isReg = await contractInstance.isDonorRegistered(await signer.getAddress());
      setIsRegistered(isReg);

      const count = await contractInstance.campaignCount();
      const fetched = [];
      for (let i = 0; i < count; i++) {
        const c = await contractInstance.campaigns(i);
        const name = typeof c.name === 'string' ? c.name : ethers.decodeBytes32String(c.name);
        fetched.push({
          id: i,
          name,
          goal: c.goal.toString(),
          collected: c.collected.toString(),
          deadline: c.deadline.toString(),
        });
      }
      setCampaigns(fetched);
    };

    loadData();
  }, []);

  const registerUser = async () => {
    try {
      const tx = await contract.register();
      await tx.wait();
      alert("Registration successful");
      setIsRegistered(true);
    } catch (err) {
      console.error("Registration failed", err);
    }
  };

  const handleDonate = async (id) => {
    try {
      const amountInEther = donationAmount[id];
      const amountInWei = ethers.parseEther(amountInEther);

      const tx = await contract.donate(id, { value: amountInWei });
      await tx.wait();
      alert("Donation successful");
      window.location.reload();
    } catch (err) {
      console.error("Donation failed", err);
      alert("Donation failed: " + err.message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Heart2Help - User</h1>

        {!isRegistered ? (
          <div style={{ textAlign: "center" }}>
            <p style={styles.info}>You are not registered. Please register to donate.</p>
            <button onClick={registerUser} style={styles.registerBtn}>Register</button>
          </div>
        ) : (
          <div style={styles.campaignGrid}>
            {campaigns.map((c) => {
              const goal = ethers.formatEther(c.goal);
              const collected = ethers.formatEther(c.collected);
              const deadlineDate = new Date(Number(c.deadline) * 1000);

              return (
                <div key={c.id} style={styles.campaignCard}>
                  <h3 style={styles.cardTitle}>{c.name}</h3>
                  <p><strong>Goal:</strong> {goal} ETH</p>
                  <p><strong>Collected:</strong> {collected} ETH</p>
                  <p><strong>Deadline:</strong> {deadlineDate.toLocaleString()}</p>

                  <input
                    type="number"
                    placeholder="Amount in ETH (0.005 - 1)"
                    step="0.001"
                    min="0.005"
                    max="1"
                    value={donationAmount[c.id] || ""}
                    onChange={(e) => setDonationAmount({ ...donationAmount, [c.id]: e.target.value })}
                    style={styles.input}
                  />
                  <button
                    onClick={() => handleDonate(c.id)}
                    style={styles.donateBtn}
                  >
                    Donate
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f1f7f6",
    padding: "30px"
  },
  card: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "1000px",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#174f37",
    textAlign: "center",
  },
  info: {
    fontSize: "1rem",
    marginBottom: "15px"
  },
  registerBtn: {
    backgroundColor: "#0d6efd",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontWeight: "600",
    cursor: "pointer"
  },
  campaignGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px"
  },
  campaignCard: {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "16px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  cardTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    marginBottom: "10px"
  },
  input: {
    marginTop: "10px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    width: "100%"
  },
  donateBtn: {
    marginTop: "10px",
    backgroundColor: "#198754",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    width: "100%",
    fontWeight: "600",
    cursor: "pointer"
  }
};