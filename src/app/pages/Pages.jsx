import React, { useState, useEffect } from 'react';
import {
  Text, Button, Flex, Heading, LoadingSpinner, Image, Divider,
  Tile, Statistics, StatisticsItem, Tag, EmptyState,
  useCrmSearch,
  hubspot
} from '@hubspot/ui-extensions';
import {
  createPageRouter, PageHeader, PageRoutes
} from '@hubspot/ui-extensions/pages';
import {
  toApodDate, contactDisplayName, formatActivityDate, buildOutreachMessage
} from '@cosmic-contacts/utils';

// ---------------------------------------------------------------------------
//  Today's Cosmos — hero section
// ---------------------------------------------------------------------------
const TodayCosmosHero = ({ todayCosmos, isLoading }) => {
  if (isLoading || !todayCosmos || todayCosmos.error) return null;

  return (
    <Flex direction="column" align="center" gap="small">
      <Heading level={2}>Today's Cosmos</Heading>
      <Heading level={3}>{todayCosmos.title}</Heading>

      {todayCosmos.media_type === 'image' && (
        <Image
          src={todayCosmos.image_url}
          alt={todayCosmos.title}
        />
      )}

      {todayCosmos.media_type === 'video' && (
        <Text>Today's APOD is a video — view it at nasa.gov/apod</Text>
      )}

      <Divider />
    </Flex>
  );
};

// ---------------------------------------------------------------------------
//  Single contact card
// ---------------------------------------------------------------------------
const ContactCard = ({
  contact,
  snapshot,
  isRevealing,
  onReveal,
  todayCosmos,
}) => {
  const [showOutreach, setShowOutreach] = useState(false);

  const props = contact.properties;
  const hasActivity = !!props.notes_last_contacted;
  const activityDate = props.notes_last_contacted || props.createdate;
  const activityFormatted = formatActivityDate(activityDate);

  const outreachMsg =
    snapshot && !snapshot.fetchError && !snapshot.error
      ? buildOutreachMessage(props, hasActivity, snapshot, todayCosmos)
      : null;

  return (
    <Tile>
      <Flex direction="column" gap="medium">
        {/* ---- Contact header row ---- */}
        <Flex justify="space-between" align="center">
          <Flex direction="column" gap="extra-small">
            <Heading level={3}>{contactDisplayName(props)}</Heading>
            <Flex gap="small" align="center" wrap="wrap">
              {props.email && (
                <Text variant="microcopy">{props.email}</Text>
              )}
              {activityFormatted && (
                <Tag variant={hasActivity ? 'success' : 'default'}>
                  {hasActivity
                    ? `Last contacted ${activityFormatted}`
                    : `Joined ${activityFormatted}`}
                </Tag>
              )}
            </Flex>
          </Flex>

          {!snapshot && (
            <Button
              onClick={() => onReveal(contact.objectId, activityDate)}
              disabled={isRevealing}
            >
              {isRevealing ? 'Reaching the stars...' : 'Reveal Their Star'}
            </Button>
          )}
        </Flex>

        {/* ---- Revealed snapshot ---- */}
        {snapshot &&
          (snapshot.fetchError || snapshot.error ? (
            <Flex direction="column" gap="extra-small">
              <Text format={{ fontWeight: 'bold' }}>
                {snapshot.error || snapshot.fetchError}
              </Text>
              {snapshot.debug && (
                <Text variant="microcopy">
                  {JSON.stringify(snapshot.debug, null, 2)}
                </Text>
              )}
            </Flex>
          ) : (
            <>
              <Divider />

              <Flex direction="column" gap="medium">
                <Flex justify="space-between" align="center">
                  <Text variant="microcopy">
                    NASA Astronomy Picture of the Day — {snapshot.date}
                  </Text>
                  <Tag variant="success">Star Revealed</Tag>
                </Flex>

                <Heading level={4}>{snapshot.title}</Heading>

                {snapshot.media_type === 'image' ? (
                  <Image
                    src={snapshot.image_url}
                    alt={snapshot.title}
                  />
                ) : (
                  <Text>
                    This day featured a video — view it at nasa.gov/apod
                  </Text>
                )}

                <Text>
                  {snapshot.explanation.length > 280
                    ? snapshot.explanation.slice(0, 280) + '...'
                    : snapshot.explanation}
                </Text>

                {/* Outreach toggle */}
                <Button
                  onClick={() => setShowOutreach(prev => !prev)}
                  variant="secondary"
                >
                  {showOutreach ? 'Hide Draft' : 'Draft Outreach'}
                </Button>

                {showOutreach && outreachMsg && (
                  <Tile compact={true}>
                    <Flex direction="column" gap="extra-small">
                      <Text variant="microcopy">Suggested outreach:</Text>
                      <Text>{outreachMsg}</Text>
                    </Flex>
                  </Tile>
                )}
              </Flex>
            </>
          ))}
      </Flex>
    </Tile>
  );
};

