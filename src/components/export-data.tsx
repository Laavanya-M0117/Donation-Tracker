import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  Calendar,
  Filter,
  Loader2
} from 'lucide-react';
import { NGO, Donation } from '../lib/blockchain';

interface ExportDataProps {
  ngos: NGO[];
  donations: Donation[];
  className?: string;
}

type ExportFormat = 'csv' | 'json' | 'txt';
type ExportType = 'donations' | 'ngos' | 'both';

interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  dateRange: 'all' | '7d' | '30d' | '90d' | 'custom';
  includeFields: {
    timestamps: boolean;
    proofCIDs: boolean;
    contactInfo: boolean;
    walletAddresses: boolean;
  };
}

export function ExportData({ ngos, donations, className = "" }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    type: 'donations',
    dateRange: 'all',
    includeFields: {
      timestamps: true,
      proofCIDs: true,
      contactInfo: false,
      walletAddresses: true,
    },
  });

  const getFilteredDonations = () => {
    let filtered = [...donations];

    if (options.dateRange !== 'all' && options.dateRange !== 'custom') {
      const now = Date.now();
      const cutoff: Record<'7d' | '30d' | '90d', number> = {
        '7d': now - 7 * 24 * 60 * 60 * 1000,
        '30d': now - 30 * 24 * 60 * 60 * 1000,
        '90d': now - 90 * 24 * 60 * 60 * 1000,
      };

      const cutoffTime = cutoff[options.dateRange];
      if (cutoffTime) {
        filtered = filtered.filter(d => d.timestamp * 1000 >= cutoffTime);
      }
    }

    return filtered;
  };

  const formatDataForCSV = (data: any[]) => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const prepareDonationData = (donations: Donation[]) => {
    return donations.map(donation => {
      const ngo = ngos.find(n => n.wallet.toLowerCase() === donation.ngo.toLowerCase());
      const data: any = {
        id: donation.id,
        donor: options.includeFields.walletAddresses ? donation.donor : '***HIDDEN***',
        ngo_name: ngo?.name || 'Unknown NGO',
        ngo_wallet: options.includeFields.walletAddresses ? donation.ngo : '***HIDDEN***',
        amount_matic: (parseFloat(donation.amount) / 1e18).toFixed(4),
        message: donation.message,
      };

      if (options.includeFields.timestamps) {
        data.timestamp = new Date(donation.timestamp * 1000).toISOString();
        data.date = new Date(donation.timestamp * 1000).toLocaleDateString();
      }

      if (options.includeFields.proofCIDs && donation.proofCID) {
        data.proof_cid = donation.proofCID;
      }

      return data;
    });
  };

  const prepareNGOData = (ngos: NGO[]) => {
    return ngos.map(ngo => {
      const data: any = {
        name: ngo.name,
        approved: ngo.approved ? 'Yes' : 'No',
        total_received_matic: (parseFloat(ngo.totalReceived) / 1e18).toFixed(4),
        total_withdrawn_matic: (parseFloat(ngo.totalWithdrawn) / 1e18).toFixed(4),
        description: ngo.description,
        website: ngo.website,
      };

      if (options.includeFields.walletAddresses) {
        data.wallet_address = ngo.wallet;
      }

      if (options.includeFields.contactInfo && ngo.contact) {
        data.contact = ngo.contact;
      }

      return data;
    });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let data: any[] = [];
      let filename = '';

      // Prepare data based on export type
      if (options.type === 'donations' || options.type === 'both') {
        const filteredDonations = getFilteredDonations();
        const donationData = prepareDonationData(filteredDonations);
        
        if (options.type === 'donations') {
          data = donationData;
          filename = `donations_${new Date().toISOString().split('T')[0]}`;
        } else {
          data.push({ type: 'donations', data: donationData });
        }
      }

      if (options.type === 'ngos' || options.type === 'both') {
        const ngoData = prepareNGOData(ngos);
        
        if (options.type === 'ngos') {
          data = ngoData;
          filename = `ngos_${new Date().toISOString().split('T')[0]}`;
        } else {
          data.push({ type: 'ngos', data: ngoData });
        }
      }

      if (options.type === 'both') {
        filename = `blockchain_data_${new Date().toISOString().split('T')[0]}`;
      }

      // Format and download based on selected format
      let content = '';
      let mimeType = '';

      switch (options.format) {
        case 'csv':
          if (options.type === 'both') {
            // For combined export, create separate sections
            const donationData = data.find(d => d.type === 'donations')?.data || [];
            const ngoData = data.find(d => d.type === 'ngos')?.data || [];
            
            content = '# DONATIONS\n' + formatDataForCSV(donationData) + 
                     '\n\n# NGOS\n' + formatDataForCSV(ngoData);
          } else {
            content = formatDataForCSV(data);
          }
          mimeType = 'text/csv';
          filename += '.csv';
          break;

        case 'json':
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          filename += '.json';
          break;

        case 'txt':
          if (options.type === 'both') {
            const donationData = data.find(d => d.type === 'donations')?.data || [];
            const ngoData = data.find(d => d.type === 'ngos')?.data || [];
            
            content = 'BLOCKCHAIN DONATION TRACKER EXPORT\n';
            content += `Export Date: ${new Date().toISOString()}\n\n`;
            content += `DONATIONS (${donationData.length})\n`;
            content += '='.repeat(50) + '\n';
            donationData.forEach((donation: any, index: number) => {
              content += `${index + 1}. ${donation.ngo_name}: ${donation.amount_matic} MATIC\n`;
              content += `   From: ${donation.donor}\n`;
              content += `   Message: ${donation.message}\n`;
              if (donation.timestamp) content += `   Date: ${donation.date}\n`;
              content += '\n';
            });

            content += `\nNGOS (${ngoData.length})\n`;
            content += '='.repeat(50) + '\n';
            ngoData.forEach((ngo: any, index: number) => {
              content += `${index + 1}. ${ngo.name} (${ngo.approved})\n`;
              content += `   Received: ${ngo.total_received_matic} MATIC\n`;
              content += `   Withdrawn: ${ngo.total_withdrawn_matic} MATIC\n`;
              if (ngo.website) content += `   Website: ${ngo.website}\n`;
              content += '\n';
            });
          } else {
            content = `BLOCKCHAIN DONATION TRACKER - ${options.type.toUpperCase()}\n`;
            content += `Export Date: ${new Date().toISOString()}\n\n`;
            data.forEach((item: any, index: number) => {
              content += `${index + 1}. ${JSON.stringify(item, null, 2)}\n\n`;
            });
          }
          mimeType = 'text/plain';
          filename += '.txt';
          break;
      }

      downloadFile(content, filename, mimeType);
      toast.success(`Successfully exported ${data.length} records as ${options.format.toUpperCase()}`);

    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4" />;
      case 'json':
        return <FileJson className="w-4 h-4" />;
      case 'txt':
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredDonations = getFilteredDonations();
  const estimatedRecords = options.type === 'donations' ? filteredDonations.length :
                          options.type === 'ngos' ? ngos.length :
                          filteredDonations.length + ngos.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Data
        </CardTitle>
        <CardDescription>
          Export blockchain data for reporting, analysis, or backup purposes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Export Type */}
        <div className="space-y-2">
          <Label>Data Type</Label>
          <Select value={options.type} onValueChange={(value: ExportType) => 
            setOptions(prev => ({ ...prev, type: value }))
          }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="donations">Donations Only</SelectItem>
              <SelectItem value="ngos">NGOs Only</SelectItem>
              <SelectItem value="both">Both Donations & NGOs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['csv', 'json', 'txt'] as ExportFormat[]).map(format => (
              <Button
                key={format}
                variant={options.format === format ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOptions(prev => ({ ...prev, format }))}
                className="gap-2"
              >
                {getFormatIcon(format)}
                {format.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Date Range (for donations) */}
        {(options.type === 'donations' || options.type === 'both') && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </Label>
            <Select value={options.dateRange} onValueChange={(value: any) => 
              setOptions(prev => ({ ...prev, dateRange: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Field Options */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Include Fields
          </Label>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="timestamps"
                checked={options.includeFields.timestamps}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({
                    ...prev,
                    includeFields: { ...prev.includeFields, timestamps: checked as boolean }
                  }))
                }
              />
              <Label htmlFor="timestamps" className="text-sm">
                Timestamps & Dates
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="proofCIDs"
                checked={options.includeFields.proofCIDs}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({
                    ...prev,
                    includeFields: { ...prev.includeFields, proofCIDs: checked as boolean }
                  }))
                }
              />
              <Label htmlFor="proofCIDs" className="text-sm">
                Proof CIDs (IPFS)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="walletAddresses"
                checked={options.includeFields.walletAddresses}
                onCheckedChange={(checked) => 
                  setOptions(prev => ({
                    ...prev,
                    includeFields: { ...prev.includeFields, walletAddresses: checked as boolean }
                  }))
                }
              />
              <Label htmlFor="walletAddresses" className="text-sm">
                Wallet Addresses
              </Label>
            </div>

            {(options.type === 'ngos' || options.type === 'both') && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contactInfo"
                  checked={options.includeFields.contactInfo}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({
                      ...prev,
                      includeFields: { ...prev.includeFields, contactInfo: checked as boolean }
                    }))
                  }
                />
                <Label htmlFor="contactInfo" className="text-sm">
                  NGO Contact Information
                </Label>
              </div>
            )}
          </div>
        </div>

        {/* Export Summary */}
        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <div className="font-medium mb-1">Export Summary</div>
          <div className="text-muted-foreground space-y-1">
            <div>Records: {estimatedRecords.toLocaleString()}</div>
            <div>Format: {options.format.toUpperCase()}</div>
            {options.dateRange !== 'all' && (
              <div>Period: {options.dateRange}</div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleExport}
            disabled={isExporting || estimatedRecords === 0}
            className="w-full gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Exporting...' : `Export ${estimatedRecords} Records`}
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}