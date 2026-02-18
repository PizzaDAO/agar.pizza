import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, base, polygon, optimism, zora } from "viem/chains";

export const config = getDefaultConfig({
  appName: "Agar.Pizza",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [mainnet, base, polygon, optimism, zora],
  ssr: false,
});
