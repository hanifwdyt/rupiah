import { Masthead } from "@/components/Masthead";
import { RateHero } from "@/components/RateHero";
import { RateChart } from "@/components/RateChart";
import { SubscribePanel } from "@/components/SubscribePanel";
import { NotificationList } from "@/components/NotificationList";
import { NewsList } from "@/components/NewsList";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-[1400px] border-x border-rule min-h-screen">
      <Masthead />
      <RateHero />
      <RateChart />
      <SubscribePanel />
      <NotificationList />
      <NewsList />
      <Footer />
    </main>
  );
}
