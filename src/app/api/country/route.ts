export function GET(req: Request) {
  const country = req.headers.get('cf-ipcountry')
  return Response.json({ country: country && country !== 'XX' ? country : null }, { headers: { 'cache-control': 'private, no-store' } })
}
