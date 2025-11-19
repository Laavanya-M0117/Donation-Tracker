import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Shield, Building2, Check, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface NGO {
  wallet: string;
  name: string;
  metadataCID: string;
  approved: boolean;
  totalReceived: string;
  totalWithdrawn: string;
}

interface AdminPanelProps {
  account: string;
  isOwner: boolean;
  ngos: NGO[];
  onApproveNGO: (ngoWallet: string, approved: boolean) => Promise<void>;
}

export function AdminPanel({ account, isOwner, ngos, onApproveNGO }: AdminPanelProps) {
  const [loadingNGO, setLoadingNGO] = useState<string | null>(null);

  const formatAmount = (amount: string) => {
    return (Number(amount) / 1e18).toFixed(4);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleApproval = async (ngoWallet: string, approved: boolean) => {
    setLoadingNGO(ngoWallet);
    try {
      await onApproveNGO(ngoWallet, approved);
      toast.success(`NGO ${approved ? 'approved' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(`Failed to ${approved ? 'approve' : 'reject'} NGO`);
    } finally {
      setLoadingNGO(null);
    }
  };

  if (!account) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Connect your wallet to access admin panel</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Access Denied</p>
            <p className="text-sm">Only the contract owner can access this panel</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingNGOs = ngos.filter(ngo => !ngo.approved);
  const approvedNGOs = ngos.filter(ngo => ngo.approved);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total NGOs</p>
              <p className="text-2xl font-bold">{ngos.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved NGOs</p>
              <p className="text-2xl font-bold text-green-600">{approvedNGOs.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold text-orange-600">{pendingNGOs.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      {pendingNGOs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Pending Approvals
              </span>
              <Badge variant="destructive">{pendingNGOs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingNGOs.map((ngo) => (
                <div
                  key={ngo.wallet}
                  className="border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-950"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-orange-200 text-orange-700">
                          {ngo.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{ngo.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatAddress(ngo.wallet)}
                        </p>
                        {ngo.metadataCID && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => window.open(`https://ipfs.io/ipfs/${ngo.metadataCID}`, '_blank')}
                            className="p-0 h-auto text-xs gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Documents
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve NGO</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to approve "{ngo.name}"? 
                              This will allow them to receive donations.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="font-medium">{ngo.name}</p>
                              <p className="text-sm text-muted-foreground">{ngo.wallet}</p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => document.querySelector('[data-state="open"]')?.click()}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handleApproval(ngo.wallet, true)}
                                disabled={loadingNGO === ngo.wallet}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {loadingNGO === ngo.wallet ? 'Approving...' : 'Approve'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject NGO</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to reject "{ngo.name}"? 
                              This action can be reversed later.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="font-medium">{ngo.name}</p>
                              <p className="text-sm text-muted-foreground">{ngo.wallet}</p>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => document.querySelector('[data-state="open"]')?.click()}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleApproval(ngo.wallet, false)}
                                disabled={loadingNGO === ngo.wallet}
                              >
                                {loadingNGO === ngo.wallet ? 'Rejecting...' : 'Reject'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approved NGOs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Approved NGOs
            </span>
            <Badge variant="default">{approvedNGOs.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedNGOs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No approved NGOs yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedNGOs.map((ngo) => (
                <div
                  key={ngo.wallet}
                  className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-950"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-green-200 text-green-700">
                          {ngo.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{ngo.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatAddress(ngo.wallet)}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Received: {formatAmount(ngo.totalReceived)} MATIC</span>
                          <span>Withdrawn: {formatAmount(ngo.totalWithdrawn)} MATIC</span>
                        </div>
                        {ngo.metadataCID && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => window.open(`https://ipfs.io/ipfs/${ngo.metadataCID}`, '_blank')}
                            className="p-0 h-auto text-xs gap-1 mt-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Documents
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600">Approved</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApproval(ngo.wallet, false)}
                        disabled={loadingNGO === ngo.wallet}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Revoke
                      </Button>
                    </div>
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