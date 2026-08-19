# 📊 InsightFlow

### Turn product data into decisions.

InsightFlow is a browser-based **product analytics and decision-support tool** that transforms product event data into actionable insights.

Upload a CSV containing user and product events and InsightFlow analyzes:

- 📈 Product usage
- 👥 User activity
- 🔄 Conversion funnels
- 🔁 Retention
- 🧩 Feature adoption
- 🎯 User segments
- 💰 Revenue
- 🧠 Automated product insights
- 📌 Feature prioritization using RICE

The application is designed to help Product Managers answer a simple question:

> **What is happening in my product, why might it be happening, and what should I do next?**

---

## 🚀 Live Demo

**Try InsightFlow:**

https://darshannellary.github.io/insightflow/

**GitHub Repository:**

https://github.com/darshannellary/insightflow

---

## ✨ Features

### 📤 CSV Product Data Import

Upload your own product event data through:

- Drag and drop
- File selection

InsightFlow automatically analyzes the dataset and detects available:

- Users
- Events
- Dates
- Plans
- Devices
- Countries
- Revenue

The application adapts to the available columns instead of requiring every field to be present.

---

### 📊 Product Dashboard

Get an immediate overview of product performance.

Key metrics can include:

- Total Users
- Active Users
- New Users
- Activation Rate
- Conversion Rate
- Retention
- Revenue
- Average Revenue Per User (ARPU)

Trend indicators help identify whether important metrics are improving or declining.

---

### 📈 User Activity Analytics

Analyze product usage over time.

View trends for:

- Daily Active Users
- Weekly Active Users
- New Users
- Product Events

Use different date ranges to understand short-term and long-term behavior.

---

### 🔄 Conversion Funnels

Understand where users drop out of the product journey.

A typical funnel might look like:

```text
Signup
   ↓
Onboarding Complete
   ↓
Feature Usage
   ↓
Purchase
```

InsightFlow calculates:

- Users at each stage
- Conversion rate
- Drop-off rate
- Largest conversion opportunity

---

### 🔁 Retention Analysis

Understand whether users continue coming back after signup.

InsightFlow creates cohort-based retention analysis using signup periods.

Example:

```text
             W0     W1     W2     W3     W4

Jul 01      100%   42%    31%    25%    21%
Jul 08      100%   46%    34%    28%    23%
Jul 15      100%   51%    38%    31%    26%
```

This makes it easier to identify:

- Strong cohorts
- Weak cohorts
- Retention deterioration
- Changes in user engagement

---

### 🧩 Feature Analytics

Automatically identify feature-related events and analyze:

- Feature adoption
- Unique users
- Usage frequency
- Adoption trends
- Relationship with conversion

Example:

```text
Feature             Users       Adoption

Dashboard           4,821       62%
Reports             2,103       27%
Export                843       11%
```

InsightFlow can highlight features with:

- High adoption
- Low adoption
- Strong conversion relationships
- Potential product opportunities

---

### 👥 Segment Analysis

Compare product performance across different user segments.

Depending on the uploaded dataset, InsightFlow can analyze dimensions such as:

- Device
- Country
- Plan
- Other available attributes

Example:

```text
DEVICE

Desktop
Conversion: 7.4%

Mobile
Conversion: 3.8%
```

InsightFlow can surface meaningful differences between segments and identify potential opportunities.

---

# 🤖 AI Product Analyst

One of InsightFlow's core features is the **AI Product Analyst**.

The important distinction is that InsightFlow does **not require an external AI API**.

There is:

- ❌ No OpenAI API
- ❌ No Anthropic API
- ❌ No Gemini API
- ❌ No API key
- ❌ No backend
- ❌ No paid AI service

Instead, InsightFlow uses **local statistical analysis, pattern detection, heuristics, and rule-based reasoning** to generate product insights.

The result is an AI-style product analysis experience that works entirely in the browser.

### What it analyzes

- Conversion
- Activation
- Retention
- Feature adoption
- Segment differences
- Revenue
- User activity trends
- Funnel drop-offs

