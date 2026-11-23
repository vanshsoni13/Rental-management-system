# Academic methodology and prototype evaluation

This document describes a study that can be conducted with the existing rental-management prototype. It is a protocol, not a report of completed fieldwork. No interviews, survey responses, usability scores, or effectiveness results are claimed here.

## Design-thinking journey

### 1. Empathize

- **Target users:** people seeking short-term equipment rentals, registered renters, and equipment owners/sellers; administrators are an operational stakeholder group.
- **Evidence available in the software:** the current workflows support product discovery and availability checks, booking, rental/payment status, seller inventory, and administrator review. This describes the product's intended workflows, not measured user pain or observed behavior.
- **Research activity to conduct:** recruit consenting renters and equipment owners for short, semi-structured interviews and a task-based questionnaire. Ask participants to describe how they currently find equipment, compare prices/availability, make a booking, and track payment or returns.
- **Proposed survey questions** (not responses): how often do you rent equipment; which information is needed before booking; how clear are rental price/deposit/availability details; how confident are you about payment and booking status; which step is most difficult; how easy was the specified prototype task (1–5); what should be improved?
- **Consent/privacy:** explain the academic purpose, voluntary participation, withdrawal, and data retention before collecting responses. Do not collect payment credentials or unnecessary identifiers. Store consent separately from pseudonymized answers and restrict access to raw data.

### 2. Define

- **User need:** prospective renters need to understand product availability, rental cost, and deposit and be able to submit and track a booking without ambiguity; sellers need to manage their own inventory and view relevant bookings.
- **Focused problem statement:** “Renters need a clear, reliable way to discover suitable equipment, confirm date-specific availability and payable amounts, and track a booking so they can make an informed rental decision.”
- **Root causes to investigate, not assume:** information split across channels, uncertainty about stock/date overlap, unclear payment progress, or lack of a centralized booking record. Interviews/surveys must establish which causes actually occur.
- **Success measures:** task completion without assistance, time to complete a booking task, rate of correct understanding of availability/price, and participant-reported ease/confidence. Define thresholds before a study; do not infer success from implementation alone.

### 3. Ideate

Candidate approaches:

| Idea | Advantages | Limitations |
|---|---|---|
| Shared spreadsheet or manual requests | Low initial cost; familiar | Difficult to enforce date-overlap stock checks; limited status visibility |
| Marketplace with inquiry-only requests | Lets users browse owner listings | Availability and payment tracking remain manual |
| Existing RentHub booking prototype | Combines listings, availability, booking, seller tools, admin operations, and payment status | Requires accurate inventory and operational updates; payment provider and real-world usability must still be evaluated |

Selection criteria are fit with renter/owner needs, preservation of the already-built project, consistency of data, and ability to test the workflow. The current prototype is retained; this migration changes the server implementation, not the product concept or UI.

### 4. Prototype

The existing React/Vite UI remains in `frontend`. It calls `/api` through Axios and the Vite proxy. FastAPI serves compatible JSON routes, validates input, authenticates the existing Bearer token, enforces role/ownership rules, and uses parameterized MySQL operations and transactions. Product images are served under `/uploads/products`. Razorpay orders are created and verified by the server; gateway secrets do not enter frontend code. A local Python recommendation engine uses TF-IDF and cosine similarity over item names, descriptions, and categories, combined with aggregate rental counts. For signed-in customers it can use their qualifying rental history; it uses no external AI service and does not persist recommendation profiles.

Representative data flow: React booking form → `POST /api/rentals` with dates/items → FastAPI validates dates/quantity, locks product rows and checks overlapping active reservations, calculates tier pricing, commits rental/items/notification together → JSON booking response → existing payment page requests a Razorpay order → server verifies the signature and captured gateway order/payment before updating records.

### 5. Test

1. Run automated unit/API-shape tests (`python -m pytest -q`) and record the actual command, date, and result.
2. With a disposable test database created from a copy of the existing schema, test registration/login, product availability boundaries, booking overlap/rollback, role ownership, COD state, Razorpay signature failures, return/deposit boundaries, and invoice duplicate protection.
3. Test the existing UI with representative customer, seller, and administrator tasks; obtain consent and record task completion/time and observed issues without collecting unnecessary personal data.
4. Analyze only collected, consented observations. Separate test fixtures from participant data and label synthetic demonstrations as synthetic.

