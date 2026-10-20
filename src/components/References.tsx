import Image from "next/image";
import type { Reference } from "../types/v5-cve";
import { api } from "../utils/api";
import { OpenGraphData } from "../utils/opengraph";
import { Chip } from "./Chip";
import styles from "./references.module.css";

export function References({ references }: { references: Reference[] }) {
  return (
    <div className={styles.referencesList}>
      {references.map((reference, i) => (
        <ReferenceItem reference={reference} key={i} />
      ))}
    </div>
  );
}

function ReferenceItem({ reference }: { reference: Reference }) {
  const { data: openGraphData } = api.getOpenGraphData.useQuery({
    url: reference.url,
  });
  const { data: hackerNewsUrl } = api.getHackerNewsUrl.useQuery({
    url: reference.url,
  });

  return (
    <a href={reference.url} className={styles.reference_item}>
      {openGraphData?.image && (
        <Image src={openGraphData.image} width={300} height={200} alt="" />
      )}
      <div className={styles.reference_item_content}>
        <b>{getTitle(reference, openGraphData)}</b>
        {openGraphData?.description && (
          <p className="pre">{openGraphData.description}</p>
        )}
        <p className={styles.url} title={reference.url}>
          {reference.url}
        </p>
        <div className={styles.tags}>
          {reference.tags?.map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
      </div>
      {hackerNewsUrl && (
        <div>
          {hackerNewsUrl.title} - {hackerNewsUrl.num_comments} comments
        </div>
      )}
    </a>
  );
}

function getTitle(
  reference: Reference,
  openGraphData: OpenGraphData | undefined
) {
  if (openGraphData?.title) {
    return openGraphData.title;
  } else if (reference.name) {
    return reference.name;
  } else {
    return getDomainName(reference.url);
  }
}

function getDomainName(url: string) {
  const domain = new URL(url).hostname;
  return domain.startsWith("www.") ? domain.slice(4) : domain;
}
