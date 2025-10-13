import { Badge } from '@/components/ui/badge';

interface SpecialtiesProps {
  specialties: string[];
}

export function Specialties({ specialties }: SpecialtiesProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
        Specialties
      </h2>
      <div className="flex flex-wrap gap-2">
        {specialties.map((specialty, index) => (
          <Badge 
            key={index}
            className="bg-gradient-primary text-white px-4 py-2 text-sm shadow-neon"
          >
            {specialty}
          </Badge>
        ))}
      </div>
    </div>
  );
}
