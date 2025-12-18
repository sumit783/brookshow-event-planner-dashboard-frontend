import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, UserX, UserCheck, Edit } from 'lucide-react';
import { Employee } from '@/types';
import { EmployeeDetailsDialog } from './EmployeeDetailsDialog';
import { EditEmployeeDialog } from './EditEmployeeDialog';
import { apiClient } from '@/services/apiClient';
import { toast } from '@/hooks/use-toast';

interface EmployeeListProps {
  employees: Employee[];
  loading: boolean;
  onUpdate: () => void;
}

export function EmployeeList({ employees, loading, onUpdate }: EmployeeListProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleToggleStatus(employee: Employee, e: React.MouseEvent) {
    e.stopPropagation();
    setUpdatingId(employee._id);
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  }

  function handleViewDetails(employee: Employee) {
    setSelectedEmployee(employee);
    setDetailsOpen(true);
  }

  function handleEdit(employee: Employee, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedEmployee(employee);
    setEditOpen(true);
  }

  if (loading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-3">
             {[1, 2, 3].map(i => (
               <div key={i} className="h-12 w-full bg-muted/30 animate-pulse rounded" />
             ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (employees.length === 0) {
     return (
        <Card className="border-dashed">
           <CardContent className="flex flex-col items-center justify-center py-12 text-center">
             <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
               <UserX className="h-6 w-6 text-muted-foreground" />
             </div>
             <h3 className="font-semibold text-lg">No Employees Found</h3>
             <p className="text-sm text-muted-foreground max-w-sm mt-1">
               You haven't added any employees yet. Add your first employee to get started.
             </p>
           </CardContent>
        </Card>
     );
  }

  return (
    <>
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee._id} className="cursor-pointer hover:bg-muted/30" onClick={() => handleViewDetails(employee)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {employee.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      {employee.name}
                      <div className="md:hidden text-xs text-muted-foreground mt-0.5">{employee.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm">{employee.email}</div>
                  <div className="text-xs text-muted-foreground">{employee.countryCode} {employee.phone}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={employee.isActive ? 'default' : 'secondary'} className={!employee.isActive ? 'bg-muted text-muted-foreground' : 'bg-green-500 hover:bg-green-600'}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={(e) => { e.stopPropagation(); handleViewDetails(employee); }}
                       title="View Details"
                     >
                       <Eye className="h-4 w-4 text-muted-foreground" />
                     </Button>

                     <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={(e) => handleEdit(employee, e)}
                       title="Edit Employee"
                     >
                       <Edit className="h-4 w-4 text-muted-foreground" />
                     </Button>
                     
                     <Button 
                       variant="ghost" 
                       size="icon"
                       disabled={updatingId === employee._id}
                       onClick={(e) => handleToggleStatus(employee, e)}
                       title={employee.isActive ? "Deactivate" : "Activate"}
                       className={employee.isActive ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                     >
                        {employee.isActive ? (
                           <UserX className="h-4 w-4" />
                        ) : (
                           <UserCheck className="h-4 w-4" />
                        )}
                     </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EmployeeDetailsDialog 
        employee={selectedEmployee}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={onUpdate}
      />
      <EditEmployeeDialog 
        employee={selectedEmployee}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onUpdate}
      />
    </>
  );
}
