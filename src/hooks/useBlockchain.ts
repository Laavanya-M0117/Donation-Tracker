import { useState, useEffect, useCallback, useRef } from 'react';
import { BlockchainService, NGO, Donation } from '../lib/blockchain';
import { toast } from 'sonner';
import { mockNGOs, mockDonations } from '../lib/mockData';

export interface BlockchainState {
  account: string;
  ngos: NGO[];
  donations: Donation[];
  pendingWithdrawals: { [key: string]: string };
  loading: boolean;
  refreshing: boolean;
  isOwner: boolean;
  connectionError: string | null;
  balance: string;
}

export interface BlockchainActions {
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  registerNGO: (name: string, metadata: string, description: string, website: string, contact: string) => Promise<void>;
  donate: (ngoWallet: string, amount: string, message: string) => Promise<void>;
  addProof: (donationId: number, cid: string) => Promise<void>;
  withdraw: (amount: string) => Promise<void>;
  approveNGO: (ngoWallet: string, approved: boolean) => Promise<void>;
}

export function useBlockchain(): [BlockchainState, BlockchainActions] {
  const [state, setState] = useState<BlockchainState>({
    account: '',
    ngos: mockNGOs as any, // Show mock data initially for demonstration
    donations: mockDonations as any, // Show mock data initially for demonstration
    pendingWithdrawals: {},
    loading: false,
    refreshing: false,
    isOwner: false,
    connectionError: null,
    balance: '0',
  });

  const blockchainRef = useRef(new BlockchainService());
  const blockchain = blockchainRef.current;

  // Auto-refresh interval
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  // Use ref to store current account to avoid dependency issues
  const accountRef = useRef(state.account);

  // Update ref when account changes
  useEffect(() => {
    accountRef.current = state.account;
  }, [state.account]);

  const updateState = useCallback((updates: Partial<BlockchainState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (!accountRef.current) return;

    try {
      if (showRefreshing) updateState({ refreshing: true });

      const [ngosData, donationsData, pendingData, balance, ownerStatus] = await Promise.all([
        blockchain.getNGOs(),
        blockchain.getDonations(),
        blockchain.getPendingWithdrawals(),
        blockchain.getBalance(),
        blockchain.isOwner(),
      ]);

      // Merge blockchain data with mock data for demonstration
      // Only show mock data if blockchain has no data yet
      const mergedNGOs = ngosData.length > 0 ? ngosData : [...mockNGOs as any];
      const mergedDonations = donationsData.length > 0 ? donationsData : [...mockDonations as any];

      updateState({
        ngos: mergedNGOs,
        donations: mergedDonations,
        pendingWithdrawals: pendingData,
        balance,
        isOwner: ownerStatus,
        connectionError: null,
      });
    } catch (error: any) {
      console.error('Failed to load data:', error);
      updateState({ connectionError: error.message || 'Failed to load blockchain data' });
      toast.error(error.message || 'Failed to load blockchain data');
    } finally {
      if (showRefreshing) updateState({ refreshing: false });
    }
  }, [blockchain, updateState]);

  const connect = useCallback(async () => {
    try {
      updateState({ loading: true, connectionError: null });
      const connectedAccount = await blockchain.connect();
      updateState({ account: connectedAccount });
      toast.success('Connected to Polygon Amoy Testnet! 🎉');
      
      // Start auto-refresh
      refreshIntervalRef.current = setInterval(() => {
        loadData(false);
      }, 30000); // Refresh every 30 seconds
    } catch (error: any) {
      console.error('Connection failed:', error);
      updateState({ connectionError: error.message });
      throw error;
    } finally {
      updateState({ loading: false });
    }
  }, [blockchain, updateState, loadData]);

  const disconnect = useCallback(() => {
    blockchain.disconnect();
    updateState({
      account: '',
      isOwner: false,
      pendingWithdrawals: {},
      connectionError: null,
      balance: '0',
    });
    
    // Clear auto-refresh
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
  }, [blockchain, updateState]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const registerNGO = useCallback(async (
    name: string,
    metadata: string,
    description: string,
    website: string,
    contact: string
  ) => {
    try {
      await blockchain.registerNGO(name, metadata, description, website, contact);
      toast.success('NGO registration submitted! Waiting for blockchain confirmation...');
      
      setTimeout(async () => {
        await loadData(false);
        toast.success('NGO registered successfully! 🎉');
      }, 3000);
    } catch (error: any) {
      console.error('NGO registration failed:', error);
      throw error;
    }
  }, [blockchain, loadData]);

  const donate = useCallback(async (ngoWallet: string, amount: string, message: string) => {
    try {
      await blockchain.donate(ngoWallet, amount, message);
      toast.success('Donation transaction submitted! 💖');
      
      setTimeout(async () => {
        await loadData(false);
        toast.success('Donation confirmed on blockchain! Thank you for your generosity! 🙏');
      }, 3000);
    } catch (error: any) {
      console.error('Donation failed:', error);
      throw error;
    }
  }, [blockchain, loadData]);

  const addProof = useCallback(async (donationId: number, cid: string) => {
    try {
      await blockchain.addProof(donationId, cid);
      toast.success('Proof of impact submitted!');
      
      setTimeout(async () => {
        await loadData(false);
        toast.success('Proof of impact added successfully! ✅');
      }, 3000);
    } catch (error: any) {
      console.error('Add proof failed:', error);
      throw error;
    }
  }, [blockchain, loadData]);

  const withdraw = useCallback(async (amount: string) => {
    try {
      await blockchain.withdraw(amount);
      toast.success('Withdrawal transaction submitted!');
      
      setTimeout(async () => {
        await loadData(false);
        toast.success('Funds withdrawn successfully! 💰');
      }, 3000);
    } catch (error: any) {
      console.error('Withdrawal failed:', error);
      throw error;
    }
  }, [blockchain, loadData]);

  const approveNGO = useCallback(async (ngoWallet: string, approved: boolean) => {
    try {
      await blockchain.approveNGO(ngoWallet, approved);
      toast.success(`NGO ${approved ? 'approval' : 'rejection'} submitted!`);
      
      setTimeout(async () => {
        await loadData(false);
        toast.success(`NGO ${approved ? 'approved' : 'rejected'} successfully!`);
      }, 3000);
    } catch (error: any) {
      console.error('NGO approval failed:', error);
      throw error;
    }
  }, [blockchain, loadData]);

  // Load data when account changes
  useEffect(() => {
    if (state.account) {
      loadData(false);
    }
  }, [state.account, loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return [
    state,
    {
      connect,
      disconnect,
      refresh,
      registerNGO,
      donate,
      addProof,
      withdraw,
      approveNGO,
    },
  ];
}