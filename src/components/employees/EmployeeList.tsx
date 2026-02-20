import { useState } from 'react';
import { cn } from '@/lib/utils';
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
      {/* Mobile/Tablet Card View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {employees.map((employee) => (
          <Card key={employee._id} className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer" onClick={() => handleViewDetails(employee)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {employee.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{employee.name}</h3>
                    <Badge variant={employee.isActive ? 'default' : 'secondary'} className={cn("mt-1 text-[10px] px-1.5 h-4", !employee.isActive ? 'bg-muted text-muted-foreground' : 'bg-green-500 hover:bg-green-600')}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleViewDetails(employee); }}
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => handleEdit(employee, e)}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 truncate">
                  <div className="h-2 w-2 rounded-full bg-primary/40 shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/40 shrink-0" />
                  <span>{employee.countryCode} {employee.phone}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <span className="text-xs text-muted-foreground italic">
                  Joined: {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'N/A'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-8 text-xs font-medium px-3", employee.isActive ? "text-destructive hover:bg-destructive/10" : "text-green-600 hover:bg-green-50")}
                  disabled={updatingId === employee._id}
                  onClick={(e) => handleToggleStatus(employee, e)}
                >
                  {employee.isActive ? (
                    <>
                      <UserX className="mr-2 h-3.5 w-3.5" /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-3.5 w-3.5" /> Activate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
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
                      <div className="font-semibold text-sm md:text-base leading-none">
                        {employee.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{employee.email}</div>
                    <div className="text-xs text-muted-foreground">{employee.countryCode} {employee.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employee.isActive ? 'default' : 'secondary'} className={!employee.isActive ? 'bg-muted text-muted-foreground' : 'bg-green-500 hover:bg-green-600'}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 md:gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); handleViewDetails(employee); }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => handleEdit(employee, e)}
                        title="Edit Employee"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", employee.isActive ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-green-600 hover:text-green-700 hover:bg-green-50")}
                        disabled={updatingId === employee._id}
                        onClick={(e) => handleToggleStatus(employee, e)}
                        title={employee.isActive ? "Deactivate" : "Activate"}
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
