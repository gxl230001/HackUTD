// MOCK DATA - replaced in later layers.
// Everything here is fake and exists only to demonstrate the UI.

export type RiskLevel = "scam" | "suspicious" | "ok";

export type ReasonSource = "rule" | "model";

export interface Reason {
  id: string;
  text: string;
  source: ReasonSource;
}

export interface CheckResult {
  risk: RiskLevel;
  reasons: Reason[];
  dont: string[];
  do: string[];
}

export interface RecentCheck {
  id: string;
  preview: string;
  checkedAt: string;
  risk: RiskLevel;
}

export interface ExampleMessage {
  id: string;
  title: string;
  text: string;
  result: CheckResult;
}

export interface CircleMember {
  id: string;
  displayName: string;
  isYou?: boolean;
}

export interface Circle {
  name: string;
  inviteCode: string;
  members: CircleMember[];
}

export type NotificationType =
  | "help_request"
  | "response"
  | "resolved"
  | "sharing_withdrawn";

export interface AppNotification {
  id: string;
  type: NotificationType;
  from: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  /** Only present for help requests. */
  request?: {
    messageText: string | null;
    findings: Reason[] | null;
    risk: RiskLevel;
  };
}

export const currentUser = { firstName: "Alex" };

export const recentChecks: RecentCheck[] = [
  {
    id: "c1",
    preview: "Your package could not be delivered. Update your address at…",
    checkedAt: "Today, 9:12 AM",
    risk: "scam",
  },
  {
    id: "c2",
    preview: "Hi, it's the pharmacy. Your prescription is ready for pickup.",
    checkedAt: "Yesterday",
    risk: "ok",
  },
  {
    id: "c3",
    preview: "You won a $500 gift card! Reply YES to claim before midnight.",
    checkedAt: "Mon",
    risk: "suspicious",
  },
];

const deliveryResult: CheckResult = {
  risk: "scam",
  reasons: [
    {
      id: "r1",
      text: "It asks you to tap a link to fix a delivery problem.",
      source: "rule",
    },
    {
      id: "r2",
      text: "The link does not go to a real delivery company's website.",
      source: "rule",
    },
    {
      id: "r3",
      text: "The wording matches common fake delivery texts.",
      source: "model",
    },
  ],
  dont: [
    "Don't tap the link.",
    "Don't enter your address, card, or password.",
    "Don't reply to the message.",
  ],
  do: [
    "Check your order in the store's own app or website.",
    "Delete the message.",
    "Ask your circle if you're unsure.",
  ],
};

const bankResult: CheckResult = {
  risk: "scam",
  reasons: [
    {
      id: "r4",
      text: "It says your account is locked and pushes you to act fast.",
      source: "rule",
    },
    {
      id: "r5",
      text: "It asks for your card number by text. Banks don't do this.",
      source: "rule",
    },
    {
      id: "r6",
      text: "The message style looks like known bank scams.",
      source: "model",
    },
  ],
  dont: [
    "Don't share card numbers, PINs, or codes.",
    "Don't call any number in the message.",
  ],
  do: [
    "Call the number on the back of your bank card.",
    "Ask your circle before doing anything.",
  ],
};

const familyResult: CheckResult = {
  risk: "suspicious",
  reasons: [
    {
      id: "r7",
      text: "Someone says they are family but is texting from a new number.",
      source: "rule",
    },
    {
      id: "r8",
      text: "They ask for money with a gift card or wire transfer.",
      source: "rule",
    },
    {
      id: "r9",
      text: "It may be real, but it looks like a common trick.",
      source: "model",
    },
  ],
  dont: [
    "Don't send money or gift cards yet.",
    "Don't share personal details.",
  ],
  do: [
    "Call your family member at the number you already know.",
    "Ask your circle to help you check.",
  ],
};

const okResult: CheckResult = {
  risk: "ok",
  reasons: [
    {
      id: "r10",
      text: "No links, money requests, or pressure to act fast.",
      source: "rule",
    },
    {
      id: "r11",
      text: "The wording looks like a normal message.",
      source: "model",
    },
  ],
  dont: ["Don't share passwords or codes, even if a message looks safe."],
  do: ["You can reply as usual.", "Ask your circle if something feels off."],
};

export const exampleMessages: ExampleMessage[] = [
  {
    id: "ex-delivery",
    title: "Delivery text",
    text: "EXAMPLE: ParcelPost: Your package is on hold due to an unpaid fee of $1.99. Pay now at parcel-post-help.example to avoid return.",
    result: deliveryResult,
  },
  {
    id: "ex-bank",
    title: "Bank alert",
    text: "EXAMPLE: Sample Bank ALERT: Your account is LOCKED. Reply with your card number and PIN within 1 hour to unlock.",
    result: bankResult,
  },
  {
    id: "ex-family",
    title: "Family member asking for money",
    text: "EXAMPLE: Hi Mom, it's me. I broke my phone so this is my new number. Can you buy me two $200 gift cards? I'll pay you back.",
    result: familyResult,
  },
];

/** Mock "check" for pasted text: picks a canned result from simple keywords. */
export function mockCheck(text: string): CheckResult {
  const t = text.toLowerCase();
  if (/(gift card|wire|new number)/.test(t)) return familyResult;
  if (/(bank|locked|pin|card number)/.test(t)) return bankResult;
  if (/(http|www\.|\.com|link|package|deliver)/.test(t)) return deliveryResult;
  return okResult;
}

export const circle: Circle = {
  name: "Family Circle",
  inviteCode: "QX7-42B",
  members: [
    { id: "m1", displayName: "Alex", isYou: true },
    { id: "m2", displayName: "Jordan" },
    { id: "m3", displayName: "Sam" },
  ],
};

export const notifications: AppNotification[] = [
  {
    id: "n1",
    type: "help_request",
    from: "Jordan",
    title: "Jordan asked for help",
    body: "Jordan got a text and wants your opinion.",
    time: "10 min ago",
    read: false,
    request: {
      messageText:
        "EXAMPLE: Sample Bank ALERT: Your account is LOCKED. Reply with your card number and PIN within 1 hour to unlock.",
      findings: bankResult.reasons,
      risk: "scam",
    },
  },
  {
    id: "n2",
    type: "response",
    from: "Sam",
    title: "Sam responded",
    body: "Sam thinks your delivery text looks like a scam.",
    time: "1 hr ago",
    read: false,
  },
  {
    id: "n3",
    type: "help_request",
    from: "Sam",
    title: "Sam asked for help",
    body: "Sam shared findings only, not the message text.",
    time: "Yesterday",
    read: true,
    request: {
      messageText: null,
      findings: familyResult.reasons,
      risk: "suspicious",
    },
  },
  {
    id: "n4",
    type: "resolved",
    from: "Jordan",
    title: "Jordan marked a request as resolved",
    body: "Thanks for helping. Jordan deleted the message.",
    time: "Mon",
    read: true,
  },
  {
    id: "n5",
    type: "sharing_withdrawn",
    from: "Sam",
    title: "Sam stopped sharing",
    body: "Sam took back a message they had shared. It's no longer visible.",
    time: "Sun",
    read: true,
  },
];

export const unreadCount = notifications.filter((n) => !n.read).length;
