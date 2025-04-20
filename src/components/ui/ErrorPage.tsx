// src/components/ErrorPage.tsx
import { useRouteError } from 'react-router-dom';
import { Button } from './ui/button';

export default function ErrorPage() {
  const error = useRouteError() as { status: number; data: string };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">Oops!</h1>
      <p className="text-lg">Sorry, an unexpected error has occurred.</p>
      <p className="text-muted-foreground">
        {error.status} - {error.data}
      </p>
      <Button asChild>
        <a href="/">Return Home</a>
      </Button>
    </div>
  );
}