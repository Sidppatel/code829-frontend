import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { type EventData } from "../../components/EventCard";
import { eventsApi } from "../../services/eventsApi";
import { HeroSection } from "./HeroSection";
import { CarouselSection } from "./CarouselSection";
import { FeaturedSection } from "./FeaturedSection";
import { CategorySection } from "./CategorySection";
import { ComingSoonSection } from "./ComingSoonSection";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ApiEventItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  startDate: string;
  endDate: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  venueName: string;
  venueCity: string;
  venueState: string;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  totalCapacity: number | null;
  totalSold: number | null;
}

interface ApiEventsResponse {
  items: ApiEventItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function apiItemToEventData(item: ApiEventItem): EventData {
  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category,
    startDate: item.startDate,
    venueName: item.venueName,
    venueCity: item.venueCity,
    venueState: item.venueState,
    minPriceCents: item.minPriceCents,
    imageUrl: item.imageUrl,
    isFeatured: item.isFeatured,
    totalCapacity: item.totalCapacity,
    totalSold: item.totalSold,
  };
}

// ---------------------------------------------------------------------------
// Placeholder data (used when API is unreachable)
// ---------------------------------------------------------------------------
const PLACEHOLDER_EVENTS: EventData[] = [
  {
    id: "1",
    title: "Neon Frequencies Festival",
    category: "Music",
    venueName: "Amphitheater Park",
    venueCity: "Austin",
    startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    minPriceCents: 8900,
  },
  {
    id: "2",
    title: "React Summit 2026",
    category: "Tech",
    venueName: "Convention Center",
    venueCity: "San Francisco",
    startDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    minPriceCents: 19900,
    totalCapacity: 500,
    totalSold: 450,
  },
  {
    id: "3",
    title: "Urban Art Walk",
    category: "Art",
    venueName: "Downtown Gallery District",
    venueCity: "New York",
    startDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    minPriceCents: 0,
  },
  {
    id: "4",
    title: "Street Food & Wine",
    category: "Food",
    venueName: "Riverside Park",
    venueCity: "Chicago",
    startDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    minPriceCents: 3500,
  },
  {
    id: "5",
    title: "Jazz Under the Stars",
    category: "Music",
    venueName: "Rooftop Lounge 42",
    venueCity: "New Orleans",
    startDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    minPriceCents: 5500,
  },
];

const PLACEHOLDER_TRENDING: EventData[] = [
  {
    id: "6",
    title: "Hackathon: Build the Future",
    category: "Tech",
    venueName: "Innovation Hub",
    venueCity: "Seattle",
    startDate: new Date(Date.now() + 86400000 * 6).toISOString(),
    minPriceCents: 0,
    totalCapacity: 200,
    totalSold: 180,
  },
  {
    id: "7",
    title: "Midnight Cinema Classics",
    category: "Art",
    venueName: "The Criterion",
    venueCity: "Los Angeles",
    startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    minPriceCents: 1800,
  },
  {
    id: "8",
    title: "Marathon City Run 2026",
    category: "Sports",
    venueName: "City Hall Plaza",
    venueCity: "Boston",
    startDate: new Date(Date.now() + 86400000 * 8).toISOString(),
    minPriceCents: 4500,
  },
  {
    id: "9",
    title: "Farm-to-Table Dinner",
    category: "Food",
    venueName: "Verdana Estate",
    venueCity: "Portland",
    startDate: new Date(Date.now() + 86400000 * 9).toISOString(),
    minPriceCents: 12000,
    totalCapacity: 60,
    totalSold: 55,
  },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function HomePage(): React.ReactElement {
  const [weekendEvents, setWeekendEvents] = useState<EventData[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<EventData[]>([]);
  const [comingSoonEvents, setComingSoonEvents] = useState<EventData[]>([]);
  const [loadingWeekend, setLoadingWeekend] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingComingSoon, setLoadingComingSoon] = useState(true);
  const [featuredEvent, setFeaturedEvent] = useState<EventData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeekend(): Promise<void> {
      try {
        const res = await eventsApi.list<ApiEventsResponse>(
          "dateFilter=this-week&pageSize=8",
        );
        if (!cancelled) {
          const items = (res.data.items ?? []).map(apiItemToEventData);
          if (items.length > 0) {
            setWeekendEvents(items);
            setFeaturedEvent(
              items.find((e) => e.isFeatured) ?? items[0] ?? null,
            );
          } else {
            // No events this week -- fetch all upcoming instead
            const allRes =
              await eventsApi.list<ApiEventsResponse>("pageSize=8");
            const allItems = (allRes.data.items ?? []).map(apiItemToEventData);
            setWeekendEvents(
              allItems.length > 0 ? allItems : PLACEHOLDER_EVENTS,
            );
            setFeaturedEvent(
              allItems.find((e) => e.isFeatured) ??
                allItems[0] ??
                PLACEHOLDER_EVENTS[0],
            );
          }
        }
      } catch {
        if (!cancelled) {
          setWeekendEvents(PLACEHOLDER_EVENTS);
          setFeaturedEvent(PLACEHOLDER_EVENTS[1]);
        }
      } finally {
        if (!cancelled) setLoadingWeekend(false);
      }
    }

    async function fetchTrending(): Promise<void> {
      try {
        const res =
          await eventsApi.list<ApiEventsResponse>("pageSize=8");
        if (!cancelled) {
          setTrendingEvents((res.data.items ?? []).map(apiItemToEventData));
        }
      } catch {
        if (!cancelled) setTrendingEvents(PLACEHOLDER_TRENDING);
      } finally {
        if (!cancelled) setLoadingTrending(false);
      }
    }

    async function fetchComingSoon(): Promise<void> {
      try {
        const res = await eventsApi.list<ApiEventsResponse>(
          "dateFilter=this-month&pageSize=10",
        );
        if (!cancelled) {
          const items = (res.data.items ?? []).map(apiItemToEventData);
          if (items.length === 0) {
            // No events this month -- show all upcoming
            const allRes = await eventsApi.list<ApiEventsResponse>(
              "pageSize=10",
            );
            setComingSoonEvents(
              (allRes.data.items ?? []).map(apiItemToEventData),
            );
          } else {
            setComingSoonEvents(items);
          }
        }
      } catch {
        if (!cancelled) setComingSoonEvents([]);
      } finally {
        if (!cancelled) setLoadingComingSoon(false);
      }
    }

    void fetchWeekend();
    void fetchTrending();
    void fetchComingSoon();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Code829 — Discover Live Events</title>
        <meta
          name="description"
          content="Find and book the best concerts, tech talks, food festivals and more near you."
        />
      </Helmet>

      <HeroSection />

      <CarouselSection
        title="This Weekend"
        subtitle="Events happening in the next few days"
        events={weekendEvents}
        loading={loadingWeekend}
        linkTo="/events?dateFilter=this-week"
      />

      <FeaturedSection event={featuredEvent} />

      <CategorySection />

      <CarouselSection
        title="Trending Near You"
        subtitle="What everyone's talking about"
        events={trendingEvents}
        loading={loadingTrending}
        linkTo="/events"
      />

      <ComingSoonSection
        events={comingSoonEvents}
        loading={loadingComingSoon}
      />

      {/* Footer spacer */}
      <div style={{ height: "4rem", background: "var(--bg-primary)" }} />
    </>
  );
}
