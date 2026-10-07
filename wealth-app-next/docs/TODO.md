# TODO For Wealth Analyzer (Next.js Application)

Last edited by: Sebastian Teslic
Last edited date: 10/6/2026
Last edited time: 4:04 PM ET

## Simulation / Monte Carlo

- Fix Monte Carlo and simulation portfolio return assumptions. Change the calculation to use `plan.holdings` instead of `plan.assets`

- Potentially move Monte Carlo and simulation calculations to the backend

- Review and expand tests for simulation calculations

## Document Import

- Make it import all fields instead of just holdings

- Add tests for document imports

## Backend / Architecture

- Review which business logic should move from PostgreSQL to the backend

- Review transactions for multi-step database operations

- Document backend architecture

- Evaluate Supabase vs. AWS-hosted architecture

## Performance

- Fix snappiness when changing pages

## UI / Visual Polish

- Improve visual consistency to closely match the HTML demo
