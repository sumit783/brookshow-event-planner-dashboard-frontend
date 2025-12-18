import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, UserX, CheckCircle } from 'lucide-react';
import { Employee } from '@/types';
import { apiClient } from '@/services/apiClient';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface EmployeeDetailsDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function EmployeeDetailsDialog({
  employee,
  open,
  onOpenChange,
  onUpdate,
}: EmployeeDetailsDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!employee) return null;

  async function handleToggleStatus() {
    if (!employee) return;
    setLoading(true);
    try {
      if (employee.isActive) {
        await apiClient.deleteEmployee(employee._id);
        toast({
          title: 'Employee Deactivated',
          description: `Employee ${employee.name} has been deactivated.`,
        });
      } else {
        await apiClient.updateEmployee(employee._id, {
          isActive: true,
        });
        toast({
          title: 'Employee Activated',
          description: `Employee ${employee.name} has been activated.`,
        });
      }
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
          <DialogDescription>
            View and manage {employee.name}'s account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{employee.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{employee.role}</p>
              </div>
            </div>
            <Badge variant={employee.isActive ? 'default' : 'destructive'}>
              {employee.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{employee.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">
                  {employee.countryCode} {employee.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="text-sm font-medium">
                  {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            
            {employee.isActive ? (
              <Button 
                variant="destructive" 
                onClick={handleToggleStatus}
                disabled={loading}
              >
                {loading ? 'Processing...' : (
                  <>
                    <UserX className="mr-2 h-4 w-4" /> Deactivate Employee
                  </>
                )}
              </Button>
            ) : (
               <Button 
                variant="default" // or success style if available, 'default' usually primary
                className="bg-green-600 hover:bg-green-700"
                onClick={handleToggleStatus}
                disabled={loading}
              >
                {loading ? 'Processing...' : (
                  <>
                     <CheckCircle className="mr-2 h-4 w-4" /> Activate Employee
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
