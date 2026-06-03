import React, { useState } from 'react';
import { Text, Button, Flex, Image, Divider, hubspot } from '@hubspot/ui-extensions';

// ---------------------------------------------------------------
//  THIS IS INTENTIONALLY INSECURE — FOR DEMO PURPOSES ONLY
//
//  The API key is hardcoded in client-side code. Anyone who opens
//  the browser dev tools > Network tab will see the full key in
//  the request URL.
//
//  In a real app this could be a paid API key, a CRM token, or
//  any secret that an end-user should never see.
//  Use a serverless function instead.
// ---------------------------------------------------------------
const NASA_API_KEY = 'DEMO_KEY';

const InsecureApodCard = () => {
  const [apod, setApod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchInsecurely = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // The key travels in the URL, visible in the browser's Network tab
      const response = await hubspot.fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`
      );
      const data = await response.json();
      setApod(data);
    } catch (err) {
      setFetchError(err.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="medium">
      <Text format={{ fontWeight: 'bold' }}>
        This card calls the NASA API directly from the browser.
      </Text>
      <Text>
        Open your browser dev tools (Network tab) before clicking the
        button, then inspect the request URL.
      </Text>

      <Button onClick={fetchInsecurely} disabled={loading}>
        {loading ? 'Fetching...' : 'Fetch APOD (Insecure)'}
      </Button>

      {fetchError && <Text>Error: {fetchError}</Text>}

      {apod && !apod.error && (
        <Flex direction="column" gap="extra-small">
          <Text format={{ fontWeight: 'bold' }}>{apod.title}</Text>
          <Text variant="microcopy">{apod.date}</Text>
          {apod.media_type === 'image' && (
            <Image src={apod.url} alt={apod.title} width={500} />
          )}
        </Flex>
      )}

      <Divider />

      <Button variant="secondary" onClick={() => setRevealed(!revealed)}>
        {revealed ? 'Hide' : 'Reveal'} what just leaked
      </Button>

      {revealed && (
        <Flex direction="column" gap="extra-small">
          <Text format={{ fontWeight: 'bold' }}>Exposed in the network request:</Text>
          <Text>
            GET https://api.nasa.gov/planetary/apod?api_key={NASA_API_KEY}
          </Text>
          <Divider />
          <Text format={{ fontWeight: 'bold' }}>Why this is dangerous:</Text>
          <Text>
            Any user with browser dev tools can copy this key. With a paid
            API, a CRM token, or an internal service credential, that means
            unauthorized access, quota theft, or data exfiltration.
          </Text>
          <Divider />
          <Text format={{ fontWeight: 'bold' }}>The fix:</Text>
          <Text>
            Use a serverless function. The key stays in process.env on
            HubSpot's server — it never reaches the browser. See the
            "Cosmic Snapshot" card on this same record for the secure version.
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

hubspot.extend(() => <InsecureApodCard />);
