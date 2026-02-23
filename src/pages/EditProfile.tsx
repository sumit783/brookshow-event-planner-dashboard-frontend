import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowLeft, Upload, Building2, User, Save } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { toast } from '@/hooks/use-toast';
import { config } from '@/config';

export default function EditProfile() {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const [saving, setSaving] = useState(false);

    // Personal Info State
    const [personalInfo, setPersonalInfo] = useState({
        displayName: authUser?.name || '',
        email: authUser?.email || '',
        phone: authUser?.phone || '',
        countryCode: authUser?.countryCode || '+91'
    });

    // Organization Info State

    const [orgInfo, setOrgInfo] = useState({
        organization: '',
        logo: null as File | null,
        logoUrl: ''
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const { data: profile, isLoading: loading, error } = useQuery({
        queryKey: ['planner-profile'],
        queryFn: () => apiClient.getPlannerProfile(),
    });

    useEffect(() => {
        if (profile) {
            // Mapping user data
            // If userId is a string (unpopulated), it won't have the details
            // Support both populated userId or legacy user object
            const userData = (typeof (profile as any).userId === 'object' ? (profile as any).userId : (profile as any).user || {});

            setPersonalInfo({
                displayName: (userData as any).displayName || (userData as any).name || authUser?.name || '',
                email: (userData as any).email || authUser?.email || '',
                phone: (userData as any).phone || authUser?.phone || '',
                countryCode: (userData as any).countryCode || authUser?.countryCode || '+91'
            });

            setOrgInfo({
                organization: profile.organization || '',
                logo: null,
                logoUrl: profile.logoUrl || ''
            });

            if (profile.logoUrl) {
                setLogoPreview(config.API_BASE_URI + profile.logoUrl);
            }
        }
    }, [profile, authUser]);

    if (error) {
        toast({
            title: "Error",
            description: "Failed to load profile data",
            variant: "destructive"
        });
        navigate('/profile');
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Logo must be less than 2MB",
                    variant: "destructive"
                });
                return;
            }
            setOrgInfo(prev => ({ ...prev, logo: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 1. Update User info
            await apiClient.updateUser(personalInfo);

            // 2. Update Planner Profile (Org info)
            await apiClient.updatePlannerProfile({
                organization: orgInfo.organization,
                logo: orgInfo.logo || undefined
            });

            toast({
                title: "Success",
                description: "Profile updated successfully",
            });

            navigate('/profile');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update profile",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 md:py-8 space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
                    <p className="text-sm text-muted-foreground">Update your personal and organization details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <User className="h-5 w-5 text-primary" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>Your account contact details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Name</Label>
                                <Input
                                    id="displayName"
                                    value={personalInfo.displayName}
                                    onChange={e => setPersonalInfo(prev => ({ ...prev, displayName: e.target.value }))}
                                    placeholder="Your Name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={personalInfo.email}
                                    onChange={e => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2 col-span-1">
                                    <Label htmlFor="countryCode">Code</Label>
                                    <Input
                                        id="countryCode"
                                        value={personalInfo.countryCode}
                                        onChange={e => setPersonalInfo(prev => ({ ...prev, countryCode: e.target.value }))}
                                        placeholder="+91"
                                        required
                                    />
                                </div>
                                <div className="space-y-2 col-span-3">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={personalInfo.phone}
                                        onChange={e => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="1234567890"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organization Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Building2 className="h-5 w-5 text-primary" />
                                Organization Details
                            </CardTitle>
                            <CardDescription>Your business information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center gap-4">
                                <Label>Organization Logo</Label>
                                <div className="relative group">
                                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                                        <AvatarImage src={logoPreview || ''} />
                                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                            {orgInfo.organization.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <button
                                        type="button"
                                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                    >
                                        <Upload className="h-6 w-6 text-white" />
                                    </button>
                                </div>
                                <Input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                                <p className="text-[10px] text-muted-foreground">Max size 2MB. Recommended 400x400.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="organization">Organization Name</Label>
                                <Input
                                    id="organization"
                                    value={orgInfo.organization}
                                    onChange={e => setOrgInfo(prev => ({ ...prev, organization: e.target.value }))}
                                    placeholder="BrookShow Events"
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
