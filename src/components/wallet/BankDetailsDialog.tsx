import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { walletService } from '@/services/walletService';
import { BankDetail } from '@/types';
import { Landmark, Loader2, Plus, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function BankDetailsDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [banks, setBanks] = useState<BankDetail[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [bankForm, setBankForm] = useState({
        accountHolderName: '',
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        isPrimary: false
    });
    const [upiForm, setUpiForm] = useState({
        upiId: '',
        isPrimary: false
    });

    useEffect(() => {
        if (open && !isAdding) {
            fetchBanks();
        }
    }, [open, isAdding]);

    async function fetchBanks() {
        setLoading(true);
        try {
            const response = await walletService.getBankDetails();
            setBanks(response.bankDetails);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to fetch bank details',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleAddBank(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await walletService.addBankDetails(bankForm);
            toast({ title: 'Success', description: 'Bank account added successfully' });
            setIsAdding(false);
            setBankForm({ accountHolderName: '', accountNumber: '', bankName: '', ifscCode: '', isPrimary: false });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to add bank account',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    }

    async function handleAddUpi(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await walletService.addBankDetails(upiForm);
            toast({ title: 'Success', description: 'UPI ID added successfully' });
            setIsAdding(false);
            setUpiForm({ upiId: '', isPrimary: false });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to add UPI ID',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    }

    const ListView = () => (
        <div className="space-y-4">
            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : banks.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground border rounded-lg border-dashed">
                    No bank accounts added yet.
                </div>
            ) : (
                <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
                    {banks.map((bank) => (
                        <div key={bank._id} className="flex items-start justify-between p-4 border rounded-lg bg-card">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">
                                        {bank.bankName || (bank.upiId ? 'UPI' : 'Bank Account')}
                                    </span>
                                    {bank.isPrimary && (
                                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                                            Primary
                                        </Badge>
                                    )}
                                </div>
                                {bank.accountHolderName && (
                                    <p className="text-sm text-muted-foreground">
                                        {bank.accountHolderName}
                                    </p>
                                )}
                                <div className="text-sm font-mono text-muted-foreground">
                                    {bank.accountNumber ? `****${bank.accountNumber.slice(-4)}` : bank.upiId}
                                </div>
                                {bank.ifscCode && (
                                    <div className="text-xs text-muted-foreground">
                                        IFSC: {bank.ifscCode}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Button className="w-full gap-2" onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4" /> Add Bank Details
            </Button>
        </div>
    );

    const AddView = () => (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold">Add New Method</h3>
            </div>

            <Tabs defaultValue="bank" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bank">Bank Account</TabsTrigger>
                    <TabsTrigger value="upi">UPI ID</TabsTrigger>
                </TabsList>

                <TabsContent value="bank">
                    <form onSubmit={handleAddBank} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="accountHolderName">Account Holder Name</Label>
                            <Input
                                id="accountHolderName"
                                required
                                value={bankForm.accountHolderName}
                                onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                                placeholder="Enter name as per bank records"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input
                                id="accountNumber"
                                required
                                value={bankForm.accountNumber}
                                onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                                placeholder="Enter account number"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                                id="bankName"
                                required
                                value={bankForm.bankName}
                                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                placeholder="e.g. State Bank of India"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ifscCode">IFSC Code</Label>
                            <Input
                                id="ifscCode"
                                required
                                value={bankForm.ifscCode}
                                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                                placeholder="e.g. SBIN0001234"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="isPrimaryBank"
                                checked={bankForm.isPrimary}
                                onCheckedChange={(checked) => setBankForm({ ...bankForm, isPrimary: checked as boolean })}
                            />
                            <Label htmlFor="isPrimaryBank">Set as primary account</Label>
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Bank Account
                        </Button>
                    </form>
                </TabsContent>

                <TabsContent value="upi">
                    <form onSubmit={handleAddUpi} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="upiId">UPI ID</Label>
                            <Input
                                id="upiId"
                                required
                                value={upiForm.upiId}
                                onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
                                placeholder="e.g. username@upi"
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="isPrimaryUpi"
                                checked={upiForm.isPrimary}
                                onCheckedChange={(checked) => setUpiForm({ ...upiForm, isPrimary: checked as boolean })}
                            />
                            <Label htmlFor="isPrimaryUpi">Set as primary account</Label>
                        </div>
                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add UPI ID
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) setIsAdding(false);
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Landmark className="h-4 w-4" /> My Banks
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                {!isAdding && (
                    <DialogHeader>
                        <DialogTitle>Bank Accounts</DialogTitle>
                        <DialogDescription>
                            Manage your bank accounts and UPI IDs for payouts.
                        </DialogDescription>
                    </DialogHeader>
                )}

                {isAdding ? <AddView /> : <ListView />}
            </DialogContent>
        </Dialog>
    );
}