// ---------------------------------------------------------------------------
//  Main board — uses useCrmSearch instead of a serverless function
// ---------------------------------------------------------------------------
const CosmicContactBoard = () => {
  const [snapshots, setSnapshots] = useState({});
  const [isRevealing, setIsRevealing] = useState({});
  const [todayCosmos, setTodayCosmos] = useState(null);
  const [isTodayLoading, setIsTodayLoading] = useState(true);

  // Fetch contacts directly from the CRM using the useCrmSearch hook —
  // no serverless function needed for reads.
  const {
    results: contacts,
    total,
    isLoading,
    error: loadError,
    pagination,
  } = useCrmSearch({
    objectType: 'contact',
    properties: [
      'firstname',
      'lastname',
      'email',
      'notes_last_contacted',
      'createdate',
    ],
    sorts: [{ propertyName: 'createdate', direction: 'DESCENDING' }],
    pageLength: 10,
  });

  useEffect(() => {
    hubspot
      .serverless('cosmic_snapshot_production')
      .then(result => setTodayCosmos(result))
      .catch(() => setTodayCosmos(null))
      .finally(() => setIsTodayLoading(false));
  }, []);

  const revealStar = async (contactId, lastActivityDate) => {
    if (isRevealing[contactId]) return;
    setIsRevealing(prev => ({ ...prev, [contactId]: true }));
    try {
      const dateStr = toApodDate(lastActivityDate);
      const result = await hubspot.serverless('cosmic_snapshot_production', {
        parameters: { date: dateStr },
      });
      setSnapshots(prev => ({ ...prev, [contactId]: result }));
    } catch (err) {
      setSnapshots(prev => ({
        ...prev,
        [contactId]: { fetchError: err.message || 'Unknown client error' },
      }));
    } finally {
      setIsRevealing(prev => ({ ...prev, [contactId]: false }));
    }
  };

  const revealedCount = Object.values(snapshots).filter(
    s => s && !s.fetchError && !s.error
  ).length;

  if (isLoading) {
    return (
      <Flex direction="column" align="center" gap="medium">
        <LoadingSpinner label="Loading your cosmic contacts..." />
      </Flex>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        title="Houston, we have a problem"
        layout="vertical"
        reverseOrder={true}
      >
        <Text>{loadError.message || 'Failed to load contacts.'}</Text>
      </EmptyState>
    );
  }

  return (
    <>
      {/* ---- Hero: Today's APOD ---- */}
      <TodayCosmosHero todayCosmos={todayCosmos} isLoading={isTodayLoading} />

      {/* ---- Stats bar ---- */}
      {contacts.length > 0 && (
        <Statistics>
          <StatisticsItem label="Total Contacts" number={String(total)} />
          <StatisticsItem
            label="Stars Revealed"
            number={String(revealedCount)}
          />
        </Statistics>
      )}

      {/* ---- Contact list ---- */}
      {contacts.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          layout="vertical"
          reverseOrder={true}
          imageName="contacts"
        >
          <Text>
            Add some contacts to your CRM to see their cosmic moments.
          </Text>
        </EmptyState>
      ) : (
        <Flex direction="column" gap="medium">
          <Flex direction="column" gap="extra-small">
            <Heading level={2}>Your Contacts, Written in the Stars</Heading>
            <Text variant="microcopy">
              Click "Reveal Their Star" to see what NASA was showing the world
              the last time you connected with each contact.
            </Text>
          </Flex>

          {contacts.map(contact => (
            <ContactCard
              key={contact.objectId}
              contact={contact}
              snapshot={snapshots[contact.objectId]}
              isRevealing={!!isRevealing[contact.objectId]}
              onReveal={revealStar}
              todayCosmos={todayCosmos}
            />
          ))}

          {/* ---- Pagination ---- */}
          {(pagination.hasNextPage || pagination.hasPreviousPage) && (
            <Flex justify="center" gap="small">
              <Button
                onClick={pagination.previousPage}
                disabled={!pagination.hasPreviousPage}
                variant="secondary"
              >
                Previous
              </Button>
              <Text>Page {pagination.currentPage}</Text>
              <Button
                onClick={pagination.nextPage}
                disabled={!pagination.hasNextPage}
                variant="secondary"
              >
                Next
              </Button>
            </Flex>
          )}
        </Flex>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
//  Page router
// ---------------------------------------------------------------------------
const PageLayout = ({ children }) => (
  <>
    <PageHeader>
      <PageHeader.PrimaryAction>
        <PageHeader.PageLink to="/">Board</PageHeader.PageLink>
      </PageHeader.PrimaryAction>
    </PageHeader>
    {children}
  </>
);

const PageRouter = createPageRouter(
  <PageRoutes layoutComponent={PageLayout}>
    <PageRoutes.IndexRoute component={CosmicContactBoard} />
  </PageRoutes>
);

hubspot.extend(() => <PageRouter />);
