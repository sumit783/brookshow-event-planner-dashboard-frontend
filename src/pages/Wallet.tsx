import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Landmark, Filter } from 'lucide-react';
import { walletService } from '@/services/walletService'; // Use new service
import { Transaction, WalletData } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { BankDetailsDialog } from '@/components/wallet/BankDetailsDialog';

export default function Wallet() {
    const [loading, setLoading] = useState(true);
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

    useEffect(() => {
        fetchWalletData();
    }, []);

    async function fetchWalletData() {
        try {
            // Fetch both simultaneously
            const [data, txData] = await Promise.all([
                walletService.getWalletData(),
                walletService.getTransactions()
            ]);

            setWalletData(data);
            setTransactions(txData.transactions);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load wallet data",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'income') return t.type === 'credit';
        if (filter === 'expense') return t.type === 'debit';
        return true;
    });

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
                    <p className="text-muted-foreground mt-1">Manage your balance and view transaction history</p>
                </div>
                <BankDetailsDialog />
            </div>

            {/* Balance Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-gradient-primary text-primary-foreground shadow-lg border-none relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <WalletIcon className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary-foreground/80">Total Balance</CardDescription>
                        <CardTitle className="text-4xl font-bold">
                            ₹{walletData?.walletBalance.toLocaleString() ?? '0'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-primary-foreground/90 bg-white/10 w-fit px-2 py-1 rounded-md">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            Available for payout
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Income</CardDescription>
                        <CardTitle className="text-2xl font-bold text-green-600 flex items-center gap-2">
                            <ArrowUpRight className="h-5 w-5" />
                            ₹{walletData?.totalIncome.toLocaleString() ?? '0'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Lifetime earnings from ticket sales</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Expenses</CardDescription>
                        <CardTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
                            <ArrowDownLeft className="h-5 w-5" />
                            ₹{walletData?.totalExpense.toLocaleString() ?? '0'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Lifetime spending on artist bookings</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Transaction History</CardTitle>
                        <CardDescription>Recent financial activity</CardDescription>
                    </div>
                    <div className="flex bg-muted rounded-lg p-1">
                        <Button
                            variant={filter === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('all')}
                            className="text-xs"
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === 'income' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('income')}
                            className="text-xs"
                        >
                            Income
                        </Button>
                        <Button
                            variant={filter === 'expense' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('expense')}
                            className="text-xs"
                        >
                            Expenses
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Filter className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>No transactions found for this filter.</p>
                            </div>
                        ) : (
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">Date</th>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3">Source</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right rounded-r-lg">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredTransactions.map((t) => (
                                            <tr key={t._id} className="bg-card hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-nowrap">
                                                    {format(new Date(t.createdAt), 'MMM dd, yyyy')}
                                                    <span className="block text-xs text-muted-foreground font-normal">
                                                        {format(new Date(t.createdAt), 'HH:mm')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-medium block">{t.description}</span>
                                                    {t.referenceId && (
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                            Ref: {t.referenceId.substring(0, 8)}...
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="capitalize">
                                                        {t.source}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        className={
                                                            t.status === 'completed'
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                                                : t.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                                                    : 'bg-red-100 text-red-800 hover:bg-red-100'
                                                        }
                                                        variant="secondary"
                                                    >
                                                        {t.status}
                                                    </Badge>
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
