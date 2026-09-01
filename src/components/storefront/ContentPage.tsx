import { StoreLayout } from "./StoreLayout";

export function ContentPage({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <StoreLayout>
      <div className="container-page max-w-3xl py-12">
        <h1 className="section-title">{title}</h1>
        <div className="mt-6 space-y-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {body}
        </div>
        {children}
      </div>
    </StoreLayout>
  );
}
