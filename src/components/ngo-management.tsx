import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Building2, DollarSign, Upload, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface NGO {
  wallet: string;
  name: string;
  metadataCID: string;
  approved: boolean;
  totalReceived: string;
  totalWithdrawn: string;
}

interface Donation {
  id: number;
  donor: string;
  ngo: string;
  amount: string;
  timestamp: number;
  message: string;
  proofCID: string;
}

interface NGOManagementProps {
  account: string;
  ngos: NGO[];
  donations: Donation[];
  pendingWithdrawals: { [key: string]: string };
  onAddProof: (donationId: number, cid: string) => Promise<void>;
  onWithdraw: (amount: string) => Promise<void>;
}

export function NGOManagement({ 
  account, 
  ngos, 
  donations, 
  pendingWithdrawals,
  onAddProof, 
  onWithdraw 
}: NGOManagementProps) {
  const [proofCID, setProofCID] = useState('');
  const [selectedDonationId, setSelectedDonationId] = useState<number | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isAddingProof, setIsAddingProof] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const userNGO = ngos.find(ngo => ngo.wallet.toLowerCase() === account.toLowerCase());
  const userDonations = donations.filter(d => d.ngo.toLowerCase() === account.toLowerCase());
  const pendingAmount = pendingWithdrawals[account] || '0';

  const formatAmount = (amount: string) => {
    return (Number(amount) / 1e18).toFixed(4);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleAddProof = async () => {
    if (!selectedDonationId || !proofCID.trim()) {
      toast.error('Please enter a valid proof CID');
      return;
    }

    setIsAddingProof(true);
    try {
      await onAddProof(selectedDonationId, proofCID);
      setProofCID('');
      setSelectedDonationId(null);
      toast.success('Proof added successfully!');
    } catch (error) {
      console.error('Add proof error:', error);
      toast.error('Failed to add proof');
    } finally {
      setIsAddingProof(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }

    const withdrawWei = parseFloat(withdrawAmount) * 1e18;
    const pendingWei = parseFloat(pendingAmount);

    if (withdrawWei > pendingWei) {
      toast.error('Insufficient balance for withdrawal');
      return;
    }

    setIsWithdrawing(true);
    try {
      await onWithdraw(withdrawAmount);
      setWithdrawAmount('');
      toast.success('Withdrawal successful!');
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to withdraw funds');
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!account) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Connect your wallet to access NGO management</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userNGO) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>You are not registered as an NGO</p>
            <p className="text-sm">Register your NGO to access this panel</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* NGO Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {userNGO.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={userNGO.approved ? 'default' : 'secondary'}>
                {userNGO.approved ? 'Approved' : 'Pending Approval'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-lg font-semibold text-green-600">
                {formatAmount(userNGO.totalReceived)} MATIC
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available to Withdraw</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatAmount(pendingAmount)} MATIC
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Funds Card */}
      {userNGO.approved && Number(pendingAmount) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Withdraw Funds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="withdraw-amount">Amount (MATIC)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  step="0.001"
                  min="0"
                  max={formatAmount(pendingAmount)}
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="w-full sm:w-auto"
                >
                  {isWithdrawing ? 'Processing...' : 'Withdraw'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Available: {formatAmount(pendingAmount)} MATIC
            </p>
          </CardContent>
        </Card>
      )}

      {/* Donations Received */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Donations Received
            </span>
            <Badge variant="secondary">{userDonations.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userDonations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No donations received yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">#{donation.id}</p>
                      <p className="text-sm text-muted-foreground">
                        From: {formatAddress(donation.donor)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">
                        {formatAmount(donation.amount)} MATIC
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(donation.timestamp * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {donation.message && (
                    <p className="text-sm bg-muted p-2 rounded mb-3">
                      "{donation.message}"
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {donation.proofCID ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600">Proof attached</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`https://ipfs.io/ipfs/${donation.proofCID}`, '_blank')}
                            className="gap-1 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No proof attached</span>
                      )}
                    </div>

                    {!donation.proofCID && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDonationId(donation.id)}
                            className="gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Add Proof
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Impact Proof</DialogTitle>
                            <DialogDescription>
                              Add proof of how this donation was used (IPFS CID or URL)
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Donation #{donation.id}</Label>
                              <p className="text-sm text-muted-foreground">
                                Amount: {formatAmount(donation.amount)} MATIC
                              </p>
                            </div>
                            <div>
                              <Label htmlFor="proof-cid">Proof CID/URL</Label>
                              <Input
                                id="proof-cid"
                                placeholder="Enter IPFS CID or URL"
                                value={proofCID}
                                onChange={(e) => setProofCID(e.target.value)}
                              />
                            </div>
                            <Button
                              onClick={handleAddProof}
                              disabled={isAddingProof}
                              className="w-full"
                            >
                              {isAddingProof ? 'Adding Proof...' : 'Add Proof'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}