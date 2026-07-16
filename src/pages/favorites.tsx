import Link from "next/link";
import { CveLink } from "../components/CveLink";
import { PageHead } from "../components/PageHead";
import { env } from "../env.mjs";
import styles from "../styles/favorites.module.css";
import { Published } from "../types/v5-cve";
import { api } from "../utils/api";
import { useFavoriteStorage } from "../utils/use-favorite-storage";

function Page({}) {
  const { favoriteIds } = useFavoriteStorage("favorites");
  const cves = api.getCVEs.useQuery({ ids: favoriteIds ?? [] });

  return (
    <>
      <PageHead title={`${env.NEXT_PUBLIC_PAGE_TITLE} - Favorites`} />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.navContainer}>
            <Link href="/">← Back</Link>
          </div>
          <h1>Favorites</h1>
          {cves.isLoading && <p>Loading...</p>}
          {cves.data
            ?.toReversed()
            .map(
              (cve) =>
                cve.cveMetadata.state === "PUBLISHED" && (
                  <CveLink key={cve.cveMetadata.cveId} cve={cve as Published} />
                )
            )}
        </div>
      </main>
    </>
  );
}

export default Page;
