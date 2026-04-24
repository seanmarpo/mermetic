/**
 * Curated example diagrams covering all major Mermaid diagram types.
 * Each entry maps a human-readable label to its Mermaid source code.
 */

export interface DiagramExample {
  readonly label: string;
  readonly code: string;
}

export const DIAGRAM_EXAMPLES: readonly DiagramExample[] = [
  {
    label: "Flowchart",
    code: `flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Check logs]
    E --> F{Found the issue?}
    F -->|Yes| G[Fix it]
    F -->|No| H[Search Stack Overflow]
    H --> D
    G --> C
    C --> I[Ship it 🚀]`,
  },
  {
    label: "Sequence",
    code: `sequenceDiagram
    actor User
    participant App
    participant API
    participant DB

    User->>App: Click "Submit"
    App->>API: POST /orders
    API->>DB: INSERT order
    DB-->>API: order_id
    API-->>App: 201 Created
    App-->>User: Show confirmation

    Note over API,DB: Async processing
    API--)DB: Queue invoice generation`,
  },
  {
    label: "Class",
    code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
        +move() void
    }
    class Dog {
        +String breed
        +fetch() void
        +makeSound() void
    }
    class Cat {
        +bool isIndoor
        +purr() void
        +makeSound() void
    }
    class Shelter {
        -List~Animal~ animals
        +adopt(Animal a) bool
        +intake(Animal a) void
    }
    Animal <|-- Dog
    Animal <|-- Cat
    Shelter "1" o-- "*" Animal : houses`,
  },
  {
    label: "State",
    code: `stateDiagram-v2
    [*] --> Idle

    Idle --> Processing : Submit
    Processing --> Validating : Parse input

    state Validating {
        [*] --> CheckFormat
        CheckFormat --> CheckRules
        CheckRules --> [*]
    }

    Validating --> Approved : Valid
    Validating --> Rejected : Invalid

    Approved --> Complete : Finalize
    Rejected --> Idle : Retry
    Complete --> [*]`,
  },
  {
    label: "Entity Relationship",
    code: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        int id PK
        string name
        string email
    }
    ORDER ||--|{ LINE_ITEM : contains
    ORDER {
        int id PK
        date created
        string status
    }
    LINE_ITEM }|--|| PRODUCT : "refers to"
    PRODUCT {
        int id PK
        string name
        float price
        int stock
    }`,
  },
  {
    label: "Gantt",
    code: `gantt
    title Project Launch Timeline
    dateFormat YYYY-MM-DD

    section Planning
        Requirements       :done, req, 2024-01-01, 14d
        Architecture       :done, arch, after req, 10d

    section Development
        Core features      :active, core, after arch, 21d
        API integration    :api, after core, 14d
        Testing            :test, after api, 10d

    section Release
        Beta release       :milestone, beta, after test, 0d
        Bug fixes          :fix, after beta, 7d
        Production launch  :milestone, launch, after fix, 0d`,
  },
  {
    label: "Pie Chart",
    code: `pie showData
    title Tech Stack Preferences (2024 Survey)
    "TypeScript" : 42
    "JavaScript" : 28
    "Python" : 18
    "Go" : 8
    "Rust" : 4`,
  },
  {
    label: "Git Graph",
    code: `gitGraph
    commit id: "init"
    commit id: "add readme"
    branch feature/auth
    checkout feature/auth
    commit id: "add login"
    commit id: "add signup"
    checkout main
    branch feature/api
    commit id: "add endpoints"
    checkout feature/auth
    commit id: "add tests"
    checkout main
    merge feature/auth id: "merge auth"
    checkout feature/api
    commit id: "add validation"
    checkout main
    merge feature/api id: "merge api"
    commit id: "v1.0.0" tag: "v1.0.0"`,
  },
  {
    label: "Mindmap",
    code: `mindmap
    root((Project))
        Frontend
            UI Components
            State Management
            Routing
        Backend
            API Layer
            Database
            Authentication
        DevOps
            CI/CD
            Monitoring
            Infrastructure
        Documentation
            API Docs
            User Guide`,
  },
  {
    label: "Timeline",
    code: `timeline
    title History of Web Development
    section Early Web
        1991 : HTML invented
        1994 : CSS proposed
        1995 : JavaScript created
    section Dynamic Web
        2004 : Web 2.0 era begins
        2006 : jQuery released
        2009 : Node.js released
    section Modern Frameworks
        2013 : React released
        2014 : Vue.js released
        2016 : TypeScript gains traction
    section Current Era
        2020 : Deno 1.0
        2023 : AI-assisted development
        2024 : Edge computing mainstream`,
  },
  {
    label: "User Journey",
    code: `journey
    title Morning Coffee Workflow
    section Get Up
        Wake up: 3: Me
        Check phone: 2: Me
    section Make Coffee
        Walk to kitchen: 3: Me
        Grind beans: 4: Me
        Brew espresso: 5: Me, Machine
        Steam milk: 4: Me, Machine
    section Enjoy
        First sip: 5: Me
        Read news: 4: Me
        Start working: 3: Me`,
  },
  {
    label: "Quadrant Chart",
    code: `quadrantChart
    title Feature Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Plan carefully
    quadrant-2 Do first
    quadrant-3 Delegate
    quadrant-4 Quick wins
    Authentication: [0.8, 0.9]
    Dark mode: [0.2, 0.6]
    Search: [0.6, 0.7]
    Tooltips: [0.15, 0.3]
    Export PDF: [0.5, 0.4]
    Keyboard shortcuts: [0.3, 0.8]
    Onboarding tour: [0.7, 0.5]`,
  },
  {
    label: "Sankey",
    code: `sankey-beta

    Traffic,Organic Search,5000
    Traffic,Direct,3000
    Traffic,Social Media,2000
    Traffic,Referral,1500
    Organic Search,Blog,3500
    Organic Search,Landing Pages,1500
    Direct,Homepage,2000
    Direct,App,1000
    Social Media,Twitter,800
    Social Media,LinkedIn,700
    Social Media,Other,500
    Blog,Signups,1200
    Landing Pages,Signups,900
    Homepage,Signups,600
    App,Signups,800`,
  },
  {
    label: "Block",
    code: `block-beta
    columns 3

    space:3
    Frontend["Frontend App"]:3
    space:3

    API["API Gateway"]
    Auth["Auth Service"]
    Cache["Redis Cache"]

    Users["User Service"]
    Orders["Order Service"]
    Notify["Notification Service"]

    space:3
    DB[("PostgreSQL")]:2
    Queue["Message Queue"]

    Frontend --> API
    API --> Auth
    API --> Cache
    API --> Users
    API --> Orders
    Orders --> Notify
    Users --> DB
    Orders --> DB
    Notify --> Queue`,
  },
  {
    label: "Layout: ELK",
    code: `---
config:
  layout: elk
---
flowchart TD
    Start[Request Received] --> Auth{Authenticated?}
    Auth -->|Yes| RateLimit{Rate limit OK?}
    Auth -->|No| Unauth[401 Unauthorized]

    RateLimit -->|Yes| Route[Route Request]
    RateLimit -->|No| TooMany[429 Too Many Requests]

    Route --> Users[User Service]
    Route --> Orders[Order Service]
    Route --> Search[Search Service]

    Users --> Cache[(Redis Cache)]
    Users --> UserDB[(Users DB)]
    Orders --> OrderDB[(Orders DB)]
    Orders --> Queue[Message Queue]
    Search --> Index[(Search Index)]

    Queue --> Notify[Notification Service]
    Queue --> Analytics[Analytics Service]

    Notify --> Email[Email Provider]
    Notify --> Push[Push Notifications]

    Cache -.->|miss| UserDB`,
  },
  {
    label: "Layout: Tidy Tree",
    code: `---
config:
  layout: tidy-tree
---
flowchart TD
    CEO[CEO]
    CEO --> CTO[CTO]
    CEO --> CFO[CFO]
    CEO --> COO[COO]

    CTO --> VP_Eng[VP Engineering]
    CTO --> VP_Prod[VP Product]

    VP_Eng --> FE[Frontend Team]
    VP_Eng --> BE[Backend Team]
    VP_Eng --> Infra[Infrastructure]

    VP_Prod --> Design[Design]
    VP_Prod --> PM[Product Managers]

    CFO --> Accounting[Accounting]
    CFO --> FPA[FP&A]

    COO --> HR[Human Resources]
    COO --> Legal[Legal]
    COO --> Ops[Operations]

    FE --> FE1[Web App]
    FE --> FE2[Mobile App]
    BE --> BE1[API Team]
    BE --> BE2[Data Team]`,
  },
] as const;
