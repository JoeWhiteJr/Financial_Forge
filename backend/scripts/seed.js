#!/usr/bin/env node

/**
 * Seed script for Financial Forge
 * Populates guide pages, bloomberg commands, and books.
 * Idempotent — safe to run multiple times.
 *
 * Usage: DATABASE_URL=postgresql://... node backend/scripts/seed.js
 */

const { Pool } = require('pg');

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@db:5432/financial_forge';

const pool = new Pool({ connectionString: DATABASE_URL });

// ---------------------------------------------------------------------------
// Guide Pages
// ---------------------------------------------------------------------------

const guidePages = [
  {
    slug: 'sector-analysis',
    title: 'Sector Analysis',
    category: 'guides',
    sort_order: 1,
    content: `# Sector Analysis Framework

## Overview

Sector analysis is a foundational skill for any finance professional. Whether you are an equity research analyst covering a specific industry vertical, an investment banking associate preparing a pitch book, or a portfolio manager evaluating allocation decisions, the ability to dissect and compare sectors is essential. A rigorous sector analysis framework helps you identify where value is being created, where risks are concentrated, and where the most compelling investment opportunities exist.

The goal of sector analysis is not simply to describe what a sector does but to understand the economic forces that drive profitability, growth, and risk within that sector relative to others. This requires both quantitative rigor and qualitative judgment.

## Key Metrics by Sector

Different sectors are driven by fundamentally different economics. Using the wrong metrics for a given sector is one of the most common mistakes analysts make. Below are the metrics that matter most for major sectors.

### Technology
- **Revenue growth rate** — the primary driver of valuation for high-growth tech companies
- **Gross margin** — indicates pricing power and scalability of the business model
- **Rule of 40** — combined revenue growth rate and profit margin should exceed 40% for SaaS companies
- **Customer acquisition cost (CAC)** and **lifetime value (LTV)** — LTV/CAC ratio above 3x is generally healthy
- **Net revenue retention (NRR)** — measures expansion within existing customer base; elite SaaS companies exceed 120%

### Healthcare
- **Pipeline value and stage distribution** — for pharma/biotech, the clinical trial pipeline is the primary value driver
- **R&D as a percentage of revenue** — indicates investment intensity and future growth potential
- **Patent cliff exposure** — revenue at risk from upcoming patent expirations
- **Regulatory approval probability** — probability-weighted pipeline valuation is critical
- **Reimbursement dynamics** — understanding payer mix and pricing pressure from government and private insurers

### Energy
- **Reserve replacement ratio** — measures whether the company is replacing depleted reserves
- **Finding and development costs (F&D)** — cost efficiency of adding new reserves
- **Breakeven oil/gas price** — the commodity price at which projects become economically viable
- **Production growth** — organic volume growth versus acquisition-driven growth
- **EBITDAX** — EBITDA adjusted for exploration expenses, the standard profitability metric in E&P

### Financials
- **Net interest margin (NIM)** — the spread between lending and funding rates, the core earnings driver for banks
- **Return on equity (ROE)** — the primary measure of profitability for financial institutions
- **Efficiency ratio** — non-interest expense divided by revenue; lower is better
- **Credit quality metrics** — non-performing loan ratios, provision coverage, charge-off rates
- **Common Equity Tier 1 (CET1) ratio** — regulatory capital adequacy measure

### Consumer (Discretionary and Staples)
- **Same-store sales growth (comps)** — organic growth at existing locations, the most important retail metric
- **Gross margin trends** — indicates input cost pressures and pricing power
- **Inventory turnover** — measures demand health and supply chain efficiency
- **Brand strength metrics** — market share trends, consumer sentiment, Net Promoter Score
- **Free cash flow conversion** — how efficiently earnings translate to cash

### Industrials
- **Book-to-bill ratio** — orders received relative to revenue shipped; above 1.0 indicates growing demand
- **Backlog growth** — visibility into future revenue
- **Capacity utilization** — how much of installed capacity is in productive use
- **Operating leverage** — the degree to which incremental revenue flows to the bottom line
- **Return on invested capital (ROIC)** — the ultimate measure of capital allocation efficiency

## How to Present a Sector Analysis

When presenting a sector analysis in a professional setting, structure your work in a clear, logical flow:

1. **Macro context** — Start with the big picture: GDP growth, interest rate environment, regulatory trends, and how they affect the sector
2. **Industry structure** — Describe competitive dynamics using frameworks like Porter's Five Forces or the sector value chain
3. **Key drivers and metrics** — Identify the 3-5 metrics that matter most and present them with historical trends and peer comparisons
4. **Relative valuation** — Show how the sector trades relative to its own history and to other sectors on relevant multiples
5. **Catalysts and risks** — Identify upcoming events or trends that could move the sector, both positively and negatively
6. **Investment conclusion** — Synthesize your analysis into a clear overweight, underweight, or neutral recommendation with supporting rationale

## Common Pitfalls

- **Using the wrong metrics** — Applying P/E ratios to pre-profit biotech companies or EV/EBITDA to banks will produce misleading results. Always use sector-appropriate metrics.
- **Ignoring the cycle** — Many sectors are cyclical. Analyzing a cyclical sector at peak earnings without adjusting for the cycle leads to value traps.
- **Confusing sector beta with company alpha** — A rising tide lifts all boats. Make sure you distinguish between sector-wide tailwinds and company-specific outperformance.
- **Neglecting regulatory risk** — Sectors like healthcare, energy, and financials are heavily regulated. Ignoring pending regulation can be catastrophic.
- **Over-reliance on backward-looking data** — Historical metrics matter, but sector analysis is fundamentally about the future. Weight leading indicators more heavily than trailing ones.
- **Failing to identify the key debate** — Every sector has a central controversy or uncertainty. Identifying it and taking a well-reasoned stance is what separates good analysis from mediocre data compilation.`,
  },
  {
    slug: 'financial-analysis',
    title: 'Financial Analysis',
    category: 'guides',
    sort_order: 2,
    content: `# Financial Analysis

## Overview

Financial analysis is the discipline of evaluating a company's performance, stability, and prospects through its financial statements. Mastering financial analysis is non-negotiable for anyone working in investment banking, equity research, private equity, credit analysis, or corporate finance. The ability to extract meaningful insights from an income statement, balance sheet, and cash flow statement is the bedrock upon which all higher-level analysis is built.

## Ratio Categories

Financial ratios are organized into five categories, each illuminating a different dimension of a company's financial health.

### Liquidity Ratios

Liquidity ratios measure a company's ability to meet short-term obligations. They answer the question: can this company pay its bills?

- **Current Ratio** = Current Assets / Current Liabilities
  - A ratio above 1.0 means the company can cover its short-term liabilities. A ratio of 1.5-2.0 is generally considered healthy, though this varies by industry.
- **Quick Ratio (Acid Test)** = (Current Assets - Inventory) / Current Liabilities
  - A more conservative measure that excludes inventory, which may not be quickly convertible to cash.
- **Cash Ratio** = Cash & Cash Equivalents / Current Liabilities
  - The most conservative liquidity measure. Useful for distressed companies or during liquidity crises.

### Profitability Ratios

Profitability ratios measure how effectively a company generates profit from its resources.

- **Gross Margin** = (Revenue - COGS) / Revenue
  - Indicates pricing power and production efficiency. Technology companies often have 60-80% gross margins; retailers may have 25-40%.
- **Operating Margin** = Operating Income / Revenue
  - Measures core operational profitability before interest and taxes. Reveals how well management controls costs.
- **Net Margin** = Net Income / Revenue
  - The bottom-line profitability after all expenses. Useful for overall profitability comparison.
- **Return on Equity (ROE)** = Net Income / Shareholders' Equity
  - The most important profitability metric. Measures how effectively management uses shareholder capital to generate profit. Top-performing companies sustain ROE above 15%.
- **Return on Assets (ROA)** = Net Income / Total Assets
  - Indicates how efficiently a company uses all its assets (debt and equity financed) to generate profit.
- **Return on Invested Capital (ROIC)** = NOPAT / Invested Capital
  - The gold standard of profitability measurement. Compares operating profit to the total capital employed, regardless of capital structure. ROIC exceeding WACC means the company is creating value.

### Leverage Ratios

Leverage ratios assess a company's debt levels and its ability to service that debt.

- **Debt-to-Equity (D/E)** = Total Debt / Shareholders' Equity
  - Indicates how much debt the company uses relative to equity. Higher leverage amplifies both returns and risk.
- **Debt-to-EBITDA** = Total Debt / EBITDA
  - The most widely used leverage metric in credit analysis and LBO modeling. Investment-grade companies typically have ratios below 3.0x.
- **Interest Coverage Ratio** = EBIT / Interest Expense
  - Measures the company's ability to service its debt. A ratio below 1.5x is a red flag; above 3.0x is generally comfortable.

### Efficiency Ratios

Efficiency ratios measure how well a company manages its working capital and assets.

- **Asset Turnover** = Revenue / Total Assets
  - Higher turnover means the company generates more revenue per dollar of assets.
- **Inventory Turnover** = COGS / Average Inventory
  - How many times inventory is sold and replaced per year. Higher is generally better.
- **Days Sales Outstanding (DSO)** = (Accounts Receivable / Revenue) x 365
  - How long it takes to collect payment. Rising DSO may indicate deteriorating credit quality of customers.
- **Days Payable Outstanding (DPO)** = (Accounts Payable / COGS) x 365
  - How long the company takes to pay its suppliers. Higher DPO improves working capital but may strain supplier relationships.

### Valuation Ratios

Valuation ratios compare a company's market price to its financial fundamentals.

- **Price-to-Earnings (P/E)** = Share Price / Earnings Per Share
  - The most widely quoted valuation metric. Compare to peers, sector averages, and the company's own history.
- **EV/EBITDA** = Enterprise Value / EBITDA
  - Capital-structure neutral valuation metric. The go-to multiple for M&A analysis and leveraged buyouts.
- **Price-to-Book (P/B)** = Share Price / Book Value Per Share
  - Most relevant for asset-heavy businesses and financial institutions.
- **PEG Ratio** = P/E / Earnings Growth Rate
  - Adjusts P/E for growth. A PEG below 1.0 may indicate undervaluation relative to growth prospects.

## DuPont Analysis

The DuPont framework decomposes ROE into three components to reveal what is driving returns:

**ROE = Net Margin x Asset Turnover x Equity Multiplier**

- **Net Margin** (Net Income / Revenue) — profitability
- **Asset Turnover** (Revenue / Total Assets) — efficiency
- **Equity Multiplier** (Total Assets / Shareholders' Equity) — leverage

This decomposition is powerful because two companies can have identical ROE driven by completely different factors. A luxury goods company might have high margins and low turnover, while a grocery chain has thin margins but very high turnover. The DuPont analysis reveals this immediately.

## How to Read Financial Statements

When analyzing financial statements, follow this structured approach:

1. **Start with the income statement** — Understand the revenue trajectory, margin profile, and key expense line items. Look for trends over at least 3-5 years.
2. **Move to the balance sheet** — Assess the capital structure (debt vs. equity), working capital position, and asset composition. Compare year-over-year changes.
3. **Analyze the cash flow statement** — Cash flow from operations is the lifeblood of the business. Compare operating cash flow to net income to assess earnings quality. Examine capital expenditure levels and free cash flow generation.
4. **Check the footnotes** — The notes to financial statements contain critical information about accounting policies, contingent liabilities, segment detail, and off-balance-sheet items.
5. **Calculate key ratios** — Use the ratios above to benchmark against peers and historical performance.

## Comparable Company Analysis (Introduction)

Comparable company analysis (or "trading comps") is the process of valuing a company by comparing it to publicly traded peers on relevant multiples. The key steps are:

1. **Select a peer group** — Choose companies with similar business models, size, growth profiles, and risk characteristics
2. **Gather financial data** — Collect the relevant metrics (revenue, EBITDA, net income, etc.) for each peer
3. **Calculate multiples** — Compute EV/EBITDA, P/E, EV/Revenue, and other relevant multiples for each peer
4. **Determine the range** — Establish the range, median, and mean of each multiple across the peer group
5. **Apply to the target** — Multiply the target company's metrics by the peer-derived multiples to arrive at an implied valuation range

Comparable company analysis is covered in depth in the Valuation guide.`,
  },
  {
    slug: 'valuation',
    title: 'Company Valuation',
    category: 'guides',
    sort_order: 3,
    content: `# Company Valuation

## Overview

Company valuation is the process of determining the economic worth of a business. It is the central skill in investment banking, private equity, equity research, and corporate development. There is no single "correct" valuation — rather, different methodologies provide different perspectives, and the art of valuation lies in synthesizing these perspectives into a well-supported range.

The three primary valuation methodologies are: Discounted Cash Flow (DCF) analysis, Comparable Company Analysis (trading comps), and Precedent Transaction Analysis (deal comps). Each has strengths and limitations, and experienced practitioners use all three to triangulate a valuation.

## Discounted Cash Flow (DCF) Model

The DCF is the most theoretically rigorous valuation methodology. It values a company based on the present value of its expected future free cash flows. The core principle is that a dollar received in the future is worth less than a dollar today, because of the time value of money and risk.

### Step 1: Project Free Cash Flow to the Firm (FCFF)

FCFF represents the cash flow available to all capital providers (debt and equity holders):

**FCFF = EBIT x (1 - Tax Rate) + Depreciation & Amortization - Capital Expenditures - Change in Net Working Capital**

Project FCFF for an explicit forecast period, typically 5-10 years. The quality of your projections depends on thorough analysis of revenue drivers, margin trends, capital intensity, and working capital dynamics.

### Step 2: Calculate Weighted Average Cost of Capital (WACC)

WACC is the blended rate of return required by all capital providers, weighted by their share of the capital structure:

**WACC = (E/V) x Re + (D/V) x Rd x (1 - T)**

Where:
- E/V = equity weight (market value of equity / total enterprise value)
- Re = cost of equity, typically estimated using the Capital Asset Pricing Model (CAPM): Re = Rf + Beta x (Rm - Rf)
- D/V = debt weight
- Rd = cost of debt (pre-tax)
- T = marginal tax rate

The cost of equity is the most judgment-intensive component. Beta measures systematic risk, Rf is the risk-free rate (typically the 10-year Treasury yield), and (Rm - Rf) is the equity risk premium, which most practitioners estimate at 5-7%.

### Step 3: Calculate Terminal Value

Since companies are assumed to be going concerns, you need to estimate the value beyond the explicit forecast period. There are two common approaches:

**Perpetuity Growth Method:**
Terminal Value = FCFFn x (1 + g) / (WACC - g)

Where g is the long-term sustainable growth rate, typically 2-3% (approximating long-run GDP or inflation). This is the most commonly used method.

**Exit Multiple Method:**
Terminal Value = EBITDAn x Exit Multiple

Where the exit multiple is derived from comparable company trading multiples. This method is useful as a sanity check but is somewhat circular since it relies on relative valuation.

Terminal value typically represents 60-80% of the total enterprise value in a DCF, which is why the assumptions around terminal value are so critical and often debated.

### Step 4: Discount and Sum

Discount each year's FCFF and the terminal value back to the present using WACC:

**Enterprise Value = Sum of [FCFFt / (1 + WACC)^t] + Terminal Value / (1 + WACC)^n**

To arrive at equity value, subtract net debt (total debt minus cash) from enterprise value. Divide by diluted shares outstanding to get implied share price.

## Comparable Company Analysis

Comparable company analysis values a target by applying valuation multiples from publicly traded peer companies. It reflects what the market is currently willing to pay for similar businesses.

### Key Steps:
1. **Select peers** — Companies with similar business models, size, growth rates, margins, and risk profiles. Aim for 5-15 peers.
2. **Gather data** — Collect market cap, enterprise value, revenue, EBITDA, net income, and growth rates for each peer.
3. **Calculate multiples** — Common multiples include EV/Revenue, EV/EBITDA, P/E, and P/FCF. Use forward (NTM) multiples when possible as they are more relevant.
4. **Analyze the range** — Report mean, median, 25th percentile, and 75th percentile. Outliers should be examined and potentially excluded with justification.
5. **Apply to target** — Multiply the target's financial metrics by the selected multiple range to derive an implied valuation range.

### Advantages:
- Market-based and objective
- Easy to understand and communicate
- Reflects current market sentiment and conditions

### Limitations:
- Assumes the market is pricing peers correctly
- Hard to find truly comparable companies
- Ignores company-specific growth and risk characteristics

## Precedent Transaction Analysis

Precedent transaction analysis values a company based on the prices paid in prior M&A transactions involving similar companies. It reflects what acquirers have actually paid, which typically includes a control premium.

### Key Steps:
1. **Identify relevant transactions** — Look for deals involving similar companies in terms of sector, size, and geography over the past 3-5 years.
2. **Gather deal data** — Collect transaction value, implied multiples (EV/Revenue, EV/EBITDA), premium paid, and deal structure.
3. **Analyze multiples** — Compute summary statistics. Note that precedent multiples are typically higher than trading multiples due to control premiums (usually 20-40%).
4. **Apply to target** — Apply the precedent multiple range to derive an implied valuation.

### Advantages:
- Reflects real prices paid by informed buyers
- Accounts for control premium and synergies
- Useful for M&A advisory

### Limitations:
- Transaction data may be limited or outdated
- Market conditions at the time of past deals may differ significantly from today
- Synergies and deal-specific factors make comparisons imprecise

## Sensitivity Analysis

No DCF is complete without a sensitivity analysis. Because valuation is highly dependent on assumptions, you should test how the output changes across a range of key inputs.

The most common sensitivity tables vary:
- **WACC vs. Terminal Growth Rate** — The two most impactful assumptions in a DCF
- **Revenue Growth vs. Operating Margin** — Tests the impact of the business performing above or below expectations
- **Exit Multiple vs. WACC** — When using the exit multiple approach for terminal value

Present sensitivity analysis as a data table with the base case highlighted. This demonstrates analytical rigor and gives stakeholders a clear view of the valuation range under different scenarios.

## When to Use Each Method

| Method | Best Used When | Typical Context |
|--------|---------------|-----------------|
| **DCF** | Company has predictable cash flows; you need an intrinsic value independent of market sentiment | Equity research, long-term investing, fairness opinions |
| **Trading Comps** | Good peer group exists; you want a market-based valuation | Quick valuation, pitch books, relative value screening |
| **Precedent Transactions** | M&A context; you need to justify an acquisition price | Sell-side M&A advisory, takeover defense, fairness opinions |

In practice, all three methods should be used together. Present the results in a "football field" chart showing the valuation range from each methodology. The overlap between methodologies provides the most defensible valuation range.`,
  },
];

