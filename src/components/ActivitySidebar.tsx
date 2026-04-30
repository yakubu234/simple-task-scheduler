import { useState } from 'react';
import { ActivityFeed } from './ActivityFeed';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Activity } from 'lucide-react';

interface ActivitySidebarProps {
  projectId: string;
  projectName: string;
}

export function ActivitySidebar({ projectId, projectName }: ActivitySidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="Activity Feed">
          <Activity className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </SheetTitle>
          <SheetDescription>
            Recent activity in "{projectName}"
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <ActivityFeed projectId={projectId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
