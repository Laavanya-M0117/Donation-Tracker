/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_RPC_URL: string
  readonly VITE_BLOCK_EXPLORER: string
  readonly VITE_IPFS_GATEWAY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
