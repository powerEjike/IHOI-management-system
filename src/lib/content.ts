export const pages = {
  about: {
    label: "About",
    eyebrow: "Our identity",
    title: "A life of faith. A heart for people.",
    description:
      "Meet International House of Incense and explore the four pillars shaping this ministry.",
    emptyTitle: "Our story is being prepared",
    emptyText:
      "Ministry history, leadership profiles, and the full vision statement will appear here after approval.",
    next: "Explore our mission",
    href: "/#mission",
  },
  outreach: {
    label: "Outreach",
    eyebrow: "Faith in action",
    title: "Beyond the walls. Into the community.",
    description:
      "Discover opportunities to share the gospel, serve communities, and walk alongside new believers.",
    emptyTitle: "Outreach updates will appear here",
    emptyText:
      "There are no published outreach activities yet. Confirmed dates, locations, and approved reports will be listed here.",
    next: "Ways to participate",
    href: "/partner",
  },
  discipleship: {
    label: "Discipleship",
    eyebrow: "Rooted and growing",
    title: "A decision is the beginning of a journey.",
    description:
      "Explore teaching and learning opportunities designed to support a growing life of faith.",
    emptyTitle: "Courses are being prepared",
    emptyText:
      "Approved course descriptions, lesson overviews, and learning materials will be published here. Enrolment will be coordinated by ministry staff.",
    next: "Explore resources",
    href: "/resources",
  },
  resources: {
    label: "Resources",
    eyebrow: "For the journey",
    title: "Truth to carry into everyday life.",
    description:
      "A home for ministry messages, Bible studies, and practical evangelism materials.",
    emptyTitle: "The resource library is coming together",
    emptyText:
      "No resources have been published yet. Approved sermons, articles, and downloadable materials will appear here.",
    next: "Explore discipleship",
    href: "/discipleship",
  },
  projects: {
    label: "Projects",
    eyebrow: "Purpose made practical",
    title: "Together, we can build something lasting.",
    description:
      "Discover ministry initiatives and opportunities to support their next steps.",
    emptyTitle: "Projects will be shared here",
    emptyText:
      "Published initiatives, their current progress, and approved partnership information will appear here when available.",
    next: "Explore partnership",
    href: "/partner",
  },
  gallery: {
    label: "Gallery",
    eyebrow: "Moments of ministry",
    title: "Stories worth remembering.",
    description:
      "A space for photographs and moments from the life and outreach of the ministry.",
    emptyTitle: "Our gallery is awaiting approved media",
    emptyText:
      "Only photographs, videos, and testimonies cleared for publication will appear here.",
    next: "Discover our outreach",
    href: "/outreach",
  },
  volunteer: {
    label: "Volunteer",
    eyebrow: "Bring your gifts",
    title: "There is a place for you to serve.",
    description:
      "Discover opportunities to contribute your time, skills, and availability to the ministry.",
    emptyTitle: "Applications are not open yet",
    emptyText:
      "Volunteer opportunities and a secure application form will be available once the ministry review process is ready. No personal details are collected on this page.",
    next: "Explore ways to partner",
    href: "/partner",
  },
  contact: {
    label: "Contact",
    eyebrow: "Connect with IHOI",
    title: "Let’s begin a conversation.",
    description:
      "Find ministry contact details and service information here once they are confirmed.",
    emptyTitle: "Contact information is being confirmed",
    emptyText:
      "Approved email, phone, location, and ministry times will be published here. The enquiry form is not available yet.",
    next: "Learn about the ministry",
    href: "/about",
  },
} as const;

export type PageSlug = keyof typeof pages;
export function isPageSlug(value: string): value is PageSlug {
  return Object.hasOwn(pages, value);
}
export const navigation = [
  { label: "About", href: "/about" },
  { label: "Outreach", href: "/outreach" },
  { label: "Discipleship", href: "/discipleship" },
  { label: "Resources", href: "/resources" },
  { label: "Projects", href: "/projects" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];
export const pillars = [
  {
    number: "01",
    name: "Evangelize",
    description: "Share the gospel with compassion and purpose.",
    href: "/outreach",
  },
  {
    number: "02",
    name: "Disciple",
    description: "Walk alongside believers as they grow in faith.",
    href: "/discipleship",
  },
  {
    number: "03",
    name: "Empower",
    description: "Equip people to put their gifts into service.",
    href: "/volunteer",
  },
  {
    number: "04",
    name: "Transform",
    description: "Carry faith into communities and everyday life.",
    href: "/projects",
  },
];
