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
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Employees</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 flex items-center gap-2">
            <Users2 className="h-4 w-4" /> Manage your team members
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <AddEmployeeDialog onSuccess={loadData} />
        </div>
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
