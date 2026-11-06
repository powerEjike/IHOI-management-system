import Link from "next/link";
import { Brand } from "./brand";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>
            Evangelize. Disciple.
            <br />
            Empower. Transform.
          </p>
        </div>
        <div>
          <h2>Explore</h2>
          <Link href="/about">Our ministry</Link>
          <Link href="/outreach">Outreach</Link>
          <Link href="/discipleship">Discipleship</Link>
        </div>
        <div>
          <h2>Participate</h2>
          <Link href="/partner">Partner with us</Link>
          <Link href="/volunteer">Become a volunteer</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div>
          <h2>For the journey</h2>
          <Link href="/resources">Resources</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/portal">Staff portal</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} International House of Incense Ministries
        </span>
        <Link href="/privacy">Privacy & website status</Link>
        <span>Faith. People. Purpose.</span>
      </div>
    </footer>
  );
}
