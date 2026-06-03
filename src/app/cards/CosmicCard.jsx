import React, { useState } from 'react';
import { Text, Button, Flex, Heading, Image, Divider, hubspot } from '@hubspot/ui-extensions';
import { toApodDate } from '@cosmic-contacts/utils';

const CosmicCard = () => {
  const [snapshot, setSnapshot] = useState(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [error, setError] = useState(null);

  const revealStar = async () => {
    if (isRevealing) return;
    setIsRevealing(true);
    setError(null);
    try {
      const result = await hubspot.serverless('cosmic_snapshot_production', {
        propertiesToSend: ['firstname', 'lastname', 'notes_last_contacted', 'createdate']
      });

      if (result.error) {
        setError({ message: result.error, debug: result.debug });
        return;
      }

      setSnapshot(result);
    } catch (err) {
      setError({ message: `Client error: ${err.message || 'unknown'}` });
    } finally {
      setIsRevealing(false);
    }
  };

  if (error) {
    return (
      <Flex direction="column" gap="small">
        <Text format={{ fontWeight: 'bold' }}>Error</Text>
        <Text>{error.message}</Text>
        {error.debug && (
          <Text variant="microcopy">{JSON.stringify(error.debug, null, 2)}</Text>
        )}
        <Button onClick={revealStar}>Try Again</Button>
      </Flex>
    );
  }

  if (!snapshot) {
    return (
      <Flex direction="column" gap="medium" align="center">
        <Text>
          See what NASA was showing the world the last time you connected with this contact.
        </Text>
        <Button onClick={revealStar} disabled={isRevealing}>
          {isRevealing ? 'Reaching the stars...' : 'Reveal Their Star'}
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="small">
      <Text variant="microcopy">
        NASA Astronomy Picture of the Day — {snapshot.date}
      </Text>
      <Heading level={3}>{snapshot.title}</Heading>
      {snapshot.media_type === 'image' ? (
        <Image src={snapshot.image_url} alt={snapshot.title} />
      ) : (
        <Text>This day featured a video — view it at nasa.gov/apod</Text>
      )}
      <Text>
        {snapshot.explanation && snapshot.explanation.length > 280
          ? snapshot.explanation.slice(0, 280) + '...'
          : snapshot.explanation}
      </Text>
      <Divider />
      <Button onClick={() => setSnapshot(null)} variant="secondary">
        Show Another Date
      </Button>
    </Flex>
  );
};

hubspot.extend(() => <CosmicCard />);
