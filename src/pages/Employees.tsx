import { useEffect, useState } from 'react';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { AddEmployeeDialog } from '@/components/employees/AddEmployeeDialog';
import { apiClient } from '@/services/apiClient';
import { Employee } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Users2 } from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const data = await apiClient.listEmployees();
      setEmployees(data);
    } catch (error) {
      console.error(error);
      toast({
         title: "Error",
         description: "Failed to load employees",
         variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Users2 className="h-4 w-4" /> Manage your team members
          </p>
        </div>
        <AddEmployeeDialog onSuccess={loadData} />
      </div>

      {/* List */}
      <EmployeeList 
         employees={employees} 
         loading={loading} 
         onUpdate={loadData}
      />
    </div>
  );
}
