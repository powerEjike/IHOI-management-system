import Link from "next/link";
import { publishedPage } from "@/lib/website/service";
import { publicRecords, upcomingEvents } from "@/lib/website/records";
import { RecordCards } from "@/components/website/public-records";
import { ContentText } from "@/components/website/content-text";
export const dynamic = "force-dynamic";
import { MinistryLogo } from "@/components/brand";
import { pillars } from "@/lib/content";

export async function generateMetadata() {
  const copy = await publishedPage("home");
  return copy ? { title: copy.title, description: copy.description } : {};
}
export default async function Home() {
  const [copy, events, resources, testimonies] = await Promise.all([
    publishedPage("home"),
    upcomingEvents(),
    publicRecords("resources", "", "", 3),
    publicRecords("testimonies", "", "", 3),
  ]);
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="small-star" aria-hidden="true">
                ✦
              </span>{" "}
              International House of Incense Ministries
            </p>
            {copy ? (
              <h1 className="custom-home-title">{copy.title}</h1>
            ) : (
              <h1>
                A heart for God.
                <br />A life poured out
                <br />
                <em>for people.</em>
              </h1>
            )}
            <p className="hero-description">
              {copy?.description ||
                "A ministry journey of evangelism, discipleship, and service. Discover the mission. Find your place in it."}
            </p>
            <div className="button-row">
              <Link href="/#mission" className="button">
                Explore our mission <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/partner" className="button button-outline">
                Join the movement <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="hero-footnote">
              <span className="line" />
              <span>Rooted in faith. Reaching beyond ourselves.</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="arch">
              <div className="arch-lines" />
              <div className="art-label">A LIFE OF WORSHIP</div>
              <MinistryLogo className="hero-ministry-logo" />
              <div className="arch-word">
                Let faith
                <br />
                <em>become action.</em>
              </div>
              <div className="art-caption">
                EVANGELIZE · DISCIPLE · EMPOWER · TRANSFORM
              </div>
            </div>
            <div className="art-stamp">
              FAITH
              <br />
              <span>in action</span>
              <span className="stamp-star">✦</span>
            </div>
            <span className="art-spark spark-one">✧</span>
            <span className="art-spark spark-two">✦</span>
          </div>
        </div>
      </section>
      <section className="mission-strip" aria-label="Our four pillars">
        <div className="container">
          {pillars.map((pillar) => (
            <span key={pillar.name}>
              {pillar.name}
              <span aria-hidden="true">✦</span>
            </span>
          ))}
        </div>
      </section>
      <section className="section container" id="mission">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The heart of the ministry</p>
            {copy ? (
              <h2>{copy.heading}</h2>
            ) : (
              <h2>
                One mission.
                <br />
                <em>Many ways to live it.</em>
              </h2>
            )}
          </div>
          <div className="heading-aside">
            {copy ? (
              <ContentText text={copy.body} />
            ) : (
              <p>
                From sharing the gospel to walking alongside others, our four
                pillars give direction to the journey.
              </p>
            )}
            <Link className="text-link" href="/about">
              Get to know IHOI <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div className="pillar-grid">
          {pillars.map((pillar) => (
            <Link className="pillar-card" href={pillar.href} key={pillar.name}>
              <span className="card-top">
                <span>{pillar.number}</span>
                <span aria-hidden="true">↗</span>
              </span>
              <h3>{pillar.name}</h3>
              <p>{pillar.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="outreach-section">
        <div className="container section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Beyond the walls</p>
              <h2>
                Faith that
                <br />
                <em>meets people.</em>
              </h2>
            </div>
            <Link className="text-link" href="/outreach">
              Explore outreach <span aria-hidden="true">↗</span>
            </Link>
          </div>
          {events.length ? (
            <RecordCards records={events} />
          ) : (
            <div className="outreach-empty">
              <div className="outreach-mark" aria-hidden="true">
                ↗
              </div>
              <div>
                <span className="status-label">Upcoming gatherings</span>
                <h3>The next opportunity starts here.</h3>
                <p>
                  Confirmed ministry dates and locations will appear here when
                  published.
                </p>
              </div>
              <Link href="/volunteer" className="button button-outline">
                Discover volunteering <span aria-hidden="true">→</span>
              </Link>
            </div>
          )}
          <p className="impact-note">
            Stories and impact figures will be shared as approved ministry
            reports become available.
          </p>
        </div>
      </section>
      <section className="section container journey-grid">
        <div className="journey-panel">
          <span className="eyebrow">Keep growing</span>
          <h2>
            Faith takes root.
            <br />
            <em>Then it grows.</em>
          </h2>
          <p>Explore discipleship and resources for the journey ahead.</p>
          <Link href="/discipleship" className="text-link">
            Discover discipleship <span aria-hidden="true">↗</span>
          </Link>
          <span className="journey-decoration" aria-hidden="true">
            ✳
          </span>
        </div>
        <div className="journey-links">
          <Link href="/resources">
            <span className="eyebrow">01 / Learn</span>
            <h3>
              Resources for the journey <span aria-hidden="true">↗</span>
            </h3>
            <p>Messages, Bible studies, and ministry materials.</p>
          </Link>
          <Link href="/projects">
            <span className="eyebrow">02 / Participate</span>
            <h3>
              Purpose in progress <span aria-hidden="true">↗</span>
            </h3>
            <p>Explore ministry projects and ways to support them.</p>
          </Link>
        </div>
      </section>
      {resources.records.length ? (
        <section className="container section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">For the journey</p>
              <h2>Words that help faith grow.</h2>
            </div>
            <Link className="text-link" href="/resources">
              All resources ↗
            </Link>
          </div>
          <RecordCards records={resources.records} />
        </section>
      ) : null}
      {testimonies.records.length ? (
        <section className="container section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Stories of faith</p>
              <h2>Lives. Grace. New beginnings.</h2>
            </div>
            <Link className="text-link" href="/testimonies">
              Read the stories ↗
            </Link>
          </div>
          <RecordCards records={testimonies.records} />
        </section>
      ) : null}
      <section className="participate-section">
        <div className="container participate-inner">
          <p className="eyebrow">There is a place for you</p>
          <h2>
            Bring your faith.
            <br />
            <em>Bring your gifts.</em>
          </h2>
          <p>
            Pray. Give. Volunteer. Go.
            <br />
            Discover the ways you can be part of the mission.
          </p>
          <Link href="/partner" className="button button-gold">
            Find your next step <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </>
  );
}
