import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Building2, CheckCircle, ExternalLink } from 'lucide-react';

interface NGO {
  wallet: string;
  name: string;
  description?: string;
  website?: string;
  approved: boolean;
}

interface ApprovedNGOsProps {
  ngos: NGO[];
  onSelectNGO?: (ngoWallet: string) => void;
}

export function ApprovedNGOs({ ngos, onSelectNGO }: ApprovedNGOsProps) {
  const approvedNGOs = ngos.filter(ngo => ngo.approved);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Approved NGOs
          </span>
          <Badge variant="secondary">{approvedNGOs.length} active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {approvedNGOs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No approved NGOs yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvedNGOs.slice(0, 5).map((ngo) => (
              <div
                key={ngo.wallet}
                className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{ngo.name}</h4>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    {ngo.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ngo.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {ngo.wallet.slice(0, 10)}...{ngo.wallet.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {ngo.website && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(ngo.website, '_blank')}
                      className="gap-1 text-xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </Button>
                  )}
                  {onSelectNGO && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onSelectNGO(ngo.wallet)}
                      className="gap-1 text-xs"
                    >
                      Donate Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