// ---------------------------------------------------------------------------
// Bloomberg Commands
// ---------------------------------------------------------------------------

const bloombergCommands = [
  // Equity Research
  {
    command: 'EQ',
    name: 'Equity Screening',
    description: 'Screen for equities using customizable criteria including market cap, sector, financial ratios, and performance metrics. Allows you to build multi-factor screens to identify investment candidates that meet specific quantitative thresholds.',
    category: 'Equity Research',
    when_to_use: 'Use EQ when you need to generate a universe of stocks meeting specific criteria, such as finding all S&P 500 companies with a P/E below 15 and dividend yield above 3%. Essential for systematic screening in equity research and portfolio construction.',
    related_commands: ['FA', 'RV', 'SPLC'],
  },
  {
    command: 'FA',
    name: 'Financial Analysis',
    description: 'Comprehensive financial analysis tool displaying detailed income statement, balance sheet, and cash flow data. Provides historical financials, consensus estimates, and segment breakdowns. Includes ratio analysis and the ability to customize templates.',
    category: 'Equity Research',
    when_to_use: 'Use FA as your first stop when analyzing a specific company. Pull up historical financials, review margin trends, examine capital structure, and compare reported results to consensus estimates. Critical for earnings analysis and financial modeling.',
    related_commands: ['EQ', 'RV', 'ERN'],
  },
  {
    command: 'RV',
    name: 'Relative Valuation',
    description: 'Displays a customizable peer comparison table with valuation multiples, financial ratios, growth rates, and performance metrics. Allows you to define your own peer group and select which fields to display.',
    category: 'Equity Research',
    when_to_use: 'Use RV to build comparable company analysis tables for pitch books, research reports, or investment screening. Essential for relative valuation work including trading comps. Customize the peer group and columns to match your specific analysis needs.',
    related_commands: ['EQ', 'FA', 'GIP'],
  },
  {
    command: 'SPLC',
    name: 'Supply Chain Analysis',
    description: 'Maps the supply chain relationships of a company, showing key customers, suppliers, and competitors with revenue exposure data. Visualizes upstream and downstream dependencies.',
    category: 'Equity Research',
    when_to_use: 'Use SPLC when analyzing a company\'s supply chain dependencies, identifying customer concentration risk, or understanding competitive positioning. Valuable for fundamental research and identifying potential investment ideas through supply chain linkages.',
    related_commands: ['FA', 'RV', 'ANR'],
  },
  {
    command: 'GIP',
    name: 'Group Information Page',
    description: 'Provides a comprehensive overview of a sector or industry group including key statistics, top companies by market cap, sector-level valuation multiples, and performance metrics.',
    category: 'Equity Research',
    when_to_use: 'Use GIP for top-down sector analysis. Start here to understand the landscape before drilling into individual companies. Useful for building sector overview slides and understanding industry composition.',
    related_commands: ['EQ', 'RV', 'ECST'],
  },
  {
    command: 'ANR',
    name: 'Analyst Recommendations',
    description: 'Displays sell-side analyst ratings, price targets, and estimates for a given security. Shows the consensus view, distribution of ratings (buy/hold/sell), and individual analyst detail including historical accuracy.',
    category: 'Equity Research',
    when_to_use: 'Use ANR to understand consensus expectations and identify where your view may differ from the street. Review price target ranges to gauge upside/downside expectations. Helpful before earnings or when evaluating a new coverage name.',
    related_commands: ['FA', 'ERN', 'RV'],
  },

  // Fixed Income
  {
    command: 'FI',
    name: 'Fixed Income Search',
    description: 'Search and screen for fixed income securities including corporate bonds, government bonds, municipal bonds, and structured products. Filter by issuer, maturity, coupon, rating, yield, and many other attributes.',
    category: 'Fixed Income',
    when_to_use: 'Use FI when sourcing bonds for a portfolio, finding specific issues for a client, or building a fixed income universe for analysis. The primary starting point for any bond market research.',
    related_commands: ['RATD', 'FXIP'],
  },
  {
    command: 'RATD',
    name: 'Ratings Detail',
    description: 'Displays detailed credit rating information from all major rating agencies (Moody\'s, S&P, Fitch) for an issuer or specific security. Shows current ratings, rating history, outlook, and recent rating actions.',
    category: 'Fixed Income',
    when_to_use: 'Use RATD to assess credit quality, track rating migration, and understand credit risk. Essential for credit analysis, investment-grade versus high-yield classification, and monitoring holdings for downgrade risk.',
    related_commands: ['FI', 'FA', 'FXIP'],
  },
  {
    command: 'FXIP',
    name: 'Fixed Income Investor Page',
    description: 'A comprehensive overview page for fixed income investors showing yield curves, credit spreads, new issuance activity, and market-level metrics. Provides a macro view of fixed income markets.',
    category: 'Fixed Income',
    when_to_use: 'Use FXIP to get a quick pulse on fixed income market conditions. Review before client meetings or when assessing the macro environment for bond investments. Useful for tracking spread trends and new issue supply.',
    related_commands: ['FI', 'RATD', 'ECOF'],
  },

  // Economics
  {
    command: 'ECOF',
    name: 'Economic Forecasts',
    description: 'Displays consensus and individual economic forecasts for key indicators including GDP, inflation, unemployment, interest rates, and other macroeconomic variables for major economies worldwide.',
    category: 'Economics',
    when_to_use: 'Use ECOF when preparing macroeconomic outlooks, assessing consensus expectations for central bank decisions, or building economic assumptions for financial models. Essential for macro research and strategy.',
    related_commands: ['WECO', 'GP', 'ECST', 'ECO'],
  },
  {
    command: 'WECO',
    name: 'World Economic Statistics',
    description: 'Provides a global macroeconomic dashboard with GDP, inflation, trade balance, and other key economic indicators for countries worldwide. Allows cross-country comparison and historical trend analysis.',
    category: 'Economics',
    when_to_use: 'Use WECO for cross-country economic comparison, identifying global economic trends, or preparing international macro analysis. Particularly useful for global macro strategy and emerging market research.',
    related_commands: ['ECOF', 'GP', 'ECST'],
  },
  {
    command: 'GP',
    name: 'Graph / Price Chart',
    description: 'Creates customizable price and data charts with technical analysis overlays. Supports equities, bonds, commodities, currencies, economic indicators, and custom data series. Offers extensive charting tools and annotation features.',
    category: 'Economics',
    when_to_use: 'Use GP to visualize trends in any data series — stock prices, yield curves, economic indicators, or commodity prices. Essential for presentations, technical analysis, and identifying historical patterns.',
    related_commands: ['ECOF', 'WECO', 'FA'],
  },
  {
    command: 'ECST',
    name: 'Economic Statistics',
    description: 'Detailed economic statistics for a specific country including national accounts, labor market data, inflation breakdown, industrial production, consumer confidence, and other high-frequency indicators.',
    category: 'Economics',
    when_to_use: 'Use ECST for deep-dive country-level economic analysis. More detailed than WECO, providing granular breakdown of economic components. Use when writing country-specific research or preparing for central bank decision analysis.',
    related_commands: ['ECOF', 'WECO', 'ECO'],
  },

  // News & Events
  {
    command: 'TOP',
    name: 'Top News',
    description: 'Displays the most important breaking news stories curated by Bloomberg editors across all asset classes and regions. Features real-time headlines with priority ranking and categorization.',
    category: 'News & Events',
    when_to_use: 'Use TOP first thing in the morning and throughout the day to stay on top of market-moving news. Essential for any market-facing role. Check before client calls and trading decisions.',
    related_commands: ['NI', 'ECO', 'ERN'],
  },
  {
    command: 'NI',
    name: 'News Search',
    description: 'Advanced news search engine allowing you to search Bloomberg\'s extensive news archive by keyword, company, topic, date range, and source. Supports complex boolean queries and custom news alerts.',
    category: 'News & Events',
    when_to_use: 'Use NI for targeted news research on a specific company, sector, or topic. Essential for due diligence, event analysis, and building a narrative around a company or industry development.',
    related_commands: ['TOP', 'ECO', 'ANR'],
  },
  {
    command: 'ECO',
    name: 'Economic Calendar',
    description: 'Displays upcoming and past economic data releases with consensus estimates, actual results, and the deviation from expectations. Covers all major economies and hundreds of economic indicators.',
    category: 'News & Events',
    when_to_use: 'Use ECO to prepare for market-moving data releases. Check daily for upcoming releases and review results to understand market reactions. Critical for macro trading and economic research. Set alerts for key releases.',
    related_commands: ['ECOF', 'TOP', 'ECST'],
  },
  {
    command: 'ERN',
    name: 'Earnings Calendar',
    description: 'Displays the earnings release calendar for public companies with reporting dates, consensus EPS and revenue estimates, and actual results. Allows filtering by date range, index, sector, and other criteria.',
    category: 'News & Events',
    when_to_use: 'Use ERN to track earnings season, prepare for upcoming company reports, and review recent earnings surprises. Essential for equity research analysts and portfolio managers during reporting periods.',
    related_commands: ['FA', 'ANR', 'TOP'],
  },

  // Portfolio & Analytics
  {
    command: 'PORT',
    name: 'Portfolio Analytics',
    description: 'Comprehensive portfolio analysis tool showing holdings, performance attribution, risk decomposition, sector and factor exposures, and benchmark tracking. Supports custom portfolios and multiple benchmarks.',
    category: 'Portfolio & Analytics',
    when_to_use: 'Use PORT for ongoing portfolio monitoring, performance review, and client reporting. Analyze attribution to understand what is driving returns and risk. Essential for portfolio managers and investment analysts.',
    related_commands: ['MARS', 'PMEN', 'RV'],
  },
  {
    command: 'MARS',
    name: 'Multi-Asset Risk System',
    description: 'Advanced multi-asset risk analytics platform providing VaR calculations, stress testing, scenario analysis, and factor-based risk decomposition across portfolios spanning equities, fixed income, derivatives, and alternatives.',
    category: 'Portfolio & Analytics',
    when_to_use: 'Use MARS for sophisticated risk analysis including stress testing portfolios against historical and hypothetical scenarios. Required for regulatory risk reporting and internal risk management. Use before major market events to assess portfolio vulnerability.',
    related_commands: ['PORT', 'PMEN'],
  },
  {
    command: 'PMEN',
    name: 'Portfolio Menu',
    description: 'The starting page for Bloomberg portfolio functionality. Create, import, and manage portfolios. Access portfolio analytics, performance, and risk tools. Manage model portfolios and track multiple strategies.',
    category: 'Portfolio & Analytics',
    when_to_use: 'Use PMEN to set up new portfolios, import holdings, and navigate to specific portfolio analytics tools. The first step before using PORT or MARS is to ensure your portfolio is properly set up in PMEN.',
    related_commands: ['PORT', 'MARS'],
  },
];

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