Example:

> **Mobile users convert at 3.8%, compared with 7.4% for desktop users.**

> **Users who complete onboarding are significantly more likely to convert.**

> **Week 3 retention has declined compared with earlier cohorts.**

The goal is to move from:

**Data → Insight → Action**

---

## 💡 Product Recommendations

InsightFlow doesn't stop at reporting numbers.

It attempts to translate analysis into potential product actions.

Example:

```text
🔴 HIGH PRIORITY

Mobile Conversion Gap

Mobile users convert significantly less than
desktop users.

WHY IT MATTERS

Mobile represents a large share of signups.

RECOMMENDATION

Investigate the mobile onboarding and
checkout experience.
```

The goal is to move from:

**Data → Insight → Decision**

rather than simply displaying charts.

---

# 📌 Product Prioritization

InsightFlow includes a lightweight feature prioritization system based on the **RICE framework**.

Users can add product ideas and score them using:

- Reach
- Impact
- Confidence
- Effort

The RICE score is calculated as:

```text
RICE =
Reach × Impact × Confidence
---------------------------
          Effort
```

Example:

| Feature | Reach | Impact | Confidence | Effort |
|---|---:|---:|---:|---:|
| Export Reports | 8 | 6 | 0.9 | 3 |
| Slack Integration | 6 | 8 | 0.8 | 5 |
| Dark Mode | 7 | 5 | 0.9 | 2 |

Features can then be ranked to help determine where the product team should focus.

---

# 🔒 Privacy by Design

InsightFlow is designed around **local data processing**.

Uploaded product data is processed directly in the user's browser.

```text
CSV File
   │
   ▼
Browser
   │
   ├── Parse Data
   ├── Calculate Metrics
   ├── Analyze Patterns
   ├── Generate Insights
   └── Render Charts
```

There is no requirement to upload product data to a server.

This means product analytics can be explored without sending the dataset to an external analytics or AI service.

> 🔒 **Your data stays in your browser.**

---

# 🧪 Sample Dataset

InsightFlow includes a realistic sample product event dataset for testing the application.

The sample dataset contains:

- **1,200 users**
- **8,817 product events**
- Multiple countries
- Mobile, desktop and tablet users
- Free, Pro and Business plans
- Signup events
- Onboarding events
- Feature usage
- Purchases
- Subscription renewals
- Cancellation events

The dataset intentionally contains patterns that InsightFlow can discover.

Examples include:

- Lower mobile conversion
- Stronger conversion after onboarding completion
- Higher conversion associated with Reports usage
- Retention changes across cohorts
- Different revenue characteristics between plans

---

# 🧠 How It Works

The core product flow is:

```text
        Upload CSV
             │
             ▼
       Parse Dataset
             │
             ▼
      Detect Data Fields
             │
             ▼
       Calculate Metrics
             │
      ┌──────┼──────┐
      ▼      ▼      ▼
   Funnel  Retention Segments
      │      │      │
      └──────┼──────┘
             ▼
      Detect Patterns
             │
             ▼
     Generate Insights
             │
             ▼
    Recommend Actions
             │
             ▼
      Product Decisions
```

The analytics engine works directly against the uploaded dataset.

---

# 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React** | Frontend application |
| **Vite** | Development and build tooling |
| **JavaScript / TypeScript** | Application logic |
| **CSS** | UI and responsive design |
| **Papa Parse** | CSV parsing |
| **Chart.js / Recharts** | Data visualization |
| **LocalStorage** | Local preference / prioritization persistence |
| **GitHub Pages** | Deployment |
| **Claude Code** | AI-assisted development |
| **Cursor** | AI-assisted coding and iteration |

The application does not require a backend or paid API.

---

# 📁 Project Structure

A typical project structure is:

