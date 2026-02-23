import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Landmark, Filter, Send } from 'lucide-react';
import { walletService } from '@/services/walletService'; // Use new service
import { Transaction, WalletData, WithdrawalRequest } from '@/types';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { BankDetailsDialog } from '@/components/wallet/BankDetailsDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const truncateWords = (text: string, limit: number) => {
    const words = text.split(/\s+/);
    if (words.length <= limit) return text;
    return words.slice(0, limit).join(' ') + '...';
};

export default function Wallet() {
    const [loading, setLoading] = useState(true);
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'withdrawals'>('all');

    // Withdrawal states
    const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

    const toggleNote = (id: string) => {
        setExpandedNotes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    async function handleWithdraw() {
        if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
            toast({ title: "Invalid amount", description: "Please enter a valid amount to withdraw", variant: "destructive" });
            return;
        }

        setWithdrawLoading(true);
        try {
            const response = await walletService.withdraw(Number(withdrawAmount));
            toast({ title: "Success", description: response.message || "Withdrawal request submitted successfully" });
            setIsWithdrawDialogOpen(false);
            setWithdrawAmount('');
            fetchWalletData(); // Refresh balance and transactions
        } catch (error: any) {
            if (error.message === "Bank details is not avilable") {
                toast({
                    title: "Action Required",
                    description: "Please add your bank details before withdrawing",
                    variant: "destructive"
                });
                setIsWithdrawDialogOpen(false);
                setIsBankDialogOpen(true);
            } else {
                toast({
                    title: "Error",
                    description: error.message || "Failed to process withdrawal",
                    variant: "destructive"
                });
            }
        } finally {
            setWithdrawLoading(false);
        }
    }

    async function fetchWalletData() {
        try {
            // Fetch everything simultaneously
            const [data, txData, withdrawalsData] = await Promise.all([
                walletService.getWalletData(),
                walletService.getTransactions(),
                walletService.getWithdrawals()
            ]);

            setWalletData(data);
            setTransactions(txData.transactions);
            setWithdrawals(withdrawalsData.requests);
            console.log("Withdrawal Data:", withdrawalsData);
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
        if (filter === 'expense') return t.type === 'debit' && t.source !== 'withdraw';
        if (filter === 'withdrawals') return t.source === 'withdraw';
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
        <div className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Wallet</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Manage your balance and view transaction history</p>
                </div>
                <BankDetailsDialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen} />
            </div>

            {/* Balance Cards */}
            <div className="grid gap-4 md:grid-gap-6 grid-cols-1 md:grid-cols-3">
                <Card className="bg-gradient-primary text-primary-foreground shadow-lg border-none relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <WalletIcon className="h-20 w-20 md:h-24 md:w-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-primary-foreground/80 text-xs md:text-sm">Total Balance</CardDescription>
                        <CardTitle className="text-3xl md:text-4xl font-bold">
                            ₹{walletData?.walletBalance.toLocaleString() ?? '0'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 md:mt-4">
                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-primary-foreground/90 bg-white/10 w-fit px-2 py-1 rounded-md">
                                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-400 animate-pulse" />
                                Available for payout
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-semibold gap-2 h-9 text-xs"
                                onClick={() => setIsWithdrawDialogOpen(true)}
                            >
                                <Send className="h-3.5 w-3.5" /> Withdraw
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader className="pb-1 md:pb-2">
                        <CardDescription className="text-xs md:text-sm">Total Income</CardDescription>
                        <CardTitle className="text-xl md:text-2xl font-bold text-green-600 flex items-center gap-2">
                            <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5" />
                            ₹{walletData?.totalIncome.toLocaleString() ?? '0'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[10px] md:text-xs text-muted-foreground">Lifetime earnings from ticket sales</p>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader className="pb-1 md:pb-2">
                        <CardDescription className="text-xs md:text-sm">Total Expenses</CardDescription>
                        <CardTitle className="text-xl md:text-2xl font-bold text-red-600 flex items-center gap-2">
                            <ArrowDownLeft className="h-4 w-4 md:h-5 md:w-5" />
                            ₹{walletData?.totalExpense.toLocaleString() ?? '0'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[10px] md:text-xs text-muted-foreground">Lifetime spending on artist bookings</p>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Section */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl md:text-2xl">Transaction History</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Recent financial activity</CardDescription>
                    </div>
                    <div className="flex bg-muted rounded-lg p-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
                        <Button
                            variant={filter === 'all' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('all')}
                            className="text-[10px] md:text-xs px-3 h-8 flex-1 sm:flex-none"
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === 'income' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('income')}
                            className="text-[10px] md:text-xs px-3 h-8 flex-1 sm:flex-none"
                        >
                            Income
                        </Button>
                        <Button
                            variant={filter === 'expense' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('expense')}
                            className="text-[10px] md:text-xs px-3 h-8 flex-1 sm:flex-none"
                        >
                            Expenses
                        </Button>
                        <Button
                            variant={filter === 'withdrawals' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('withdrawals')}
                            className="text-[10px] md:text-xs px-3 h-8 flex-1 sm:flex-none"
                        >
                            Withdrawals
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
                            <div className="space-y-4">
                                {/* Mobile Card View */}
                                <div className="grid grid-cols-1 gap-3 lg:hidden">
                                    {filteredTransactions.map((t) => (
                                        <Card key={t._id} className="p-4 bg-muted/20 border-border">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-semibold text-sm leading-tight">{t.description}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {format(new Date(t.createdAt), 'MMM dd, HH:mm')}
                                                        </span>
                                                        <Badge variant="outline" className="text-[9px] px-1 h-3.5 capitalize">
                                                            {t.source}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className={`font-bold text-sm ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                                </div>
                                            </div>

                                            {t.source === 'withdraw' && (
                                                <div className="text-[10px] text-muted-foreground mt-2 pb-2 border-b border-border/50">
                                                    {(() => {
                                                        const withdrawal = withdrawals.find(w =>
                                                            typeof w.transactionId === 'string'
                                                                ? w.transactionId === t._id
                                                                : w.transactionId?._id === t._id
                                                        );
                                                        if (!withdrawal?.bankDetails) return null;
                                                        const bd = withdrawal.bankDetails;
                                                        return bd.upiId || `${bd.bankName} (****${bd.accountNumber?.slice(-4)})`;
                                                    })()}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-2 pt-1">
                                                <Badge
                                                    className={cn(
                                                        "text-[10px] px-2 h-4",
                                                        t.status === 'completed'
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                                                            : t.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                                                : 'bg-red-100 text-red-800 hover:bg-red-100'
                                                    )}
                                                    variant="secondary"
                                                >
                                                    {t.status}
                                                </Badge>
                                                {t.referenceId && (
                                                    <span className="text-[10px] text-muted-foreground font-mono opacity-50">
                                                        Ref: {t.referenceId.substring(0, 6)}...
                                                    </span>
                                                )}
                                            </div>

                                            {t.status === 'failed' && t.adminNote && (
                                                <div className="mt-3 pt-3 border-t w-full text-xs">
                                                    <p className="font-semibold text-destructive mb-1 text-[10px]">Reason for Rejection:</p>
                                                    <p className="text-muted-foreground whitespace-pre-wrap text-[10px] leading-relaxed">
                                                        {expandedNotes.has(t._id) ? t.adminNote : truncateWords(t.adminNote, 20)}
                                                        {t.adminNote.split(/\s+/).length > 20 && (
                                                            <button
                                                                onClick={() => toggleNote(t._id)}
                                                                className="ml-1 text-primary hover:underline font-medium"
                                                            >
                                                                {expandedNotes.has(t._id) ? "Read Less" : "Read More"}
                                                            </button>
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden lg:block relative overflow-x-auto">
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
                                                    <td className="px-4 py-3 font-medium text-nowrap align-top">
                                                        {format(new Date(t.createdAt), 'MMM dd, yyyy')}
                                                        <span className="block text-xs text-muted-foreground font-normal">
                                                            {format(new Date(t.createdAt), 'HH:mm')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 align-top max-w-md">
                                                        <span className="font-medium block">{t.description}</span>
                                                        {t.source === 'withdraw' && (
                                                            <span className="text-xs text-muted-foreground block">
                                                                {(() => {
                                                                    const withdrawal = withdrawals.find(w =>
                                                                        typeof w.transactionId === 'string'
                                                                            ? w.transactionId === t._id
                                                                            : w.transactionId?._id === t._id
                                                                    );
                                                                    if (!withdrawal?.bankDetails) return null;
                                                                    const bd = withdrawal.bankDetails;
                                                                    return bd.upiId || `${bd.bankName} (****${bd.accountNumber?.slice(-4)})`;
                                                                })()}
                                                            </span>
                                                        )}
                                                        {t.referenceId && (
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                Ref: {t.referenceId.substring(0, 8)}...
                                                            </span>
                                                        )}
                                                        {t.status === 'failed' && t.adminNote && (
                                                            <div className="mt-3 pt-3 border-t w-full text-xs">
                                                                <p className="font-semibold text-destructive mb-1">Reason for Rejection:</p>
                                                                <p className="text-muted-foreground whitespace-pre-wrap">
                                                                    {expandedNotes.has(t._id) ? t.adminNote : truncateWords(t.adminNote, 20)}
                                                                    {t.adminNote.split(/\s+/).length > 20 && (
                                                                        <button
                                                                            onClick={() => toggleNote(t._id)}
                                                                            className="ml-1 text-primary hover:underline font-medium"
                                                                        >
                                                                            {expandedNotes.has(t._id) ? "Read Less" : "Read More"}
                                                                        </button>
                                                                    )}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 align-top">
                                                        <Badge variant="outline" className="capitalize">
                                                            {t.source}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 align-top">
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
                                                    <td className={`px-4 py-3 text-right font-bold align-top ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            {/* Withdrawal Dialog */}
            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Withdraw Funds</DialogTitle>
                        <DialogDescription>
                            Enter the amount you would like to withdraw to your primary bank account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Enter amount"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWithdrawDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleWithdraw} disabled={withdrawLoading}>
                            {withdrawLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Withdraw
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
