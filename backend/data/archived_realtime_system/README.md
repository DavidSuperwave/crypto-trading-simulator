# Archived Real-Time System Data

These files are from the old real-time trading system that was removed during migration to the compound interest system on Tue Aug 12 03:16:56 CST 2025.

## Archived Files:
- simulated_trades.json - Old trade data from real-time system
- monthly_targets.json - Pre-generated simulation targets
- daily_records.json - Daily achievement records
- simulation_parameters.json - Old system configuration

## Migration Details:
- All functionality moved to compound interest system
- Capital management logic ported from realtimeTradeGenerator to intradayTradeService
- Frontend now uses /compound-interest/simulation/* endpoints
- Real-time system files deleted: realtimeTradeGenerator.js, realtimeDailyProcessor.js, interestService.js

## Active System:
The application now uses only the compound interest system with enhanced capital management.