## Sampling and survey plan

Use purposive recruitment for initial formative interviews, then a convenience sample of eligible adult renters and equipment owners for prototype task testing; report recruitment and nonresponse limitations. If the population size `N` is known and a proportion estimate is needed, a conventional planning estimate at 95% confidence with `p=0.5` and margin `e=0.05` is `n0 = 1.96² × p × (1-p) / e² ≈ 385`, adjusted for a finite population by `n = n0 / (1 + (n0-1)/N)`. This is a planning reference, not a claim that this prototype has that many users or that this sample is feasible. A smaller academic usability sample can identify qualitative issues but cannot support precise population-wide prevalence claims.

## Probability and statistical methods

- **Descriptive statistics:** count valid and missing observations; mean/median/mode, min/max/range, sample standard deviation, and frequency/percentage summaries. The API excludes nulls from numeric summaries and reports their count.
- **Correlation:** Spearman is the default for ordinal ratings or monotonic relationships; Pearson is available for approximately interval, linearly related variables. Report variable names, complete-pair `n`, coefficient, and p-value. Inspect plots/outliers and do not interpret association as causation.
- **Hypothesis example:** for the same participant completing a comparable booking task before and after the prototype, H0 is that the mean paired task-time difference is zero; H1 is that it is not zero. Use a two-sided paired t-test at a preregistered alpha (for example 0.05) only when paired differences are reasonably independent across participants and approximately normal. Report the mean difference, 95% confidence interval, p-value, and Cohen's `dz`; consider Wilcoxon signed-rank if assumptions are not reasonable. A convenience sample and learning/order effects limit generalization and causal interpretation.
- **No fabricated findings:** the analysis module and tests use deterministic synthetic fixtures only. There are no real participant observations in the repository. Endpoints accept data for analysis but do not save it.

## Local AI recommendation method

The recommendation prototype is a content-based retrieval system, not a generative chatbot or a supervised model trained on labeled outcomes. Scikit-learn TF-IDF vectorizes product names, categories, and descriptions; cosine similarity ranks related active items. Rental counts contribute a transparent popularity signal. The catalog search also expands a small domain synonym vocabulary (for example, bike/bicycle) before querying the catalog. When a signed-in customer has qualifying rental history, the model uses that customer's previously rented item content as a profile; otherwise it falls back to popularity. Recommendations include reasons and are not guarantees of suitability or availability. The catalog data stays in the application's own backend and recommendation profiles are computed per request, not stored.

Evaluation should compare the recommendations with a simple popularity-only baseline using a consented, held-out set of rental interactions when enough data exists. Report data size and coverage, and use metrics such as Precision@K or Recall@K only when a valid relevance label is available. The current prototype has not been evaluated with real participants; synthetic tests establish code behavior, not recommendation quality.

## Subject mapping, limitations, and next steps

| Subject | Where demonstrated | Evidence |
|---|---|---|
| Design Thinking | This protocol's five stages | Existing workflow and explicit future research/evaluation plan |
| Web Technology | React/Vite client, HTTP/JSON REST API, FastAPI, MySQL | Existing frontend integration, documented routes, OpenAPI |
| Artificial Intelligence | Local content-based rental recommender | TF-IDF item vectors, cosine-similarity ranking, rental-history profile, and popularity fallback |
| Python | FastAPI backend, business logic, database access, AI/analysis modules | Python application and pytest cases |
| Probability & Statistics | Empathize sampling plan, define success measures, test-stage analysis | Reusable validated summaries, correlation and paired-test functions |

Limitations: the study protocol has not been conducted; no usability, recommendation-quality, or effectiveness evidence is yet available. Deployment requires a properly backed-up and migrated existing MySQL database, configured production secrets, HTTPS, and a restricted CORS origin. Razorpay cannot be end-to-end verified without valid Test Mode credentials and external gateway access. Future work should conduct the consented study, evaluate the workflow with real participants, and report actual results with sampling and assumption limitations.
