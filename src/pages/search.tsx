import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { CveLink } from "../components/CveLink";
import { PageHead } from "../components/PageHead";
import { env } from "../env.mjs";
import { search } from "../server/api/api";
import styles from "../styles/favorites.module.css";
import { Published } from "../types/v5-cve";

type Props = {
  cves: Published[] | undefined;
};

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const query = context.query.query;
  console.log(`Searching for '${query}'`);
  if (!query || Array.isArray(query)) return { props: { cves: [] } };

  const cves = await search(query);
  return {
    props: { cves },
  };
};

function Page({
  cves,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <PageHead title={`${env.NEXT_PUBLIC_PAGE_TITLE} - Search results`} />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.navContainer}>
            <Link href="/">← Back</Link>
          </div>
          <h1>Search results</h1>
          {cves?.map(
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
