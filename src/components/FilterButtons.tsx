import { Button } from "@/components/ui/button";
import { Project } from "@/lib/googleSheets";

interface FilterButtonsProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  projectCounts: {
    all: number;
    newLeads: number;
    building: number;
    deployed: number;
  };
}

export const FilterButtons = ({
  selectedFilter,
  onFilterChange,
  projectCounts,
}: FilterButtonsProps) => {
  const filters = [
    { value: 'all', label: 'All', count: projectCounts.all },
    { value: 'New Lead', label: 'New Leads', count: projectCounts.newLeads },
    { value: 'Building', label: 'Building', count: projectCounts.building },
    { value: 'Deployed', label: 'Deployed', count: projectCounts.deployed },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={selectedFilter === filter.value ? 'default' : 'outline'}
          onClick={() => onFilterChange(filter.value)}
          className="rounded-full"
        >
          {filter.label}
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
            selectedFilter === filter.value
              ? 'bg-primary-foreground/20'
              : 'bg-muted'
          }`}>
            {filter.count}
          </span>
        </Button>
      ))}
    </div>
  );
};
