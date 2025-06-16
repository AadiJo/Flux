<p align="center">
  <img src="https://i.imgur.com/dv4dWZa.gif" alt="OBD Animation" />
</p>

<p align="center">
  An app that connects to your car’s OBD-II port to track driving habits, score performance, and help you drive smarter.
</p>

## Codebase Structure

```
├── src/                   // Main application source code
│   ├── assets/            // Static assets, images, and resources
│   ├── screens/           // Main application screens/views
│   ├── services/          // Logic and API services
│   ├── contexts/          // React Context providers
│   ├── utils/             // Utility functions and helpers
│   ├── hooks/             // Custom React hooks
│   ├── constants/         // Application constants and configurations
│   └── App.js             // Root application component
├── app.json               // Expo app configuration
├── index.js               // Appglication entry point
└── package.json           // Project dependencies and scripts
```

## 🎯 Project Goal

By the time this project is complete, it will be a fully featured mobile application that:

- **Seamlessly connects** to any vehicle’s OBD‑II port (via Bluetooth or Wi‑Fi) to ingest real‑time engine and driving telemetry.
- **Continuously evaluates** key driving metrics (e.g., harsh acceleration, sudden braking, cornering, speed compliance) and computes an easy‑to‑understand safety score for each trip.
- **Delivers actionable insights** through interactive visualizations—heatmaps of problem areas, trip summaries, and trend charts—so drivers (or parents of teen drivers) can pinpoint and correct risky behaviors.
- **Provides a parental dashboard** that:
  - Highlights repeat problem zones on a map
  - Sends customizable alerts for out‑of‑bounds driving events
  - Tracks a teen’s progress over time with historical score comparisons
- **Supports an insurance preview mode** (optional)—letting individuals simulate how their driving score would translate into usage‑based rates, before investing in a full telematics policy.
- **Is designed for extensibility**, so future enhancements (gamification, social leaderboards, automated coaching prompts, etc.) can be added with minimal friction.

With these features, the finished product will empower parents to coach their teens and help all drivers develop safer habits.

## Bugs / Feature Improvements

- ✅ Async location processing
- ✅ Event pin markers
- 🟨 Automatic OBD configuring
- Driving advice?
- Color coded pins for different events
- Integration / Custom FW for further optimization
- Individual score breakdowns
- Styling cleanup
- Routes (trip grouping)
- Bluetooth connection (instead of wifi)
- Accounts / Data sharing
