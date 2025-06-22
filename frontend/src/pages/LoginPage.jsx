import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contractABI/contract.js";

export default function LoginPage() {
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkConnection();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setIsConnected(false);
          setIsAdmin(false);
        } else {
          window.location.reload();
        }
      });
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const userAddress = accounts[0].address;
          setAccount(userAddress);
          setIsConnected(true);

          const signer = await provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          const adminAddress = await contract.admin();
          const isAdminAccount = userAddress.toLowerCase() === adminAddress.toLowerCase();
          setIsAdmin(isAdminAccount);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const userAddress = accounts[0];
        setAccount(userAddress);
        setIsConnected(true);

        const adminAddress = await contract.admin();
        const isAdminAccount = userAddress.toLowerCase() === adminAddress.toLowerCase();
        setIsAdmin(isAdminAccount);
      } catch (error) {
        console.error("Wallet connection error:", error);
        alert("Failed to connect wallet. Please try again.");
      }
    } else {
      alert("MetaMask not found. Please install MetaMask.");
    }
  };

  const handleAdminLogin = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (isAdmin) {
      navigate("/admin", { state: { account: account } });
    } else {
      alert("Access denied. You are not the admin.");
    }
  };

  const handleUserLogin = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    navigate("/user", { state: { account: account } });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img
          src="/logoh2h.jpg"
          alt="Heart2Help Logo"
          style={{ height: "50px", marginBottom: "10px" }}
        />
        <h1 style={styles.title}>Heart2Help</h1>
        <p style={styles.subtitle}>Connect your MetaMask wallet</p>

        {isConnected && (
          <div style={styles.status}>
            <p style={styles.connected}>✓ Wallet Connected</p>
            <p style={styles.address}>
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </p>
            {isAdmin && <p style={styles.admin}>Admin Account</p>}
          </div>
        )}

        <div style={styles.buttonGroup}>
          <button style={styles.adminBtn} onClick={handleAdminLogin}>
            {isConnected ? "Admin Panel" : "Login as Admin"}
          </button>
          <button style={styles.userBtn} onClick={handleUserLogin}>
            {isConnected ? "User Panel" : "Login as User"}
          </button>
        </div>
{/* Optional debug info */}
        <div style={styles.debug}>
          <p>Connected: {isConnected ? "Yes" : "No"}</p>
          <p>Admin: {isAdmin ? "Yes" : "No"}</p>
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
    height: "100vh",
    backgroundColor: "#f5f5f5",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
    minWidth: "320px",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "10px",
    color: "#4b7251",
    fontFamily: "Arial, sans-serif",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#4b5563",
    marginBottom: "20px",
    fontFamily: "Arial, sans-serif",
  },
  status: {
    marginBottom: "20px",
  },
  connected: {
    color: "#10b981",
    fontWeight: "600",
  },
  address: {
    fontSize: "0.85rem",
    color: "#6b7280",
  },
  admin: {
    fontSize: "0.9rem",
    fontWeight: "bold",
    color: "#2563eb",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  adminBtn: {
    padding: "12px",
    borderRadius: "10px",
    backgroundColor: "#4b7251",
    color: "#fff",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    fontFamily: "Arial, sans-serif",
  },
  userBtn: {
    padding: "12px",
    borderRadius: "10px",
    backgroundColor: "#10b981",
    color: "#fff",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    fontFamily: "Arial, sans-serif",
  },
  debug: {
    marginTop: "20px",
    fontSize: "0.75rem",
    color: "#9ca3af",
  },
};