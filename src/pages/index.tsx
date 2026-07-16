import {
  GetServerSideProps,
  InferGetServerSidePropsType,
  type NextPage,
} from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChangeEvent, FormEvent, useState } from "react";
import { CveLink } from "../components/CveLink";
import { PageHead } from "../components/PageHead";
import { env } from "../env.mjs";
import { getRecentCVEs } from "../server/api/api";
import styles from "../styles/index.module.css";
import { Published } from "../types/v5-cve";
import { api } from "../utils/api";
import { useFavoriteStorage } from "../utils/use-favorite-storage";
import { clamp, isPublished } from "../utils/utils";

const MAX_NUMBER_OF_FAVORITES = 5;

type Props = {
  recents: Published[];
};
export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  let queryCount = parseInt(context.query.count as string);
  if (!queryCount || isNaN(queryCount)) queryCount = 10;
  const count = clamp(queryCount, 1, 200);
  const recents = await getRecentCVEs(count);
  console.log(
    "Recent CVEs:",
    recents.map((cve) => cve.cveMetadata.cveId)
  );
  return {
    props: { recents },
  };
};

const Home: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ recents }) => {
  const [value, setValue] = useState("");
  const router = useRouter();
  const { favoriteIds } = useFavoriteStorage("favorites");

  const onType = (e: ChangeEvent<HTMLInputElement>) => {
    const v = formatValue(e.target.value);
    setValue(v);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isCVEid(value)) {
      router.push(`/${value}`);
    } else {
      router.push(`/search?query=${value}`);
    }
  };

  const favorites = api.getCVEs.useQuery({
    ids:
      favoriteIds
        ?.sort((a, b) => b.localeCompare(a))
        ?.slice(0, MAX_NUMBER_OF_FAVORITES + 2) ?? [],
  });

  return (
    <>
      <PageHead />
      <main className={styles.main}>
        <div className={styles.container}>
          <header>
            <span>{env.NEXT_PUBLIC_PAGE_TITLE}</span>
          </header>
          <form onSubmit={onSubmit} action="/form">
            <label htmlFor="cveId">
              <h2>Search</h2>
            </label>
            <input
              name="cveId"
              placeholder="CVE-0000-00000"
              value={value}
              onChange={onType}
              type="text"
              autoFocus={true}
            />
          </form>
          {!!favorites.data?.length && <h2>Favorites</h2>}
          {favorites.data
            ?.toReversed()
            .slice(0, MAX_NUMBER_OF_FAVORITES)
            .map((cve) => (
              <CveLink key={cve.cveMetadata.cveId} cve={cve as Published} />
            ))}
          {!!favorites.data?.length &&
            favorites.data?.length > MAX_NUMBER_OF_FAVORITES && (
              <Link href="/favorites">All favorites →</Link>
            )}
          <h2>Recent</h2>
          {recents?.map(
            (cve) =>
              isPublished(cve) && (
                <CveLink key={cve.cveMetadata.cveId} cve={cve} />
              )
          )}
          <Link
            id="load-more"
            href={`/?count=${recents.length + 10}#load-more`}
          >
            Load more ↓
          </Link>
        </div>
      </main>
    </>
  );
};

function formatValue(value: string) {
  const v = value.toUpperCase();
  if (/^[0-9]{4}$/.test(v)) {
    if (parseInt(v) < 2050 && parseInt(v) > 1980) {
      return `CVE-${v}`;
    }
  } else if (isCVEid(v)) {
    // Complete id
    return `${v}`;
  } else if (/^CVE-[0-9]{5,}$/.test(v)) {
    // More than 4 numbers
    return `${v.substring(0, 8)}-${v.substring(8)}`;
  }
  return value;
}
const isCVEid = (value: string) => /^CVE-[0-9]{4}-[0-9]+$/.test(value);

export default Home;
