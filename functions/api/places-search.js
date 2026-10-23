// Cloudflare Pages Function: /api/places-search
// Proxies Google Places API (New) requests when hosted on Cloudflare Pages

export async function onRequestPost(context) {
  try {
    const { apiKey, textQuery, locationBias } = await context.request.json();
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing Google Places API Key' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const upstream = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName,places.types'
      },
      body: JSON.stringify({
        textQuery,
        ...(locationBias ? { locationBias } : {})
      })
    });

    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