const books = [
  {
    title: 'Principles for Dealing with the Changing World Order',
    author: 'Ray Dalio',
    category: 'Macro',
    summary: 'Ray Dalio examines the rise and decline of major empires and reserve currencies over the past 500 years, identifying patterns in debt cycles, internal conflict, and geopolitical shifts. The book provides a framework for understanding where the United States and China stand in the current world order and what historical patterns suggest about the future.',
    difficulty: 'Advanced',
    why_it_matters: 'Understanding macroeconomic cycles and geopolitical dynamics is essential for long-term investment strategy and risk management. This book provides a rare big-picture framework that helps finance professionals contextualize current events within centuries of historical precedent.',
    sort_order: 1,
  },
  {
    title: 'Best Practices for Equity Research Analysts',
    author: 'James Valentine',
    category: 'Equity Research',
    summary: 'A practical handbook for sell-side and buy-side equity research analysts covering the complete workflow from idea generation to stock selection. Valentine draws on decades of Wall Street experience to explain how to build financial models, develop differentiated insights, write impactful research, and communicate effectively with portfolio managers and clients.',
    difficulty: 'Intermediate',
    why_it_matters: 'This is the definitive guide for anyone pursuing a career in equity research. It bridges the gap between academic finance and the practical skills needed to produce actionable investment research that moves markets and informs portfolio decisions.',
    sort_order: 2,
  },
  {
    title: 'The Richest Man in Babylon',
    author: 'George S. Clason',
    category: 'Foundations',
    summary: 'Set in ancient Babylon, this collection of parables delivers timeless personal finance lessons including the importance of saving at least 10% of income, making money work for you through sound investments, and avoiding speculative schemes. Its simplicity belies the power of its core principles.',
    difficulty: 'Beginner',
    why_it_matters: 'Before analyzing companies, every finance professional needs a solid foundation in personal financial discipline. The principles in this book — pay yourself first, invest wisely, seek counsel from experts — form the bedrock of financial literacy that underpins all higher-level finance work.',
    sort_order: 3,
  },
  {
    title: 'The Intelligent Investor',
    author: 'Benjamin Graham',
    category: 'Value Investing',
    summary: 'The definitive text on value investing, introducing concepts such as Mr. Market, margin of safety, and the distinction between investment and speculation. Graham teaches investors to analyze securities as fractional business ownership rather than ticker symbols, emphasizing fundamental analysis and emotional discipline.',
    difficulty: 'Intermediate',
    why_it_matters: 'Warren Buffett calls this "by far the best book on investing ever written." The concepts of margin of safety and Mr. Market remain foundational to sound investment thinking. Understanding Graham\'s framework is essential for anyone evaluating equities or managing money.',
    sort_order: 4,
  },
  {
    title: 'Security Analysis',
    author: 'Benjamin Graham & David Dodd',
    category: 'Value Investing',
    summary: 'The original and most comprehensive treatise on fundamental security analysis, covering bonds, preferred stocks, and common stocks. Graham and Dodd establish rigorous frameworks for evaluating balance sheet strength, earning power, and intrinsic value. The book is dense and technical, but its methodology remains the foundation of professional security analysis.',
    difficulty: 'Advanced',
    why_it_matters: 'This is the intellectual foundation upon which modern fundamental analysis is built. While the examples are historical, the analytical frameworks for assessing creditworthiness, earnings quality, and asset values are as relevant today as when the book was first published in 1934.',
    sort_order: 5,
  },
  {
    title: 'One Up on Wall Street',
    author: 'Peter Lynch',
    category: 'Investing',
    summary: 'Peter Lynch, who achieved a 29.2% average annual return managing the Fidelity Magellan Fund, shares his approach to finding great investments in everyday life. He categorizes stocks into six types (slow growers, stalwarts, fast growers, cyclicals, turnarounds, and asset plays) and provides practical frameworks for analyzing each.',
    difficulty: 'Beginner',
    why_it_matters: 'Lynch demonstrates that successful investing is accessible and grounded in common sense and thorough research. His stock categorization framework and emphasis on understanding what you own provide practical tools that both novice and experienced investors can immediately apply.',
    sort_order: 6,
  },
  {
    title: 'Common Stocks and Uncommon Profits',
    author: 'Philip Fisher',
    category: 'Growth Investing',
    summary: 'Fisher pioneered growth investing by developing the "scuttlebutt" method of qualitative research — gathering intelligence from competitors, suppliers, customers, and employees. He outlines fifteen points to look for in a common stock, emphasizing management quality, R&D capability, and long-term growth potential over short-term earnings.',
    difficulty: 'Intermediate',
    why_it_matters: 'Fisher\'s qualitative approach complements Graham\'s quantitative framework. Understanding how to evaluate management quality, competitive advantages, and growth potential through primary research is an essential skill for any serious investor or analyst.',
    sort_order: 7,
  },
  {
    title: 'A Random Walk Down Wall Street',
    author: 'Burton Malkiel',
    category: 'Markets',
    summary: 'Malkiel presents the efficient market hypothesis and argues that stock prices follow a random walk, making consistent outperformance through stock picking or market timing extremely difficult. The book surveys the history of market bubbles, critiques both technical and fundamental analysis, and makes a compelling case for diversified index investing.',
    difficulty: 'Beginner',
    why_it_matters: 'Every finance professional should understand the efficient market hypothesis, even if they disagree with it. This book provides essential context for understanding market behavior, the challenge of generating alpha, and why most active managers underperform passive benchmarks over time.',
    sort_order: 8,
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Starting seed...');

    // --- Guide Pages ---
    for (const page of guidePages) {
      await client.query(
        `INSERT INTO pages (slug, title, category, content, sort_order)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           content = EXCLUDED.content,
           sort_order = EXCLUDED.sort_order`,
        [page.slug, page.title, page.category, page.content, page.sort_order]
      );
    }
    console.log(`Seeded ${guidePages.length} guide pages`);

    // --- Bloomberg Commands ---
    // Ensure a unique constraint on the command column for idempotency
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'bloomberg_commands_command_key'
        ) THEN
          ALTER TABLE bloomberg_commands ADD CONSTRAINT bloomberg_commands_command_key UNIQUE (command);
        END IF;
      END $$;
    `);

    for (const cmd of bloombergCommands) {
      await client.query(
        `INSERT INTO bloomberg_commands (command, name, description, category, when_to_use, related_commands)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (command) DO NOTHING`,
        [cmd.command, cmd.name, cmd.description, cmd.category, cmd.when_to_use, cmd.related_commands]
      );
    }
    console.log(`Seeded ${bloombergCommands.length} bloomberg commands`);

    // --- Books ---
    // Ensure a unique constraint on title for idempotency
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'books_title_key'
        ) THEN
          ALTER TABLE books ADD CONSTRAINT books_title_key UNIQUE (title);
        END IF;
      END $$;
    `);

    for (const book of books) {
      await client.query(
        `INSERT INTO books (title, author, category, summary, difficulty, why_it_matters, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (title) DO NOTHING`,
        [book.title, book.author, book.category, book.summary, book.difficulty, book.why_it_matters, book.sort_order]
      );
    }
    console.log(`Seeded ${books.length} books`);

    await client.query('COMMIT');
    console.log('Seed completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed, transaction rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
