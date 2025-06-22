import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractABI/contract";

export default function AdminPage() {
  const { state } = useLocation();
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(true);
  const [adminAddress, setAdminAddress] = useState("");
  const [userAddress, setUserAddress] = useState("");

  const safeFormatEther = (value, defaultValue = "0.0") => {
    try {
      if (!value || value === "0x") {
        return defaultValue;
      }
      return ethers.formatEther(value);
    } catch (error) {
      console.warn("Error formatting ether value:", value, error);
      return defaultValue;
    }
  };

  useEffect(() => {
    const loadContract = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const userAddr = await signer.getAddress();
        setUserAddress(userAddr);

        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);

        const adminAddr = await contractInstance.admin();
        setAdminAddress(adminAddr);

        if (userAddr.toLowerCase() !== adminAddr.toLowerCase()) {
          alert("Access denied. You are not the admin.");
          window.history.back();
          return;
        }

        const count = await contractInstance.campaignCount();
        const fetched = [];

        for (let i = 0; i < count; i++) {
          try {
            const c = await contractInstance.campaigns(i);
            const name = typeof c.name === 'string' ? c.name : ethers.decodeBytes32String(c.name);
            fetched.push({
              id: i,
              name,
              goal: c.goal.toString(),
              collected: c.collected.toString(),
              deadline: c.deadline.toString(),
            });
          } catch (error) {
            console.warn("Error loading campaign " + i + ":", error);
          }
        }
        setCampaigns(fetched);
      } catch (error) {
        console.error("Error loading contract:", error);
        alert("Failed to load admin panel: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadContract();
  }, []);

  const handleCreate = async () => {
    if (!name || !goal || !duration) {
      alert("Please fill in all fields");
      return;
    }
    if (parseFloat(goal) <= 0) {
      alert("Goal must be greater than 0");
      return;
    }
    if (parseInt(duration) <= 0) {
      alert("Duration must be greater than 0 days");
      return;
    }

    try {
      const tx = await contract.createCampaign(name, ethers.parseEther(goal), duration);
      alert("Creating campaign... Please wait for confirmation.");
      await tx.wait();
      alert("Campaign created successfully!");

      setName("");
      setGoal("");
      setDuration("");

      window.location.reload();
    } catch (err) {
      console.error("Create failed", err);
      alert("Failed to create campaign: " + err.message);
    }
  };

  const handleWithdraw = async (campaignId) => {
    if (!window.confirm("Are you sure you want to withdraw funds from campaign " + campaignId + "?")) {
      return;
    }

    try {
      const tx = await contract.withdrawFunds(campaignId);
      alert("Processing withdrawal... Please wait for confirmation.");
      await tx.wait();
      alert("Withdrawal successful!");
      window.location.reload();
    } catch (err) {
      console.error("Withdraw failed", err);
      alert("Withdrawal failed: " + err.message);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}><h2>Loading...</h2></div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Admin Panel</h1>

        <div style={styles.formRow}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Campaign Name" style={styles.input} />
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal (ETH)" type="number" style={styles.input} />
          <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (Days)" type="number" style={styles.input} />
        </div>

        <button onClick={handleCreate} style={styles.createBtn}>Create Campaign</button>

        <h2 style={styles.subtitle}>Active Campaigns</h2>
        <div style={styles.campaignGrid}>
          {campaigns.map((c, index) => {
            const goalEth = safeFormatEther(c.goal);
            const collectedEth = safeFormatEther(c.collected);
            const progress = parseFloat(goalEth) > 0 ? (parseFloat(collectedEth) / parseFloat(goalEth)) * 100 : 0;
            const deadlineDate = new Date(Number(c.deadline) * 1000);

            return (
              <div key={index} style={styles.campaignCard}>
                <h3 style={styles.cardTitle}>{c.name}</h3>
                <p><strong>Goal:</strong> {goalEth} ETH</p>
                <p><strong>Collected:</strong> {collectedEth} ETH</p>
                <p><strong>Deadline:</strong> {deadlineDate.toLocaleString()}</p>
                <div style={styles.progressBarOuter}>
                  <div style={{ ...styles.progressBarInner, width: '${progress.toFixed(2)}%' }}></div>
                </div>
                <p><strong>Progress:</strong> {progress.toFixed(2)}%</p>
                <button
                  onClick={() => handleWithdraw(index)}
                  disabled={parseFloat(collectedEth) === 0}
                  style={parseFloat(collectedEth) === 0 ? styles.disabledBtn : styles.withdrawBtn}
                >
                  {parseFloat(collectedEth) === 0 ? 'No Funds Available' : 'Withdraw Funds'}
                </button>
              </div>
            );
          })}
        </div>
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
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "1000px",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "20px",
    color: "#174f37",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "1.3rem",
    color: "#174f37",
    margin: "30px 0 10px",
    fontWeight: "600"
  },
  formRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "20px"
  },
  input: {
    flex: "1",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontFamily: "Arial, sans-serif",
  },
  createBtn: {
    backgroundColor: "#198754",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px 20px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "1rem",
    fontFamily: "Arial, sans-serif",
    display: "block",
    margin: "20px auto 0 auto",
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
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    fontFamily: "Arial, sans-serif",
  },
  cardTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    marginBottom: "10px"
  },
  progressBarOuter: {
    width: "100%",
    backgroundColor: "#e0e0e0",
    borderRadius: "12px",
    overflow: "hidden",
    height: "10px",
    margin: "10px 0"
  },
  progressBarInner: {
    height: "10px",
    backgroundColor: "#198754"
  },
  withdrawBtn: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    width: "100%",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily: "Arial, sans-serif",
  },
  disabledBtn: {
    backgroundColor: "#ccc",
    color: "white",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    width: "100%",
    fontWeight: "600",
    cursor: "not-allowed",
    fontFamily: "Arial, sans-serif",
  }
};