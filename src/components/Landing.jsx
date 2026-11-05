import { Chloe, ChloePose, Logo, LogoMark } from './Brand.jsx'
import '../landing.css'

// The same sample subscriptions as the log in preview, so the numbers on both pages agree.
const SAMPLE = [
  { name: 'Netflix', cycle: 'Monthly', price: '₱549.00', status: 'soon', label: 'Due in 3 days', tilt: -4 },
  { name: 'Spotify', cycle: 'Monthly', price: '₱149.00', status: 'paid', label: 'Paid', tilt: 3 },
  { name: 'iCloud+', cycle: 'Monthly', price: '₱149.00', status: 'overdue', label: 'Overdue', tilt: -2 },
]

const STAMP_CLASS = { soon: 'due-soon', paid: 'due-paid', overdue: 'due-overdue' }

const STEPS = [
  {
    title: 'Add what you pay for',
    body: 'Enter the name, price, billing cycle, and the first due date. Weekly, monthly, or yearly, in any currency.',
  },
  {
    title: 'See what needs you',
    body: 'Every subscription gets a status: paid, due soon, overdue, or upcoming. The ones that need attention stand out.',
  },
  {
    title: 'Mark it paid',
    body: 'One tap records the payment and moves the next due date forward. Made a mistake? Undo it from the history.',
  },
]

const FEATURES = [
  {
    title: 'Statuses you can read at a glance',
    body: 'Due soon means within 7 days. Overdue shows how many periods you are behind, so nothing quietly piles up.',
    demo: (
      <span className="feature-stamps">
        <span className="due-soon">Due soon</span>
        <span className="due-overdue">2 overdue</span>
        <span className="due-paid">Paid</span>
      </span>
    ),
  },
  {
    title: 'The real monthly and yearly cost',
    body: 'Weekly and yearly plans are turned into a monthly figure, then added up per currency. No guessing, no spreadsheet.',
    demo: <span className="feature-figure">₱10,164.00 / yr</span>,
  },
  {
    title: 'Reminders before the charge',
    body: 'Turn on notifications and get a heads-up 3 days before a payment, on the day it is due, and every day it stays overdue.',
    demo: (
      <span className="feature-notice">
        <BellIcon /> Netflix is due in 3 days
      </span>
    ),
  },
  {
    title: 'A payment history for every one',
    body: 'Each paid period is kept with the date you paid and the amount, so you can look back on what went out.',
    demo: (
      <span className="feature-history">
        <span>Oct 12</span>
        <span>₱549.00</span>
        <span>Sep 12</span>
        <span>₱549.00</span>
      </span>
    ),
  },
  {
    title: 'Find anything fast',
    body: 'Search by name and filter by category, status, or renewal date when the list gets long.',
    demo: (
      <span className="feature-search">
        <SearchIcon /> spot
      </span>
    ),
  },
  {
    title: 'Private to your account',
    body: 'Your list is tied to your login. Nobody else can read or change it, and it is there on any device you sign in from.',
    demo: (
      <span className="feature-lock">
        <LockIcon /> Only you
      </span>
    ),
  },
]

const FAQ = [
  {
    q: 'Does SubTrack connect to my bank or card?',
    a: 'No. You add your subscriptions yourself. SubTrack never sees your bank details, and it never charges, pays, or cancels anything for you. It keeps track so you can decide.',
  },
  {
    q: 'How much does it cost?',
    a: 'Nothing. Create an account with your email and a password and start adding subscriptions.',
  },
  {
    q: 'Can I track subscriptions in different currencies?',
    a: 'Yes. Each subscription has its own currency, and totals are shown separately for each one. SubTrack does not convert between currencies, so the totals are labelled as estimates.',
  },
  {
    q: 'How do reminders work on my phone?',
    a: 'Turn on reminders from the dashboard in each browser you want them on. On an iPhone, add SubTrack to your Home Screen first (Share, then Add to Home Screen), because iPhones only deliver notifications to installed sites.',
  },
  {
    q: 'What if I miss a few payments?',
    a: 'The card shows how many periods are overdue. When you mark it paid, you can pay just the oldest period or all of them at once, and each one is recorded in the history.',
  },
]

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

