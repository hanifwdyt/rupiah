import { Nav } from "@/components/Nav";
import { RateHero } from "@/components/RateHero";
import { RateChart } from "@/components/RateChart";
import { SubscribePanel } from "@/components/SubscribePanel";
import { NotificationList } from "@/components/NotificationList";
import { NewsList } from "@/components/NewsList";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <RateHero />
        <RateChart />
        <SubscribePanel />
        <NotificationList />
        <NewsList />
        <Footer />
      </main>
    </>
  );
}
