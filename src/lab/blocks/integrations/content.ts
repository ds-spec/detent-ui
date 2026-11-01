import {
  siAirtable,
  siBigcommerce,
  siCalendly,
  siConfluence,
  siDiscord,
  siGithub,
  siGmail,
  siGooglemeet,
  siGoogledrive,
  siGooglesheets,
  siHelpscout,
  siHubspot,
  siIntercom,
  siJira,
  siLinear,
  siMailchimp,
  siMessenger,
  siNotion,
  siPaypal,
  siShopify,
  siStripe,
  siTelegram,
  siWhatsapp,
  siZendesk,
} from 'simple-icons'

/**
 * The tools that drift through the glass, dealt across three rows. Marks are Simple Icons paths
 * (CC0) on a 24×24 box; the brands belong to their owners and are here as data you swap for your own.
 */
export type Integration = {
  id: string
  name: string
  /** What kind of tool it is. */
  kind: string
  /** What the product does there, in one sentence that follows its name: “answers new tickets…”. */
  does: string
  /** The mark, as a path on a 24×24 box. */
  mark: string
  /** The mark's own colour, under the glass and once it's connected. A colour too faint for the theme falls back to ink. */
  color: string
  /** What connecting lets the product do there, one line each. Defaults to what tools of its kind need. */
  access?: string[]
  connected?: boolean
}

/** What a tool of each kind is asked for when it's connected. */
export const ACCESS: Record<string, string[]> = {
  'Help desk': ['Read tickets, macros and customers', 'Reply, tag and hand over to your team'],
  'Live chat': ['Read conversations in Messenger', 'Reply and pass threads to your team'],
  Messaging: ['Read messages sent to your account', 'Reply as your business'],
  Email: ['Read your support inbox', 'Draft replies, and send the ones you allow'],
  Community: ['Read the help channels you choose', 'Reply and open threads'],
  Calls: ['Join calls it’s invited to', 'Write up notes and next steps'],
  Scheduling: ['See your team’s availability', 'Book calls on their calendars'],
  'Email marketing': ['Look up subscribers', 'Change their subscriptions'],
  Database: ['Read the bases you share with it', 'Add and update rows'],
  Store: ['Read orders, products and customers', 'Change addresses and start returns'],
  Payments: ['Read charges and customers', 'Refund up to the limit you set'],
  CRM: ['Read contacts and deals', 'Log conversations and notes'],
  Spreadsheets: ['Open the sheets you share with it', 'Add rows'],
  Docs: ['Read the pages you share with it', 'Comment when one looks out of date'],
  Files: ['Read the folders you share with it'],
  Issues: ['Read issues and where they stand', 'File and update issues'],
  Code: ['Read issues and releases'],
}

const hex = (s: { hex: string }) => `#${s.hex}`

