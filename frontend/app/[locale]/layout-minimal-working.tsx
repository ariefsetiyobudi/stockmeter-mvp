export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <html lang={locale}>
      <body>
        <div>Minimal Layout - Locale: {locale}</div>
        {children}
      </body>
    </html>
  );
}