// Three sample tickets fanned out, with Chloe keeping watch. Decorative: the text beside it says it all.
function HeroTickets() {
  return (
    <div className="hero-art" aria-hidden="true">
      <Chloe mood="alert" size={112} className="hero-chloe" />
      {SAMPLE.map((sub, i) => (
        <div
          key={sub.name}
          className="stub"
          style={{ '--tilt': `${sub.tilt}deg`, '--delay': `${120 + i * 140}ms` }}
        >
          <div className="stub-top">
            <span className="stub-badge">{sub.name[0]}</span>
            <span className="stub-name">
              <strong>{sub.name}</strong>
              <span>{sub.cycle}</span>
            </span>
            <span className="stub-price">{sub.price}</span>
          </div>
          <div className="stub-bottom">
            <span className="stub-due">Next due</span>
            <span className={STAMP_CLASS[sub.status]}>{sub.label}</span>
          </div>
        </div>
      ))}
      <div className="hero-receipt">
        <span>Monthly total</span>
        <strong>₱847.00</strong>
      </div>
    </div>
  )
}

export default function Landing({ onLogIn, onSignUp }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Logo size={36} tagline={false} />
        <nav className="landing-nav-actions" aria-label="Account">
          <button type="button" className="link" onClick={onLogIn}>
            Log in
          </button>
          <button type="button" className="small" onClick={onSignUp}>
            Get started
          </button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Subscription tracker</p>
            <h1>
              Catch every renewal <em>before it catches you.</em>
            </h1>
            <p className="hero-lede">
              SubTrack puts all your subscriptions on one page: streaming, music, cloud storage, apps,
              and the free trial you forgot to cancel. See what's due this week, what's overdue, and
              what it all really costs you.
            </p>
            <div className="hero-actions">
              <button type="button" className="big" onClick={onSignUp}>
                Start tracking for free
              </button>
              <a className="hero-secondary" href="#how-it-works">
                See how it works
              </a>
            </div>
            <ul className="hero-points">
              <li>No bank or card connection</li>
              <li>Reminders on your phone</li>
              <li>Any currency</li>
            </ul>
          </div>
          <HeroTickets />
        </section>

        <section className="math" aria-labelledby="math-title">
          <div className="math-inner reveal">
            <p className="eyebrow">Do the math</p>
            <h2 id="math-title">
              <span className="math-small">₱847 a month sounds small.</span>
              <span className="math-big">
                That's <span className="math-figure">₱10,164</span> a year.
              </span>
            </h2>
            <p className="math-note">
              Three ordinary subscriptions add up fast, and renewals don't send you a bill to open.
              SubTrack shows the yearly figure next to the monthly one, so you can decide what's
              worth keeping.
            </p>
          </div>
        </section>

        <section id="how-it-works" className="steps-section" aria-labelledby="steps-title">
          <p className="eyebrow">How it works</p>
          <h2 id="steps-title" className="section-heading">
            Set it up once. Glance at it whenever.
          </h2>
          <ol className="steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="step reveal">
                <span className="step-number">{String(i + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="features-section" aria-labelledby="features-title">
          <p className="eyebrow">What you get</p>
          <h2 id="features-title" className="section-heading">
            Everything you need to stay ahead of your bills.
          </h2>
          <ul className="features">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="feature reveal">
                <div className="feature-demo" aria-hidden="true">
                  {feature.demo}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="chloe-section reveal" aria-labelledby="chloe-title">
          <div className="chloe-moods" aria-hidden="true">
            <figure>
              <ChloePose mood="alert" size={150} />
              <figcaption>Something's due</figcaption>
            </figure>
            <figure>
              <ChloePose mood="napping" size={150} />
              <figcaption>All paid</figcaption>
            </figure>
          </div>
          <div>
            <p className="eyebrow">Meet Chloe</p>
            <h2 id="chloe-title" className="section-heading">
              A watchdog for your due dates.
            </h2>
            <p className="muted">
              Chloe the dachshund lives on your dashboard. Her ears go up when a payment is close or
              overdue, and she tells you which one. When everything is paid, she naps until the next
              charge.
            </p>
          </div>
        </section>

        <section className="faq-section" aria-labelledby="faq-title">
          <p className="eyebrow">Good to know</p>
          <h2 id="faq-title" className="section-heading">
            Questions, answered.
          </h2>
          <div className="faq">
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="final-cta reveal" aria-labelledby="cta-title">
          <LogoMark size={56} className="final-cta-mark" />
          <h2 id="cta-title">Know what's coming out, and when.</h2>
          <p>It takes a minute to sign up, and a few more to add what you pay for.</p>
          <div className="hero-actions">
            <button type="button" className="big inverse" onClick={onSignUp}>
              Create your free account
            </button>
            <button type="button" className="link" onClick={onLogIn}>
              I already have an account
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <Logo size={28} tagline={false} />
        <p className="muted">Track your subscriptions. Keep your money.</p>
      </footer>
    </div>
  )
}
