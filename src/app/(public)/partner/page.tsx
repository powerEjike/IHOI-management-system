import type { Metadata } from "next";
import Link from "next/link";
import { PublicEnquiries } from "@/components/website/contact-details";
import { publishedPage } from "@/lib/website/service";
import { ContentText } from "@/components/website/content-text";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Partner with us" };
const pathways = [
  {
    name: "Pray",
    text: "Stand with the ministry in prayer for the gospel, communities, and lives being discipled.",
  },
  {
    name: "Give",
    text: "Approved giving and project-support information will be published here. Online payments are not available.",
  },
  {
    name: "Volunteer",
    text: "Explore opportunities to offer your skills and time. Share your interest through the volunteering page.",
    href: "/volunteer",
  },
  {
    name: "Go",
    text: "Discover published outreach opportunities and take a practical step into service.",
    href: "/outreach",
  },
];
export default async function PartnerPage() {
  const copy = await publishedPage("partner");
  return (
    <>
      <section className="page-hero container">
        <p className="eyebrow">Partner with IHOI</p>
        {copy ? (
          <h1>{copy.title}</h1>
        ) : (
          <h1>
            Different gifts.
            <br />
            <em>A shared purpose.</em>
          </h1>
        )}
        <p className="page-description">
          {copy?.description ||
            "Explore four ways to participate in the ministry journey."}
        </p>
      </section>
      <section className="container page-body">
        {copy ? (
          <article className="published-copy">
            <h2>{copy.heading}</h2>
            <ContentText text={copy.body} />
          </article>
        ) : null}
        <div className="pathway-grid">
          {pathways.map((item, index) => (
            <article className="pathway-card" key={item.name}>
              <span className="eyebrow">0{index + 1} / Participate</span>
              <h2>{item.name}</h2>
              <p>{item.text}</p>
              {item.href ? (
                <Link href={item.href} className="text-link">
                  Explore {item.name.toLowerCase()}{" "}
                  <span aria-hidden="true">↗</span>
                </Link>
              ) : null}
            </article>
          ))}
        </div>
        <PublicEnquiries kind="partnership" />
      </section>
    </>
  );
}
