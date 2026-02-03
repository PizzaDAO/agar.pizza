import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { fetchPizzaDAONFTs, saveSelectedNFT, getSelectedNFT } from "../lib/nft-fetch";
import { NFTDisplayItem } from "../lib/nft-types";

interface NFTPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string | null) => void;
}

export function NFTPicker({ isOpen, onClose, onSelect }: NFTPickerProps) {
  const { address, isConnected } = useAccount();
  const [nfts, setNfts] = useState<NFTDisplayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<string | null>(getSelectedNFT());

  // Fetch NFTs when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      fetchPizzaDAONFTs(address)
        .then((fetchedNfts) => {
          setNfts(fetchedNfts);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setNfts([]);
    }
  }, [isConnected, address]);

  if (!isOpen) return null;

  const handleSelect = (nft: NFTDisplayItem | null) => {
    const imageUrl = nft?.imageUrl || null;
    setSelectedNFT(imageUrl);
    saveSelectedNFT(imageUrl);
    onSelect(imageUrl);
    onClose();
  };

  const handleUseDefault = () => {
    setSelectedNFT(null);
    saveSelectedNFT(null);
    onSelect(null);
    onClose();
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: "#FFC107" }}>Choose Your Pizza</h2>
          <button onClick={onClose} style={closeButtonStyle}>
            X
          </button>
        </div>

        {!isConnected ? (
          <div style={connectPromptStyle}>
            <p style={{ marginBottom: 16, color: "#ccc" }}>
              Connect your wallet to use your Rare Pizza NFT as your blob!
            </p>
            <ConnectButton />
          </div>
        ) : loading ? (
          <div style={loadingStyle}>
            <div style={spinnerStyle} />
            <p style={{ color: "#ccc" }}>Loading your NFTs...</p>
          </div>
        ) : nfts.length === 0 ? (
          <div style={emptyStyle}>
            <p style={{ color: "#ccc", marginBottom: 16 }}>
              No PizzaDAO NFTs found in your wallet
            </p>
            <a
              href="https://rarepizzas.com"
              target="_blank"
              rel="noopener noreferrer"
              style={linkStyle}
            >
              Get a Rare Pizza
            </a>
          </div>
        ) : (
          <>
            <div style={gridStyle}>
              {nfts.map((nft) => (
                <button
                  key={`${nft.contractAddress}-${nft.tokenId}`}
                  onClick={() => handleSelect(nft)}
                  style={{
                    ...nftCardStyle,
                    border: selectedNFT === nft.imageUrl
                      ? "3px solid #FFC107"
                      : "3px solid transparent",
                  }}
                >
                  <img
                    src={nft.thumbnailUrl || nft.imageUrl}
                    alt={nft.name}
                    style={nftImageStyle}
                    loading="lazy"
                  />
                  <span style={nftNameStyle}>{nft.name}</span>
                </button>
              ))}
            </div>
            <button onClick={handleUseDefault} style={defaultButtonStyle}>
              Use Default Pizza
            </button>
          </>
        )}

        {isConnected && (
          <div style={walletInfoStyle}>
            <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
};

const modalStyle: React.CSSProperties = {
  background: "#1a1a2e",
  borderRadius: 16,
  padding: 24,
  maxWidth: 600,
  maxHeight: "80vh",
  width: "90%",
  overflow: "auto",
  border: "1px solid rgba(255, 193, 7, 0.3)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const closeButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#888",
  fontSize: 20,
  cursor: "pointer",
  padding: 8,
};

const connectPromptStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "40px 20px",
};

const loadingStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "40px 20px",
  gap: 16,
};

const spinnerStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  border: "4px solid rgba(255, 255, 255, 0.2)",
  borderTopColor: "#FFC107",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const emptyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "40px 20px",
};

const linkStyle: React.CSSProperties = {
  color: "#FFC107",
  textDecoration: "none",
  padding: "12px 24px",
  border: "2px solid #FFC107",
  borderRadius: 8,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const nftCardStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.1)",
  borderRadius: 12,
  padding: 8,
  cursor: "pointer",
  transition: "all 0.2s",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

const nftImageStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "1",
  objectFit: "cover",
  borderRadius: 8,
};

const nftNameStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#fff",
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
};

const defaultButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 24px",
  background: "rgba(255, 255, 255, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  borderRadius: 8,
  color: "#ccc",
  fontSize: 14,
  cursor: "pointer",
  marginTop: 8,
};

const walletInfoStyle: React.CSSProperties = {
  marginTop: 24,
  paddingTop: 16,
  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  display: "flex",
  justifyContent: "center",
};
