import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Users, Target } from 'lucide-react';

interface NGO {
  wallet: string;
  name: string;
  totalReceived: string;
  approved: boolean;
}

interface Donation {
  id: number;
  donor: string;
  ngo: string;
  amount: string;
  timestamp: number;
  proofCID: string;
}

interface AnalyticsDashboardProps {
  ngos: NGO[];
  donations: Donation[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AnalyticsDashboard({ ngos, donations }: AnalyticsDashboardProps) {
  const formatAmount = (amount: string) => {
    return Number(amount) / 1e18;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Calculate NGO distribution data
  const ngoData = ngos
    .filter(ngo => ngo.approved && Number(ngo.totalReceived) > 0)
    .map(ngo => ({
      name: ngo.name,
      value: formatAmount(ngo.totalReceived),
      wallet: ngo.wallet,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Calculate monthly donations
  const monthlyData = donations.reduce((acc: { [key: string]: { month: string; donations: number; amount: number } }, donation) => {
    const date = new Date(donation.timestamp * 1000);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthName, donations: 0, amount: 0 };
    }
    
    acc[monthKey].donations += 1;
    acc[monthKey].amount += formatAmount(donation.amount);
    
    return acc;
  }, {});

  const monthlyChartData = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

  // Calculate total metrics
  const totalDonations = donations.length;
  const totalAmount = donations.reduce((sum, d) => sum + formatAmount(d.amount), 0);
  const approvedNGOs = ngos.filter(n => n.approved).length;
  const donationsWithProof = donations.filter(d => d.proofCID).length;
  const transparencyRate = totalDonations > 0 ? (donationsWithProof / totalDonations) * 100 : 0;

  // Top donors
  const donorData = donations.reduce((acc: { [key: string]: { donor: string; amount: number; count: number } }, donation) => {
    if (!acc[donation.donor]) {
      acc[donation.donor] = { donor: donation.donor, amount: 0, count: 0 };
    }
    acc[donation.donor].amount += formatAmount(donation.amount);
    acc[donation.donor].count += 1;
    return acc;
  }, {});

  const topDonors = Object.values(donorData)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impact</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">MATIC donated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active NGOs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedNGOs}</div>
            <p className="text-xs text-muted-foreground">Verified organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transparency Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{transparencyRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Donations with proof</p>
            <Progress value={transparencyRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{new Set(donations.map(d => d.donor)).size}</div>
            <p className="text-xs text-muted-foreground">Unique donors</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Donations Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'amount' ? `${value.toFixed(4)} MATIC` : value,
                    name === 'amount' ? 'Total Amount' : 'Total Donations'
                  ]}
                />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="donations" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* NGO Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>NGO Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ngoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ngoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toFixed(4)} MATIC`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top NGOs */}
        <Card>
          <CardHeader>
            <CardTitle>Top NGOs by Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ngoData.slice(0, 5).map((ngo, index) => (
                <div key={ngo.wallet} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{ngo.name}</p>
                      <p className="text-sm text-muted-foreground">{formatAddress(ngo.wallet)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{ngo.value.toFixed(4)} MATIC</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Donors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Donors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDonors.map((donor, index) => (
                <div key={donor.donor} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{formatAddress(donor.donor)}</p>
                      <p className="text-sm text-muted-foreground">{donor.count} donations</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{donor.amount.toFixed(4)} MATIC</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'amount' ? `${value.toFixed(4)} MATIC` : value,
                  name === 'amount' ? 'Total Amount' : 'Total Donations'
                ]}
              />
              <Bar dataKey="donations" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}