export const INTEGRATIONS: Integration[] = [
  {
    id: 'zendesk',
    name: 'Zendesk',
    kind: 'Help desk',
    does: 'answers new tickets in your macros’ voice, and hands the hard ones to a person with the thread summed up.',
    mark: siZendesk.path,
    color: hex(siZendesk),
    connected: true,
  },
  {
    id: 'intercom',
    name: 'Intercom',
    kind: 'Live chat',
    does: 'takes the first reply in Messenger, and passes the conversation on already summarised.',
    mark: siIntercom.path,
    color: '#1f8ded',
  },
  {
    id: 'helpscout',
    name: 'Help Scout',
    kind: 'Help desk',
    does: 'replies in your shared inbox the way your team would, and leaves a note when it hands one over.',
    mark: siHelpscout.path,
    color: hex(siHelpscout),
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    kind: 'Messaging',
    does: 'answers customers where they already message you, in the language they wrote in.',
    mark: siWhatsapp.path,
    color: hex(siWhatsapp),
  },
  {
    id: 'messenger',
    name: 'Messenger',
    kind: 'Messaging',
    does: 'picks up messages to your page within seconds, at three in the morning as much as at noon.',
    mark: siMessenger.path,
    color: hex(siMessenger),
  },
  {
    id: 'telegram',
    name: 'Telegram',
    kind: 'Messaging',
    does: 'runs your support bot, with the same answers and the same limits as everywhere else.',
    mark: siTelegram.path,
    color: hex(siTelegram),
  },
  {
    id: 'gmail',
    name: 'Gmail',
    kind: 'Email',
    does: 'drafts replies in your support inbox for a person to send, and sends the easy ones itself.',
    mark: siGmail.path,
    color: hex(siGmail),
  },
  {
    id: 'discord',
    name: 'Discord',
    kind: 'Community',
    does: 'answers in your community’s help channel, and pulls in a person when it turns out to be a bug.',
    mark: siDiscord.path,
    color: hex(siDiscord),
  },
  {
    id: 'googlemeet',
    name: 'Google Meet',
    kind: 'Calls',
    does: 'sits in on support calls to take notes, and writes up what was agreed before the call ends.',
    mark: siGooglemeet.path,
    color: hex(siGooglemeet),
  },
  {
    id: 'calendly',
    name: 'Calendly',
    kind: 'Scheduling',
    does: 'books time with the right person when a conversation needs a call, not another message.',
    mark: siCalendly.path,
    color: hex(siCalendly),
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    kind: 'Email marketing',
    does: 'unsubscribes, resubscribes and fixes preferences the moment a customer asks.',
    mark: siMailchimp.path,
    color: hex(siMailchimp),
  },
  {
    id: 'airtable',
    name: 'Airtable',
    kind: 'Database',
    does: 'reads and updates the tables your team already runs on, like claims and replacements.',
    mark: siAirtable.path,
    color: hex(siAirtable),
  },
  {
    id: 'shopify',
    name: 'Shopify',
    kind: 'Store',
    does: 'looks up orders, changes an address before it ships, and starts a return without a form.',
    mark: siShopify.path,
    color: hex(siShopify),
    connected: true,
  },
  {
    id: 'bigcommerce',
    name: 'BigCommerce',
    kind: 'Store',
    does: 'finds orders, tracks parcels and starts exchanges on BigCommerce stores.',
    mark: siBigcommerce.path,
    color: hex(siBigcommerce),
  },
  {
    id: 'stripe',
    name: 'Stripe',
    kind: 'Payments',
    does: 'refunds inside the limits you set, and says why on the customer’s receipt.',
    mark: siStripe.path,
    color: hex(siStripe),
    connected: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    kind: 'Payments',
    does: 'issues PayPal refunds inside your limits, and tells the customer when to expect them.',
    mark: siPaypal.path,
    color: hex(siPaypal),
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    kind: 'CRM',
    does: 'logs every conversation to the contact, along with anything that was promised.',
    mark: siHubspot.path,
    color: hex(siHubspot),
  },
  {
    id: 'googlesheets',
    name: 'Google Sheets',
    kind: 'Spreadsheets',
    does: 'keeps a running sheet of what it did, for the people who reconcile it.',
    mark: siGooglesheets.path,
    color: hex(siGooglesheets),
  },
  {
    id: 'notion',
    name: 'Notion',
    kind: 'Docs',
    does: 'learns from your help pages and policies, and flags the ones that have gone out of date.',
    mark: siNotion.path,
    color: hex(siNotion),
  },
  {
    id: 'confluence',
    name: 'Confluence',
    kind: 'Docs',
    does: 'answers from your Confluence pages, and says which page every answer came from.',
    mark: siConfluence.path,
    color: hex(siConfluence),
  },
  {
    id: 'googledrive',
    name: 'Google Drive',
    kind: 'Files',
    does: 'reads the manuals, price lists and PDFs in your shared drive.',
    mark: siGoogledrive.path,
    color: hex(siGoogledrive),
  },
  {
    id: 'linear',
    name: 'Linear',
    kind: 'Issues',
    does: 'files the bugs customers run into, with their own words and how many it affects.',
    mark: siLinear.path,
    color: hex(siLinear),
  },
  {
    id: 'jira',
    name: 'Jira',
    kind: 'Issues',
    does: 'files bugs for teams on Jira: one issue for each bug, not one for every complaint.',
    mark: siJira.path,
    color: hex(siJira),
  },
  {
    id: 'github',
    name: 'GitHub',
    kind: 'Code',
    does: 'checks that a fix has actually shipped before telling anyone it’s fixed.',
    mark: siGithub.path,
    color: hex(siGithub),
  },
]
