export async function onRequest(context) {
  const url = new URL('/preview.html', context.request.url);
  return context.env.ASSETS.fetch(url);
}
