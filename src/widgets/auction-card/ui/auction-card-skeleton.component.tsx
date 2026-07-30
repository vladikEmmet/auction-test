import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui/card.component';
import { Skeleton } from '@/shared/ui/skeleton.component';

export function AuctionCardSkeleton() {
  return (
    <Card className="flex h-full flex-col" aria-hidden>
      <CardHeader className="gap-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="mt-auto h-14 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}