```text
insightflow/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── analytics/
│   ├── data/
│   └── utils/
│
├── public/
│
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

The application separates UI components, pages, analytics logic, sample data, and utility functions to keep the codebase maintainable.

---

# 💻 Running Locally

## 1. Clone the repository

```bash
git clone https://github.com/darshannellary/insightflow.git
```

## 2. Enter the project directory

```bash
cd insightflow
```

## 3. Install dependencies

```bash
npm install
```

## 4. Start the development server

```bash
npm run dev
```

Then open the local URL shown in the terminal.

---

# 🏗️ Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

# 🌐 Deployment

InsightFlow is deployed as a static application using **GitHub Pages**.

**Live application:**

https://darshannellary.github.io/insightflow/

**Repository:**

https://github.com/darshannellary/insightflow

---

# 🎨 Product Design Philosophy

InsightFlow was designed around a simple product principle:

> **Analytics should help teams make decisions, not just look at dashboards.**

Many analytics tools present large amounts of data but leave the Product Manager to determine what matters.

InsightFlow attempts to shorten that path:

```text
Data
 ↓
Metrics
 ↓
Patterns
 ↓
Insights
 ↓
Recommendations
 ↓
Product Decisions
```

The interface therefore emphasizes:

- Clarity
- Actionability
- Context
- Simplicity
- Trust
- Privacy

---

# 🤖 Built While Learning Vibe Coding

InsightFlow was built as part of my exploration of **vibe coding and AI-assisted software development**.

I used:

- **Claude Code**
- **Cursor**

The project was an opportunity to explore how AI-assisted development could be used to build a complete product rather than simply generating isolated UI components.

The development process followed:

```text
Idea
 ↓
Product Definition
 ↓
Architecture
 ↓
Prototype
 ↓
Build
 ↓
Test
 ↓
Debug
 ↓
Iterate
 ↓
Deploy
```

A key design decision was deliberately avoiding paid AI APIs.

Instead, I built a local product intelligence engine using statistical analysis and rule-based reasoning.

This keeps the application:

- Free to operate
- Private
- Easy to deploy
- Easy to demonstrate
- Independent of API keys

---

# 📚 What I Learned

Building InsightFlow helped me explore:

- Product analytics
- Event-based data modeling
- CSV parsing
- Data transformation
- Statistical analysis
- Conversion funnels
- Cohort retention
- Feature adoption
- User segmentation
- Revenue analytics
- Product prioritization
- RICE scoring
- Rule-based reasoning
- Data visualization
- React application architecture
- Responsive dashboard design
- Local-first application architecture
- Browser-based data processing
- AI-assisted software development
- GitHub Pages deployment

---

# 🔮 Future Improvements

Potential future improvements include:

- [ ] Real LLM integration when API economics make sense
- [ ] More advanced statistical analysis
- [ ] Automatic anomaly detection
- [ ] A/B test analysis
- [ ] Experiment tracking
- [ ] Customer journey visualization
- [ ] More advanced cohort analysis
- [ ] Custom funnel creation
- [ ] Saved dashboards
- [ ] Exportable reports
- [ ] PDF report generation
- [ ] CSV export
- [ ] More prioritization frameworks
- [ ] MoSCoW prioritization
- [ ] Value vs. Effort matrix
- [ ] Opportunity scoring
- [ ] Product roadmap visualization
- [ ] More advanced natural-language querying

---

# 🚧 Current Limitations

InsightFlow intentionally operates without an external AI API.

The **AI Product Analyst** therefore uses:

- Statistical analysis
- Pattern detection
- Heuristics
- Rule-based reasoning
- Natural-language templates

It is not a general-purpose conversational AI model.

This is an intentional MVP trade-off designed around:

**Zero API cost + privacy + simple deployment.**

---

# 👨‍💻 Author

**Darshan Nellary**

Product Manager | FinTech & Payments | AI-Assisted Product Development

**GitHub:**

https://github.com/darshannellary

---

# 📄 License

This project currently does not specify a license.

---

> **Note:** This README uses standard GitHub Markdown with no custom dark-background styling. GitHub controls the page background according to the viewer's GitHub appearance setting.
